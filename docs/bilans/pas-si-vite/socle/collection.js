/* =========================================================================
   collection.js — en-tête unifié de la collection « Jeux »
   Chantier 05 (§5.1). À charger APRÈS i18n.js :

     <script src="i18n.js"></script>
     <script src="collection.js"></script>

   ── Le problème qu'il règle ─────────────────────────────────────────────
   Trois éléments se disputaient le coin supérieur de chaque page : la
   pastille « ← Retour », le bouton FR/EN injecté par i18n.js, et le titre
   du jeu. Tous les trois en `position:fixed` ou en absolu, chacun avec ses
   propres coordonnées. En dessous de 680 px ils se recouvraient.

   Le chantier 01 avait posé une rustine (`placeToggle()` réservait du
   padding en tête de <header>), mais elle ne pouvait rien pour les pages
   sans <header> — echecs, terre_ronde_plate, Emprise, mine. Une heuristique
   de détection de collision a été tentée puis retirée : elle produisait un
   placement différent d'une page à l'autre, ce qui était pire.

   ── La réponse ──────────────────────────────────────────────────────────
   Une grille `retour | titre | langue` en flux normal. Trois zones qui se
   partagent la largeur au lieu de se superposer : le chevauchement devient
   structurellement impossible, à n'importe quelle largeur.

   ── Utilisation ─────────────────────────────────────────────────────────
   Le plus souvent, rien à écrire : le script trouve le titre existant
   (<h1>) et le lien retour existant (.back-hub, .back-btn, .back…) et les
   reloge dans la grille. Pour forcer une valeur :

     <body data-col-titre="Le Grand Oral" data-col-retour="../index.html">

   Une page qui n'a pas de page parente (le portail) ou qui se referme sur
   elle-même par décision (RÉSO · Alberte, décision D2 du 4 septembre 2026)
   déclare qu'elle n'a PAS de lien de retour ; la case reste vide pour que le
   titre garde son centrage, exactement comme dans un cadre :

     <body data-col-retour="non">

   Pour désactiver sur une page (une démo plein écran, par exemple) :

     <body data-col-entete="non">
   ========================================================================= */
(function () {
  'use strict';

  /* Signalé tout de suite, avant tout DOMContentLoaded : i18n.js lit ce
     drapeau pour ne plus injecter son bouton flottant ni appliquer sa
     rustine `placeToggle()`, que cet en-tête remplace. */
  window.__COLLECTION_ENTETE__ = true;

  /* Le jeu tourne-t-il dans un cadre ? Exploration ouvre chaque jeu dans une
     <iframe>, et deux commandes de l'en-tête n'y ont aucun sens :

       — « ← Retour » chargeait le portail DANS le cadre : l'explorateur se
         retrouvait avec le hub de la collection à l'intérieur du lecteur du
         parcours, sans moyen d'en sortir. Le cadre a déjà son propre bouton
         « ← Parcours » dans sa barre.
       — la bascule FR/EN rechargeait le jeu seul avec ?lang=…, sans que la
         page qui l'entoure change de langue : deux langues à l'écran.

     L'accès à une iframe d'une autre origine lève une exception dans certains
     navigateurs : le try/catch retombe alors sur « oui, on est encadré », qui
     est le cas où l'on masque — jamais l'inverse. */
  var DANS_UN_CADRE = (function () {
    try { return window.self !== window.top; } catch (e) { return true; }
  })();

  /* Sélecteurs de lien retour rencontrés dans la collection. Ils viennent de
     jeux écrits à des moments différents ; le chantier 06 les unifiera. */
  var SEL_RETOUR = '.back-hub, .back-btn, .back-link, a.back, #menu-btn-bottom, #menu-link';

  var LABELS = {
    fr: { retour: 'Retour aux jeux', langue: 'EN', skip: 'Aller au contenu',
          versEN: 'Switch to English' },
    en: { retour: 'Back to games',   langue: 'FR', skip: 'Skip to content',
          versFR: 'Passer en français' }
  };

  function lang() {
    return (window.I18N && window.I18N.lang) || document.documentElement.lang || 'fr';
  }
  function txt(cle) {
    var l = lang();
    return (LABELS[l] && LABELS[l][cle]) || LABELS.fr[cle] || '';
  }

  /* Le href de retour : celui déclaré, sinon celui du lien existant, sinon
     on remonte au portail selon la profondeur du chemin. */
  function hrefRetour(existant) {
    var force = document.body.getAttribute('data-col-retour');
    if (force) return force;
    if (existant && existant.getAttribute('href')) return existant.getAttribute('href');
    var profondeur = location.pathname.replace(/\/[^\/]*$/, '').split('/').filter(Boolean).length;
    return profondeur > 0 ? '../index.html' : 'index.html';
  }

  /* Un <h1> enfermé dans une modale, une boîte de dialogue ou un écran masqué
     n'est pas le titre de la page : c'est le titre de cet écran-là. Emprise
     en est l'exemple — son unique <h1> est « Avant de commencer », dans la
     modale d'avertissement. Le reprendre afficherait le mauvais titre, et le
     masquer en `.sr-only` casserait la modale. */
  function titreUtilisable(el) {
    if (!el) return false;
    if (el.closest('[hidden], [aria-hidden="true"], dialog')) return false;
    return !el.closest('.modal-overlay, .modal, .overlay, [role="dialog"], [class*="modal"]');
  }

  /* Le titre, par ordre de priorité :
       1. `data-col-titre` sur <body> — valeur forcée ;
       2. `data-col-titre-cle` sur <body> — clé i18n, donc titre traduit ;
       3. l'élément marqué `data-col-titre-source` — pour les pages dont le
          titre n'est pas un <h1> (Terre ronde/plate a un `<div id="title">`
          en position fixe) ;
       4. le premier <h1> utilisable ;
       5. le <title> du document, en dernier recours. */
  function trouverTitre() {
    var force = document.body.getAttribute('data-col-titre');
    if (force) return { texte: force, source: null };

    var cle = document.body.getAttribute('data-col-titre-cle');
    if (cle && window.I18N) return { texte: window.I18N.t(cle), source: null };

    var marque = document.querySelector('[data-col-titre-source]');
    if (marque) return { texte: marque.textContent.trim(), source: marque };

    var h1 = null;
    document.querySelectorAll('h1').forEach(function (c) {
      if (!h1 && titreUtilisable(c)) h1 = c;
    });
    if (h1) return { texte: h1.textContent.trim(), source: h1 };

    return { texte: (document.title || '').trim(), source: null };
  }

  function bascule() {
    var suivante = lang() === 'fr' ? 'en' : 'fr';
    try { localStorage.setItem('jeux_lang', suivante); } catch (e) {}
    var p = new URLSearchParams(location.search);
    p.set('lang', suivante);
    location.search = p.toString();
  }

  function construire() {
    if (document.body.getAttribute('data-col-entete') === 'non') return;
    if (document.querySelector('.col-entete')) return;

    var ancienRetour = document.querySelector(SEL_RETOUR);
    var titre = trouverTitre();

    var entete = document.createElement('header');
    entete.className = 'col-entete';
    /* Grille intérieure : l'en-tête est pleine largeur (pour son voile), la
       grille est bornée et centrée. Voir le commentaire dans collection.css. */
    var grille = document.createElement('div');
    grille.className = 'col-entete__grille';
    entete.appendChild(grille);

    /* ── Retour ──────────────────────────────────────────────────────────
       Dans un cadre, la case reste (la grille garde ses trois colonnes, donc
       le titre reste centré) mais elle est vide. Même chose quand la page
       déclare `data-col-retour="non"` : un lien mort serait pire qu'une case
       vide. */
    var sansRetour = document.body.getAttribute('data-col-retour') === 'non';
    if (DANS_UN_CADRE || sansRetour) {
      var videRetour = document.createElement('span');
      videRetour.className = 'col-entete__vide';
      videRetour.setAttribute('aria-hidden', 'true');
      grille.appendChild(videRetour);
    } else {
    var retour = document.createElement('a');
    retour.className = 'col-entete__retour';
    retour.href = hrefRetour(ancienRetour);
    retour.innerHTML = '<span aria-hidden="true">←</span>' +
                       '<span class="col-entete__label"></span>';
    /* textContent plutôt que innerHTML pour le libellé : il peut venir d'un
       data-* de page, on ne le réinjecte pas en HTML. */
    /* Le libellé du retour est surchargeable par clé i18n : les pages
       d'illusions reviennent à leur propre index (« Retour aux illusions »),
       pas au portail. */
    var cleRetour = document.body.getAttribute('data-col-retour-cle');
    var libRetour = (cleRetour && window.I18N) ? window.I18N.t(cleRetour) : txt('retour');
    /* Les dictionnaires existants écrivent « ← Retour aux illusions » : la
       flèche y était collée au texte faute d'en-tête. C'est l'en-tête qui la
       dessine maintenant — sans ce nettoyage on lirait « ←← Retour ». */
    libRetour = libRetour.replace(/^[\s←◀«<]+/, '').trim();
    retour.querySelector('.col-entete__label').textContent = libRetour;
    retour.setAttribute('aria-label', libRetour);
    grille.appendChild(retour);
    }

    /* ── Titre ─────────────────────────────────────────────────────────── */
    var h = document.createElement('h1');
    h.className = 'col-entete__titre';
    h.textContent = titre.texte;

    grille.appendChild(h);

    /* ── Emplacement extra ───────────────────────────────────────────────
       La page marque `data-col-entete-extra` sur les éléments qu'elle veut
       voir en permanence dans l'en-tête. Ils sont DÉPLACÉS ici (pas copiés) :
       leurs écouteurs, leur id et leur clé i18n suivent intacts.

       Sans cet emplacement, un jeu qui a un troisième élément persistant n'a
       d'autre choix que de le poser en `position:fixed` dans un coin — ce qui
       reproduit exactement le chevauchement que l'en-tête vient de régler.
       C'était le cas d'Emprise : « Besoin d'aide ? », fixe et haut de 12 px,
       recouvrait le bandeau « FICTION » en 390 px. */
    var extras = document.querySelectorAll('[data-col-entete-extra]');
    if (extras.length) {
      var zone = document.createElement('div');
      zone.className = 'col-entete__extra';
      extras.forEach(function (el) { zone.appendChild(el); });
      grille.appendChild(zone);
      entete.classList.add('col-entete--extra');
    }

    /* ── Langue ──────────────────────────────────────────────────────────
       Seulement si la page est traduite. `echecs.html` n'inclut pas i18n.js :
       lui afficher une bascule FR/EN promettrait une traduction inexistante
       et rechargerait la page pour rien. La grille reste équilibrée grâce à
       la colonne fantôme ci-dessous. */
    if (window.I18N && !DANS_UN_CADRE) {
      var langue = document.createElement('button');
      langue.type = 'button';
      langue.className = 'col-entete__langue';
      langue.innerHTML = '<span aria-hidden="true">🌐</span>' +
                         '<span class="col-entete__label"></span>';
      langue.querySelector('.col-entete__label').textContent = txt('langue');
      langue.setAttribute('aria-label',
        lang() === 'fr' ? LABELS.fr.versEN : LABELS.en.versFR);
      langue.addEventListener('click', bascule);
      grille.appendChild(langue);
    } else {
      var vide = document.createElement('span');
      vide.className = 'col-entete__vide';
      vide.setAttribute('aria-hidden', 'true');
      grille.appendChild(vide);
    }

    /* ── Remplacement des anciens éléments ─────────────────────────────── */
    /* On retire l'ancienne pastille de retour et l'ancien bouton FR/EN :
       laisser les deux exemplaires reproduirait exactement le problème. */
    if (ancienRetour) ancienRetour.remove();
    var ancienneLangue = document.querySelector('.i18n-toggle');
    if (ancienneLangue) ancienneLangue.remove();

    /* Le <h1> d'origine est masqué plutôt que supprimé : certaines pages le
       ciblent en CSS ou en JS, et il porte parfois un data-i18n. */
    if (titre.source) {
      titre.source.classList.add('sr-only');
      /* si i18n retraduit le h1 d'origine, on suit sa valeur */
      if (titre.source.hasAttribute('data-i18n')) {
        new MutationObserver(function () {
          h.textContent = titre.source.textContent.trim();
        }).observe(titre.source, { childList: true, characterData: true, subtree: true });
      }
    }

    document.body.insertBefore(entete, document.body.firstChild);

    /* On publie la hauteur réelle dans --entete-h. Plusieurs jeux ont un HUD
       en `position:fixed; top:0` (Mine, les arcades) : sorti du flux, il
       recouvrirait l'en-tête. Ils s'y adossent avec `top: var(--entete-h)`
       plutôt qu'avec une constante qui dériverait à la première retouche. */
    var mesurer = function () {
      var h = Math.round(entete.getBoundingClientRect().height);
      if (h > 0) document.documentElement.style.setProperty('--entete-h', h + 'px');
    };
    mesurer();
    window.addEventListener('resize', mesurer);
    if (window.ResizeObserver) new ResizeObserver(mesurer).observe(entete);

    /* ── Lien d'évitement ──────────────────────────────────────────────────
       Il cherchait `main, #game, #jeu, #app, #contenu` et n'apparaissait pas
       si la page n'avait aucun des cinq : les pages sans conteneur nommé —
       la moitié de la collection — n'avaient donc pas de lien d'évitement du
       tout, alors que ce sont justement celles dont le contenu commence
       après un en-tête et une rangée de boutons.

       À défaut de conteneur, on pose une ancre vide juste après l'en-tête.
       `tabindex="-1"` la rend cible de focus sans l'ajouter à l'ordre de
       tabulation : le lien y amène le focus, et le Tab suivant repart sur le
       premier élément réellement focusable du contenu. */
    var cible = document.querySelector('main, #game, #jeu, #app, #contenu');
    if (!cible) {
      cible = document.createElement('span');
      cible.id = 'col-contenu';
      cible.tabIndex = -1;
      entete.insertAdjacentElement('afterend', cible);
    }
    if (!cible.id) cible.id = 'col-contenu';
    if (!cible.hasAttribute('tabindex')) cible.tabIndex = -1;
    var skip = document.createElement('a');
    skip.className = 'col-skip';
    skip.href = '#' + cible.id;
    skip.textContent = txt('skip');
    document.body.insertBefore(skip, entete);
  }

  /* i18n.js injecte son bouton flottant sur DOMContentLoaded. On passe après
     lui pour pouvoir le retirer, sans dépendre de l'ordre des <script>. */
  function demarrer() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        setTimeout(construire, 0);
      });
    } else {
      setTimeout(construire, 0);
    }
  }
  demarrer();

  /* =======================================================================
     CONTRAT « FIN DE PARTIE » — le message qu'un jeu envoie à la page qui
     l'encadre. Défini par la tâche E5 ; ColFin (tâche E1) s'y conforme, et
     Exploration l'écoute. Il n'y en a qu'un : ne pas en inventer un second.

     ── Le message ───────────────────────────────────────────────────────
       {
         type   : 'col:fin-de-partie',   // exactement cette chaîne. Obligatoire.
         jeu    : 'radar-desinfo',       // identifiant stable du jeu. Recommandé.
         score  : 7,                     // entier, facultatif
         total  : 10,                    // entier, facultatif
         reussi : true                   // booléen, facultatif
       }

     `type` est le seul champ obligatoire : un parcours qui débloque l'étape
     suivante n'a pas besoin du score. Les autres champs servent à ce qui
     viendra ensuite (un bilan de parcours, par exemple) ; les envoyer coûte
     une ligne et évite d'avoir à réécrire les 14 jeux pour les ajouter.

     ── Côté jeu ─────────────────────────────────────────────────────────
       Collection.finDePartie({ jeu: 'radar-desinfo', score: 7, total: 10 });

     Sans effet hors d'un cadre : un jeu peut l'appeler sans se demander
     comment il est ouvert. Une partie abandonnée n'envoie rien — le message
     dit « la partie est allée à son terme », pas « le joueur est parti ».

     ── Côté page encadrante ─────────────────────────────────────────────
       window.addEventListener('message', function (e) {
         if (e.source !== monIframe.contentWindow) return;   // ← indispensable
         if (!e.data || e.data.type !== 'col:fin-de-partie') return;
         …
       });

     La vérification porte sur `e.source`, pas sur `e.origin` : le Fakemètre
     est servi depuis antoninatger.github.io, les autres jeux depuis le même
     domaine que la page. Une liste d'origines serait à tenir à jour, alors
     que « ce message vient-il bien de MON cadre ? » se vérifie tout seul et
     ne laisse rien passer.

     `targetOrigin` est '*' à l'envoi, faute de connaître l'origine du parent.
     Le message ne contient qu'un score de jeu : rien qui vaille d'être
     protégé, et rien qui identifie le joueur.
     ======================================================================= */
  var TYPE_FIN = 'col:fin-de-partie';

  function finDePartie(details) {
    if (!DANS_UN_CADRE) return false;
    var msg = { type: TYPE_FIN };
    if (details) {
      if (details.jeu != null)    msg.jeu    = String(details.jeu);
      if (details.score != null)  msg.score  = Number(details.score);
      if (details.total != null)  msg.total  = Number(details.total);
      if (details.reussi != null) msg.reussi = !!details.reussi;
    }
    try { window.parent.postMessage(msg, '*'); return true; }
    catch (e) { return false; }
  }

  window.Collection = {
    construireEntete: construire,
    finDePartie: finDePartie,
    TYPE_FIN: TYPE_FIN,
    dansUnCadre: DANS_UN_CADRE
  };
})();


/* =========================================================================
   ColModale — une modale accessible, une seule fois pour la collection
   Tâche E1.

   Bâtie sur <dialog> et showModal(). Le piège de focus, la touche Échap et
   le retour du focus à l'élément qui a ouvert la modale sont donnés par le
   navigateur : les trois choses qu'une modale maison réécrit, et que la
   collection ratait (Emprise : ✕ sans aria-label, pas d'Échap, focus non
   piégé). Il ne reste ici que le contenu, le style et la promesse.

   ── Utilisation ────────────────────────────────────────────────────────
     const ok = await ColModale.confirmer({
       titre  : 'Quitter la partie ?',
       texte  : 'Votre progression sera perdue.',
       ok     : 'Quitter',
       annuler: 'Continuer à jouer'
     });

   `confirmer` renvoie true / false. `ouvrir` prend des actions libres et
   renvoie la valeur de celle qui a été choisie (null si Échap).
   ========================================================================= */
(function () {
  'use strict';

  var LIB = {
    fr: { ok: 'Confirmer', annuler: 'Annuler', fermer: 'Fermer' },
    en: { ok: 'Confirm',   annuler: 'Cancel',  fermer: 'Close' }
  };
  function lang() {
    return (window.I18N && window.I18N.lang === 'en') ? 'en' : 'fr';
  }
  function txt(cle) { return LIB[lang()][cle]; }

  /* actions : [{ id, libelle, principal?, autofocus? }] */
  function ouvrir(opts) {
    opts = opts || {};
    return new Promise(function (resoudre) {

      /* Repli si <dialog> n'est pas supporté : plutôt que d'afficher une
         boîte non fermable, on rend la main à confirm(), qui est laid mais
         accessible et fonctionne partout. */
      if (typeof HTMLDialogElement === 'undefined' ||
          !HTMLDialogElement.prototype.showModal) {
        var principale = (opts.actions || []).filter(function (a) { return a.principal; })[0];
        var texteBrut = (opts.titre || '') + (opts.texte ? '\n\n' + opts.texte : '');
        var reponse = window.confirm(texteBrut);
        resoudre(reponse && principale ? principale.id : null);
        return;
      }

      var dlg = document.createElement('dialog');
      dlg.className = 'col-modale';
      if (opts.classe) dlg.classList.add(opts.classe);

      var corps = document.createElement('div');
      corps.className = 'col-modale__corps';

      if (opts.titre) {
        var h = document.createElement('h2');
        h.className = 'col-modale__titre';
        h.textContent = opts.titre;
        corps.appendChild(h);
        /* Le titre nomme la modale pour un lecteur d'écran : sans ça, elle
           s'annonce « dialogue », et rien d'autre. */
        h.id = 'col-modale-titre-' + Date.now();
        dlg.setAttribute('aria-labelledby', h.id);
      }
      if (opts.texte) {
        var p = document.createElement('p');
        p.className = 'col-modale__texte';
        p.textContent = opts.texte;
        corps.appendChild(p);
      }
      if (opts.contenu instanceof Node) corps.appendChild(opts.contenu);

      var barre = document.createElement('div');
      barre.className = 'col-modale__actions';
      var actions = opts.actions && opts.actions.length ? opts.actions
                  : [{ id: 'ok', libelle: txt('fermer'), principal: true, autofocus: true }];

      actions.forEach(function (a) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'col-btn' + (a.principal ? '' : ' col-btn--fantome');
        b.textContent = a.libelle;
        b.addEventListener('click', function () { fermer(a.id); });
        barre.appendChild(b);
        if (a.autofocus) b.dataset.colAutofocus = '1';
      });

      corps.appendChild(barre);
      dlg.appendChild(corps);
      document.body.appendChild(dlg);

      var fini = false;
      function fermer(valeur) {
        if (fini) return;
        fini = true;
        /* On retire la modale APRÈS la fermeture : c'est `close()` qui rend
           le focus à l'élément qui avait ouvert la modale, et il ne peut
           plus le faire si l'élément a déjà quitté le document. */
        dlg.addEventListener('close', function () { dlg.remove(); }, { once: true });
        dlg.close();
        resoudre(valeur);
      }

      /* Échap : le navigateur ferme la modale tout seul, mais il faut
         encore résoudre la promesse — sinon l'appelant attend pour rien. */
      dlg.addEventListener('cancel', function (e) {
        e.preventDefault();
        fermer(null);
      });

      dlg.showModal();

      var vise = dlg.querySelector('[data-col-autofocus]') || dlg.querySelector('button');
      if (vise) vise.focus();
    });
  }

  function confirmer(opts) {
    opts = opts || {};
    return ouvrir({
      titre: opts.titre,
      texte: opts.texte,
      actions: [
        { id: 'non', libelle: opts.annuler || txt('annuler'), autofocus: true },
        { id: 'oui', libelle: opts.ok || txt('ok'), principal: true }
      ]
    }).then(function (r) { return r === 'oui'; });
  }

  window.ColModale = { ouvrir: ouvrir, confirmer: confirmer };
})();


/* =========================================================================
   ColFin — l'écran de fin de partie de la collection
   Tâche E1.

   ── Le problème ────────────────────────────────────────────────────────
   À la fin d'une partie, les jeux affichaient « 7 / 10 » et rien d'autre :
   ni ce qui avait été raté, ni pourquoi. Un score sans retour n'apprend
   rien, et c'est précisément le moment où le joueur est disponible pour
   apprendre. Quatorze jeux doivent recevoir ce composant (tâche E2) : son
   interface compte donc plus que son code.

   ── Adopter le composant, en dix lignes ────────────────────────────────
     ColFin.rendre({
       jeu   : 'radar-desinfo',            // identifiant stable
       score : bonnes,
       total : questions.length,
       items : questions.map(function (q, i) {
         return { id: q.id, titre: q.q, reussi: reponses[i] === q.answer,
                  explication: q.expl, lien: q.fiche };
       }),
       onRejouer: function (rates) { relancer(rates); }
     });

   Rien d'autre n'est obligatoire. `cible` vaut par défaut l'élément
   `.col-fin` ou `#ecran-fin` de la page ; le titre, le message et le lien
   de retour ont des valeurs par défaut traduites.

   ── Ce que le composant fait, et que chaque jeu n'a plus à écrire ──────
     · la liste des items ratés, avec explication et lien de fiche ;
     · le bouton « rejouer mes erreurs », qui rappelle onRejouer avec les
       seuls items ratés ;
     · la mémoire des items déjà vus, dans une clé localStorage nommée par
       jeu — pour que deux parties de suite ne reposent pas les mêmes
       questions tant que le paquet n'est pas épuisé ;
     · l'émission du message `col:fin-de-partie` (contrat défini plus haut
       dans ce fichier, tâche E5) : Exploration débloque l'étape suivante
       sur ce message, et sur rien d'autre.

   ── La forme d'un item ─────────────────────────────────────────────────
     { id          : 'q3',        // stable d'une partie à l'autre : c'est lui
                                  //   qu'on mémorise. À défaut, le titre.
       titre       : '…',         // l'intitulé montré au joueur
       reussi      : true|false,
       explication : '…',         // affichée sous les items ratés
       lien        : 'url',       // facultatif — vers la fiche
       lienTexte   : '…' }        // facultatif — libellé du lien
   ========================================================================= */
(function () {
  'use strict';

  var PREFIXE_VUS = 'col.vus.';
  /* « Ta collection » (portail, 24 septembre 2026) : une partie allée à son
     terme laisse une trace par jeu, `col.fini.<jeu>` = date. Le portail les
     lit pour afficher les jeux déjà joués sur cet appareil. Rien d'autre
     n'est gardé : ni score, ni nom. */
  var PREFIXE_FINI = 'col.fini.';
  function marquerFini(jeu) {
    if (!jeu) return;
    try { localStorage.setItem(PREFIXE_FINI + jeu, String(Date.now())); } catch (e) {}
  }

  var LIB = {
    fr: {
      titre: 'Partie terminée',
      sansFaute: 'Aucune erreur : tout est juste.',
      aRevoir: 'À revoir',
      rejouerErreurs: 'Rejouer mes erreurs',
      rejouer: 'Rejouer',
      retour: 'Retour aux jeux',
      voirFiche: 'Voir la fiche',
      quitterTitre: 'Quitter la partie ?',
      quitterTexte: 'La partie en cours sera perdue.',
      quitterOui: 'Quitter',
      quitterNon: 'Continuer à jouer'
    },
    en: {
      titre: 'Game over',
      sansFaute: 'No mistakes: everything is correct.',
      aRevoir: 'To review',
      rejouerErreurs: 'Replay my mistakes',
      rejouer: 'Play again',
      retour: 'Back to games',
      voirFiche: 'See the card',
      quitterTitre: 'Leave the game?',
      quitterTexte: 'The game in progress will be lost.',
      quitterOui: 'Leave',
      quitterNon: 'Keep playing'
    }
  };
  function lang() { return (window.I18N && window.I18N.lang === 'en') ? 'en' : 'fr'; }
  function txt(cle) { return LIB[lang()][cle]; }

  /* ── Mémoire des items déjà vus ────────────────────────────────────────
     Une clé par jeu : `col.vus.radar-desinfo`. Le jeu décide quoi en faire —
     le composant se contente de retenir, de rendre et d'oublier. C'est
     volontairement du localStorage et non du sessionStorage : « ne me
     repose pas la question de la semaine dernière » n'a de sens que si la
     mémoire survit à la fermeture de l'onglet. */
  function vus(jeu) {
    try {
      var brut = localStorage.getItem(PREFIXE_VUS + jeu);
      var liste = brut ? JSON.parse(brut) : [];
      return Array.isArray(liste) ? liste : [];
    } catch (e) { return []; }
  }

  function marquerVus(jeu, ids) {
    if (!jeu || !ids || !ids.length) return;
    try {
      var deja = vus(jeu);
      ids.forEach(function (id) {
        if (id != null && deja.indexOf(String(id)) < 0) deja.push(String(id));
      });
      localStorage.setItem(PREFIXE_VUS + jeu, JSON.stringify(deja));
    } catch (e) { /* stockage refusé : le jeu marche, sans mémoire */ }
  }

  function oublierVus(jeu) {
    try { localStorage.removeItem(PREFIXE_VUS + jeu); } catch (e) {}
  }

  /* Trie une liste d'items pour qu'un jeu serve d'abord ce qui n'a jamais
     été vu. Quand tout a été vu, la mémoire est effacée et on repart d'un
     paquet complet — sinon la deuxième partie n'aurait plus rien à servir. */
  function nonVusDabord(jeu, items) {
    var connus = vus(jeu);
    var neufs = items.filter(function (it) { return connus.indexOf(String(idDe(it))) < 0; });
    if (!neufs.length) { oublierVus(jeu); return items.slice(); }
    var revus = items.filter(function (it) { return connus.indexOf(String(idDe(it))) >= 0; });
    return neufs.concat(revus);
  }

  function idDe(item) {
    return (item && item.id != null) ? item.id : (item && item.titre) || '';
  }

  /* ── Confirmation de sortie ────────────────────────────────────────────
     Pendant une partie, « ← Retour » et la bascule de langue quittent la
     page sans prévenir : une partie de dix questions se perd sur un doigt
     mal posé. protegerSortie(true) intercepte les deux et demande. */
  var sortieProtegee = false;
  var ecouteurPose = false;

  function surClicSortie(e) {
    if (!sortieProtegee) return;
    var cible = e.target.closest && e.target.closest('.col-entete__retour, .col-entete__langue');
    if (!cible) return;
    e.preventDefault();
    e.stopPropagation();
    ColModale.confirmer({
      titre: txt('quitterTitre'),
      texte: txt('quitterTexte'),
      ok: txt('quitterOui'),
      annuler: txt('quitterNon')
    }).then(function (oui) {
      if (!oui) return;
      sortieProtegee = false;
      if (cible.tagName === 'A') location.href = cible.href;
      else cible.click();
    });
  }

  function protegerSortie(actif) {
    sortieProtegee = !!actif;
    if (ecouteurPose) return;
    /* En phase de CAPTURE : le bouton de langue a son propre écouteur posé
       par l'en-tête, et il partirait avant nous en phase de bulle. */
    document.addEventListener('click', surClicSortie, true);
    ecouteurPose = true;
  }

  /* ── Le rendu ──────────────────────────────────────────────────────── */
  function cibleParDefaut() {
    return document.querySelector('[data-col-fin]')
        || document.getElementById('ecran-fin')
        || document.querySelector('.col-fin');
  }

  function ligneItem(item) {
    var li = document.createElement('li');
    li.className = 'col-recap__item ' + (item.reussi ? 'col-recap__item--ok' : 'col-recap__item--ko');

    var p = document.createElement('p');
    p.className = 'col-recap__intitule';
    var marque = document.createElement('span');
    marque.className = 'col-recap__marque';
    marque.setAttribute('aria-hidden', 'true');
    marque.textContent = item.reussi ? '✓' : '✗';
    p.appendChild(marque);
    p.appendChild(document.createTextNode(item.titre || ''));
    li.appendChild(p);

    if (item.explication) {
      var e = document.createElement('p');
      e.className = 'col-recap__expl';
      e.textContent = item.explication;
      li.appendChild(e);
    }
    if (item.lien) {
      var a = document.createElement('a');
      a.className = 'col-recap__lien';
      a.href = item.lien;
      a.textContent = (item.lienTexte || txt('voirFiche')) + ' →';
      li.appendChild(a);
    }
    return li;
  }

  function rendre(opts) {
    opts = opts || {};
    var items = Array.isArray(opts.items) ? opts.items : [];
    var rates = items.filter(function (it) { return !it.reussi; });
    var total = (opts.total != null) ? opts.total : items.length;
    var score = (opts.score != null) ? opts.score : (items.length - rates.length);

    var cible = opts.cible || cibleParDefaut();
    if (!cible) { console.warn('ColFin : aucune cible de rendu'); return null; }

    /* Le témoin que `outils/etat-refonte.py` mesure (tâche A3) : il n'est
       posé que si un récapitulatif a réellement été rendu. */
    cible.setAttribute('data-col-recap', String(rates.length));
    cible.textContent = '';

    var h = document.createElement('h2');
    h.className = 'col-fin__titre';
    h.textContent = opts.titre || txt('titre');
    h.tabIndex = -1;                      // cible de focus à l'arrivée
    cible.appendChild(h);

    var sc = document.createElement('p');
    sc.className = 'col-fin__score';
    sc.textContent = score + ' / ' + total;
    cible.appendChild(sc);

    if (opts.message) {
      var m = document.createElement('p');
      m.className = 'col-fin__msg';
      m.textContent = opts.message;
      cible.appendChild(m);
    }

    if (rates.length) {
      var bloc = document.createElement('section');
      bloc.className = 'col-recap';
      var t = document.createElement('h3');
      t.className = 'col-recap__titre';
      t.textContent = txt('aRevoir') + ' — ' + rates.length;
      bloc.appendChild(t);
      var ul = document.createElement('ul');
      ul.className = 'col-recap__liste';
      rates.forEach(function (it) { ul.appendChild(ligneItem(it)); });
      bloc.appendChild(ul);
      cible.appendChild(bloc);
    } else if (items.length) {
      var ok = document.createElement('p');
      ok.className = 'col-recap__sansfaute';
      ok.textContent = txt('sansFaute');
      cible.appendChild(ok);
    }

    var actions = document.createElement('div');
    actions.className = 'col-actions';

    if (rates.length && typeof opts.onRejouer === 'function') {
      var br = document.createElement('button');
      br.type = 'button';
      br.className = 'col-btn';
      br.textContent = txt('rejouerErreurs') + ' (' + rates.length + ')';
      br.addEventListener('click', function () { opts.onRejouer(rates); });
      actions.appendChild(br);
    }
    if (typeof opts.onRecommencer === 'function') {
      var b2 = document.createElement('button');
      b2.type = 'button';
      b2.className = 'col-btn' + (rates.length ? ' col-btn--fantome' : '');
      b2.textContent = opts.rejouerTexte || txt('rejouer');
      b2.addEventListener('click', function () { opts.onRecommencer(); });
      actions.appendChild(b2);
    }
    /* Une page qui a déclaré `data-col-retour="non"` n'a pas de lien de retour
       dans l'en-tête ; elle n'en a pas davantage en fin de partie. */
    var retourPage = document.body.getAttribute('data-col-retour');
    if (opts.retour !== false && retourPage !== 'non') {
      var a = document.createElement('a');
      a.className = 'col-btn col-btn--fantome';
      a.href = opts.retour || retourPage || '../index.html';
      a.textContent = opts.retourTexte || txt('retour');
      actions.appendChild(a);
    }
    cible.appendChild(actions);

    /* La partie est finie : plus rien à protéger, et le message part. */
    protegerSortie(false);
    marquerVus(opts.jeu, items.map(idDe));
    marquerFini(opts.jeu);
    if (window.Collection && Collection.finDePartie) {
      Collection.finDePartie({
        jeu: opts.jeu, score: score, total: total,
        reussi: rates.length === 0
      });
    }

    /* Le focus suit l'écran : sans ça, la fin de partie est muette pour un
       lecteur d'écran et le clavier repart du haut de la page. */
    if (cible.hidden === true) cible.hidden = false;
    h.focus({ preventScroll: false });

    return cible;
  }

  window.ColFin = {
    rendre: rendre,
    vus: vus,
    marquerVus: marquerVus,
    oublierVus: oublierVus,
    nonVusDabord: nonVusDabord,
    protegerSortie: protegerSortie
  };
})();
