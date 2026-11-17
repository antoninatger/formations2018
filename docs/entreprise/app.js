// Entreprise : enjeux de l’information — née le 17 novembre 2026 du PowerPoint
// « Formation entreprise 30 - 45 minutes ». La plupart des diapos sont en série avec MASNI ;
// les sélecteurs de l’éditeur sont donc ceux de MASNI.
const Deck = createDeckEngine({
  storagePrefix: 'entreprise',
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
