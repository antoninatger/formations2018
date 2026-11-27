// Plus rien de propre à cette intervention : la liste qu'on coche en salle est devenue un
// widget du moteur (famille « liste-a-cocher », 7 septembre), monté depuis le balisage de
// la diapo et remis à zéro avec « Revoir depuis le début ».
const Deck = createDeckEngine({
  storagePrefix: 'fnrhetoric',
  extraEditCandidateSelectors: ['.two-imgs > .imgcard', '.persona-grid > .persona', '.img-grid > .imgcard', '.links-row > .gamelink', '.tech-grid > .techcard'],
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

// Textes et photos plus grands (27 novembre), repris de la formation universitaire, dont la partie
// rhétorique est en série avec celle-ci : Antonin veut les mêmes changements des deux côtés.
// Antonin : « tous les textes, quand c'est possible, doivent être plus grands » ; « de manière
// générale, photo plus grande, texte plus grand ».
// À l'affichage de chaque diapo, tout son contenu (textes, photos, schémas) est agrandi d'un même
// facteur, autour de son centre, jusqu'à remplir la zone sûre de l'écran (la bande 16:9 du milieu,
// que la projection ne coupe jamais) : rien ne se chevauche qui ne se chevauchait pas, rien ne
// sort de la page. Plafond : une fois et demie. Une diapo déjà pleine ne bouge pas.
// Affichage seulement : rien n'est écrit dans les diapos (une feuille de style du document,
// recalculée à chaque diapo), les diapos de série restent identiques dans les autres formations,
// et le mode édition montre la diapo telle qu'elle est enregistrée.
// Laissées telles quelles : les diapos dont le contenu grandit pendant la séance (réponses
// tapées, nuages de mots), celles qui ont leur propre mise en page (alphabet, sophismes, quiz
// « complot ou théorie du complot »).
(function () {
  var deck = document.getElementById('deck');
  if (!deck) return;
  var feuille = document.createElement('style');
  feuille.id = 'ed-agrandir';
  document.head.appendChild(feuille);
  var ZONE = { g: 155, d: 1770, h: 40, b: 880 };
  var PLAFOND = 1.5;
  var EXCLUES = '.wreponse, .wpoll[data-telephone="textes"], .wpoll[data-telephone="mots"], .ed-props-soph, iframe, [class*="duel"]';

  function horsContenu(el) {
    var c = typeof el.className === 'string' ? el.className : '';
    return /(^|\s)(ed-|widget-ctl|slide-comment|speaker-notes)/.test(c) || el.tagName === 'SCRIPT' || el.tagName === 'STYLE';
  }
  function boite(slide) {
    var sr = slide.getBoundingClientRect();
    var k = sr.width / slide.offsetWidth || 1;
    var b = null;
    function ajouter(el) {
      if (horsContenu(el) || el.hidden) return;
      var cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') return;
      var r = el.getBoundingClientRect();
      if (r.width > 1 && r.height > 1) {
        var x1 = (r.left - sr.left) / k, y1 = (r.top - sr.top) / k, x2 = (r.right - sr.left) / k, y2 = (r.bottom - sr.top) / k;
        b = b ? { x1: Math.min(b.x1, x1), y1: Math.min(b.y1, y1), x2: Math.max(b.x2, x2), y2: Math.max(b.y2, y2) } : { x1: x1, y1: y1, x2: x2, y2: y2 };
      }
      if (cs.overflow === 'visible') Array.prototype.forEach.call(el.children, ajouter);
    }
    Array.prototype.forEach.call(slide.children, ajouter);
    return b;
  }
  function calculer(slide) {
    feuille.textContent = '';
    if (!slide || !slide.id || slide.classList.contains('editing') || slide.classList.contains('quiz-complot')) return;
    if (slide.id === 's-alpha' || slide.querySelector(EXCLUES)) return;
    void slide.offsetWidth;
    var b = boite(slide);
    if (!b) return;
    var w = b.x2 - b.x1, h = b.y2 - b.y1;
    var zw = ZONE.d - ZONE.g, zh = ZONE.b - ZONE.h;
    var f = Math.min(PLAFOND, zw / w, zh / h);
    if (!(f > 1.04)) return;
    f = Math.floor(f * 100) / 100;
    var C = { x: slide.offsetWidth / 2, y: slide.offsetHeight / 2 };
    var c = { x: (b.x1 + b.x2) / 2, y: (b.y1 + b.y2) / 2 };
    function borne(v, mi, ma) { return Math.max(mi, Math.min(ma, v)); }
    var cx = borne(C.x + f * (c.x - C.x), ZONE.g + f * w / 2, ZONE.d - f * w / 2);
    var cy = borne(C.y + f * (c.y - C.y), ZONE.h + f * h / 2, ZONE.b - f * h / 2);
    var tx = Math.round(cx - C.x - f * (c.x - C.x)), ty = Math.round(cy - C.y - f * (c.y - C.y));
    feuille.textContent = '#deck #' + CSS.escape(slide.id) + '.active:not(.editing){scale:' + f + ';translate:' + tx + 'px ' + ty + 'px;transform-origin:50% 50%}';
  }
  function active() { return deck.querySelector('section.slide.active'); }
  var prevu = false;
  function bientot() {
    if (prevu) return;
    prevu = true;
    // Après « les photos à la taille de l'écran », qui place les photos au même moment.
    requestAnimationFrame(function () { requestAnimationFrame(function () { prevu = false; calculer(active()); }); });
  }
  var derniere = null, enEdition = false;
  new MutationObserver(function () {
    var s = active();
    var ed = !!(s && s.classList.contains('editing'));
    if (s !== derniere || ed !== enEdition) { derniere = s; enEdition = ed; bientot(); }
  }).observe(deck, { subtree: true, attributes: true, attributeFilter: ['class'] });
  new MutationObserver(bientot).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  deck.addEventListener('load', function (e) { if (e.target.tagName === 'IMG' && e.target.closest('section.slide.active')) bientot(); }, true);
  window.addEventListener('resize', bientot);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(bientot);
  bientot();
  window.Agrandir = { calculer: calculer, bientot: bientot, effacer: function () { feuille.textContent = ''; } };
})();

// Le jeu des 4 manières de débattre (27 novembre). Un clic sur l'étiquette d'un personnage fait défiler
// les rôles, un clic sur la flèche fait défiler les sens ; « Valider avec la classe » corrige.
// Rien n'est enregistré : c'est l'état de la séance. Les bonnes réponses sont dans data-bon.
(function () {
  var ROLES = ['', 'Orateur', 'Interlocuteur', 'Auditoire', 'Auditoire = Interlocuteur', 'Orateur et interlocuteur'];
  var SENS = [['', '?'], ['convainc', '→'], ['s’influencent', '⇄'], ['convaincre le public', '↓'], ['joute verbale', '⚔']];
  function poserFleche(b, v) {
    var k = 0; SENS.forEach(function (x, i) { if (x[0] === v) k = i; });
    b.setAttribute('data-val', SENS[k][0]);
    b.querySelector('b').textContent = SENS[k][1];
    b.querySelector('small').textContent = SENS[k][0] || 'sens';
  }
  function poserRole(b, v) { b.setAttribute('data-val', v); b.textContent = v || '?'; }
  window.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.jeu-debat button, .jd-valider');
    if (!b || b.closest('.slide.editing')) return;
    e.stopPropagation(); e.preventDefault();
    var slide = b.closest('section.slide'), jeu = slide.querySelector('.jeu-debat');
    if (b.classList.contains('jd-valider')) {
      if (jeu.hasAttribute('data-valide')) {          // second clic : on recommence
        jeu.removeAttribute('data-valide');
        jeu.querySelectorAll('.jd-role').forEach(function (r) { poserRole(r, ''); r.parentNode.classList.remove('jd-ok', 'jd-ko'); });
        jeu.querySelectorAll('.jd-fleche').forEach(function (f) { poserFleche(f, ''); f.parentNode.classList.remove('jd-ok', 'jd-ko'); });
        b.textContent = 'Valider avec la classe'; return;
      }
      jeu.setAttribute('data-valide', '');
      jeu.querySelectorAll('.jd-role, .jd-fleche').forEach(function (x) {
        var ok = x.getAttribute('data-val') === x.getAttribute('data-bon');
        x.parentNode.classList.toggle('jd-ok', ok); x.parentNode.classList.toggle('jd-ko', !ok);
        x.parentNode.querySelector('.jd-verdict').textContent = ok ? '✓' : '✗';
        if (!ok) { if (x.classList.contains('jd-fleche')) poserFleche(x, x.getAttribute('data-bon')); else poserRole(x, x.getAttribute('data-bon')); }
      });
      b.textContent = 'Recommencer'; return;
    }
    if (jeu.hasAttribute('data-valide')) return;
    if (b.classList.contains('jd-fleche')) {
      var k = 0; SENS.forEach(function (x, i) { if (x[0] === b.getAttribute('data-val')) k = i; });
      poserFleche(b, SENS[(k + 1) % SENS.length][0]);
    } else {
      var i = ROLES.indexOf(b.getAttribute('data-val'));
      poserRole(b, ROLES[(i + 1) % ROLES.length]);
    }
  }, true);
})();
