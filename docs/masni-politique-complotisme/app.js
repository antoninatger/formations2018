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
const Deck = createDeckEngine({
  storagePrefix: 'masni',
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
