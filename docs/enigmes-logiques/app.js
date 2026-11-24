// Énigmes logiques — venue de PowerPoint (import de Contenus/, 23 septembre 2026).
const Deck = createDeckEngine({
  storagePrefix: 'enigmes',
  complexSlideIds: new Set(),
  playPausedVideoOnAdvance: true,
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

// Les réponses des élèves à l'énigme des pommes de terre (24 novembre). Antonin : « les
// élèves peuvent écrire leur suggestion (si la réponse est juste, elle est validée) […] mais
// elles s'affichent toutes ». Même système que « Désinformation : comment manipuler
// l'opinion » : en mode 📱 Téléphones ou 💻 Chacun son PC (boutons du bandeau,
// ../shared-vote-public.js), une fois la dernière ligne de l'énoncé affichée, la question part
// sur les téléphones / PC. Toutes les réponses s'affichent sous l'énoncé ; celles qui disent
// 50 (kg) sont en vert avec ✓. Zone « ed- » : rien n'est écrit dans le fichier. Un clic sur
// une réponse l'efface de l'écran. En mode 🖥️ Projecteur, rien ne change (à main levée).
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
(function () {
  var ID = 'enigmes-les-pommes-de-terre';
  var st = document.createElement('style');
  st.textContent =
    '.ed-pdt{position:absolute;left:12.731%;top:62%;width:75%;height:30%;display:flex;flex-wrap:wrap;align-content:flex-start;gap:8px 10px;overflow:hidden;z-index:3}' +
    '.ed-pdt:empty{display:none}' +
    '.ed-pdt span{background:rgba(255,255,255,.94);color:#14161c;border:3px solid transparent;border-radius:12px;padding:6px 12px;font:600 22px/1.3 Nunito,sans-serif;cursor:pointer;animation:edPdtArrive .35s ease}' +
    '.ed-pdt span.juste{background:#dcfce7;border-color:#16a34a;color:#14532d;font-weight:800}' +
    '.ed-pdt span.juste::before{content:"✓ ";color:#16a34a}' +
    '@keyframes edPdtArrive{from{opacity:0;transform:translateY(8px)}}' +
    '.slide.editing .ed-pdt{display:none}';
  document.head.appendChild(st);

  // Juste : le nombre 50 tout seul (« 50 », « 50 kg », « 50kg », « 50 kilos »), ou « cinquante ».
  // Pas « 150 », « 0,50 » ni « 50,5 ».
  function juste(t) {
    var s = String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return /(^|[^0-9.,])50(?![0-9]|[.,][0-9])/.test(s) || /\bcinquante\b/.test(s);
  }
  function zone(slide) {
    var z = slide.querySelector('.ed-pdt');
    if (!z) {
      z = document.createElement('div');
      z.className = 'ed-pdt';
      z.addEventListener('click', function (e) {
        var s = e.target.closest('span');
        if (s && window.VotePublic && window.VotePublic.masquer) { window.VotePublic.masquer(s.dataset.mot); s.remove(); }
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
      s.dataset.mot = x.mot;
      s.textContent = x.mot + (x.n > 1 ? ' ×' + x.n : '');
      if (juste(x.mot)) s.className = 'juste';
      z.appendChild(s);
    });
  }
  window.VOTE_QUESTIONS = (window.VOTE_QUESTIONS || []).concat([
    function (slide, mode) {
      if (mode === 'projecteur' || slide.id !== ID) return null;
      var etapes = slide.querySelectorAll('.step');
      var derniere = etapes[etapes.length - 1];
      if (!derniere || !derniere.classList.contains('shown')) return null;
      return { cle: 'reponse', titre: 'Combien pèse désormais le lot de pommes de terre ?',
        afficher: function (m) { remplir(zone(slide), m); } };
    }
  ]);
})();
