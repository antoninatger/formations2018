/* Le serveur local des cours. Il sert le dossier « Web apps » (le parent de Cours, pour que
   les liens ../../Jeux des diapos marchent comme en double-clic) a l'adresse
   http://localhost:8417/, et a personne d'autre : il n'ecoute que sur 127.0.0.1.

   Pourquoi un serveur plutot que le double-clic : sous file://, le navigateur interdit de
   lire un fichier voisin (etiquettes.json, d'ou « etiquettes non lisibles »), melange
   toutes les pages locales dans une seule origine, et refuse de retenir l'autorisation
   du dossier d'une session a l'autre. Sous http://localhost, rien de tout cela.

   Le PORT est fixe expres : le navigateur range localStorage par origine, et l'origine
   comprend le port. Changer de port, ce serait perdre les diapos masquees, les titres
   personnalises et le dossier connecte. Si le port est deja pris PAR CE SERVEUR (un
   lanceur ouvert deux fois), on s'en sert ; s'il est pris par autre chose, on le dit et
   on s'arrete, plutot que d'ouvrir les cours ailleurs en silence.

   Aucune dependance : Node seul.

   18 octobre — « pourquoi [connecter le dossier] ? Moyen de plus avoir a le faire ? ».
   Le serveur ecrit desormais lui-meme dans le dossier Cours, sur demande des pages qu'il
   sert (/__dossier, plus bas), et glisse en tete de chaque page HTML _lanceur/dossier-
   serveur.js, qui presente ce service au moteur comme un dossier deja connecte. Ouvertes
   par le lanceur, les formations, la mediatheque et l'atelier n'ont donc plus rien a
   demander. Le double-clic (file://) n'est pas touche et garde « Connecter le dossier ».
   Garde-fous : l'ecriture ne sort jamais du dossier Cours, n'est acceptee que des pages
   servies ici (en-tetes Host, Origin et X-Cours), et une suppression range le fichier dans
   Cours/_to_delete/ au lieu de le detruire. */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8417;
const RACINE = path.resolve(__dirname, '..', '..');   // …/Web apps
const TEMOIN = '/__serveur-cours';                    // « c'est bien moi » pour un 2e lanceur
const COURS = path.resolve(__dirname, '..');          // …/Web apps/Cours : seul endroit ou l'on ecrit
const API_DOSSIER = '/__dossier';
// A changer a chaque modification de ce serveur : le lanceur compare, et remplace un serveur
// d'une version anterieure reste ouvert (18 octobre : l'ancien, toujours en route, ne savait
// pas ecrire, et les cours redemandaient le dossier).
const VERSION = '2026-10-18-lanceur-node';
// L'icone d'abord : la fenetre des cours la montre dans la barre des taches, a la place du
// globe d'Edge. Une page qui declare la sienne plus loin dans son <head> garde la sienne.
const SCRIPT_DOSSIER = '<link rel="icon" href="/Cours/_lanceur/cours.ico">'
  + '<script src="/Cours/_lanceur/dossier-serveur.js"></script>';
// Les seules adresses sous lesquelles une page des cours nous parle. Un site exterieur qui
// ferait pointer son nom de domaine sur 127.0.0.1 arriverait avec un autre Host : refuse.
const HOTES = new Set(['localhost:' + PORT, '127.0.0.1:' + PORT, '[::1]:' + PORT]);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.m4v': 'video/mp4',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
};

function repondre(res, code, texte) {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(texte);
}

function servir(req, res) {
  if (!HOTES.has(req.headers.host)) return repondre(res, 403, 'Adresse refusée.');
  let url, chemin;
  try { url = new URL(req.url, 'http://localhost'); chemin = decodeURIComponent(url.pathname); }
  catch (e) { return repondre(res, 400, 'Adresse illisible.'); }
  if (chemin === TEMOIN) return repondre(res, 200, 'cours');
  if (chemin === TEMOIN + '/version') return repondre(res, 200, VERSION);
  // Le lanceur remplace un serveur d'une autre version : il lui demande de s'arreter. Meme
  // garde que l'ecriture (X-Cours), pour qu'aucune page exterieure ne puisse l'eteindre.
  if (chemin === TEMOIN + '/arreter' && req.method === 'POST' && req.headers['x-cours'] === '1') {
    repondre(res, 200, 'arret');
    return setTimeout(() => process.exit(0), 50);
  }
  if (chemin === API_DOSSIER) return dossierApi(req, res, url);
  if (req.method !== 'GET' && req.method !== 'HEAD') return repondre(res, 405, 'Lecture seule.');

  // Jamais en dehors de « Web apps » : « ../ » et les chemins absolus sont refuses.
  const fichier = path.resolve(RACINE, '.' + path.posix.normalize('/' + chemin));
  if (fichier !== RACINE && !fichier.startsWith(RACINE + path.sep)) return repondre(res, 403, 'Interdit.');

  fs.stat(fichier, (err, st) => {
    if (err) return repondre(res, 404, 'Introuvable : ' + chemin);
    if (st.isDirectory()) {
      // Un dossier : son index.html, comme sur un vrai site. Sans barre finale, on la
      // rajoute, sinon les chemins relatifs de la page partiraient du dossier parent.
      if (!chemin.endsWith('/')) {
        res.writeHead(301, { Location: encodeURI(chemin) + '/' });
        return res.end();
      }
      const index = path.join(fichier, 'index.html');
      if (!fs.existsSync(index)) return repondre(res, 404, 'Pas d\'index.html dans ' + chemin);
      return envoyer(req, res, index, fs.statSync(index));
    }
    envoyer(req, res, fichier, st);
  });
}

// Les videos se lisent par morceaux (en-tete Range) : sans cela, impossible d'avancer dans
// une video ou de la recadrer, et le navigateur retelecharge tout a chaque saut.
function envoyer(req, res, fichier, st) {
  const type = TYPES[path.extname(fichier).toLowerCase()] || 'application/octet-stream';
  if (type.startsWith('text/html')) return envoyerPage(req, res, fichier);
  const entetes = {
    'Content-Type': type,
    'Accept-Ranges': 'bytes',
    // Toujours la version du disque : l'atelier ecrit les fichiers pendant qu'on les sert.
    'Cache-Control': 'no-store',
  };
  const plage = req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
  if (plage && (plage[1] !== '' || plage[2] !== '')) {
    let debut, fin;
    if (plage[1] === '') { debut = Math.max(0, st.size - Number(plage[2])); fin = st.size - 1; }
    else { debut = Number(plage[1]); fin = plage[2] === '' ? st.size - 1 : Math.min(Number(plage[2]), st.size - 1); }
    if (debut > fin || debut >= st.size) {
      res.writeHead(416, { 'Content-Range': 'bytes */' + st.size });
      return res.end();
    }
    entetes['Content-Range'] = 'bytes ' + debut + '-' + fin + '/' + st.size;
    entetes['Content-Length'] = fin - debut + 1;
    res.writeHead(206, entetes);
    if (req.method === 'HEAD') return res.end();
    return fs.createReadStream(fichier, { start: debut, end: fin }).pipe(res);
  }
  entetes['Content-Length'] = st.size;
  res.writeHead(200, entetes);
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(fichier).pipe(res);
}

// Une page HTML : la meme, avec dossier-serveur.js en tete, avant tout autre script. Le
// fichier sur le disque n'est pas modifie ; c'est la copie envoyee qui porte la ligne.
function envoyerPage(req, res, fichier) {
  fs.readFile(fichier, 'utf8', (err, texte) => {
    if (err) return repondre(res, 404, 'Introuvable.');
    const m = /<head[^>]*>/i.exec(texte);
    const page = m ? texte.slice(0, m.index + m[0].length) + SCRIPT_DOSSIER + texte.slice(m.index + m[0].length)
      : SCRIPT_DOSSIER + texte;
    const corps = Buffer.from(page, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': corps.length,
      'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : corps);
  });
}

// ── /__dossier : le dossier Cours, en lecture ET en ecriture ────────────────────────────
// ?op=stat|liste|lire (GET) ; ecrire (PUT, le corps est le contenu) ; creer-dossier,
// supprimer (POST). ?p= est un chemin relatif au dossier Cours, avec des « / ».
function dossierApi(req, res, url) {
  // Une page d'un autre site ne peut pas poser X-Cours sans une autorisation (CORS) que
  // nous ne donnons jamais ; l'Origin, quand le navigateur l'envoie, doit etre la notre.
  const origine = req.headers.origin;
  if (req.headers['x-cours'] !== '1' || (origine && !HOTES.has(origine.replace(/^http:\/\//, '')))) {
    return repondre(res, 403, 'Refusé : seules les pages des cours peuvent écrire.');
  }
  const op = url.searchParams.get('op');
  const rel = (url.searchParams.get('p') || '').replace(/\\/g, '/');
  if (rel.split('/').includes('..')) return repondre(res, 403, 'Hors du dossier Cours.');
  const cible = path.resolve(COURS, '.' + path.posix.normalize('/' + rel));
  if (cible !== COURS && !cible.startsWith(COURS + path.sep)) return repondre(res, 403, 'Hors du dossier Cours.');
  const methode = { stat: 'GET', liste: 'GET', lire: 'GET', ecrire: 'PUT', 'creer-dossier': 'POST', supprimer: 'POST' }[op];
  if (!methode) return repondre(res, 400, 'Opération inconnue : ' + op);
  if (cible === COURS && (op === 'ecrire' || op === 'supprimer')) return repondre(res, 403, 'Pas le dossier Cours lui-même.');
  if (req.method !== methode) return repondre(res, 405, op + ' attend ' + methode);
  const echec = (e) => e && e.code === 'ENOENT' ? repondre(res, 404, 'Introuvable : ' + rel)
    : repondre(res, 500, String(e && e.message || e));

  if (op === 'stat') {
    return fs.stat(cible, (err, st) => err ? echec(err)
      : repondre(res, 200, JSON.stringify({ kind: st.isDirectory() ? 'directory' : 'file' })));
  }
  if (op === 'liste') {
    return fs.readdir(cible, { withFileTypes: true }, (err, ents) => {
      if (err) return echec(err);
      const out = ents.filter(e => e.isDirectory() || e.isFile())
        .map(e => [e.name, e.isDirectory() ? 'directory' : 'file']);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(out));
    });
  }
  if (op === 'lire') {
    return fs.stat(cible, (err, st) => {
      if (err) return echec(err);
      if (!st.isFile()) return repondre(res, 404, 'Pas un fichier : ' + rel);
      const type = TYPES[path.extname(cible).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Cache-Control': 'no-store',
        'X-Modifie-Le': String(Math.round(st.mtimeMs)) });
      fs.createReadStream(cible).pipe(res);
    });
  }
  if (op === 'creer-dossier') {
    return fs.mkdir(cible, { recursive: true }, err => err ? echec(err) : repondre(res, 200, 'ok'));
  }
  if (op === 'ecrire') {
    // A cote d'abord, puis on remplace : une ecriture interrompue (onglet ferme, coupure)
    // laisse l'ancien fichier intact au lieu d'un fichier coupe en deux.
    const provisoire = cible + '.ecriture-en-cours';
    return fs.mkdir(path.dirname(cible), { recursive: true }, err => {
      if (err) return echec(err);
      const flux = fs.createWriteStream(provisoire);
      let rate = false;
      const abandon = (e) => { if (rate) return; rate = true; flux.destroy(); fs.unlink(provisoire, () => {}); echec(e); };
      req.on('error', abandon);
      req.on('aborted', () => abandon(new Error('envoi interrompu')));
      flux.on('error', abandon);
      flux.on('finish', () => {
        if (rate) return;
        fs.rename(provisoire, cible, e => e ? abandon(e) : repondre(res, 200, 'ok'));
      });
      req.pipe(flux);
    });
  }
  if (op === 'supprimer') {
    // Rien n'est detruit : le fichier part dans _to_delete/, ou Antonin fait le menage.
    const jour = new Date().toISOString().slice(0, 10);
    const rang = path.join(COURS, '_to_delete', 'supprime-depuis-les-cours-' + jour, path.relative(COURS, cible));
    return fs.stat(cible, (err) => {
      if (err) return echec(err);
      fs.mkdir(path.dirname(rang), { recursive: true }, e => {
        if (e) return echec(e);
        const dest = fs.existsSync(rang) ? rang + '.' + Date.now() : rang;
        fs.rename(cible, dest, e2 => e2 ? echec(e2) : repondre(res, 200, 'ok'));
      });
    });
  }
}

// Le port est-il deja tenu par un serveur des cours ? (lanceur ouvert deux fois)
function dejaLa() {
  return new Promise(resolve => {
    const r = http.get({ host: '127.0.0.1', port: PORT, path: TEMOIN, timeout: 1500 }, rep => {
      let t = ''; rep.on('data', d => t += d); rep.on('end', () => resolve(t === 'cours'));
    });
    r.on('error', () => resolve(false));
    r.on('timeout', () => { r.destroy(); resolve(false); });
  });
}

if (require.main === module) {
  const serveur = http.createServer(servir);
  serveur.on('error', async e => {
    if (e.code === 'EADDRINUSE') {
      if (await dejaLa()) { console.log('Le serveur des cours tourne deja : on s\'en sert.'); process.exit(0); }
      console.error('Le port ' + PORT + ' est pris par un autre programme. Fermez-le, puis relancez.');
      process.exit(2);
    }
    console.error(e); process.exit(1);
  });
  serveur.listen(PORT, '127.0.0.1', () => {
    console.log('Cours servis depuis : ' + RACINE);
    console.log('Adresse : http://localhost:' + PORT + '/Cours/');
    console.log('Lance par « Ouvrir les cours », il tourne sans fenetre jusqu\'a l\'arret de l\'ordinateur.');
  });
  // Aussi sur l'adresse IPv6 locale : sous Windows, « localhost » la tente en premier.
  // Sans IPv6 sur la machine, tant pis : 127.0.0.1 suffit.
  const serveur6 = http.createServer(servir);
  serveur6.on('error', () => {});
  serveur6.listen(PORT, '::1');
}

module.exports = { servir, PORT, RACINE, VERSION };
