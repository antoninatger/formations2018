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

// Diapos à interaction complexe : contenu interactif jamais détruit, converti à la demande
// en version statique éditable (voir shared-deck-engine.js). Les diapos qui portent un
// widget monté depuis ses données (data-checklist, data-cartes, data-barometre…) ne sont
// plus listées ici : le moteur les déclare lui-même en les montant.
//
// 21 septembre — « De maniere generale je ne veux plus une seule page dynamique ». Six
// diapos sortent de cette liste parce qu'elles ne sont plus dynamiques du tout : s4, s11,
// s-devinette-eclair, s30, s31 (bouton « Voir la reponse » + encadre revele) et s-imaginez
// (cartes a retourner) sont desormais du texte et des images, reveles par des blocs .step.
// Ce qu'Antonin ecrit dans l'editeur EST ce qui est projete : plus de jumeau a plat qui
// dormait a cote de l'interactif. Ne reste que s-alpha, dont l'alphabet a rebours est
// engendre par app.js.
const COMPLEX_SLIDE_IDS = new Set(['s-alpha']);

const Deck = createDeckEngine({
  storagePrefix: 'fn1',
  extraEditCandidateSelectors: ['.persona-grid > .persona'],
  complexSlideIds: COMPLEX_SLIDE_IDS,
  arrowOverride: alphabetArrowOverride,
  playPausedVideoOnAdvance: true,
  onInit(deck) {
    alphaCtl = buildAlphabet();
    // Les cinq portes d'encadre (s4, s11, s-devinette-eclair, s30, s31) et le cadre cliquable
    // de s20 ont disparu avec les boutons « Voir la reponse » : ces diapos n'ont plus que des
    // blocs .step, que les fleches, la molette et les zones de clic revelent deja — et
    // recachent en revenant en arriere, ce qu'aucune porte d'encadre ne savait faire.
  },
  // Widgets non enregistrés comme portes (pas pilotés par les flèches) : à réinitialiser
  // explicitement au "Revoir depuis le début", en plus des portes (reset générique).
  onRestart() {
    if (alphaCtl) alphaCtl.reset();
  }
});

// Deck.quizVote / Deck.quizReveal, que les boutons de s6 appellent, vivent desormais dans
// le moteur : ils visent le widget « quiz-vote » de la diapo active, comme Deck.vote ou
// Deck.critAddLine depuis l'etape V.
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
