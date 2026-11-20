// Plus rien de propre à cette intervention : la bascule 64 % / 36 % est devenue un widget
// du moteur (famille « compteur-bascule », 7 septembre), qui porte ses deux valeurs dans
// le balisage au lieu de les avoir écrites dans le code d'une seule formation.
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
