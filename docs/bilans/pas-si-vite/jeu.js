/* ═══════════════════════════════════════════════════════════════════════
   « Pas si vite ! » — le déroulé d'une partie (25/09/2026)

   Paramètres d'adresse :
     ?niveau=qcm|libre   saute l'écran de choix du niveau
     ?serie=niveau1      les conversations d'une formation (un scénario
                         sans `series` appartient à toutes)
     ?lang=en            anglais (géré par i18n.js)
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var JEU = 'pas-si-vite';
  var PAR_PARTIE = 5;
  var LENT = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  var params = new URLSearchParams(location.search);
  var SERIE = params.get('serie');
  var TOUS = (window.PSV_SCENARIOS || []).filter(function (s) {
    return !SERIE || !s.series || s.series.indexOf(SERIE) >= 0;
  });

  var $ = function (id) { return document.getElementById(id); };
  var el = {
    intro: $('ecran-intro'), jeu: $('ecran-jeu'), fin: $('ecran-fin'),
    progression: $('progression'), pastille: $('pastille-niveau'),
    avatar: $('ami-avatar'), nom: $('ami-nom'), fil: $('fil'),
    saisie: $('saisie'), champ: $('champ'), champLabel: $('champ-label'), envoyer: $('envoyer'),
    question: $('question'), consigne: $('consigne'), choix: $('choix'), aideLibre: $('aide-libre'),
    retour: $('retour'), voir: $('btn-voir'),
    bilan: $('bilan'), bilanTitre: $('bilan-titre'), bilanCorps: $('bilan-corps'),
    bilanExpl: $('bilan-expl'), bilanReflexe: $('bilan-reflexe'), bilanIdees: $('bilan-idees'),
    bilanFigure: $('bilan-figure'), bilanImg: $('bilan-img'), bilanLegende: $('bilan-legende'),
    suivant: $('btn-suivant')
  };

  var niveau = 'qcm';
  var paquet = [], i = 0, joue = [];
  var sc = null, essais = 0, fini = false, occupe = false, jeton = 0, minute = 0;
  function tic() { return ++minute; }            // chaque échange avance l'horloge du fil

  /* ── Outils ──────────────────────────────────────────────────────────── */
  function L() { return I18N.lang === 'en' ? 'en' : 'fr'; }
  /* Typographie française à l'affichage : apostrophe courbe, espace fine
     insécable avant ! ? ; : et à l'intérieur des guillemets. Les textes
     restent écrits simplement dans scenarios.js. */
  function typo(s) {
    if (L() !== 'fr' || typeof s !== 'string') return s;
    return s.replace(/'/g, '\u2019')
      .replace(/ ([!?;])/g, '\u202F$1')
      .replace(/ ([:»])/g, '\u00A0$1')
      .replace(/« /g, '«\u00A0');
  }
  function tr(o) { return o ? typo(o[L()] || o.fr || '') : ''; }
  function t(cle, vars) {
    var s = typo(I18N.t(cle));
    if (Array.isArray(s)) return s.map(typo);
    if (vars) Object.keys(vars).forEach(function (k) { s = String(s).split('{' + k + '}').join(vars[k]); });
    return s;
  }
  function hasard(liste) { return liste[Math.floor(Math.random() * liste.length)]; }
  function melanger(a) {
    a = a.slice();
    for (var k = a.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)); var x = a[k]; a[k] = a[j]; a[j] = x; }
    return a;
  }
  function texteSeul(html) { var d = document.createElement('div'); d.innerHTML = html; return d.textContent; }
  function attendre(ms) { return new Promise(function (r) { setTimeout(r, LENT ? ms : 0); }); }
  function heure(sc, decalage) {
    var p = sc.heure.split(':'), m = (+p[0]) * 60 + (+p[1]) + (decalage || 0);
    return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  }

  function montrer(nom) {
    ['intro', 'jeu', 'fin'].forEach(function (k) { el[k].hidden = (k !== nom); });
  }

  /* ── Le fil de discussion ────────────────────────────────────────────── */
  function defiler(noeud) {
    if (!noeud || !noeud.scrollIntoView) return;
    var r = noeud.getBoundingClientRect();
    if (r.bottom > window.innerHeight || r.top < 0) {
      noeud.scrollIntoView({ block: 'nearest', behavior: LENT ? 'smooth' : 'auto' });
    }
  }

  function bulle(sens, contenu, h) {
    var li = document.createElement('li');
    li.className = 'bulle bulle--' + sens;
    if (contenu.image) {
      li.classList.add('bulle--image');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'zoom';
      b.setAttribute('aria-label', t('agrandir') + ' : ' + tr(contenu.alt));
      var img = document.createElement('img');
      img.src = contenu.image;
      img.alt = tr(contenu.alt);
      img.addEventListener('load', function () { defiler(li); });
      b.appendChild(img);
      b.addEventListener('click', function () { agrandir(contenu); });
      li.appendChild(b);
    } else {
      var p = document.createElement('span');
      p.textContent = contenu.texte != null ? contenu.texte : tr(contenu);
      li.appendChild(p);
    }
    /* Pour un lecteur d'écran, qui parle : l'heure seule ne le dit pas. */
    var qui = document.createElement('span');
    qui.className = 'sr-only';
    qui.textContent = (sens === 'recu' ? sc.ami.nom : (L() === 'en' ? 'You' : 'Toi')) + ' : ';
    li.insertBefore(qui, li.firstChild);
    var hh = document.createElement('span');
    hh.className = 'bulle__heure';
    hh.textContent = h + (sens === 'envoye' ? ' ✓✓' : '');
    hh.setAttribute('aria-hidden', 'true');
    li.appendChild(hh);
    el.fil.appendChild(li);
    defiler(li);
    return li;
  }

  /* L'ami « écrit », puis sa bulle arrive. Le jeton annule un enchaînement
     en cours si le joueur change de conversation entre-temps. */
  function ecrire(contenu, h, duree) {
    var mon = jeton;
    var ind = document.createElement('li');
    ind.className = 'bulle bulle--ecrit';
    ind.setAttribute('aria-hidden', 'true');
    ind.innerHTML = '<span></span><span></span><span></span>';
    el.fil.appendChild(ind);
    defiler(ind);
    return attendre(duree || 900).then(function () {
      ind.remove();
      if (mon !== jeton) throw new Error('annule');
      return bulle('recu', contenu, h);
    });
  }

  function agrandir(contenu) {
    var img = document.createElement('img');
    img.src = contenu.image;
    img.alt = tr(contenu.alt);
    ColModale.ouvrir({ titre: t('imageDe', { nom: sc.ami.nom }), contenu: img, classe: 'psv-zoom' });
  }

  /* ── Une partie ──────────────────────────────────────────────────────── */
  function lancer(liste) {
    paquet = liste && liste.length ? liste : ColFin.nonVusDabord(JEU, melanger(TOUS)).slice(0, PAR_PARTIE);
    i = 0;
    joue = [];
    ColFin.protegerSortie(true);
    el.pastille.textContent = t(niveau === 'qcm' ? 'pastilleQcm' : 'pastilleLibre');
    montrer('jeu');
    poser();
  }

  function poser() {
    jeton++;
    sc = paquet[i];
    essais = 0; fini = false; occupe = true; minute = 0;

    el.progression.textContent = t('progression', { n: i + 1, total: paquet.length });
    el.avatar.textContent = sc.ami.avatar;
    el.avatar.style.background = sc.ami.couleur;
    el.nom.textContent = sc.ami.nom;
    el.fil.textContent = '';
    var jour = document.createElement('li');
    jour.className = 'jour';
    jour.textContent = t('aujourdhui');
    el.fil.appendChild(jour);

    el.question.textContent = tr(sc.question);
    el.question.setAttribute('tabindex', '-1');
    el.consigne.textContent = t(niveau === 'qcm' ? 'consigneQcm' : 'consigneLibre');
    el.retour.textContent = '';
    el.retour.className = 'retour';
    el.voir.hidden = true;
    el.bilan.hidden = true;
    el.choix.textContent = '';
    el.choix.hidden = true;
    el.aideLibre.hidden = true;
    el.saisie.hidden = true;
    el.champ.value = '';

    /* Le focus va à la question : le joueur sait où il en est, et le fil
       annonce les messages au fur et à mesure (aria-live). */
    el.question.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'auto' });

    var chaine = Promise.resolve();
    sc.messages.forEach(function (m, k) {
      chaine = chaine.then(function () {
        return ecrire(m, heure(sc, 0), k === 0 ? 700 : (m.image ? 1100 : 1300));
      });
    });
    chaine.then(function () {
      occupe = false;
      if (niveau === 'qcm') montrerChoix(); else montrerSaisie();
    }).catch(function () { /* conversation abandonnée */ });
  }

  /* ── Niveau 1 : les choix ────────────────────────────────────────────── */
  function montrerChoix() {
    el.choix.hidden = false;
    melanger(sc.qcm).forEach(function (opt) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'choix-btn';
      b.textContent = tr(opt);
      b.addEventListener('click', function () { choisir(opt, b); });
      el.choix.appendChild(b);
    });
    el.choix.firstChild.focus({ preventScroll: true });
    defiler(el.choix.lastChild);
  }

  function verrouillerChoix(v) {
    [].forEach.call(el.choix.children, function (b) {
      if (!b.classList.contains('est-faux')) b.disabled = v;
    });
  }

  function choisir(opt, b) {
    if (occupe || fini) return;
    occupe = true;
    verrouillerChoix(true);
    bulle('envoye', { texte: tr(opt) }, heure(sc, tic()));
    if (opt.bonne) {
      b.classList.add('est-juste');
      el.retour.className = 'retour est-ok';
      el.retour.textContent = t('bienVu');
      ecrire(sc.merci, heure(sc, tic()), 1200).then(function () { conclure(essais === 0); }).catch(function () {});
    } else {
      essais++;
      b.classList.add('est-faux');
      b.disabled = true;
      b.setAttribute('aria-disabled', 'true');
      ecrire({ texte: hasard(t('doute')) }, heure(sc, tic()), 1000).then(function () {
        el.retour.className = 'retour est-ko';
        el.retour.innerHTML = '';
        var p = document.createElement('span');
        p.innerHTML = '<b></b> ';
        p.querySelector('b').textContent = t('pasTout');
        p.appendChild(document.createTextNode(tr(opt.retour) + ' ' + t('autreReponse')));
        el.retour.appendChild(p);
        occupe = false;
        verrouillerChoix(false);
        var libre = [].filter.call(el.choix.children, function (x) { return !x.disabled; })[0];
        if (libre) libre.focus({ preventScroll: true });
      }).catch(function () {});
    }
  }

  /* ── Niveau 2 : la réponse écrite ────────────────────────────────────── */
  function montrerSaisie() {
    el.saisie.hidden = false;
    el.aideLibre.hidden = false;
    el.champ.disabled = false;
    el.envoyer.disabled = false;
    el.champLabel.textContent = t('champLabel', { nom: sc.ami.nom });
    el.champ.placeholder = t('placeholder', { nom: sc.ami.nom });
    ajusterChamp();
    el.champ.focus({ preventScroll: true });
    defiler(el.saisie);
  }

  function ajusterChamp() {
    el.champ.style.height = 'auto';
    el.champ.style.height = Math.min(el.champ.scrollHeight + 2, 160) + 'px';
  }
  el.champ.addEventListener('input', ajusterChamp);
  el.champ.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      el.saisie.requestSubmit ? el.saisie.requestSubmit() : envoyerReponse(e);
    }
  });
  el.saisie.addEventListener('submit', envoyerReponse);

  function envoyerReponse(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (occupe || fini) return;
    var texte = el.champ.value.trim();
    var r = PSV_ANALYSE.analyser(texte, sc, L());
    if (r.vide) {
      el.retour.className = 'retour est-ko';
      el.retour.textContent = t('videMsg');
      el.champ.focus();
      return;
    }
    occupe = true;
    el.champ.value = '';
    ajusterChamp();
    bulle('envoye', { texte: texte }, heure(sc, tic()));
    var reussi = r.idees.length > 0 && !r.contre;

    if (reussi) {
      el.champ.disabled = true;
      el.envoyer.disabled = true;
      el.voir.hidden = true;
      el.retour.className = 'retour est-ok';
      el.retour.innerHTML = '';
      var b = document.createElement('b');
      b.textContent = t('bienVu') + ' ';
      el.retour.appendChild(b);
      el.retour.appendChild(document.createTextNode(t('ideesVues') + ' ' +
        r.idees.map(function (n) { return tr(sc.idees[n].nom); }).join(' ; ') + '.'));
      ecrire(sc.merci, heure(sc, tic()), 1200).then(function () { conclure(true, r.idees); }).catch(function () {});
      return;
    }

    essais++;
    var replique = r.contre ? hasard(t('confirme')) : hasard(t('doute'));
    ecrire({ texte: replique }, heure(sc, tic()), 1000).then(function () {
      el.retour.className = 'retour est-ko';
      el.retour.innerHTML = '';
      var p = document.createElement('span');
      if (r.contre) {
        p.textContent = tr(sc.contre.retour);
      } else {
        p.textContent = essais === 1 ? t('rienVu1', { nom: sc.ami.nom }) : t('rienVu2');
      }
      el.retour.appendChild(p);
      var ind = document.createElement('span');
      ind.className = 'indice';
      ind.textContent = t('indice') + ' ' + tr(sc.indice);
      el.retour.appendChild(ind);
      if (essais >= 2) el.voir.hidden = false;
      occupe = false;
      el.champ.focus({ preventScroll: true });
    }).catch(function () {});
  }

  el.voir.addEventListener('click', function () {
    if (occupe || fini) return;
    occupe = true;
    el.voir.hidden = true;
    el.champ.disabled = true;
    el.envoyer.disabled = true;
    el.retour.className = 'retour';
    el.retour.textContent = t('reponseVue');
    bulle('envoye', sc.modele, heure(sc, tic()));
    ecrire(sc.merci, heure(sc, tic()), 1100).then(function () { conclure(false, []); }).catch(function () {});
  });

  /* ── Ce qu'il fallait voir ───────────────────────────────────────────── */
  function conclure(reussi, ideesVues) {
    fini = true;
    occupe = false;
    joue.push({
      id: sc.id,
      titre: sc.ami.nom + ' : « ' + tr(sc.messages[sc.messages.length - 1]) + ' »',
      reussi: reussi,
      explication: texteSeul(tr(sc.explication)) + ' ' + tr(sc.reflexe)
    });

    el.bilanExpl.innerHTML = tr(sc.explication);           // texte du jeu, pas du joueur
    el.bilanReflexe.textContent = tr(sc.reflexe);
    if (sc.revelation) {
      el.bilanFigure.hidden = false;
      el.bilanCorps.classList.add('a-image');
      el.bilanImg.src = sc.revelation.image;
      el.bilanImg.alt = tr(sc.revelation.alt);
      el.bilanLegende.textContent = tr(sc.revelation.legende);
    } else {
      el.bilanFigure.hidden = true;
      el.bilanCorps.classList.remove('a-image');
      el.bilanImg.removeAttribute('src');
    }
    el.bilanIdees.textContent = '';
    el.bilanIdees.hidden = niveau !== 'libre';
    if (niveau === 'libre') {
      var tt = document.createElement('p');
      tt.textContent = t('ideesTitre');
      var ul = document.createElement('ul');
      sc.idees.forEach(function (idee, n) {
        var li = document.createElement('li');
        if (ideesVues && ideesVues.indexOf(n) >= 0) li.className = 'vu';
        li.textContent = tr(idee.nom);
        ul.appendChild(li);
      });
      el.bilanIdees.appendChild(tt);
      el.bilanIdees.appendChild(ul);
    }
    el.suivant.textContent = t(i < paquet.length - 1 ? 'suivant' : 'voirBilan');
    el.bilan.hidden = false;
    el.bilanTitre.focus({ preventScroll: true });
    el.bilan.scrollIntoView({ block: 'start', behavior: LENT ? 'smooth' : 'auto' });
  }

  el.suivant.addEventListener('click', function () {
    i++;
    if (i < paquet.length) poser(); else finir();
  });

  /* ── Fin de partie ───────────────────────────────────────────────────── */
  function finir() {
    jeton++;
    montrer('fin');
    ColFin.rendre({
      jeu: JEU,
      titre: t('finTitre'),
      items: joue,
      message: t('finMsg'),
      onRejouer: function (rates) {
        lancer(TOUS.filter(function (s) { return rates.some(function (r) { return r.id === s.id; }); }));
      },
      onRecommencer: function () { lancer(); },
      retour: window.PSV_RETOUR ? PSV_RETOUR.href : undefined,
      retourTexte: window.PSV_RETOUR ? t(PSV_RETOUR.cle) : undefined
    });
    if (niveau === 'qcm') {
      var actions = el.fin.querySelector('.col-actions');
      if (actions) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'col-btn col-btn--fantome';
        b.textContent = t('versNiveau2');
        b.addEventListener('click', function () { niveau = 'libre'; lancer(); });
        actions.insertBefore(b, actions.querySelector('a'));
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ── Départ ──────────────────────────────────────────────────────────── */
  [].forEach.call(document.querySelectorAll('.niveau'), function (b) {
    b.addEventListener('click', function () { niveau = b.getAttribute('data-niveau'); lancer(); });
  });
  var demande = params.get('niveau');
  if (demande === 'qcm' || demande === 'libre') { niveau = demande; lancer(); }
})();
