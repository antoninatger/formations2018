/* Le vote du public, côté diaporama (22 octobre).

   Antonin : « que le public vote via son téléphone […] Je veux pas qu'il scanne un QR code à
   chaque vote. S'il y a 10 slides avec 10 votes, il scanne une fois. Et après, la nouvelle
   question apparaît sur leur téléphone en fonction de la slide. »

   D'où une SALLE par séance : un code de quatre lettres, tiré ici, et une liaison avec le
   relais en ligne (dossier _vote, voir LISEZ-MOI). À chaque diapo, ce fichier dit au relais
   quelle est la question en cours, ou qu'il n'y en a pas ; le relais la pousse aux
   téléphones et renvoie les comptes, que le sondage affiche.

   Ce qui décide qu'une diapo porte une question : un sondage réglé « 📱 Vote par téléphone »
   ou « 📱 Nuage de mots » (shared-widgets.js, data-telephone). La question montrée aux
   téléphones est le titre de la diapo, et les réponses sont les options du sondage : rien
   n'est à écrire en plus.

   À l'écran, rien n'est ajouté à la diapo elle-même. Une vignette se pose dans le coin tant
   que la diapo porte une question : le QR code, le code, le nombre de téléphones branchés.
   Un clic dessus (ou la touche Q, sur n'importe quelle diapo) l'agrandit pour le premier
   scan.

   La salle se garde d'une formation à l'autre (même ordinateur, même navigateur) tant
   qu'elle a servi dans les 45 dernières minutes : on enchaîne deux formations sans faire
   rescanner. Au-delà, ou avec « Nouveau groupe », un nouveau code est tiré, et les
   téléphones du groupe précédent ne reçoivent plus rien.

   Chargé par shared-widgets.js, seulement là où un sondage est réglé « par téléphone ».
   Ne fait rien dans la fenêtre du présentateur (?presenter=1). */
(function () {
  'use strict';
  if (window.VotePublic) return;
  if (/[?&]presenter=1\b/.test(location.search)) { window.VotePublic = { surveiller() {} }; return; }

  const RELAIS = String(window.VOTE_RELAIS || '').replace(/\/+$/, '');
  const CLE_SALLE = 'vote-public-salle';
  const GARDE = 45 * 60 * 1000;
  const LETTRES = 'ABCDEFGHJKLMNPQRSTUVWXYZ';   // ni I ni O : ils se confondent avec 1 et 0
  const BASE = (document.currentScript && document.currentScript.src || '').replace(/[^/]*$/, '');

  // ── La salle ───────────────────────────────────────────────────────────────
  function hasard(n, alphabet) {
    const a = new Uint8Array(n);
    crypto.getRandomValues(a);
    return Array.from(a, b => alphabet[b % alphabet.length]).join('');
  }
  function lireSalle() {
    try {
      const s = JSON.parse(localStorage.getItem(CLE_SALLE) || 'null');
      if (s && /^[A-Z]{4}$/.test(s.code) && s.cle && Date.now() - (s.t || 0) < GARDE) return s;
    } catch (e) { /* stockage indisponible : une salle par page */ }
    return null;
  }
  function ecrireSalle() {
    salle.t = Date.now();
    try { localStorage.setItem(CLE_SALLE, JSON.stringify(salle)); } catch (e) { /* tant pis */ }
  }
  function nouvelleSalle() {
    salle = { code: hasard(4, LETTRES), cle: hasard(24, 'abcdefghijklmnopqrstuvwxyz0123456789'), t: Date.now() };
    ecrireSalle();
  }
  let salle = lireSalle();
  function adresseTelephone() { return RELAIS + '/' + salle.code; }

  // ── La liaison ─────────────────────────────────────────────────────────────
  let ws = null, delai = 1000, minuterie = null, actif = false;
  let enLigne = false, nbPublic = 0, derniere = null;   // derniere : la question envoyée
  const resultats = new Map();                          // id de question → dernier message reçu

  function brancher() {
    if (!RELAIS) { majVignette(); return; }
    if (ws && (ws.readyState === 0 || ws.readyState === 1)) return;
    if (!salle) nouvelleSalle();
    clearTimeout(minuterie);
    const url = RELAIS.replace(/^http/, 'ws') + '/ws/' + salle.code + '?role=anim&cle=' + salle.cle;
    let w;
    try { w = new WebSocket(url); } catch (e) { reessayer(); return; }
    ws = w;
    w.onopen = () => {
      enLigne = true; delai = 1000;
      ecrireSalle();
      // Le relais a pu oublier la question (salle neuve, relais redémarré) : on la redit.
      if (derniere !== undefined) envoyer({ t: 'question', q: derniere });
      majVignette();
    };
    w.onmessage = e => {
      let m;
      try { m = JSON.parse(e.data); } catch (x) { return; }
      if (m.t === 'prise') {
        // Le code est déjà celui d'une autre séance, ailleurs : on en tire un autre.
        nouvelleSalle();
        return;
      }
      if (m.t === 'public') { nbPublic = m.n; majVignette(); }
      else if (m.t === 'resultats') { resultats.set(m.qid, m); appliquer(m); majVignette(); }
    };
    w.onclose = () => {
      if (ws === w) ws = null;
      enLigne = false;
      majVignette();
      reessayer();
    };
    w.onerror = () => { try { w.close(); } catch (x) {} };
  }
  function reessayer() {
    clearTimeout(minuterie);
    minuterie = setTimeout(brancher, delai);
    delai = Math.min(delai * 2, 15000);
  }
  function envoyer(objet) {
    if (ws && ws.readyState === 1) { ws.send(JSON.stringify(objet)); return true; }
    return false;
  }
  setInterval(() => { envoyer({ t: 'ping' }); }, 25000);

  // ── La diapo en cours ──────────────────────────────────────────────────────
  function diapoActive() {
    return document.querySelector('#deck .slide.active') || document.querySelector('.slide.active');
  }
  function widgetsTelephone(slide) {
    return slide ? Array.from(slide.querySelectorAll('.wpoll[data-widget="poll"][data-telephone]')) : [];
  }
  // Le texte d'un élément bilingue, en français (la version que la salle lit d'habitude).
  function texteDe(el) {
    if (!el) return '';
    const c = el.cloneNode(true);
    c.querySelectorAll('.t-en, [class*="ed-"], .widget-ctl, script, style').forEach(x => x.remove());
    return c.textContent.replace(/\s+/g, ' ').trim();
  }
  function titreDe(slide, wrap) {
    const candidats = Array.from(slide.querySelectorAll('h1, h2, h3, .title, .kicker'))
      .filter(h => !h.closest('.wpoll') && !h.closest('[class*="ed-"]'));
    // Le titre le plus proche AVANT le sondage, sinon le premier de la diapo.
    let avant = null;
    candidats.forEach(h => { if (h.compareDocumentPosition(wrap) & Node.DOCUMENT_POSITION_FOLLOWING) avant = h; });
    const h2 = candidats.find(h => /^H[12]$/.test(h.tagName));
    return texteDe(avant && /^H[1-3]$/.test(avant.tagName) ? avant : (h2 || avant || candidats[0]));
  }
  function questionDe(slide) {
    if (!slide || slide.classList.contains('editing')) return { q: null, wrap: null };
    const wrap = widgetsTelephone(slide)[0];
    if (!wrap) return { q: null, wrap: null };
    const libre = wrap.dataset.telephone === 'mots' || wrap.dataset.telephone === 'textes';
    const options = libre ? [] : Array.from(wrap.querySelectorAll(':scope > .wpoll-opt > .wpoll-label')).map(texteDe);
    if (!libre && !options.length) return { q: null, wrap: null };
    const id = location.pathname.replace(/\/index\.html$/, '/') + '#' + (slide.id || '') + '~'
      + Array.prototype.indexOf.call(slide.querySelectorAll('.wpoll[data-widget="poll"]'), wrap);
    return { q: { id, type: libre ? wrap.dataset.telephone : 'choix', titre: titreDe(slide, wrap), options }, wrap };
  }

  let wrapEnCours = null;
  function verifier() {
    if (!actif) return;
    const { q, wrap } = questionDe(diapoActive());
    wrapEnCours = wrap;
    if (JSON.stringify(q) !== JSON.stringify(derniere)) {
      derniere = q;
      envoyer({ t: 'question', q });
      if (q) {
        ecrireSalle();
        // Une question neuve part de zéro à l'écran, en attendant les comptes du relais.
        const r = resultats.get(q.id);
        if (r) appliquer(r);
        else if (q.type !== 'choix') window.SharedWidgets.nuageRendre(wrap, [], masquer);
        else window.SharedWidgets.pollResultats(wrap, q.options.map(() => 0), 0);
      }
    }
    majVignette();
  }
  function appliquer(m) {
    if (!derniere || m.qid !== derniere.id || !wrapEnCours || !window.SharedWidgets) return;
    if (m.type !== 'choix') window.SharedWidgets.nuageRendre(wrapEnCours, m.mots, masquer);
    else window.SharedWidgets.pollResultats(wrapEnCours, m.comptes, m.votants);
  }
  function masquer(mot) {
    if (derniere) envoyer({ t: 'masquer', qid: derniere.id, mot });
  }

  let prevu = false;
  function bientot() {
    if (prevu) return;
    prevu = true;
    requestAnimationFrame(() => { prevu = false; verifier(); });
  }

  // ── La vignette et le grand QR code ────────────────────────────────────────
  let qrPret = null;
  function chargerQr() {
    if (window.qrcode) return Promise.resolve();
    if (!qrPret) {
      qrPret = new Promise(ok => {
        const s = document.createElement('script');
        s.src = BASE + 'shared-qrcode.js';
        s.onload = ok; s.onerror = ok;
        document.head.appendChild(s);
      });
    }
    return qrPret;
  }
  function svgQr(texte) {
    if (!window.qrcode) return '';
    const qr = window.qrcode(0, 'M');
    qr.addData(texte);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  }

  function injecterStyles() {
    const st = document.createElement('style');
    st.textContent = `
.vp-vignette{position:fixed;left:18px;bottom:72px;z-index:60;display:flex;align-items:center;gap:12px;
  background:#fff;color:#111;border-radius:14px;padding:8px 14px 8px 8px;box-shadow:0 8px 28px rgba(0,0,0,.35);
  cursor:pointer;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;user-select:none;}
.vp-vignette[hidden],.vp-grand[hidden]{display:none !important;}
.vp-vignette .vp-qr{width:92px;height:92px;}
.vp-vignette .vp-qr svg,.vp-grand .vp-qr svg{width:100%;height:100%;display:block;}
.vp-vignette .vp-code{font-size:1.5rem;font-weight:800;letter-spacing:.12em;line-height:1;}
.vp-vignette .vp-n,.vp-grand .vp-n{font-size:.85rem;color:#555;margin-top:6px;}
.vp-hors{color:#b3261e !important;}
.wqr-vote{display:inline-flex;flex-direction:column;align-items:center;gap:6px;background:#fff;color:#111;
  border-radius:16px;padding:12px 14px 10px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;cursor:pointer;}
.wqr-vote .vp-qr{width:200px;height:200px;}
.wqr-vote .vp-qr svg{width:100%;height:100%;display:block;}
.wqr-vote .vp-code{font-size:1.6rem;font-weight:800;letter-spacing:.14em;line-height:1;}
.wqr-vote .vp-adresse{font-size:.8rem;color:#444;}
.wqr-vote .vp-n{font-size:.8rem;color:#555;}
.wqr-vote:empty::before{content:'QR code du vote';color:#888;font-size:.85rem;padding:40px 20px;}
.vp-grand{position:fixed;inset:0;z-index:2147483000;background:rgba(8,12,22,.92);display:flex;
  align-items:center;justify-content:center;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;}
.vp-grand .vp-carte{background:#fff;color:#111;border-radius:24px;padding:28px 34px;text-align:center;
  max-width:92vw;max-height:94vh;display:flex;flex-direction:column;align-items:center;}
.vp-grand .vp-qr{width:min(62vh,72vw);height:min(62vh,72vw);}
.vp-grand .vp-adresse{font-size:clamp(1rem,2.4vw,1.6rem);margin-top:14px;color:#333;word-break:break-all;}
.vp-grand .vp-code{font-size:clamp(1.6rem,4vw,2.6rem);font-weight:800;letter-spacing:.14em;margin-top:4px;}
.vp-grand .vp-actions{display:flex;gap:10px;margin-top:16px;}
.vp-grand button{font:inherit;font-size:.85rem;border:1px solid #ccc;background:#f4f4f4;color:#333;
  border-radius:10px;padding:6px 12px;cursor:pointer;}
.vp-grand button:hover{background:#e8e8e8;}
`;
    document.head.appendChild(st);
  }

  let vignette = null, grand = null, qrDe = '';
  function construire() {
    injecterStyles();
    vignette = document.createElement('div');
    vignette.className = 'vp-vignette';
    vignette.hidden = true;
    vignette.title = 'Agrandir le QR code (touche Q)';
    vignette.innerHTML = '<div class="vp-qr"></div><div><div class="vp-code"></div><div class="vp-n"></div></div>';
    vignette.addEventListener('click', () => ouvrirGrand(true));
    document.body.appendChild(vignette);

    grand = document.createElement('div');
    grand.className = 'vp-grand';
    grand.hidden = true;
    grand.innerHTML = '<div class="vp-carte"><div class="vp-qr"></div><div class="vp-adresse"></div>'
      + '<div class="vp-code"></div><div class="vp-n"></div><div class="vp-actions">'
      + '<button type="button" class="vp-remettre" title="Effacer les réponses à la question de cette diapo">↺ Remettre cette question à zéro</button>'
      + '<button type="button" class="vp-nouveau" title="Tirer un nouveau code : les téléphones du groupe précédent ne recevront plus rien">Nouveau groupe</button>'
      + '<button type="button" class="vp-fermer">Fermer (Échap)</button></div></div>';
    grand.addEventListener('click', e => { if (e.target === grand) ouvrirGrand(false); });
    grand.querySelector('.vp-fermer').addEventListener('click', () => ouvrirGrand(false));
    grand.querySelector('.vp-remettre').addEventListener('click', () => {
      if (!derniere) return;
      if (!confirm('Effacer toutes les réponses à cette question ?')) return;
      envoyer({ t: 'remettre', qid: derniere.id });
    });
    grand.querySelector('.vp-nouveau').addEventListener('click', () => {
      if (!confirm('Tirer un nouveau code ? Les téléphones déjà branchés devront rescanner.')) return;
      nouvelleSalle();
      resultats.clear();
      nbPublic = 0;
      if (ws) { const w = ws; ws = null; try { w.close(); } catch (e) {} }
      brancher();
      majVignette();
    });
    document.body.appendChild(grand);

    // En capture, avant le diaporama : Échap ferme le grand QR sans quitter une branche,
    // et Q ne doit pas atteindre une diapo. On laisse passer tout ce qui s'écrit.
    document.addEventListener('keydown', e => {
      if (!grand.hidden && e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); ouvrirGrand(false); return; }
      if ((e.key === 'q' || e.key === 'Q') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const t = e.target;
        if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
        if (document.querySelector('.slide.editing')) return;
        e.preventDefault(); e.stopPropagation();
        ouvrirGrand(grand.hidden);
      }
    }, true);
  }

  function ouvrirGrand(oui) {
    if (!grand) return;
    if (oui && !actif) demarrer();
    grand.hidden = !oui;
    majVignette();
  }

  // Le QR code posé sur une diapo (data-widget="qr-vote") : son contenu est refait ici à
  // chaque fois, dans un élément de l'éditeur (préfixe ed-), donc jamais écrit dans le fichier.
  function majQrPoses(svg, adresse, code, etat) {
    document.querySelectorAll('[data-widget="qr-vote"]').forEach(w => {
      let c = w.querySelector(':scope > .ed-wqr');
      if (!c) {
        c = document.createElement('div');
        c.className = 'ed-wqr';
        c.style.cssText = 'display:contents';
        c.innerHTML = '<div class="vp-qr"></div><div class="vp-code"></div><div class="vp-adresse"></div><div class="vp-n"></div>';
        w.appendChild(c);
        c.querySelector('.vp-qr').title = 'Agrandir le QR code (touche Q)';
        w.addEventListener('click', () => { if (!w.closest('.slide.editing')) ouvrirGrand(true); });
      }
      if (svg !== null) c.querySelector('.vp-qr').innerHTML = svg;
      c.querySelector('.vp-code').textContent = code;
      c.querySelector('.vp-adresse').textContent = adresse.replace(/^https?:\/\//, '');
      c.querySelector('.vp-n').textContent = etat;
    });
  }

  function majVignette() {
    if (!vignette) return;
    const slide = diapoActive();
    const qrPose = !!(slide && slide.querySelector('[data-widget="qr-vote"]'));
    const montrer = !!derniere && !qrPose && !document.querySelector('.slide.editing');
    vignette.hidden = !montrer;
    let etat;
    if (!RELAIS) etat = 'Relais pas encore en ligne';
    else if (!enLigne) etat = 'Pas de connexion au relais…';
    else {
      const r = derniere && resultats.get(derniere.id);
      etat = '📱 ' + nbPublic + (r ? ' · ' + r.votants + ' réponse' + (r.votants > 1 ? 's' : '') : '');
    }
    const code = salle ? salle.code : '····';
    vignette.querySelector('.vp-code').textContent = code;
    grand.querySelector('.vp-code').textContent = code;
    vignette.querySelectorAll('.vp-n').forEach(n => { n.textContent = etat; n.classList.toggle('vp-hors', !enLigne); });
    grand.querySelectorAll('.vp-n').forEach(n => { n.textContent = etat; n.classList.toggle('vp-hors', !enLigne); });
    grand.querySelector('.vp-adresse').textContent = RELAIS && salle ? adresseTelephone().replace(/^https?:\/\//, '') : '';
    grand.querySelector('.vp-remettre').hidden = !derniere;
    const adresse = RELAIS && salle ? adresseTelephone() : '';
    majQrPoses(null, adresse, code, etat);
    if (adresse !== qrDe || document.querySelector('[data-widget="qr-vote"] .vp-qr:empty')) {
      chargerQr().then(() => {
        const svg = adresse ? svgQr(adresse) : '';
        qrDe = adresse;
        vignette.querySelector('.vp-qr').innerHTML = svg;
        grand.querySelector('.vp-qr').innerHTML = svg;
        majQrPoses(svg, adresse, code, etat);
      });
    }
  }

  // ── Mise en route ──────────────────────────────────────────────────────────
  function demarrer() {
    if (actif) return;
    actif = true;
    derniere = undefined;
    brancher();
    const deck = document.getElementById('deck') || document.body;
    new MutationObserver(recs => {
      for (const r of recs) {
        if (r.target.classList && r.target.classList.contains('slide')) { bientot(); return; }
        if (r.type === 'childList' || r.attributeName === 'data-telephone') { bientot(); return; }
      }
    }).observe(deck, { attributes: true, attributeFilter: ['class', 'data-telephone'], subtree: true, childList: true });
    // Les options et le titre se retouchent à la main : une saisie change la question.
    deck.addEventListener('input', bientot, true);
    verifier();
  }

  // Appelé par shared-widgets.js à chaque montage d'un sondage « par téléphone ».
  function surveiller() {
    if (!document.querySelector('.wpoll[data-widget="poll"][data-telephone], [data-widget="qr-vote"]')) return;
    demarrer();
  }

  function pret(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  pret(() => {
    construire();
    chargerQr();
    surveiller();
  });

  window.VotePublic = { surveiller, ouvrirGrand, etat: () => ({ salle, enLigne, nbPublic, question: derniere }) };
})();
