// Intervention créée avec « Nouvelle intervention ».
// Tout le reste (quiz, sondages, jauges) s'ajoute par les modèles de diapo,
// sans code : ce fichier n'a besoin de rien d'autre pour qu'une formation vive.
const Deck = createDeckEngine({
  storagePrefix: 'arnenlig',
});
window.Deck = Deck;
Deck.init();

// Numéro de la diapo, en bas à gauche (18 octobre). Antonin : « mets un numéro sur chaque
// slide, comme ça après je pourrai te dicter les corrections ». Le numéro suit l'ordre
// des diapos dans le fichier ; il est recalculé à chaque changement de diapo.
(function () {
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
