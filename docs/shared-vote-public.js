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

   17 novembre : Antonin trouvait la vignette trop grande et toujours là. Elle est désormais
   cachée au départ ; le bouton « 📱 QR code » de la barre du haut la fait apparaître (en
   grand d'abord, pour le scan), puis elle reste en petit à gauche sur chaque diapo, jusqu'à
   ce qu'on la masque (même bouton, ou sa petite croix). Le choix est gardé d'une formation
   à l'autre sur cet ordinateur.

   À l'écran, rien n'est ajouté à la diapo elle-même. Une vignette se pose dans le coin tant
   que la diapo porte une question : le QR code, le code, le nombre de téléphones branchés.
   Un clic dessus (ou la touche Q, sur n'importe quelle diapo) l'agrandit pour le premier
   scan.

   La salle se garde d'une formation à l'autre (même ordinateur, même navigateur) tant
   qu'elle a servi dans les 45 dernières minutes : on enchaîne deux formations sans faire
   rescanner. Au-delà, ou avec « Nouveau groupe », un nouveau code est tiré, et les
   téléphones du groupe précédent ne reçoivent plus rien.

   21 novembre : Antonin, « s'il y a l'option téléphone, les gens pourront voter par
   téléphone. Si c'est la version juste présentation, il n'y a pas de curseur, ce sera à
   main levée ». Les barres d'un vote par téléphone (data-telephone="1") ne s'affichent donc
   qu'en VERSION TÉLÉPHONE : quand le QR code a été demandé (bouton « 📱 QR code »), ou dès
   qu'un téléphone est branché. Sinon, version présentation seule : <html> porte la classe
   vp-sans-telephone et les barres sont masquées (jamais en édition). Les nuages de mots et
   les murs de réponses ne bougent pas. Rien n'est écrit dans les diapos.

   23 novembre, les TROIS MODES (window.VOTE_MODES = true ; depuis le 24 novembre,
   shared-widgets.js le pose sur toutes les formations, sauf si l'une pose false).
   Antonin : « je veux pouvoir switcher sur trois options. La première, c'est une
   présentation sur projecteur […] La deuxième, c'est que téléphone, donc tu montres le
   QR code […] Et la troisième, c'est si les intervenants sont derrière chacun un PC […]
   soit pour voter, donc oui, non, soit mettre un message, soit mettre un emoji ».
   Le bouton « 📱 QR code » devient alors trois boutons dans le bandeau :
     🖥️ Projecteur   rien ne se branche, tout se fait à main levée (comme avant) ;
     📱 Téléphones   le QR code, les votes sur les téléphones ;
     💻 Chacun son PC  la même page, ouverte par un lien (à coller dans le chat de la visio
                     ou à taper), avec en plus des emojis et des messages, qui passent à
                     l'écran quelques secondes, par-dessus la diapo, sans rien y écrire.
   Le VOTE ÉCLAIR, en mode Téléphones ou PC : sur une diapo « Vrai ou faux ? »
   (.quiz-vrai-faux), la question part toute seule avec Vrai / Faux ; sur n'importe quelle
   autre diapo, la touche V ouvre (ou referme) un vote Oui / Non. La question est le titre de
   la diapo ; les résultats s'affichent dans un petit cadre en bas à droite, hors de la diapo.

   24 novembre, les QUESTIONS D'UNE FORMATION : une formation peut poser ses propres questions
   (window.VOTE_QUESTIONS, une liste de fonctions (diapo, mode) → null ou { cle, type, titre,
   afficher(resultats) }). Elles passent avant le vote éclair ; c'est la formation qui dit
   où et comment montrer les réponses (afficher), dans un élément de préfixe ed- (jamais écrit
   dans le fichier). VotePublic.masquer(texte) retire une réponse de l'écran.

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
  const MODES = !!window.VOTE_MODES;
  const CLE_MODE = 'vote-public-mode';
  let mode = 'projecteur';
  if (MODES) {
    try { const m = localStorage.getItem(CLE_MODE); if (m === 'telephone' || m === 'pc') mode = m; } catch (e) { /* stockage indisponible */ }
  }
  // Vote éclair : une diapo « Vrai ou faux ? » en porte un d'office ; la touche V l'ajoute
  // (ou le retire) sur la diapo en cours. id de diapo → true / false.
  const eclairs = new Map();

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
      if (MODES) envoyer({ t: 'reglages', reactions: mode === 'pc' });
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
      else if (m.t === 'emoji' && MODES && mode === 'pc') lancerEmoji(m.emoji);
      else if (m.t === 'message' && MODES && mode === 'pc') montrerMessage(m.texte);
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
  function eclairDe(slide) {
    if (!MODES || mode === 'projecteur') return null;
    const vf = slide.classList.contains('quiz-vrai-faux');
    const voulu = eclairs.has(slide.id) ? eclairs.get(slide.id) : vf;
    if (!voulu) return null;
    // Un titre sur une carte qui se retourne : la face visible (recto, ou verso une fois tournée).
    const visible = h => {
      const r = h.closest('.retourne');
      if (!r) return true;
      return r.classList.contains('tournee') ? !!h.closest('.retourne-verso') : !!h.closest('.retourne-recto');
    };
    const titre = texteDe(Array.from(slide.querySelectorAll('h1, h2, h3')).find(h => !h.closest('[class*="ed-"]') && visible(h)))
      || texteDe(slide.querySelector('.kicker'));
    const id = location.pathname.replace(/\/index\.html$/, '/') + '#' + (slide.id || '') + '~eclair';
    return { id, type: 'choix', titre, options: vf ? ['Vrai', 'Faux'] : ['Oui', 'Non'] };
  }
  function questionPerso(slide) {
    if (!MODES || mode === 'projecteur') return null;
    for (const fn of (window.VOTE_QUESTIONS || [])) {
      let r = null;
      try { r = fn(slide, mode); } catch (e) { console.error(e); }
      if (!r) continue;
      const id = location.pathname.replace(/\/index\.html$/, '/') + '#' + (slide.id || '') + '~' + r.cle;
      const q = { id, type: r.type || 'textes', titre: r.titre || '', options: r.options || [] };
      // 25 novembre : une question écrite peut avoir plusieurs cases (« Mésinformation »,
      // « Désinformation ») ; chaque réponse revient avec le numéro de sa case (champ).
      if (r.champs) q.champs = r.champs;
      return { q, afficher: r.afficher };
    }
    return null;
  }
  function questionDe(slide) {
    if (!slide || slide.classList.contains('editing')) return { q: null, wrap: null };
    if (MODES && mode === 'projecteur') return { q: null, wrap: null };
    const wrap = widgetsTelephone(slide)[0];
    if (!wrap) {
      const p = questionPerso(slide);
      // Sans afficher(), les résultats d'un vote à choix vont dans le cadre du vote éclair.
      if (p) return { q: p.q, wrap: null, perso: p.afficher ? p : null };
      return { q: eclairDe(slide), wrap: null };
    }
    const libre = wrap.dataset.telephone === 'mots' || wrap.dataset.telephone === 'textes';
    const options = libre ? [] : Array.from(wrap.querySelectorAll(':scope > .wpoll-opt > .wpoll-label')).map(texteDe);
    if (!libre && !options.length) return { q: null, wrap: null };
    const id = location.pathname.replace(/\/index\.html$/, '/') + '#' + (slide.id || '') + '~'
      + Array.prototype.indexOf.call(slide.querySelectorAll('.wpoll[data-widget="poll"]'), wrap);
    return { q: { id, type: libre ? wrap.dataset.telephone : 'choix', titre: titreDe(slide, wrap), options }, wrap };
  }

  let wrapEnCours = null, persoEnCours = null;
  function verifier() {
    if (!actif) return;
    const { q, wrap, perso } = questionDe(diapoActive());
    wrapEnCours = wrap;
    persoEnCours = perso || null;
    if (JSON.stringify(q) !== JSON.stringify(derniere)) {
      derniere = q;
      envoyer({ t: 'question', q });
      if (q) {
        ecrireSalle();
        // Une question neuve part de zéro à l'écran, en attendant les comptes du relais.
        const r = resultats.get(q.id);
        if (r) appliquer(r);
        else if (persoEnCours) persoEnCours.afficher({ mots: [], votants: 0 });
        else if (!wrap) majEclair({ comptes: q.options.map(() => 0), votants: 0 });
        else if (q.type !== 'choix') window.SharedWidgets.nuageRendre(wrap, [], masquer);
        else window.SharedWidgets.pollResultats(wrap, q.options.map(() => 0), 0);
      }
    }
    majVignette();
  }
  function appliquer(m) {
    if (derniere && m.qid === derniere.id && persoEnCours) { persoEnCours.afficher(m); return; }
    if (derniere && m.qid === derniere.id && !wrapEnCours) { majEclair(m); return; }
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
.vp-vignette{position:fixed;left:14px;bottom:64px;z-index:60;display:flex;align-items:center;gap:8px;
  background:#fff;color:#111;border-radius:10px;padding:5px 22px 5px 5px;box-shadow:0 8px 28px rgba(0,0,0,.35);
  cursor:pointer;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;user-select:none;}
.vp-vignette[hidden],.vp-grand[hidden]{display:none !important;}
html.vp-sans-telephone .slide:not(.editing) .wpoll[data-widget="poll"][data-telephone="1"]{display:none !important;}
.vp-vignette .vp-qr{width:58px;height:58px;}
.vp-vignette .vp-qr svg,.vp-grand .vp-qr svg{width:100%;height:100%;display:block;}
.vp-vignette .vp-code{font-size:1rem;font-weight:800;letter-spacing:.12em;line-height:1;}
.vp-vignette .vp-n,.vp-grand .vp-n{font-size:.85rem;color:#555;margin-top:6px;}
.vp-hors{color:#b3261e !important;}
.vp-vignette .vp-n{font-size:.7rem;margin-top:3px;}
.vp-vignette .vp-masquer{position:absolute;top:2px;right:4px;border:0;background:none;color:#888;font-size:14px;line-height:1;cursor:pointer;padding:2px;}
.vp-vignette .vp-masquer:hover{color:#111;}
#topbar .vp-bouton.vp-actif{border-color:var(--acc2);color:var(--acc2);}
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
.vp-modes{display:inline-flex;gap:0 !important;border-radius:10px;overflow:hidden;border:1px solid var(--bord)}
#topbar .vp-modes button{border:0;border-radius:0;margin:0;white-space:nowrap}
#topbar .vp-modes button+button{border-left:1px solid var(--bord)}
#topbar .vp-modes button.vp-actif{background:var(--acc2);color:#0b1220}
.vp-eclair{position:fixed;right:80px;bottom:64px;z-index:60;width:360px;background:#fff;color:#111;border-radius:14px;
  padding:12px 16px 12px;box-shadow:0 8px 28px rgba(0,0,0,.35);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.vp-eclair[hidden],.vp-messages:empty{display:none !important}
.vp-eclair .vp-ligne{display:grid;grid-template-columns:minmax(52px,max-content) 1fr 34px;align-items:center;gap:8px;margin:5px 0;font-weight:700;font-size:.95rem}
.vp-eclair .vp-barre{height:16px;border-radius:8px;background:#eceff4;overflow:hidden}
.vp-eclair .vp-barre i{display:block;height:100%;width:0;border-radius:8px;transition:width .5s ease}
.vp-eclair .vp-ligne:nth-child(1) .vp-barre i{background:#2563eb}
.vp-eclair .vp-ligne:nth-child(2) .vp-barre i{background:#dc2626}
.vp-eclair .vp-ligne:nth-child(3) .vp-barre i{background:#d97706}
.vp-eclair .vp-ligne:nth-child(4) .vp-barre i{background:#16a34a}
.vp-eclair .vp-ligne[hidden]{display:none}
.vp-eclair .vp-ligne span:last-child{text-align:right}
.vp-eclair .vp-total{font-size:.75rem;color:#666;margin-top:4px}
.vp-emoji{position:fixed;bottom:40px;z-index:2147482000;font-size:46px;line-height:1;pointer-events:none;
  animation:vp-monte 3.2s ease-out forwards;font-family:"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif}
@keyframes vp-monte{0%{transform:translate(0,0) scale(.6);opacity:0}10%{opacity:1;transform:translate(0,-30px) scale(1.1)}
  100%{transform:translate(var(--dx),-62vh) scale(1);opacity:0}}
.vp-messages{position:fixed;right:18px;top:70px;z-index:2147482000;width:min(380px,40vw);display:flex;flex-direction:column;gap:8px;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.vp-message{background:#fff;color:#111;border-radius:14px;padding:10px 14px;font-size:1.05rem;line-height:1.35;cursor:pointer;
  box-shadow:0 8px 28px rgba(0,0,0,.35);animation:vp-arrive .35s ease;transition:opacity .6s ease}
.vp-message::before{content:'💬 ';}
.vp-message.vp-part{opacity:0}
@keyframes vp-arrive{from{transform:translateX(40px);opacity:0}}
.vp-grand .vp-consigne{display:none}
/* Mode « Chacun son PC » (24 novembre) : pas de QR code, l'adresse à taper, en grand. */
.vp-grand.vp-pc .vp-qr,.vp-vignette.vp-pc .vp-qr{display:none}
.vp-grand.vp-pc .vp-consigne{display:block;font-size:clamp(1.1rem,2.2vw,1.6rem);color:#555;margin-bottom:6px}
.vp-grand.vp-pc .vp-carte{padding:46px 60px 30px}
.vp-grand.vp-pc .vp-adresse{font-size:clamp(1.8rem,4.6vw,4rem);font-weight:800;color:#111;margin-top:0;word-break:normal;white-space:nowrap}
.vp-grand.vp-pc .vp-code{font-size:clamp(1.1rem,2vw,1.5rem);font-weight:600;letter-spacing:.04em;color:#555;margin-top:10px}
.vp-vignette.vp-pc{padding:8px 26px 8px 14px}
.vp-vignette.vp-pc .vp-code{display:none}
.vp-vignette.vp-pc .vp-lien-court{font-size:1rem;font-weight:800;color:#111;margin-top:0}
.vp-grand .vp-lien[hidden],.vp-vignette .vp-lien-court[hidden]{display:none}
.vp-vignette .vp-lien-court{font-size:.72rem;color:#333;margin-top:3px;white-space:nowrap}
`;
    document.head.appendChild(st);
  }

  let vignette = null, grand = null, qrDe = '', bouton = null, boutonsModes = null, eclair = null, messages = null;
  const CLE_VIGNETTE = 'vote-public-vignette';
  let vignetteVoulue = false;
  try { vignetteVoulue = localStorage.getItem(CLE_VIGNETTE) === '1'; } catch (e) { /* stockage indisponible */ }
  if (MODES) vignetteVoulue = mode !== 'projecteur';
  function montrerVignette(oui) {
    vignetteVoulue = !!oui;
    try { localStorage.setItem(CLE_VIGNETTE, oui ? '1' : '0'); } catch (e) { /* tant pis */ }
    if (oui && !actif) demarrer();
    majVignette();
  }
  function construire() {
    injecterStyles();
    vignette = document.createElement('div');
    vignette.className = 'vp-vignette';
    vignette.hidden = true;
    vignette.title = 'Agrandir le QR code (touche Q)';
    vignette.innerHTML = '<div class="vp-qr"></div><div><div class="vp-code"></div><div class="vp-lien-court" hidden></div><div class="vp-n"></div></div>'
      + '<button type="button" class="vp-masquer" title="Masquer le QR code">✕</button>';
    vignette.addEventListener('click', e => {
      if (e.target.closest('.vp-masquer')) { e.stopPropagation(); montrerVignette(false); return; }
      ouvrirGrand(true);
    });
    document.body.appendChild(vignette);

    // Le bouton de la barre du haut : montre (en grand d'abord) ou masque le QR code.
    // Avec les trois modes, ce sont trois boutons à la place.
    const outils = document.querySelector('#topbar .tools');
    if (outils && MODES) {
      boutonsModes = document.createElement('div');
      boutonsModes.className = 'vp-modes';
      boutonsModes.innerHTML = '<button type="button" data-mode="projecteur" title="Présentation sur projecteur : rien ne se branche, on vote à main levée">🖥️ Projecteur</button>'
        + '<button type="button" data-mode="telephone" title="Le public vote avec son téléphone (QR code)">📱 Téléphones</button>'
        + '<button type="button" data-mode="pc" title="Chacun derrière un PC : un lien à ouvrir, votes, emojis et messages">💻 Chacun son PC</button>';
      boutonsModes.addEventListener('click', e => {
        const b = e.target.closest('button[data-mode]');
        if (b) choisirMode(b.dataset.mode);
      });
      outils.insertBefore(boutonsModes, outils.firstChild);
    } else if (outils) {
      bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.className = 'vp-bouton';
      bouton.hidden = true;
      bouton.textContent = '📱 QR code';
      bouton.title = 'Afficher ou masquer le QR code du vote par téléphone';
      bouton.addEventListener('click', () => {
        if (vignetteVoulue) montrerVignette(false);
        else { montrerVignette(true); ouvrirGrand(true); }
      });
      outils.insertBefore(bouton, outils.firstChild);
    }

    grand = document.createElement('div');
    grand.className = 'vp-grand';
    grand.hidden = true;
    grand.innerHTML = '<div class="vp-carte"><div class="vp-consigne">Sur votre ordinateur, ouvrez&nbsp;:</div><div class="vp-qr"></div><div class="vp-adresse"></div>'
      + '<div class="vp-code"></div><div class="vp-n"></div><div class="vp-actions">'
      + '<button type="button" class="vp-lien" hidden title="Copier le lien, à coller dans le chat de la visio">📋 Copier le lien</button>'
      + '<button type="button" class="vp-remettre" title="Effacer les réponses à la question de cette diapo">↺ Remettre cette question à zéro</button>'
      + '<button type="button" class="vp-nouveau" title="Tirer un nouveau code : les téléphones du groupe précédent ne recevront plus rien">Nouveau groupe</button>'
      + '<button type="button" class="vp-fermer">Fermer (Échap)</button></div></div>';
    grand.addEventListener('click', e => { if (e.target === grand) ouvrirGrand(false); });
    grand.querySelector('.vp-fermer').addEventListener('click', () => ouvrirGrand(false));
    grand.querySelector('.vp-lien').addEventListener('click', e => {
      const b = e.currentTarget;
      const fini = () => { b.textContent = '✓ Lien copié'; setTimeout(() => { b.textContent = '📋 Copier le lien'; }, 2000); };
      const lien = RELAIS && salle ? adresseTelephone() : '';
      if (!lien) return;
      if (navigator.clipboard) navigator.clipboard.writeText(lien).then(fini, () => {});
    });
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

    if (MODES) {
      eclair = document.createElement('div');
      eclair.className = 'vp-eclair';
      eclair.hidden = true;
      eclair.innerHTML = '<div class="vp-ligne"><span></span><div class="vp-barre"><i></i></div><span>0</span></div>'
        + '<div class="vp-ligne"><span></span><div class="vp-barre"><i></i></div><span>0</span></div><div class="vp-total"></div>';
      document.body.appendChild(eclair);
      deplacable(eclair);
      messages = document.createElement('div');
      messages.className = 'vp-messages';
      messages.addEventListener('click', e => { const m = e.target.closest('.vp-message'); if (m) m.remove(); });
      document.body.appendChild(messages);
    }

    // En capture, avant le diaporama : Échap ferme le grand QR sans quitter une branche,
    // et Q ne doit pas atteindre une diapo. On laisse passer tout ce qui s'écrit.
    document.addEventListener('keydown', e => {
      if (!grand.hidden && e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); ouvrirGrand(false); return; }
      // Avec les trois modes, avancer ou reculer referme le grand QR code (et la touche agit).
      if (MODES && !grand.hidden && /^(ArrowRight|ArrowLeft|ArrowDown|ArrowUp|PageDown|PageUp| |Enter)$/.test(e.key)) ouvrirGrand(false);
      if ((e.key === 'q' || e.key === 'Q') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const t = e.target;
        if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
        if (document.querySelector('.slide.editing')) return;
        e.preventDefault(); e.stopPropagation();
        ouvrirGrand(grand.hidden);
      }
      if (MODES && mode !== 'projecteur' && (e.key === 'v' || e.key === 'V') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const t = e.target;
        if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
        if (document.querySelector('.slide.editing')) return;
        const slide = diapoActive();
        if (!slide || widgetsTelephone(slide).length) return;
        e.preventDefault(); e.stopPropagation();
        eclairs.set(slide.id, !eclairDe(slide));
        bientot();
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

  // Version téléphone (QR code demandé, ou un téléphone branché) ou présentation seule.
  function majVersion() {
    const telephone = MODES ? mode !== 'projecteur' : (vignetteVoulue || nbPublic > 0);
    document.documentElement.classList.toggle('vp-sans-telephone', !telephone);
  }

  function majVignette() {
    majVersion();
    if (!vignette) return;
    const slide = diapoActive();
    const qrPose = !!(slide && slide.querySelector('[data-widget="qr-vote"]'));
    // Le QR code ne vient que si on l'a demandé (bouton « 📱 QR code ») ; il reste alors sur
    // toutes les diapos, sauf celles qui posent déjà un QR code, et sauf en édition.
    const aDesVotes = MODES || !!document.querySelector('.wpoll[data-widget="poll"][data-telephone], [data-widget="qr-vote"]');
    // Avec les trois modes (24 novembre), pas de vignette : Antonin, « je veux pas qu'il soit
    // là en permanence et je ne veux pas avoir à fermer à la main ». Le grand QR code vient
    // au clic sur Téléphones (ou PC), et repart tout seul à la diapo ou au clic suivant.
    const montrer = !MODES && aDesVotes && vignetteVoulue && !qrPose && !document.querySelector('.slide.editing');
    vignette.hidden = !montrer;
    if (bouton) { bouton.hidden = !aDesVotes; bouton.classList.toggle('vp-actif', vignetteVoulue); }
    if (boutonsModes) boutonsModes.querySelectorAll('button').forEach(b => b.classList.toggle('vp-actif', b.dataset.mode === mode));
    if (eclair) eclair.hidden = !(derniere && !wrapEnCours && !persoEnCours && mode !== 'projecteur' && !document.querySelector('.slide.editing'));
    grand.querySelector('.vp-lien').hidden = !(MODES && mode === 'pc');
    const pc = MODES && mode === 'pc';
    grand.classList.toggle('vp-pc', pc);
    vignette.classList.toggle('vp-pc', pc);
    vignette.title = pc ? 'Agrandir l’adresse (touche Q)' : 'Agrandir le QR code (touche Q)';
    const court = vignette.querySelector('.vp-lien-court');
    court.hidden = !(MODES && mode === 'pc' && RELAIS && salle);
    if (!court.hidden) court.textContent = adresseTelephone().replace(/^https?:\/\//, '');
    let etat;
    if (!RELAIS) etat = 'Relais pas encore en ligne';
    else if (!enLigne) etat = 'Pas de connexion au relais…';
    else {
      const r = derniere && resultats.get(derniere.id);
      etat = (MODES && mode === 'pc' ? '💻 ' : '📱 ') + nbPublic + (r ? ' · ' + r.votants + ' réponse' + (r.votants > 1 ? 's' : '') : '');
    }
    const code = salle ? salle.code : '····';
    vignette.querySelector('.vp-code').textContent = code;
    grand.querySelector('.vp-code').textContent = code;
    if (MODES && mode === 'pc' && salle && RELAIS) grand.querySelector('.vp-code').textContent = 'ou ' + RELAIS.replace(/^https?:\/\//, '') + ', puis le code ' + salle.code;
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

  // ── Les trois modes (window.VOTE_MODES) ────────────────────────────────────
  function choisirMode(m) {
    mode = m;
    try { localStorage.setItem(CLE_MODE, m); } catch (e) { /* tant pis */ }
    vignetteVoulue = m !== 'projecteur';
    if (m !== 'projecteur' && !actif) demarrer();
    envoyer({ t: 'reglages', reactions: m === 'pc' });
    if (m !== 'pc' && messages) messages.textContent = '';
    if (m !== 'projecteur') ouvrirGrand(true); else ouvrirGrand(false);
    bientot();
  }

  // Le petit cadre des résultats se déplace à la souris (25 novembre). Antonin : « je vais
  // pouvoir le déplacer parce que des fois il masque une information importante ». La place
  // choisie est gardée dans ce navigateur, pour toutes les diapos et toutes les formations.
  const CLE_PLACE = 'vote-public-place-cadre';
  function deplacable(el) {
    function poser(x, y) {
      const w = el.offsetWidth || 360, h = el.offsetHeight || 90;
      x = Math.max(0, Math.min(innerWidth - w, x)); y = Math.max(0, Math.min(innerHeight - h, y));
      el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.right = 'auto'; el.style.bottom = 'auto';
      return [x, y];
    }
    try {
      const p = JSON.parse(localStorage.getItem(CLE_PLACE) || 'null');
      if (p && isFinite(p[0]) && isFinite(p[1])) poser(p[0], p[1]);
    } catch (e) { /* stockage indisponible */ }
    el.style.cursor = 'move';
    el.style.touchAction = 'none';
    el.title = 'Glisser pour déplacer';
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      e.preventDefault(); e.stopPropagation();
      const r = el.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
      let fin = [r.left, r.top];
      try { el.setPointerCapture(e.pointerId); } catch (x) { /* rien */ }
      const bouger = ev => { fin = poser(ev.clientX - dx, ev.clientY - dy); };
      const lacher = () => {
        el.removeEventListener('pointermove', bouger);
        el.removeEventListener('pointerup', lacher);
        el.removeEventListener('pointercancel', lacher);
        try { localStorage.setItem(CLE_PLACE, JSON.stringify(fin.map(Math.round))); } catch (x) { /* rien */ }
      };
      el.addEventListener('pointermove', bouger);
      el.addEventListener('pointerup', lacher);
      el.addEventListener('pointercancel', lacher);
    });
    // Un clic sur le cadre ne doit pas faire avancer la diapo.
    el.addEventListener('click', e => e.stopPropagation());
  }

  function majEclair(m) {
    if (!eclair || !derniere) return;
    // Autant de lignes que d'options (2 pour Vrai/Faux, jusqu'à 4 ailleurs).
    let lignes = eclair.querySelectorAll('.vp-ligne');
    while (lignes.length < derniere.options.length) {
      const l = lignes[0].cloneNode(true);
      eclair.insertBefore(l, eclair.querySelector('.vp-total'));
      lignes = eclair.querySelectorAll('.vp-ligne');
    }
    lignes.forEach((l, i) => { l.hidden = i >= derniere.options.length; });
    const max = Math.max(1, m.votants || 0);
    derniere.options.forEach((o, i) => {
      const l = lignes[i]; if (!l) return;
      const n = (m.comptes && m.comptes[i]) || 0;
      l.firstElementChild.textContent = o;
      l.querySelector('i').style.width = Math.round(100 * n / max) + '%';
      l.lastElementChild.textContent = n;
    });
    const n = m.votants || 0;
    eclair.querySelector('.vp-total').textContent = n + ' vote' + (n > 1 ? 's' : '') + ' · touche V pour fermer';
    majVignette();
  }

  function lancerEmoji(em) {
    const e = document.createElement('div');
    e.className = 'vp-emoji';
    e.textContent = em;
    e.style.right = (4 + Math.random() * 22) + 'vw';
    e.style.setProperty('--dx', Math.round((Math.random() - 0.5) * 120) + 'px');
    document.body.appendChild(e);
    setTimeout(() => e.remove(), 3400);
    // Pas plus de 30 à la fois : une salle enthousiaste ne doit pas cacher la diapo.
    const tous = document.querySelectorAll('.vp-emoji');
    if (tous.length > 30) tous[0].remove();
  }

  function montrerMessage(texte) {
    if (!messages) return;
    const d = document.createElement('div');
    d.className = 'vp-message';
    d.title = 'Cliquer pour effacer';
    d.textContent = texte;
    messages.appendChild(d);
    while (messages.children.length > 4) messages.firstElementChild.remove();
    setTimeout(() => { d.classList.add('vp-part'); setTimeout(() => d.remove(), 700); }, 20000);
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
        // Une formation qui pose ses questions (window.VOTE_QUESTIONS) peut les lier à un clic
        // (une étape qui apparaît, une carte qui se retourne) : tout changement de classe compte.
        if (window.VOTE_QUESTIONS && r.type === 'attributes' && r.attributeName === 'class') { bientot(); return; }
        if (r.type === 'childList' || r.attributeName === 'data-telephone') { bientot(); return; }
      }
    }).observe(deck, { attributes: true, attributeFilter: ['class', 'data-telephone'], subtree: true, childList: true });
    // Les options et le titre se retouchent à la main : une saisie change la question.
    deck.addEventListener('input', bientot, true);
    verifier();
  }

  // Appelé par shared-widgets.js à chaque montage d'un sondage « par téléphone ».
  function surveiller() {
    if (MODES) { if (mode !== 'projecteur') demarrer(); else majVignette(); return; }
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

  window.VotePublic = { surveiller, ouvrirGrand, masquer, mode: () => mode, etat: () => ({ salle, enLigne, nbPublic, question: derniere }) };
})();
