// « MASNI — Politique et complotisme » : les cinq cours du MASNI dans une seule formation
// (import du 21 septembre 2026).
//
// Rien de dynamique ici, et c'est voulu : aucune diapo n'est engendrée par ce fichier, tout
// est dans le balisage de index.html. Ce qu'Antonin ouvre dans l'éditeur EST ce qui est
// projeté — pas de jumeau à plat qui dormirait à côté d'un interactif.
//
// Les sélecteurs ci-dessous sont l'union de ceux des quatre formations où les diapos ont
// été piochées : sans eux, l'éditeur ne saurait pas attraper une image d'une paire ou
// d'une grille venue de niveau2 ou de la rhétorique.
// Les reprises (26 novembre, comme dans niveau 2). Une diapo vide qui porte
// data-reprise="<id>" reçoit, à l'ouverture et avant le moteur, une copie du contenu de la
// diapo <id> : on ne modifie que l'originale, les reprises suivent. Ici, la diapo des
// critères du cours 2 reprend s5 (celle du cours 3, en série avec niveau 1 et niveau 2), et
// les trois « leviers » du cours 3 reprennent nv2-leviers. Les règles de style écrites pour
// l'originale (#s5 …) sont réécrites pour la copie.
(function () {
  document.querySelectorAll('#deck section.slide[data-reprise]').forEach(function (copie) {
    var source = document.getElementById(copie.getAttribute('data-reprise'));
    if (!source || source === copie) return;
    var re = new RegExp('#' + source.id.replace(/[-]/g, '\\-') + '(?![\\w-])', 'g');
    copie.innerHTML = source.innerHTML.replace(re, '#' + copie.id);
    copie.querySelectorAll('[id]').forEach(function (el) { el.id = copie.id + '-' + el.id; });
  });
})();

// Repris de formation-fake-news-niveau1/app.js (26 novembre) : la diapo « Récitez
// l'alphabet à l'envers » (s-alpha, en série) a besoin de ce code pour ses lettres.
// ── Alphabet à rebours (Z -> A) : seule diapo au sens de flèches inversé ──
let alphaCtl = null;

function buildAlphabet() {
  const slideEl = document.getElementById('s-alpha');
  const grid = document.getElementById('alpha-grid');
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  letters.forEach(L => {
    const span = document.createElement('span');
    span.className = 'alpha-letter';
    span.textContent = L;
    grid.appendChild(span);
  });
  const boxes = Array.from(grid.children);
  let revealedCount = 0;

  function revealNext() {
    if (revealedCount >= boxes.length) return false;
    const idx = boxes.length - 1 - revealedCount;
    boxes[idx].classList.add('shown');
    revealedCount++;
    return true;
  }
  function retreat() {
    if (revealedCount <= 0) return false;
    revealedCount--;
    const idx = boxes.length - 1 - revealedCount;
    boxes[idx].classList.remove('shown');
    return true;
  }
  function isDone() { return revealedCount >= boxes.length; }
  function isAtStart() { return revealedCount <= 0; }
  function reset() {
    revealedCount = 0;
    boxes.forEach(b => b.classList.remove('shown'));
  }

  grid.addEventListener('click', revealNext);

  return { slideEl, revealNext, isDone, isAtStart, retreat, reset };
}

// Cas particulier : sur la diapo alphabet, les lettres se révèlent de Z vers A, mais
// les flèches gardent leur sens habituel — DROITE fait avancer (une lettre de plus,
// puis la diapo suivante quand l'alphabet est complet), GAUCHE fait reculer (une lettre
// de moins, puis la diapo précédente quand il n'en reste aucune). Le sens inversé
// d'origine bloquait la navigation : la flèche droite ne faisait que retirer des lettres
// et ne permettait jamais de quitter la diapo.
function alphabetArrowOverride(e, activeSlide) {
  if (!alphaCtl || activeSlide !== alphaCtl.slideEl || activeSlide.classList.contains('static-active')) return false;
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    if (!alphaCtl.isDone()) { alphaCtl.revealNext(); return true; }
    Deck.next();
    return true;
  }
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    if (!alphaCtl.isAtStart()) { alphaCtl.retreat(); return true; }
    Deck.prev();
    return true;
  }
  return false;
}

const Deck = createDeckEngine({
  storagePrefix: 'masni',
  complexSlideIds: new Set(['s-alpha']),
  arrowOverride: alphabetArrowOverride,
  onInit() { alphaCtl = buildAlphabet(); },
  onRestart() { if (alphaCtl) alphaCtl.reset(); },
  playPausedVideoOnAdvance: true,
  lightboxToutesImages: true,   // beaucoup de figures d'études : un clic les ouvre en grand
  extraEditCandidateSelectors: [
    '.two-imgs > .imgcard', '.img-grid > .imgcard', '.montage-grid > .m-item',
    '.vid-row > .vidcol', '.tech-grid > .techcard', '.links-row > .gamelink',
    '.persona-grid > .persona', '.causal-stack > .causal-pair',
  ],
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

// Les photos à la taille de l'écran (21 novembre).
// Antonin : « grandis toutes tes photos pour qu'elles fassent la taille de l'écran ».
// Une diapo qui ne porte qu'UNE photo (dans un cadre .imgcard ou .imgcard-full) la voit
// agrandie au plus grand qui tienne dans la place libre : sous le titre, au-dessus du
// sondage ou de la phrase qui suit, sans déformation. Seule sur sa diapo, elle prend toute
// la hauteur. La largeur reste dans la zone 16:9 du milieu (1614 px de la toile de
// 1925 px), que la projection ne coupe jamais.
// Rien n'est écrit dans les diapos : les tailles sont recalculées à l'affichage de chaque
// diapo et posées dans une feuille de style du document, hors de tout enregistrement. En
// mode édition, la diapo reprend la taille et la place réglées à la main.
// La place libre change avec le vote : en version « présentation seule », le sondage par
// téléphone est masqué (main levée), la photo prend sa place ; en version téléphone, elle
// lui laisse la sienne. D'où le recalcul quand la classe de <html> change.
(function () {
  var deck = document.getElementById('deck');
  if (!deck) return;
  var feuille = document.createElement('style');
  feuille.id = 'ed-photos-ecran';
  document.head.appendChild(feuille);
  var regles = {};
  var LARGEUR_SURE = 1614;   // 908 × 16 / 9 : ce que montre un écran 16:9
  var MARGE = 16;            // entre la photo et le texte voisin
  var BAS = 28;              // marge du bas, quand la photo est la dernière chose de la diapo

  function ecrire() {
    feuille.textContent = Object.keys(regles).map(function (k) { return regles[k]; }).join('\n');
  }
  function visible(el) {
    if (el.hidden) return false;
    var cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden';
  }
  function horsContenu(el) {
    var c = typeof el.className === 'string' ? el.className : '';
    return /(^|\s)(ed-|widget-ctl|slide-comment)/.test(c) || el.tagName === 'SCRIPT' || el.tagName === 'STYLE';
  }
  // La diapo et sa photo, si la diapo n'en porte qu'une, seule dans son cadre.
  function photoDe(slide) {
    if (!slide.id || slide.classList.contains('editing')) return null;
    if (slide.querySelector('video, iframe, canvas, svg image')) return null;
    var imgs = slide.querySelectorAll('img');
    if (imgs.length !== 1) return null;
    var img = imgs[0];
    var cadre = img.parentElement;
    if (!cadre || cadre.parentElement !== slide) return null;
    if (!/(^|\s)imgcard(-full)?(\s|$)/.test(cadre.className)) return null;
    // Seules sont admises, à côté de la photo, les marques posées dessus (le tampon VRAI /
    // FAUX des quiz), qui suivent le cadre. Une forme ou un cache posés sur la DIAPO, eux,
    // ne suivraient pas : la diapo est alors laissée telle quelle.
    var autres = Array.prototype.filter.call(cadre.children, function (c) {
      return c !== img && !horsContenu(c) && !/(^|\s)vf-marque(\s|$)/.test(c.className);
    });
    if (autres.length) return null;
    var formes = Array.prototype.some.call(slide.children, function (c) {
      return c !== cadre && /(^|\s)(forme|cache)/.test(c.className) && getComputedStyle(c).position === 'absolute';
    });
    if (formes) return null;
    return { img: img, cadre: cadre };
  }

  function calculer(slide) {
    var p = photoDe(slide);
    if (!p) return;
    var id = slide.id;
    if (regles[id]) { delete regles[id]; ecrire(); }
    var nw = p.img.naturalWidth, nh = p.img.naturalHeight;
    if (!nw || !nh) {
      if (!p.img._photosEcran) {
        p.img._photosEcran = true;
        p.img.addEventListener('load', function () { calculer(slide); });
      }
      return;
    }
    var W = slide.clientWidth, H = slide.clientHeight;
    var sr = slide.getBoundingClientRect();
    var k = sr.height / H || 1;
    function local(el) {
      var r = el.getBoundingClientRect();
      return { top: (r.top - sr.top) / k, bottom: (r.bottom - sr.top) / k, left: (r.left - sr.left) / k, right: (r.right - sr.left) / k };
    }
    var cr = local(p.cadre);
    var centre = (cr.top + cr.bottom) / 2;
    var pose = getComputedStyle(p.cadre).position === 'absolute';
    var largeurMax = Math.min(LARGEUR_SURE, W - 32);
    var sel = '#deck #' + CSS.escape(id) + ':not(.editing)';
    var enfants = Array.prototype.slice.call(slide.children);
    var autres = enfants.filter(function (c) {
      if (c === p.cadre || horsContenu(c) || !visible(c)) return false;
      var r = local(c);
      return r.bottom - r.top > 1;
    }).map(function (c) { var r = local(c); r.el = c; return r; });
    var dessus = autres.filter(function (r) { return (r.top + r.bottom) / 2 < centre; });
    var dessous = autres.filter(function (r) { return (r.top + r.bottom) / 2 >= centre; });
    var hAvant = (cr.bottom - cr.top) - 2;
    var classe = '.' + p.cadre.className.trim().split(/\s+/)[0];
    var css;
    if (pose || !autres.length) {
      // Cadre posé à la main, ou photo seule : la photo se replace au milieu, sous le titre,
      // et ce qui était sous elle descend d'autant (sans changer d'ordre ni d'écart).
      // Un texte À CÔTÉ de la photo (même hauteur) : on ne touche à rien.
      var aCote = autres.some(function (r) { return r.top < cr.bottom - 10 && r.bottom > cr.top + 10; });
      if (aCote) return;
      var haut = dessus.length ? Math.max.apply(null, dessus.map(function (r) { return r.bottom; })) + MARGE : 0;
      var finDessous = dessous.length ? Math.max.apply(null, dessous.map(function (r) { return r.bottom; })) : cr.bottom;
      var queue = finDessous - cr.bottom;                // hauteur de ce qui suit la photo
      var plafond = dessous.length ? H - BAS : H;
      var bh = plafond - queue - haut - 2;
      if (bh <= hAvant + 4 && dessus.length) return;     // pas de place à gagner
      var e = Math.min(largeurMax / nw, bh / nh);
      var w = Math.floor(nw * e), h = Math.floor(nh * e);
      if (h < hAvant) return;
      var top = Math.round(haut + (bh - h) / 2);
      var left = Math.round((W - w) / 2);
      css = sel + ' > ' + classe + '{position:absolute!important;left:' + left + 'px!important;top:' + top +
        'px!important;width:' + w + 'px!important;height:auto!important;max-width:none!important;max-height:none!important;margin:0!important;transform:none!important}';
      var decalage = Math.round(top + h + 2 - cr.bottom);
      dessous.forEach(function (r) {
        css += sel + ' > :nth-child(' + (enfants.indexOf(r.el) + 1) + '){translate:0 ' + decalage + 'px!important}';
      });
    } else {
      // Dans le fil de la diapo : la photo grandit de toute la place qui reste en bas.
      var finContenu = Math.max.apply(null, [cr.bottom].concat(Array.prototype.filter.call(slide.children, function (c) {
        return !horsContenu(c) && visible(c) && getComputedStyle(c).position !== 'absolute';
      }).map(function (c) { return local(c).bottom + (parseFloat(getComputedStyle(c).marginBottom) || 0); })));
      var limite = H - BAS;
      var libre = limite - finContenu;
      // Jamais plus petite qu'avant : avec un sondage, la place peut manquer.
      if (libre < 8) return;                             // pas de place à gagner : rien ne change
      var hImg = hAvant + libre;
      var e2 = Math.min(largeurMax / nw, hImg / nh);
      var w2 = Math.floor(nw * e2);
      css = sel + '{padding-bottom:' + BAS + 'px!important}' +
        sel + ' > ' + classe + '{width:' + w2 + 'px!important;height:auto!important;max-width:none!important;max-height:none!important;flex-shrink:0!important}';
    }
    css += sel + ' > ' + classe + ' > img{width:100%!important;height:auto!important;max-width:none!important;max-height:none!important}';
    regles[id] = css;
    ecrire();
  }

  function active() { return deck.querySelector('section.slide.active'); }
  var prevu = false;
  function bientot() {
    if (prevu) return;
    prevu = true;
    requestAnimationFrame(function () {
      prevu = false;
      var s = active();
      if (s) calculer(s);
    });
  }
  var derniere = null, enEdition = false;
  new MutationObserver(function () {
    var s = active();
    var ed = !!(s && s.classList.contains('editing'));
    if (s !== derniere || ed !== enEdition) { derniere = s; enEdition = ed; bientot(); }
  }).observe(deck, { subtree: true, attributes: true, attributeFilter: ['class'] });
  // Version téléphone ou présentation seule : le sondage apparaît ou disparaît.
  new MutationObserver(function () { regles = {}; ecrire(); bientot(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(bientot);
  bientot();
  window.PhotosEcran = { calculer: calculer };
})();


// ─────────────────────────────────────────────────────────────────────────────────────
// Repris de formation-fake-news-niveau2/app.js (26 novembre). Le cours 3 porte désormais
// les diapos de niveau 2, en série : leurs votes par téléphone et leurs jeux (curseur de
// l'opinion, leviers, titres des vaccins, critères, tweets du métro, tweet de Noël) sont
// recopiés ici tels quels. Si le code change dans niveau 2, le recopier ici aussi.
// Seule adaptation : la diapo des critères existe deux fois (s5 au cours 3, sa reprise
// masni-c2-n1-s5 au cours 2), critId() dit laquelle est à l'écran.
function critId() {
  var a = document.querySelector('#deck section.slide.active');
  return a && a.id === 'masni-c2-n1-s5' ? 'masni-c2-n1-s5' : 's5';
}

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
    '#nv2-s11:has(.step[data-order="3"].shown) .ed-props-mes,#nv2-s11:has(.step[data-order="4"].shown) .ed-props-des,#nv2-s11:not(:has(.step[data-order="2"].shown)) .ed-props-des{opacity:0;pointer-events:none}' +
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
    // 25 novembre, Antonin : « je vais être sûr que dans le vote, ils aient une case
    // désinformation, une case mésinformation. Et comme ça, moi, ça remplira les deux zones. »
    // Une seule question à deux cases, ouverte du 1er clic jusqu'à la définition de la
    // désinformation ; chaque réponse va sous son titre.
    function (slide) {
      if (slide.id !== 'nv2-s11' || !montre(slide, 1) || montre(slide, 4)) return null;
      return { cle: 'definitions', titre: 'Votre définition', champs: ['Mésinformation', 'Désinformation'],
        afficher: function (m) {
          var mots = (m && m.mots) || [];
          remplir(zone(slide, 'ed-props-mes', 'left:16.462%;top:39.5%;width:70%;height:20.5%'), { mots: mots.filter(function (x) { return !x.champ; }) });
          remplir(zone(slide, 'ed-props-des', 'left:16.462%;top:68.5%;width:70%;height:26%'), { mots: mots.filter(function (x) { return x.champ === 1; }) });
        } };
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
    'body:not(:has(#s5.active)):not(:has(#masni-c2-n1-s5.active)) .ed-props-crit,body:has(.slide.editing) .ed-props-crit{display:none}' +
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
          var cachee = document.querySelector('#' + critId() + ' .crit-pos.step:not(.shown)');
          if (cachee && window.Deck && Deck.next) Deck.next();
          setTimeout(function () {
            var carte = document.querySelectorAll('#' + critId() + ' .crit-pos .retourne')[n - 1];
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
      if (slide.id !== 's5' && slide.id !== 'masni-c2-n1-s5') return null;
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
    if (slide.id !== 'nv2-s15') return null;
    function vu(n) { var t = slide.querySelector('.tw-carte.step[data-order="' + n + '"]'); return !!(t && t.classList.contains('shown')); }
    // 25 novembre : « une fois que je rajoute Info sans filtre et Justice pour elles, tu crées
    // un nouveau vote où ils doivent voter soit pour Info sans filtre, soit Justice pour elles ».
    if (vu(4)) return { cle: 'description-2', type: 'choix', titre: 'Et maintenant, quelle est la bonne description ?', options: ['Info Sans Filtre', 'Justice pour elles'] };
    if (vu(2) && !vu(3)) return { cle: 'description', type: 'choix', titre: 'Quelle est la bonne description de la vidéo ?', options: ['Patriote Éveillé', 'Le Fil Métro'] };
    return null;
  },
  // Diapo 33, le tweet de Noël (25 novembre). Antonin : « ils peuvent voter avant et après que
  // je clique pour changer d'information, pour dire si c'est positif, négatif ou neutre ».
  // Deux votes distincts : un pour chaque version du tweet.
  function (slide) {
    if (slide.id !== 's16') return null;
    var v = slide.querySelector('.tw-zone-tweet .pct-value');
    var apres = !!(v && v.textContent.indexOf('64') < 0);
    return { cle: apres ? 'ton-apres' : 'ton-avant', type: 'choix', titre: 'Cette information est-elle positive, négative ou neutre ?', options: ['Positive', 'Négative', 'Neutre'] };
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
      // Ouverte dès l'arrivée sur la diapo (25 novembre) ; les idées s'affichent à l'écran
      // une fois le titre retourné.
      if (slide.id !== 'nv2-manipuler-opinion') return null;
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

// Diapo 36, le jeu des titres en mode 📱 / 💻 (25 novembre). Antonin : « je voudrais que les
// élèves puissent sélectionner eux-mêmes de leur page les vignettes qui leur semblent
// pertinentes ». Chacun coche sur sa page autant de titres qu'il veut ; à l'écran, chaque
// vignette porte le nombre d'élèves qui l'ont choisie (pastille « ed- », jamais enregistrée).
(function () {
  var st = document.createElement('style');
  st.textContent =
    '#nv2-vaccins-titres .vt-carte{position:relative}' +
    '.ed-vt-n{position:absolute;top:-12px;right:-12px;min-width:40px;height:40px;padding:0 8px;border-radius:999px;background:#2563eb;color:#fff;font:800 22px/40px Nunito,sans-serif;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,.4);pointer-events:none;animation:edPropArrive .3s ease}' +
    '.slide.editing .ed-vt-n,#nv2-vaccins-titres[data-ed-valide] .ed-vt-n{display:none}';
  document.head.appendChild(st);
  function titres(slide) {
    return Array.prototype.map.call(slide.querySelectorAll('.vt-carte'), function (c) {
      var t = c.querySelector('.vt-titre .t-fr') || c.querySelector('.vt-titre') || c;
      // 25 novembre : « Mets si l'info est vraie ou fausse » sur la page des élèves aussi.
      var v = c.querySelector('.vt-verdict .t-fr') || c.querySelector('.vt-verdict');
      var verdict = v ? v.textContent.replace(/\s+/g, ' ').trim() : '';
      return t.textContent.replace(/\s+/g, ' ').trim() + (verdict ? ' (' + verdict + ')' : '');
    });
  }
  window.VOTE_QUESTIONS = (window.VOTE_QUESTIONS || []).concat([
    function (slide) {
      if (slide.id !== 'nv2-vaccins-titres' || slide.hasAttribute('data-ed-valide')) return null;
      return { cle: 'titres', type: 'selection', titre: 'Quelles informations vas-tu choisir ?', options: titres(slide),
        afficher: function (m) {
          var comptes = (m && m.comptes) || [];
          slide.querySelectorAll('.vt-carte').forEach(function (c, i) {
            var b = c.querySelector('.ed-vt-n'), n = comptes[i] || 0;
            if (!n) { if (b) b.remove(); return; }
            if (!b) { b = document.createElement('span'); b.className = 'ed-vt-n'; c.appendChild(b); }
            b.textContent = n;
          });
        } };
    }
  ]);
})();


// ─────────────────────────────────────────────────────────────────────────────────────
// Le vote par téléphone sur les autres diapos de vote (26 novembre). Antonin : « je veux
// que l'option téléphone […] les gens puissent voter avec leur téléphone, sur toutes ces »
// diapos. Les diapos « Vrai ou faux ? » et « Laquelle est générée par IA ? » votent déjà
// toutes seules (vote éclair) ; les sondages du cours 1 sont réglés « par téléphone ».
// Restent trois familles, posées ici, sans rien écrire dans les diapos :
//  · « Vraie photo, ou générée par IA ? » (.photo-ia, cours 2) : Vraie photo / Générée par IA ;
//  · « À main levée… » (s26, le sondage des conducteurs) : les trois questions du sondage ;
//  · « Réponses à écrire » (.wreponse, les caractéristiques d'une théorie du complot) : ce
//    que les téléphones envoient entre dans la liste, comme si on le tapait au clavier
//    (vert si c'est une réponse attendue, rouge sinon).
(function () {
  function texte(el) { return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  function titreDe(slide) { var h = slide.querySelector('h2 .t-fr, h1 .t-fr, h2, h1'); return texte(h); }
  var envoyes = {};
  window.VOTE_QUESTIONS = (window.VOTE_QUESTIONS || []).concat([
    function (slide) {
      if (!slide.classList.contains('photo-ia')) return null;
      return { cle: 'photo-ia', type: 'choix', titre: titreDe(slide), options: ['Vraie photo', 'Générée par IA'] };
    },
    function (slide) {
      var d = slide.querySelector('.drive-polls[data-sondage]');
      if (!d) return null;
      var opts = [];
      try { opts = JSON.parse(d.getAttribute('data-sondage')).map(function (q) { return String(q.fr || '').replace(/<[^>]+>/g, ''); }); } catch (e) { return null; }
      if (opts.length < 2) return null;
      return { cle: 'main-levee', type: 'choix', titre: titreDe(slide), options: opts };
    },
    function (slide) {
      var w = slide.querySelector('.wreponse[data-widget="reponse"]');
      if (!w) return null;
      var deja = envoyes[slide.id] = envoyes[slide.id] || {};
      return { cle: 'reponses', type: 'textes', titre: titreDe(slide),
        afficher: function (m) {
          var saisie = w.querySelector('.wreponse-saisie'), valider = w.querySelector('.wreponse-valider');
          if (!saisie || !valider) return;
          ((m && m.mots) || []).forEach(function (x) {
            if (!x || !x.mot || deja[x.mot]) return;
            deja[x.mot] = true;
            saisie.value = x.mot;
            valider.click();
          });
        } };
    }
  ]);
})();


// « Quel sophisme reconnaissez-vous ? » (cours 4, 26 novembre). Antonin : oui à un vote à
// réponse libre. Chacun écrit le sophisme qu'il reconnaît ; les réponses s'affichent à droite
// de l'écran, hors de la diapo (zone « ed- », jamais enregistrée). Un clic sur une réponse
// l'efface. La bonne réponse reste celle qu'on fait apparaître au clic, comme avant.
(function () {
  var IDS = ['masni-c4-reperer-1', 'masni-c4-reperer-2', 'masni-c4-reperer-3', 'masni-c4-reperer-4'];
  var st = document.createElement('style');
  st.textContent =
    '.ed-props-soph{position:fixed;z-index:12;right:1vw;top:12vh;width:22vw;max-height:76vh;overflow:hidden;' +
    'display:flex;flex-direction:column;gap:8px;pointer-events:auto}' +
    'body:has(.slide.editing) .ed-props-soph{display:none}' +
    '.ed-props-soph span{background:rgba(255,255,255,.92);color:#111827;border-radius:12px;padding:8px 14px;' +
    "font:700 20px 'Nunito',sans-serif;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.25)}";
  document.head.appendChild(st);
  function zone() {
    var z = document.querySelector('.ed-props-soph');
    if (!z) {
      z = document.createElement('div');
      z.className = 'ed-props-soph';
      z.addEventListener('click', function (e) {
        var s = e.target.closest('span');
        if (s && window.VotePublic && window.VotePublic.masquer) { window.VotePublic.masquer(s.textContent); s.remove(); }
      });
      document.body.appendChild(z);
    }
    return z;
  }
  function majVisibilite() {
    var a = document.querySelector('#deck section.slide.active');
    var z = document.querySelector('.ed-props-soph');
    if (z) z.style.display = a && IDS.indexOf(a.id) >= 0 ? '' : 'none';
  }
  new MutationObserver(majVisibilite).observe(document.getElementById('deck'), { subtree: true, attributes: true, attributeFilter: ['class'] });
  window.VOTE_QUESTIONS = (window.VOTE_QUESTIONS || []).concat([
    function (slide) {
      if (IDS.indexOf(slide.id) < 0) return null;
      var h = slide.querySelector('h2 .t-fr, h2');
      return { cle: 'sophisme', type: 'textes', titre: h ? h.textContent.trim() : 'Quel sophisme reconnaissez-vous ?',
        afficher: function (m) {
          var z = zone(); z.textContent = '';
          ((m && m.mots) || []).slice().reverse().forEach(function (x) {
            var s = document.createElement('span'); s.textContent = x.mot; z.appendChild(s);
          });
          majVisibilite();
        } };
    }
  ]);
})();
