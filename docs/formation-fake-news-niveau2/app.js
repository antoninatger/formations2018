// Plus rien de propre à cette intervention : la bascule 64 % / 36 % est devenue un widget
// du moteur (famille « compteur-bascule », 7 septembre), qui porte ses deux valeurs dans
// le balisage au lieu de les avoir écrites dans le code d'une seule formation.
// Les reprises (24 novembre). Antonin : « tu la remets après la slide 44 […] c'est la même
// slide que tu répètes. Comme ça, si tu en modifies une, ça les modifie toutes. » Une diapo
// vide qui porte data-reprise="<id>" reçoit, à l'ouverture et avant le moteur, une copie du
// contenu de la diapo <id> : on ne modifie que l'originale, les reprises suivent.
(function () {
  document.querySelectorAll('#deck section.slide[data-reprise]').forEach(function (copie) {
    var source = document.getElementById(copie.getAttribute('data-reprise'));
    if (!source || source === copie) return;
    copie.innerHTML = source.innerHTML;
    copie.querySelectorAll('[id]').forEach(function (el) { el.id = copie.id + '-' + el.id; });
  });
})();

const Deck = createDeckEngine({
  storagePrefix: 'fn2',
  // Comportement historique de cette formation, conserve quand la visionneuse est
  // remontee dans le moteur : un clic sur n'importe quelle image l'ouvre en grand.
  lightboxToutesImages: true, playPausedVideoOnAdvance: true, // 1er oct. 2026 : la vidéo part au 1er clic, comme dans le PowerPoint
  extraEditCandidateSelectors: ['.montage-grid > .m-item', '.persona-grid > .persona', '.vid-row > .vidcol'],
});

window.Deck = Deck;
Deck.init();

// Numéro de la diapo, en bas à gauche (18 octobre), le même que dans « Arnaques en ligne ».
// Antonin : « rajoute des numérotations sur toutes les slides de toutes les formations ».
// Le numéro suit l'ordre des diapos dans cette formation (une diapo de série prend donc
// sa place ici, pas celle qu'elle a ailleurs) ; il est recalculé à chaque changement de diapo.
// L'ancien petit compteur #slidenum, s'il existe, est masqué pour ne pas afficher deux numéros.
(function () {
  var ancien = document.getElementById('slidenum');
  if (ancien) ancien.style.display = 'none';
  var badge = document.createElement('div');
  badge.id = 'num-diapo';
  badge.style.cssText = 'position:fixed;left:14px;bottom:12px;z-index:30;padding:4px 12px;border-radius:10px;' +
    'background:rgba(11,18,32,.75);border:1px solid rgba(255,255,255,.15);color:#eef2fb;' +
    "font:800 20px 'Nunito',sans-serif;pointer-events:none";
  document.body.appendChild(badge);
  var deck = document.getElementById('deck');
  function maj() {
    var diapos = Array.prototype.slice.call(deck.querySelectorAll('section.slide'));
    var i = diapos.indexOf(deck.querySelector('section.slide.active'));
    badge.textContent = i < 0 ? '' : (i + 1) + ' / ' + diapos.length;
  }
  new MutationObserver(maj).observe(deck, { subtree: true, attributes: true, attributeFilter: ['class'], childList: true });
  maj();
})();

// « Comment convaincre l'opinion ? » (20 novembre). Antonin : « si je pousse le curseur à
// droite, il y a plusieurs rouges qui se retournent qui deviennent bleus […] à gauche,
// plusieurs bleus qui deviennent rouges ». Le curseur va de -10 à 10 ; chaque cran retourne
// deux ronds, dans l'ordre que porte leur data-o. Les classes posées ici sont de l'état :
// elles sont recalculées depuis le curseur, remis au milieu à chaque arrivée sur la diapo.
// Tout passe par document et #deck : l'éditeur peut remplacer la section en enregistrant.
(function () {
  function diapo() { return document.getElementById('nv2-manipuler-opinion'); }
  function maj(d) {
    var c = d && d.querySelector('.mo-curseur'); if (!c) return;
    var v = Number(c.value) || 0;
    d.querySelectorAll('.mo-r[data-o]').forEach(function (r) {
      r.classList.toggle('mo-vers-bleu', Number(r.dataset.o) < v * 2);
    });
    d.querySelectorAll('.mo-b[data-o]').forEach(function (b) {
      b.classList.toggle('mo-vers-rouge', Number(b.dataset.o) < -v * 2);
    });
  }
  document.addEventListener('input', function (e) {
    if (e.target.classList && e.target.classList.contains('mo-curseur')) maj(e.target.closest('section.slide'));
  });
  // Lâché, le curseur rend le clavier : les flèches doivent continuer de changer de diapo.
  document.addEventListener('change', function (e) {
    if (e.target.classList && e.target.classList.contains('mo-curseur')) e.target.blur();
  });
  var etaitActive = false;
  function arrivee() {
    var d = diapo(); var active = !!(d && d.classList.contains('active'));
    if (active && !etaitActive) { var c = d.querySelector('.mo-curseur'); if (c) c.value = 0; maj(d); }
    etaitActive = active;
  }
  var deck = document.getElementById('deck');
  if (deck) new MutationObserver(arrivee).observe(deck, { subtree: true, attributes: true, attributeFilter: ['class'] });
  maj(diapo()); arrivee();
})();

// Les trois modes de présentation (23 novembre, prototype sur cette formation).
// Antonin : « je veux pouvoir switcher sur trois options » : projecteur, téléphones (QR
// code), chacun derrière un PC (votes, emojis, messages). Les trois boutons apparaissent
// dans le bandeau ; tout vit dans ../shared-vote-public.js, rien n'est écrit dans les diapos.
window.VOTE_MODES = true;
(function () {
  if (window.VotePublic) return;
  function ajouter(nom, apres) {
    var s = document.createElement('script');
    s.src = '../' + nom;
    s.onload = s.onerror = apres || null;
    document.head.appendChild(s);
  }
  ajouter('vote-relais.js', function () { ajouter('shared-vote-public.js'); });
})();


// Le jeu des titres d'articles sur les vaccins (24 novembre) : un clic sélectionne une carte,
// un second la libère. Rien n'est enregistré : c'est l'état de la séance.
document.addEventListener('click', function (e) {
  var c = e.target.closest && e.target.closest('#nv2-vaccins-titres .vt-carte');
  if (!c || c.closest('.slide.editing') || c.closest('[data-ed-valide]')) return;
  c.classList.toggle('vt-choisie');
});

// Le bouton « Valider » du jeu des titres (24 novembre au soir). Antonin : « on va mettre un
// bouton valider, et toutes ces vignettes qui ne sont pas validées disparaissent, et les
// vignettes qu'on a validées se mettent en fil, les unes sous les autres. » Le bouton et
// l'état (data-ed-valide) ne sont jamais enregistrés ; un second clic remet la grille.
(function () {
  var st = document.createElement('style');
  st.textContent =
    '.ed-vt-valider{position:absolute;left:50%;transform:translateX(-50%);bottom:3%;z-index:4;padding:12px 30px;border:0;border-radius:14px;background:#e8860c;color:#1c1105;font:800 30px/1 "Baloo 2",Nunito,sans-serif;cursor:pointer;box-shadow:0 8px 22px rgba(0,0,0,.4)}' +
    '.ed-vt-valider:hover{filter:brightness(1.08)}' +
    '.slide.editing .ed-vt-valider{display:none}' +
    '#nv2-vaccins-titres[data-ed-valide] .vt-carte:not(.vt-choisie){display:none}' +
    '#nv2-vaccins-titres[data-ed-valide] .vt-grille{grid-template-columns:minmax(0,1150px);justify-content:center;gap:16px}' +
    '#nv2-vaccins-titres[data-ed-valide] .vt-carte{flex-direction:row;gap:22px;min-height:0;padding:16px 26px;font-size:30px;cursor:default;animation:edFil .45s ease both}' +
    '#nv2-vaccins-titres[data-ed-valide] .vt-carte:hover{transform:none}' +
    '@keyframes edFil{from{opacity:0;transform:translateY(14px)}}';
  document.head.appendChild(st);
  function poser() {
    var s = document.getElementById('nv2-vaccins-titres');
    if (!s || s.querySelector('.ed-vt-valider')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'ed-vt-valider';
    b.textContent = 'Valider';
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var on = !s.hasAttribute('data-ed-valide');
      if (on) s.setAttribute('data-ed-valide', ''); else s.removeAttribute('data-ed-valide');
      b.textContent = on ? 'Revenir' : 'Valider';
      b.blur();
    });
    s.appendChild(b);
  }
  poser();
  var deck = document.getElementById('deck');
  if (deck) new MutationObserver(poser).observe(deck, { childList: true, subtree: true });
})();

// Les questions écrites du mode « 💻 Chacun son PC » (24 novembre), posées par
// ../shared-vote-public.js. Les réponses s'affichent dans des zones « ed- », jamais
// enregistrées dans le fichier ; un clic sur une réponse l'efface de l'écran.
//  · Diapo « Différentes Fake News » : au 1er clic (Mésinformation), le public propose une
//    définition, qui s'affiche sous le titre ; au 2e clic (Désinformation), même chose.
//    La définition d'Antonin (3e et 4e clics) prend la place des propositions.
//  · Diapo « Comment manipuler l'opinion ? » : voir plus bas (propositions qui retournent
//    les panneaux, et compteur).
(function () {
  var st = document.createElement('style');
  st.textContent =
    '.ed-props{position:absolute;display:flex;flex-wrap:wrap;align-content:flex-start;gap:8px 10px;overflow:hidden;z-index:3;transition:opacity .4s ease}' +
    '.ed-props:empty{display:none}' +
    '.ed-props span{background:rgba(255,255,255,.94);color:#14161c;border-radius:12px;padding:6px 12px;font:600 20px/1.3 Nunito,sans-serif;cursor:pointer;animation:edPropArrive .35s ease}' +
    '@keyframes edPropArrive{from{opacity:0;transform:translateY(8px)}}' +
    '#s11:has(.step[data-order="3"].shown) .ed-props-mes,#s11:has(.step[data-order="4"].shown) .ed-props-des{opacity:0;pointer-events:none}' +
    '.slide.editing .ed-props{display:none}' +
    '#nv2-manipuler-opinion:not(:has(.mo-titre.tournee)) .ed-props-mo{opacity:0}';
  document.head.appendChild(st);

  function zone(slide, cls, style) {
    var z = slide.querySelector('.' + cls);
    if (!z) {
      z = document.createElement('div');
      z.className = 'ed-props ' + cls;
      z.style.cssText = style;
      z.addEventListener('click', function (e) {
        var s = e.target.closest('span');
        if (s && window.VotePublic && window.VotePublic.masquer) { window.VotePublic.masquer(s.textContent); s.remove(); }
      });
      slide.appendChild(z);
    }
    return z;
  }
  function remplir(z, m) {
    var mots = (m && m.mots) || [];
    z.textContent = '';
    // Les plus récentes d'abord : ce qui ne tient pas dans la zone est caché en bas.
    mots.slice().reverse().forEach(function (x) {
      var s = document.createElement('span');
      s.textContent = x.mot;
      z.appendChild(s);
    });
  }
  function montre(slide, ordre) {
    var el = slide.querySelector('.step[data-order="' + ordre + '"]');
    return !!(el && el.classList.contains('shown'));
  }
  window.VOTE_QUESTIONS = (window.VOTE_QUESTIONS || []).concat([
    function (slide, mode) {
      if (mode !== 'pc' || slide.id !== 's11') return null;
      if (montre(slide, 2) && !montre(slide, 4)) return { cle: 'desinformation', titre: 'Désinformation : votre définition ?',
        afficher: function (m) { remplir(zone(slide, 'ed-props-des', 'left:16.462%;top:68.5%;width:70%;height:26%'), m); } };
      if (montre(slide, 1) && !montre(slide, 3) && !montre(slide, 2)) return { cle: 'mesinformation', titre: 'Mésinformation : votre définition ?',
        afficher: function (m) { remplir(zone(slide, 'ed-props-mes', 'left:16.462%;top:39.5%;width:70%;height:20.5%'), m); } };
      return null;
    }
  ]);
})();

// Diapo 6, les six critères en étoile, en mode 📱 Téléphones ou 💻 PC (24 novembre).
// Antonin : « ils mettent des tentatives et si ça tombe juste, je clique sur la phrase […]
// elle va retourner un des nombres […] s'il y a écrit source, ou juste chercher des sources,
// ou juste trouver la bonne source, et bah ça fait quand même retourner le 1. »
// Les propositions s'affichent à gauche et à droite de l'étoile. Un clic sur l'une d'elles :
// si elle parle d'un critère (mots ci-dessous), elle passe au vert et retourne sa carte ;
// sinon elle passe au gris et s'efface. Un double-clic l'efface sans rien retourner.
(function () {
  var CRITERES = [
    // [numéro de la carte, mots qui y mènent] : testés dans cet ordre (« plusieurs sources »
    // avant « source », « auteur de la source » avant « source »).
    [4, /plusieurs|beaucoup|nombreu|recoup|croiser|croise|compar|autres? (sources?|medias?|sites?|journaux)|d'?autres|partout|tout le monde/],
    [2, /interlocut|qui (parle|le dit|dit|l'a dit|ecrit)|auteur|expert|specialist|personne|temoin|journaliste|celui qui|scientifique qui|credibilite de la personne/],
    [6, /comment|critique|avis|fact|debat|reaction|dementi|contredit|contest/],
    [3, /preuve|demontr|argument|donnee|chiffre|etude|scientif|fait|photo|video|image|document|statisti/],
    [5, /credib|plausible|vraisembl|logique|coheren|realist|bon sens|possible|ca se tient|absurde|exagere|trop beau/],
    [1, /source|fiab|site|media|journal|provenance|origine|reputation|serieu|officiel|url|lien/]
  ];
  function critereDe(texte) {
    var t = String(texte).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’`]/g, "'");
    for (var i = 0; i < CRITERES.length; i++) if (CRITERES[i][1].test(t)) return CRITERES[i][0];
    return 0;
  }
  var st = document.createElement('style');
  st.textContent =
    // Les deux colonnes sont posées sur la page (et non dans la diapo), au-dessus des zones
    // de clic qui font avancer ou reculer, et ne se montrent que sur cette diapo.
    '.ed-props-crit{position:fixed;z-index:12;flex-direction:column;flex-wrap:nowrap;align-items:stretch}' +
    'body:not(:has(#s5.active)) .ed-props-crit,body:has(.slide.editing) .ed-props-crit{display:none}' +
    '.ed-props-crit span{font-size:19px;padding:7px 12px}' +
    '.ed-props-crit span.ed-juste{background:#bbf7d0;color:#14532d}' +
    '.ed-props-crit span.ed-faux{background:#d1d5db;color:#4b5563;opacity:0;transition:opacity .6s ease .6s}';
  document.head.appendChild(st);

  var traites = {};   // texte → 'juste' | 'faux' : la couleur reste quand la liste se redessine
  function zoneCrit(slide, cote) {
    var cls = 'ed-props-crit-' + cote;
    var z = document.querySelector('.' + cls);
    if (!z) {
      z = document.createElement('div');
      z.className = 'ed-props ed-props-crit ' + cls;
      z.style.cssText = (cote === 'g' ? 'left:1vw;' : 'right:1vw;') + 'top:9vh;width:16vw;height:80vh';
      z.addEventListener('click', function (e) {
        var s = e.target.closest('span');
        if (!s || traites[s.textContent]) return;
        var n = critereDe(s.textContent);
        traites[s.textContent] = n ? 'juste' : 'faux';
        s.classList.add(n ? 'ed-juste' : 'ed-faux');
        if (n) {
          // Si l'étoile n'est pas encore sortie, on la fait sortir d'abord.
          var cachee = document.querySelector('#s5 .crit-pos.step:not(.shown)');
          if (cachee && window.Deck && Deck.next) Deck.next();
          setTimeout(function () {
            var carte = document.querySelectorAll('#s5 .crit-pos .retourne')[n - 1];
            if (carte && !carte.classList.contains('tournee')) carte.click();
          }, cachee ? 800 : 0);
        } else {
          setTimeout(function () { if (window.VotePublic && window.VotePublic.masquer) window.VotePublic.masquer(s.textContent); s.remove(); }, 1300);
        }
      });
      z.addEventListener('dblclick', function (e) {
        var s = e.target.closest('span');
        if (s && window.VotePublic && window.VotePublic.masquer) { window.VotePublic.masquer(s.textContent); s.remove(); }
      });
      document.body.appendChild(z);
    }
    return z;
  }
  function remplirCrit(slide, m) {
    var g = zoneCrit(slide, 'g'), d = zoneCrit(slide, 'd');
    g.textContent = ''; d.textContent = '';
    ((m && m.mots) || []).forEach(function (x, i) {
      if (traites[x.mot] === 'faux') return;
      var s = document.createElement('span');
      s.textContent = x.mot;
      if (traites[x.mot] === 'juste') s.className = 'ed-juste';
      (i % 2 ? d : g).appendChild(s);
    });
  }
  window.VOTE_QUESTIONS = (window.VOTE_QUESTIONS || []).concat([
    function (slide, mode) {
      if (slide.id !== 's5') return null;
      return { cle: 'criteres', titre: 'Quels sont les critères pour valider l’information ?',
        afficher: function (m) { remplirCrit(slide, m); } };
    }
  ]);
})();

// Diapo 32, les quatre tweets du métro (24 novembre). Antonin : « tu vas faire un vote pour
// savoir si les gens estiment que c'est Patriote Éveillé, la bonne description, ou Le Fil
// Métro ». Le vote part quand les deux premiers tweets sont à l'écran (2e clic), en mode
// Téléphones ou PC ; les résultats vont dans le petit cadre en bas à droite.
window.VOTE_QUESTIONS = (window.VOTE_QUESTIONS || []).concat([
  function (slide) {
    if (slide.id !== 's15') return null;
    var deux = slide.querySelector('.tw-carte.step[data-order="2"]');
    if (!deux || !deux.classList.contains('shown')) return null;
    return { cle: 'description', type: 'choix', titre: 'Quelle est la bonne description de la vidéo ?', options: ['Patriote Éveillé', 'Le Fil Métro'] };
  }
]);

// Diapo « Comment manipuler l'opinion ? » (24 novembre). Antonin : « une fois que je ferai
// apparaître les 4 panneaux qu'on retourne, il faut que les élèves puissent écrire les
// possibilités. Et moi, je dois défiler les possibilités […] sur une d'entre elles qui est
// correcte […] ça joue. Et peut-être mettre un compteur en bas en fonction du nombre de
// rouges et de bleus ». Un clic sur une proposition : si elle parle d'un des quatre leviers
// (mots ci-dessous), elle passe au vert et retourne son panneau ; sinon elle s'efface.
// Le compteur (zone « ed- », jamais enregistrée) compte les ronds rouges et bleus visibles.
(function () {
  var LEVIERS = [
    // [panneau, mots qui y mènent], testés dans cet ordre.
    [2, /fuir|fuite|chass|harcel|faire partir|partir|bann|exclu|insult|menac|intimid|virer|degag|attaqu|cyberharc/],
    [3, /decourag|demotiv|lass|faire taire|taire|peur|doute|desesp|epuis|fatig|abandon|silence|abstenir|abstention|plus voter|ne pas voter|resign/],
    [4, /divert|distrai|detourn|autre sujet|autre chose|occup|amus|jeu|foot|sport|people|buzz|attention|ailleurs|spectacle|humour|blague|meme/],
    [1, /rouge|ajout|rajout|faux compte|compte|bot|robot|troll|multipli|plus de (gens|monde|personnes)|recrut|payer|astroturf|nombre|masse|foule|plus nombreu|clon/]
  ];
  function levierDe(texte) {
    var t = String(texte).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’`]/g, "'");
    for (var i = 0; i < LEVIERS.length; i++) if (LEVIERS[i][1].test(t)) return LEVIERS[i][0];
    return 0;
  }
  var st = document.createElement('style');
  st.textContent =
    '.ed-props-mo2{overflow-y:auto!important;scrollbar-width:thin}' +
    '.ed-props-mo2 span.ed-juste{background:#bbf7d0;color:#14532d}' +
    '.ed-props-mo2 span.ed-faux{background:#d1d5db;color:#4b5563;opacity:0;transition:opacity .6s ease .6s}' +
    '#nv2-manipuler-opinion:not(:has(.mo-titre.tournee)) .ed-props-mo2{opacity:0;pointer-events:none}' +
    '.ed-mo-compteur{position:absolute;display:flex;gap:14px;z-index:3;pointer-events:none}' +
    '.ed-mo-compteur b{display:flex;align-items:center;gap:10px;background:rgba(15,23,42,.72);border-radius:14px;padding:6px 16px;font:800 34px/1.1 "Baloo 2",Nunito,sans-serif;color:#fff;min-width:118px;justify-content:center;transition:transform .25s ease}' +
    '.ed-mo-compteur i{width:24px;height:24px;border-radius:50%;display:inline-block;box-shadow:inset 0 -3px 6px rgba(0,0,0,.25)}' +
    '.ed-mo-compteur b.ed-bouge{transform:scale(1.18)}' +
    '.slide.editing .ed-mo-compteur,.slide.editing .ed-props-mo2{display:none}';
  document.head.appendChild(st);

  function diapo() { return document.getElementById('nv2-manipuler-opinion'); }
  var traites = {};
  function zoneMo(slide) {
    var z = slide.querySelector('.ed-props-mo2');
    if (!z) {
      z = document.createElement('div');
      z.className = 'ed-props ed-props-mo2';
      z.style.cssText = 'left:32%;top:88%;width:56%;height:12%;justify-content:center';
      z.addEventListener('click', function (e) {
        var s = e.target.closest('span');
        if (!s || traites[s.textContent]) return;
        var n = levierDe(s.textContent);
        traites[s.textContent] = n ? 'juste' : 'faux';
        s.classList.add(n ? 'ed-juste' : 'ed-faux');
        if (n) {
          var carte = slide.querySelector('.mo-carte.mo-c' + n);
          if (carte && !carte.classList.contains('tournee')) carte.click();
        } else {
          setTimeout(function () { if (window.VotePublic && window.VotePublic.masquer) window.VotePublic.masquer(s.textContent); s.remove(); }, 1300);
        }
      });
      z.addEventListener('dblclick', function (e) {
        var s = e.target.closest('span');
        if (s && window.VotePublic && window.VotePublic.masquer) { window.VotePublic.masquer(s.textContent); s.remove(); }
      });
      slide.appendChild(z);
    }
    return z;
  }
  function remplirMo(slide, m) {
    var z = zoneMo(slide);
    z.textContent = '';
    ((m && m.mots) || []).slice().reverse().forEach(function (x) {
      if (traites[x.mot] === 'faux') return;
      var s = document.createElement('span');
      s.textContent = x.mot;
      if (traites[x.mot] === 'juste') s.className = 'ed-juste';
      z.appendChild(s);
    });
  }
  window.VOTE_QUESTIONS = (window.VOTE_QUESTIONS || []).concat([
    function (slide) {
      if (slide.id !== 'nv2-manipuler-opinion' || !slide.querySelector('.mo-titre.tournee')) return null;
      return { cle: 'manipuler', titre: 'Comment manipuler l’opinion ? Vos idées',
        afficher: function (m) { remplirMo(slide, m); } };
    }
  ]);

  // Le compteur : un rond est rouge ou bleu selon sa classe et le curseur (mo-vers-*) ;
  // une fois le titre retourné, les panneaux retournés ajoutent des rouges (1), font
  // disparaître (2), griser (3) ou verdir (4) une partie des bleus.
  function compter(d) {
    var titre = !!d.querySelector('.mo-titre.tournee');
    function on(n) { return titre && !!d.querySelector('.mo-carte.mo-c' + n + '.tournee'); }
    var r = 0, b = 0;
    d.querySelectorAll('.mo-champ .mo-rond').forEach(function (x) {
      var c = x.classList;
      var rouge = (c.contains('mo-r') && !c.contains('mo-vers-bleu')) || (c.contains('mo-b') && c.contains('mo-vers-rouge'));
      if (c.contains('mo-plus') && !on(1)) return;
      if (rouge) { r++; return; }
      if (c.contains('mo-fuite') && on(2)) return;
      if (c.contains('mo-gris') && on(3)) return;
      if (c.contains('mo-vert') && on(4)) return;
      b++;
    });
    return { r: r, b: b };
  }
  var avant = {};
  function majCompteur() {
    var d = diapo(); if (!d) return;
    var k = d.querySelector('.ed-mo-compteur');
    if (!k) {
      k = document.createElement('div');
      k.className = 'ed-mo-compteur';
      k.style.cssText = 'left:13.5%;top:88.5%';
      k.innerHTML = '<b class="ed-k-r"><i style="background:#ef4444"></i><span></span></b><b class="ed-k-b"><i style="background:#3b82f6"></i><span></span></b>';
      d.appendChild(k);
    }
    var n = compter(d);
    [['r', n.r], ['b', n.b]].forEach(function (p) {
      var el = k.querySelector('.ed-k-' + p[0]);
      var sp = el.querySelector('span');
      if (sp.textContent !== String(p[1])) {
        sp.textContent = p[1];
        if (avant[p[0]] !== undefined) { el.classList.add('ed-bouge'); setTimeout(function () { el.classList.remove('ed-bouge'); }, 260); }
        avant[p[0]] = p[1];
      }
    });
  }
  var deck = document.getElementById('deck');
  var attente = 0;
  if (deck) new MutationObserver(function () {
    if (attente) return;
    attente = requestAnimationFrame(function () { attente = 0; majCompteur(); });
  }).observe(deck, { subtree: true, attributes: true, attributeFilter: ['class'], childList: true });
  majCompteur();
})();

// Les quatre leviers et leurs reprises (24 novembre). Antonin : « il n'y a qu'une seule
// bonne réponse […] si on clique sur rajouter des rouges […] il y a une coche verte, et si
// on met sur faire fuir les bleus, divertir les bleus, décourager les bleus, et ben ça fait
// une croix rouge sur la vignette […] il faut qu'ils puissent voter pour choisir laquelle
// des 4 options est bonne. » Les bonnes réponses sont propres à chaque occurrence : elles
// sont écrites sur la section elle-même (data-bonnes="1,2"), pas dans le contenu recopié,
// donc la diapo reste la même partout. Bonne carte : coche verte et son effet sur les ronds ;
// mauvaise carte : croix rouge, sans effet (un 2e clic retire la croix).
(function () {
  var NOMS = ['Rajouter des rouges', 'Faire fuir les bleus', 'Décourager les bleus', 'Divertir les bleus'];
  var st = document.createElement('style');
  st.textContent =
    '.mo-leviers .mo-carte[data-ed-verdict]::after{position:absolute;right:-16px;top:-16px;width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:900 36px/1 Nunito,sans-serif;color:#fff;z-index:5;box-shadow:0 4px 14px rgba(0,0,0,.35);animation:edVerdict .35s cubic-bezier(.3,1.6,.5,1)}' +
    '.mo-leviers .mo-carte[data-ed-verdict="juste"]::after{content:"✓";background:#16a34a}' +
    '.mo-leviers .mo-carte[data-ed-verdict="faux"]::after{content:"✗";background:#dc2626}' +
    '@keyframes edVerdict{from{transform:scale(0)}}';
  document.head.appendChild(st);
  function bonnes(slide) {
    return String(slide.getAttribute('data-bonnes') || '').split(/[ ,]+/).filter(Boolean).map(Number);
  }
  window.addEventListener('click', function (e) {
    if (!e.isTrusted) return;
    var carte = e.target.closest && e.target.closest('.mo-leviers[data-bonnes] .mo-carte');
    if (!carte || carte.closest('.slide.editing')) return;
    var m = /\bmo-c(\d)\b/.exec(carte.className); if (!m) return;
    var n = Number(m[1]);
    if (bonnes(carte.closest('section.slide')).indexOf(n) >= 0) {
      carte.setAttribute('data-ed-verdict', 'juste');   // le moteur retourne la carte ensuite
      return;
    }
    e.stopPropagation(); e.preventDefault();
    if (carte.getAttribute('data-ed-verdict') === 'faux') carte.removeAttribute('data-ed-verdict');
    else carte.setAttribute('data-ed-verdict', 'faux');
  }, true);
  window.VOTE_QUESTIONS = (window.VOTE_QUESTIONS || []).concat([
    function (slide) {
      if (!slide.matches('.mo-leviers[data-bonnes]')) return null;
      return { cle: 'levier-' + slide.id, type: 'choix', titre: 'Quel levier est utilisé ici ?', options: NOMS };
    }
  ]);
})();
