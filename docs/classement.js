/* ═══════════════════════════════════════════════════════════════════════
   CLASSEMENT DU MENU DES FORMATIONS (4 octobre 2026)
   Antonin : « il y a trop de formations, on s'y perd : un code couleur par
   âge ou public, et un classement par thème (l'art d'un côté, etc.) ».

   Ce fichier ne change PAS index.html : les cartes restent écrites dans les
   deux sections d'origine (centrales / spécifiques), que l'atelier (admin.js)
   continue de lire et d'écrire comme avant. À l'affichage, les cartes sont
   simplement rangées par thème, avec une couleur par public et des filtres.

   ► POUR RECLASSER UNE FORMATION : modifie sa ligne dans FORMATIONS ci-dessous
     (le nom est celui de son dossier). Une formation absente de la liste
     apparaît dans « À classer ».
   ═══════════════════════════════════════════════════════════════════════ */
(function () {

  /* Les publics : couleur de la bordure de la carte et des pastilles. */
  var PUBLICS = {
    primaire: { nom: 'Primaire',          coul: '#34d399' },
    college:  { nom: 'Collège',           coul: '#60a5fa' },
    lycee:    { nom: 'Lycée',             coul: '#a78bfa' },
    sup:      { nom: 'Supérieur',         coul: '#f472b6' },
    adultes:  { nom: 'Grand public',      coul: '#fbbf24' },
    pros:     { nom: 'Pros · encadrants', coul: '#fb923c' },
    tous:     { nom: 'Pour tous (réserve)', coul: '#94a3b8' }
  };

  /* Les thèmes, dans l'ordre d'affichage. */
  var THEMES = [
    { id: 'esprit',   titre: '🧠 Esprit critique et fake news' },
    { id: 'dialogue', titre: '🗣️ Complotisme, débat et dialogue' },
    { id: 'prevention', titre: '🛡️ Prévention' },
    { id: 'recits',   titre: '🎨 Récits, art et écriture' },
    { id: 'entreprise', titre: '💼 Entreprise' },
    { id: 'reserves', titre: '🧩 Réserves à piocher' }
  ];

  /* Une ligne par formation : dossier → thème + publics (le premier donne la couleur). */
  var FORMATIONS = {
    'formation-fake-news-niveau1':          { theme: 'esprit',     publics: ['college', 'lycee', 'adultes'], ordre: 1 },
    'formation-fake-news-niveau2':          { theme: 'esprit',     publics: ['lycee', 'sup', 'adultes'], ordre: 2 },
    'formation-fake-news-influenceurs':     { theme: 'esprit',     publics: ['college', 'lycee'] },
    'formation-raisonnements-fallacieux':   { theme: 'esprit',     publics: ['lycee', 'adultes'] },
    'formation-rhetorique-niveau3':         { theme: 'esprit',     publics: ['college', 'lycee'], ordre: 3 },
    'ia-entre-crainte-et-espoir':           { theme: 'esprit',     publics: ['lycee', 'adultes'] },
    'fake-news-6e-5e':                      { theme: 'esprit',     publics: ['college'] },
    'parcours-cm1-cm2':                     { theme: 'esprit',     publics: ['primaire'] },
    'parler-a-un-complotiste':              { theme: 'dialogue',   publics: ['adultes'] },
    'comment-convaincre-un-climatosceptique': { theme: 'dialogue', publics: ['adultes', 'lycee'] },
    'masni-politique-complotisme':          { theme: 'dialogue',   publics: ['sup'] },
    'esprit-critique-encadrants':           { theme: 'dialogue',   publics: ['pros'] },
    'communiquer-efficacement':             { theme: 'dialogue',   publics: ['pros', 'adultes'] },
    'arnaques-en-ligne':                    { theme: 'prevention', publics: ['lycee', 'adultes'] },
    'harcelement-scolaire':                 { theme: 'prevention', publics: ['primaire', 'college'] },
    'la-magie-des-histoires':               { theme: 'recits',     publics: ['college', 'lycee'] },
    'la-magie-des-histoires-manga':         { theme: 'recits',     publics: ['college', 'lycee'] },
    'la-magie-des-histoires-spiderman':     { theme: 'recits',     publics: ['college'] },
    'demon-slayer-pourquoi-ca-marche':      { theme: 'recits',     publics: ['college', 'lycee'] },
    'attaque-des-titans':                   { theme: 'recits',     publics: ['college', 'lycee'] },
    'narrative-design':                     { theme: 'recits',     publics: ['sup'] },
    'atelier-ecrire-une-histoire':          { theme: 'recits',     publics: ['college', 'lycee'] },
    'fictions-et-esprit-critique':          { theme: 'recits',     publics: ['adultes', 'pros'] },
    'impact-du-numerique-sur-la-culture':   { theme: 'recits',     publics: ['lycee', 'adultes'] },
    'entreprise-2':                         { theme: 'entreprise', publics: ['pros'] },
    'illusions-d-optique':                  { theme: 'reserves',   publics: ['tous'] },
    'enigmes-logiques':                     { theme: 'reserves',   publics: ['tous'] }
  };

  var CLE = 'cours_menu_filtres';
  var etat = { publics: [], theme: '', q: '' };
  try { var s = JSON.parse(localStorage.getItem(CLE) || 'null'); if (s) etat = Object.assign(etat, s); } catch (e) {}
  function memoriser() { try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) {} }

  function dossierDe(carte) { return (carte.getAttribute('href') || '').split('/')[0]; }
  function sansAccents(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  var css = ''
    + '#menu .wrap{max-width:1180px}'
    + '#menu .cls-barre{position:sticky;top:0;z-index:5;display:flex;flex-direction:column;gap:10px;margin:0 0 26px;padding:12px 14px;'
    + 'background:rgba(17,24,39,.92);backdrop-filter:blur(6px);border:1px solid var(--bord);border-radius:14px}'
    + '#menu .cls-ligne{display:flex;flex-wrap:wrap;gap:6px;align-items:center}'
    + '#menu .cls-lib{font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.6px;color:var(--mu);min-width:62px}'
    + '#menu .cls-puce{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:20px;border:1px solid var(--bord);'
    + 'background:var(--panel);color:var(--tx);font:700 .8rem Nunito,sans-serif;cursor:pointer}'
    + '#menu .cls-puce i{width:10px;height:10px;border-radius:50%;display:inline-block}'
    + '#menu .cls-puce.on{background:var(--panel2);border-color:var(--acc2);box-shadow:0 0 0 1px var(--acc2) inset}'
    + '#menu .cls-puce:focus-visible,#menu .card:focus-visible{outline:3px solid var(--acc2);outline-offset:2px}'
    + '#menu .cls-q{flex:1;min-width:200px;padding:7px 12px;border-radius:10px;border:1px solid var(--bord);background:var(--bg2);color:var(--tx);font:600 .9rem Nunito,sans-serif}'
    + '#menu .cls-compte{font-size:.8rem;color:var(--mu);margin-left:auto}'
    + '#menu .cls-raz{background:none;border:0;color:var(--acc2);font:700 .8rem Nunito,sans-serif;cursor:pointer;text-decoration:underline}'
    + '#menu .cls-theme{margin-bottom:34px}'
    + '#menu .cls-theme-titre{font-size:1.2rem;color:var(--acc2);margin-bottom:12px;display:flex;align-items:baseline;gap:10px}'
    + '#menu .cls-theme-titre small{font:700 .78rem Nunito,sans-serif;color:var(--mu)}'
    + '#menu .card{border-left:5px solid var(--cls-coul,var(--bord))}'
    + '#menu .card .status{display:none}'
    + '#menu .cls-publics{display:flex;flex-wrap:wrap;gap:5px}'
    + '#menu .cls-publics span{font-size:.68rem;font-weight:800;padding:2px 8px;border-radius:12px;color:#0b1220}'
    + '#menu .cls-publics span.cls-centrale{background:transparent;color:#fbbf24;border:1px solid rgba(251,191,36,.6)}'
    + '#menu .cls-vide{color:var(--mu);font-weight:700;text-align:center;padding:30px}'
    + '#menu .cls-origine{display:none}'
    + '#menu .card[hidden],#menu .cls-theme[hidden],#menu [hidden]{display:none!important}';

  function installer() {
    var menu = document.getElementById('menu');
    var wrap = menu && menu.querySelector('.wrap');
    if (!wrap || document.getElementById('cls-racine')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

    var racine = document.createElement('div'); racine.id = 'cls-racine';
    var barre = '<div class="cls-barre" role="search">'
      + '<div class="cls-ligne"><input class="cls-q" id="cls-q" type="search" placeholder="Chercher une formation (titre, sujet…)" aria-label="Chercher une formation">'
      + '<span class="cls-compte" id="cls-compte"></span><button type="button" class="cls-raz" id="cls-raz">Tout afficher</button></div>'
      + '<div class="cls-ligne"><span class="cls-lib">Public</span>'
      + Object.keys(PUBLICS).map(function (k) {
          return '<button type="button" class="cls-puce" data-public="' + k + '" aria-pressed="false"><i style="background:' + PUBLICS[k].coul + '"></i>' + PUBLICS[k].nom + '</button>';
        }).join('') + '</div>'
      + '<div class="cls-ligne"><span class="cls-lib">Thème</span>'
      + THEMES.map(function (t) { return '<button type="button" class="cls-puce" data-theme="' + t.id + '" aria-pressed="false">' + t.titre + '</button>'; }).join('')
      + '</div></div>';
    var sections = THEMES.concat([{ id: 'aclasser', titre: '❓ À classer' }]).map(function (t) {
      return '<section class="cls-theme" data-cls-theme="' + t.id + '"><h2 class="cls-theme-titre">' + t.titre + ' <small></small></h2><div class="grid"></div></section>';
    }).join('');
    racine.innerHTML = barre + sections + '<div class="cls-vide" id="cls-vide" hidden>Aucune formation ne correspond à ces filtres.</div>';
    var premiereCategorie = wrap.querySelector('section.categorie');
    wrap.insertBefore(racine, premiereCategorie || null);
    wrap.querySelectorAll('section.categorie').forEach(function (s) { s.classList.add('cls-origine'); });

    ranger();
    brancher(racine);
    filtrer();

    // L'atelier (admin.js) ajoute ou déplace des cartes dans les sections d'origine :
    // on les reprend aussitôt dans le bon thème.
    if (window.MutationObserver) {
      var mo = new MutationObserver(function () { ranger(); filtrer(); });
      wrap.querySelectorAll('section.categorie .grid').forEach(function (g) { mo.observe(g, { childList: true }); });
    }
  }

  /* Range chaque carte dans la grille de son thème, avec ses pastilles de public. */
  function ranger() {
    var wrap = document.querySelector('#menu .wrap');
    wrap.querySelectorAll('section.categorie a.card').forEach(function (carte) {
      var centrale = !!carte.closest('[data-categorie="centrales"]');
      var id = dossierDe(carte), f = FORMATIONS[id] || { theme: 'aclasser', publics: [] };
      carte.dataset.clsTheme = f.theme;
      carte.dataset.clsPublics = f.publics.join(' ');
      carte.dataset.clsCentrale = centrale ? '1' : '';
      carte.dataset.clsOrdre = f.ordre || '';
      carte.style.setProperty('--cls-coul', f.publics.length ? PUBLICS[f.publics[0]].coul : 'var(--bord)');
      var p = carte.querySelector('.cls-publics');
      if (!p) { p = document.createElement('div'); p.className = 'cls-publics'; var d = carte.querySelector('.desc'); (d ? d.parentNode : carte).insertBefore(p, d ? d.nextSibling : null); }
      p.innerHTML = (centrale ? '<span class="cls-centrale" title="Formation centrale">★ Centrale</span>' : '')
        + f.publics.map(function (k) { return '<span style="background:' + PUBLICS[k].coul + '">' + PUBLICS[k].nom + '</span>'; }).join('');
      var grille = document.querySelector('[data-cls-theme="' + f.theme + '"] .grid');
      grille.appendChild(carte);
    });
    // Dans chaque thème : les formations centrales d'abord ; parmi elles, une suite numérotée
    // (« ordre » : Niveau 1, 2, 3) dans son ordre, puis le reste par ordre alphabétique
    document.querySelectorAll('#cls-racine .cls-theme .grid').forEach(function (g) {
      Array.prototype.slice.call(g.children).sort(function (a, b) {
        if (!!a.dataset.clsCentrale !== !!b.dataset.clsCentrale) return a.dataset.clsCentrale ? -1 : 1;
        var oa = Number(a.dataset.clsOrdre) || 999, ob = Number(b.dataset.clsOrdre) || 999;
        if (oa !== ob) return oa - ob;
        return (a.querySelector('h2') || a).textContent.localeCompare((b.querySelector('h2') || b).textContent, 'fr');
      }).forEach(function (c) { g.appendChild(c); });
    });
  }

  function filtrer() {
    var q = sansAccents(etat.q).trim(), total = 0, vus = 0;
    document.querySelectorAll('#cls-racine .cls-theme').forEach(function (sec) {
      var n = 0;
      sec.querySelectorAll('a.card').forEach(function (c) {
        total++;
        var pubs = (c.dataset.clsPublics || '').split(' ');
        var ok = (!etat.publics.length || etat.publics.some(function (p) { return pubs.indexOf(p) >= 0; }))
          && (!etat.theme || c.dataset.clsTheme === etat.theme)
          && (!q || sansAccents(c.textContent).indexOf(q) >= 0);
        c.hidden = !ok; if (ok) n++;
      });
      vus += n;
      sec.hidden = n === 0;
      sec.querySelector('small').textContent = n + ' formation' + (n > 1 ? 's' : '');
    });
    document.getElementById('cls-compte').textContent = vus === total ? total + ' formations' : vus + ' sur ' + total;
    document.getElementById('cls-vide').hidden = vus > 0;
    document.querySelectorAll('#cls-racine [data-public]').forEach(function (b) { var on = etat.publics.indexOf(b.dataset.public) >= 0; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    document.querySelectorAll('#cls-racine [data-theme]').forEach(function (b) { var on = etat.theme === b.dataset.theme; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    var raz = document.getElementById('cls-raz'); raz.hidden = !(etat.publics.length || etat.theme || etat.q);
  }

  function brancher(racine) {
    var q = racine.querySelector('#cls-q'); q.value = etat.q || '';
    q.addEventListener('input', function () { etat.q = q.value; memoriser(); filtrer(); });
    racine.querySelector('.cls-barre').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.public) {
        var i = etat.publics.indexOf(b.dataset.public);
        if (i >= 0) etat.publics.splice(i, 1); else etat.publics.push(b.dataset.public);
      } else if (b.dataset.theme) {
        etat.theme = etat.theme === b.dataset.theme ? '' : b.dataset.theme;
      } else if (b.id === 'cls-raz') {
        etat = { publics: [], theme: '', q: '' }; q.value = '';
      } else return;
      memoriser(); filtrer();
    });
    // « / » place le curseur dans la recherche
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); q.focus(); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installer);
  else installer();
})();
