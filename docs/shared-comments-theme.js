/* Widget partagé : bascule thème clair/sombre + bouton commentaire par diapo.
   Autonome — s'ajoute à n'importe quel diaporama de ce dossier qui a un
   #topbar > .tools et des sections .slide, sans toucher au script du diaporama. */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function storageKey(suffix) {
    return 'deckwidget:' + location.pathname + ':' + suffix;
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
:root[data-theme="light"]{
  --bg:#f4f6fb; --bg2:#e8ecf5; --panel:#ffffff; --panel2:#eef1f8;
  --tx:#0f172a; --mu:#5b6472; --bord:rgba(15,23,42,.14);
}
body{transition:background-color .3s ease,color .3s ease;}
.slide-comment{position:fixed;bottom:64px;right:18px;z-index:21;}
.comment-btn{width:38px;height:38px;border-radius:50%;background:var(--panel);border:1px solid var(--bord);
  color:var(--tx);font-size:1.05rem;cursor:pointer;position:relative;}
.comment-btn:hover{border-color:var(--acc2);}
.comment-btn.has-note::after{content:'';position:absolute;top:1px;right:1px;width:10px;height:10px;border-radius:50%;
  background:var(--acc);border:2px solid var(--bg);}
.comment-panel{display:none;position:absolute;bottom:44px;top:auto;right:0;width:min(300px,80vw);background:var(--panel);
  border:1px solid var(--bord);border-radius:12px;padding:10px;box-shadow:0 12px 30px rgba(0,0,0,.4);}
.comment-panel.open{display:block;}
.comment-panel textarea{width:100%;min-height:110px;background:var(--panel2);border:1px solid var(--bord);
  border-radius:8px;color:var(--tx);padding:8px 10px;font-family:'Nunito',sans-serif;font-size:.85rem;resize:vertical;}
.comment-panel textarea:focus-visible{outline:2px solid var(--acc2);}
.comments-modal{display:none;position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.6);align-items:center;justify-content:center;padding:20px;}
.comments-modal.open{display:flex;}
.comments-modal-box{background:var(--panel);border:1px solid var(--bord);border-radius:18px;padding:24px;
  max-width:640px;width:100%;max-height:80vh;display:flex;flex-direction:column;text-align:left;}
.comments-modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
.comments-modal-head h3{font-family:'Baloo 2',cursive;font-size:1.15rem;color:var(--acc);margin:0;}
.comments-modal-head button{background:none;border:none;color:var(--mu);font-size:1.2rem;cursor:pointer;}
.comments-modal-body{overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:12px;}
.comments-entry{background:var(--panel2);border:1px solid var(--bord);border-radius:12px;padding:12px 14px;}
.comments-entry-head{font-weight:800;font-size:.8rem;color:var(--acc);margin-bottom:6px;}
.comments-entry-head code{color:var(--mu);font-weight:600;}
.comments-entry-text{font-size:.88rem;line-height:1.5;white-space:pre-wrap;}
.comments-empty{color:var(--mu);font-size:.9rem;}
.comments-modal-actions{display:flex;gap:10px;margin-top:16px;}
#btn-theme,#btn-comments{background:var(--panel);border:1px solid var(--bord);color:var(--tx);border-radius:10px;
  padding:7px 12px;font-size:.85rem;font-weight:700;cursor:pointer;font-family:'Nunito',sans-serif;}
#btn-theme:hover,#btn-comments:hover{border-color:var(--acc2);}
.dw-reveal-btn{background:var(--panel2);border:1px solid var(--acc2);color:var(--acc2);
  border-radius:50px;padding:10px 24px;font-family:'Baloo 2',cursive;font-weight:700;font-size:.95rem;cursor:pointer;}
.dw-reveal-btn:hover{background:rgba(255,255,255,.08);}
@media(max-width:640px){
  .slide-comment{right:10px;}
  #btn-theme,#btn-comments{padding:6px 8px;font-size:.72rem;}
}
`;
    document.head.appendChild(style);
  }

  function injectThemeToggle(tools, state) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'btn-theme';
    tools.insertBefore(btn, tools.firstChild);
    state.themeBtn = btn;

    function apply(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      try { localStorage.setItem(storageKey('theme'), theme); } catch (e) { /* stockage indisponible */ }
      state.applyThemeLabel();
    }
    state.applyThemeLabel = function () {
      const theme = document.documentElement.getAttribute('data-theme') || 'dark';
      btn.textContent = theme === 'light'
        ? (state.lang === 'en' ? 'Dark mode' : 'Mode sombre')
        : (state.lang === 'en' ? 'Light mode' : 'Mode clair');
      btn.title = state.lang === 'en' ? 'Switch theme' : 'Changer de thème';
    };
    let theme = 'dark';
    try { theme = localStorage.getItem(storageKey('theme')) || 'dark'; } catch (e) { /* stockage indisponible */ }
    apply(theme);
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      apply(current === 'light' ? 'dark' : 'light');
    });
  }

  function injectComments(tools, slides, state) {
    const STORAGE_KEY = storageKey('comments');
    let store = {};
    try { store = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (e) { store = {}; }
    function save() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch (e) { /* stockage indisponible */ }
    }

    slides.forEach((slide, idx) => {
      if (!slide.id) slide.id = 'slide-' + idx;
    });

    // Un seul widget pour toute la présentation, rattaché à document.body — jamais à la
    // diapo : un panneau enfant de la <section> serait sérialisé par l'enregistrement en
    // page (fuite constatée le 2026-08-15). Il suit la diapo affichée via .slide.active.
    const wrap = document.createElement('div');
    wrap.className = 'slide-comment';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'comment-btn';
    btn.title = state.lang === 'en' ? 'Leave a comment on this slide' : 'Laisser un commentaire sur cette diapo';
    btn.textContent = '💬';
    const panel = document.createElement('div');
    panel.className = 'comment-panel';
    const textarea = document.createElement('textarea');
    textarea.placeholder = state.lang === 'en' ? 'Note here what should change on this slide…' : 'Notez ici les modifications à apporter à cette diapo…';
    panel.appendChild(textarea);
    wrap.appendChild(btn);
    wrap.appendChild(panel);
    document.body.appendChild(wrap);

    let currentId = null;
    let saveTimer = null;
    function updateBadge() {
      btn.classList.toggle('has-note', !!(currentId && store[currentId] && store[currentId].trim()));
    }
    // Écrire tout de suite ce qui est dans le champ, sans attendre la temporisation de
    // frappe : on s'en sert quand on quitte la diapo, et rien ne doit rester en l'air.
    function enregistrerMaintenant() {
      if (!currentId) return;
      store[currentId] = textarea.value;
      clearTimeout(saveTimer);
      save();
    }
    function syncToActiveSlide() {
      const active = document.querySelector('.slide.active');
      const id = active ? active.id : (slides[0] ? slides[0].id : null);
      if (id === currentId) { updateBadge(); return; }
      // Antonin, diapo 19 : changer de diapo pendant qu'on ecrit vidait le champ sous les
      // yeux — la note semblait perdue alors qu'elle etait bien rangee. Elle est donc
      // enregistree et la fenetre se ferme franchement : on voit ce qui se passe.
      if (panel.classList.contains('open')) {
        enregistrerMaintenant();
        panel.classList.remove('open');
        if (document.activeElement === textarea) textarea.blur();
      }
      currentId = id;
      textarea.value = (id && store[id]) || '';
      updateBadge();
    }
    syncToActiveSlide();
    // Suivre la diapo affichée sans toucher au script du diaporama : observer les
    // changements de classe sous le deck (couvre aussi les diapos créées en cours de route).
    new MutationObserver(syncToActiveSlide)
      .observe(document.getElementById('deck') || document.body,
        { subtree: true, attributes: true, attributeFilter: ['class'] });

    btn.addEventListener('click', () => {
      panel.classList.toggle('open');
      if (panel.classList.contains('open')) textarea.focus();
    });

    textarea.addEventListener('input', () => {
      if (!currentId) return;
      store[currentId] = textarea.value;
      updateBadge();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(save, 300);
    });
    // Empêche la navigation du diaporama (flèches/espace) de voler la saisie.
    textarea.addEventListener('keydown', e => e.stopPropagation());

    const modal = document.createElement('div');
    modal.id = 'comments-modal';
    modal.className = 'comments-modal';
    modal.innerHTML =
      '<div class="comments-modal-box">' +
      '<div class="comments-modal-head"><h3 id="comments-modal-title">Commentaires laissés</h3><button type="button" id="comments-close">✕</button></div>' +
      '<div id="comments-modal-body" class="comments-modal-body"></div>' +
      '<div class="comments-modal-actions">' +
      '<button type="button" class="dw-reveal-btn" id="comments-copy">Copier tout</button>' +
      '<button type="button" class="dw-reveal-btn" id="comments-clear">Tout effacer</button>' +
      '</div></div>';
    document.body.appendChild(modal);

    function getAll() {
      return slides
        .map((s, idx) => ({ id: s.id, idx, text: (store[s.id] || '').trim() }))
        .filter(e => e.text);
    }

    function openModal() {
      const body = modal.querySelector('#comments-modal-body');
      const all = getAll();
      const slideLabel = state.lang === 'en' ? 'Slide' : 'Diapo';
      if (!all.length) {
        body.innerHTML = `<p class="comments-empty">${state.lang === 'en' ? 'No comments yet.' : 'Aucun commentaire pour l’instant.'}</p>`;
      } else {
        body.innerHTML = all.map(e =>
          '<div class="comments-entry"><div class="comments-entry-head">' + slideLabel + ' ' + (e.idx + 1) +
          ' · <code>' + e.id + '</code></div><div class="comments-entry-text"></div></div>'
        ).join('');
        body.querySelectorAll('.comments-entry-text').forEach((el, i) => { el.textContent = all[i].text; });
      }
      modal.classList.add('open');
    }
    function closeModal() { modal.classList.remove('open'); }

    modal.querySelector('#comments-close').addEventListener('click', closeModal);
    modal.querySelector('#comments-copy').addEventListener('click', () => {
      const slideLabel = state.lang === 'en' ? 'Slide' : 'Diapo';
      const text = getAll().map(e => slideLabel + ' ' + (e.idx + 1) + ' (' + e.id + ') :\n' + e.text).join('\n\n---\n\n');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).catch(() => {});
    });
    modal.querySelector('#comments-clear').addEventListener('click', () => {
      if (!confirm(state.lang === 'en' ? 'Clear all comments?' : 'Effacer tous les commentaires ?')) return;
      store = {};
      save();
      textarea.value = '';
      updateBadge();
      openModal();
    });

    // Phase de capture : empêche la navigation du diaporama sous la modale pendant qu'elle est ouverte.
    document.addEventListener('keydown', e => {
      if (!modal.classList.contains('open')) return;
      if (e.key === 'Escape') { closeModal(); return; }
      e.stopPropagation();
    }, true);

    const btnListe = document.createElement('button');
    btnListe.type = 'button';
    btnListe.id = 'btn-comments';
    btnListe.addEventListener('click', openModal);
    tools.insertBefore(btnListe, tools.firstChild);
    state.commentsBtn = btnListe;
    state.applyCommentsLabel = function () {
      btnListe.title = state.lang === 'en' ? 'View all comments' : 'Voir tous les commentaires';
      btnListe.textContent = state.lang === 'en' ? 'Comments' : 'Commentaires';
      modal.querySelector('#comments-modal-title').textContent = state.lang === 'en' ? 'Comments left' : 'Commentaires laissés';
      modal.querySelector('#comments-copy').textContent = state.lang === 'en' ? 'Copy all' : 'Copier tout';
      modal.querySelector('#comments-clear').textContent = state.lang === 'en' ? 'Clear all' : 'Tout effacer';
      document.querySelectorAll('.comment-btn').forEach(b => {
        b.title = state.lang === 'en' ? 'Leave a comment on this slide' : 'Laisser un commentaire sur cette diapo';
      });
      document.querySelectorAll('.comment-panel textarea').forEach(t => {
        t.placeholder = state.lang === 'en' ? 'Note here what should change on this slide…' : 'Notez ici les modifications à apporter à cette diapo…';
      });
    };
    state.applyCommentsLabel();
  }

  ready(function () {
    const tools = document.querySelector('#topbar .tools');
    const slides = Array.from(document.querySelectorAll('.slide'));
    if (!tools || !slides.length) return;
    injectStyles();
    const state = { lang: document.documentElement.lang === 'en' ? 'en' : 'fr' };
    injectThemeToggle(tools, state);
    injectComments(tools, slides, state);
    window.DeckWidgetSetLang = function (lang) {
      state.lang = lang === 'en' ? 'en' : 'fr';
      state.applyThemeLabel();
      state.applyCommentsLabel();
    };
  });
})();
