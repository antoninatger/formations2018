/* « Ouvrir les cours », en un seul programme (18 octobre : « le raccourci sur le bureau
   marche difficilement »).

   Avant, le .bat enchainait cinq a quinze demarrages de Node (verifier la version, attendre
   le serveur seconde par seconde) et laissait une fenetre « Serveur des cours » reduite
   dans la barre des taches : plusieurs secondes avant de voir les cours, et une fenetre
   qu'on fermait par megarde. Ici, tout se fait dans un seul Node :
     1. un serveur des cours de la bonne version tourne deja ? on s'en sert ;
        d'une autre version ? on lui demande de s'arreter (ou on l'arrete) ;
     2. sinon on le demarre, SANS fenetre, detache : il reste la tant que l'ordinateur
        tourne, et la fenetre des cours peut etre fermee et rouverte instantanement ;
     3. on attend qu'il reponde (par dixiemes de seconde, pas par secondes) ;
     4. on ouvre Edge en mode application, en grand.
   En cas d'echec, l'explication s'ouvre dans le Bloc-notes : impossible de la manquer, meme
   lance depuis un raccourci sans fenetre.

   node lancer.js [page]   (page relative a Cours/, index.html par defaut) */
'use strict';
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, execSync } = require('child_process');
const { PORT, VERSION } = require('./serveur-cours.js');

const PAGE = process.argv[2] || 'index.html';
const ADRESSE = 'http://localhost:' + PORT + '/Cours/' + PAGE.replace(/\\/g, '/');
const JOURNAL = path.join(os.tmpdir(), 'serveur-cours.log');
const WINDOWS = process.platform === 'win32';

function demander(chemin, methode) {
  return new Promise(resolve => {
    const r = http.request({ host: '127.0.0.1', port: PORT, path: chemin, method: methode || 'GET',
      timeout: 1500, headers: { 'X-Cours': '1' } }, rep => {
      let t = ''; rep.on('data', d => t += d); rep.on('end', () => resolve(rep.statusCode === 200 ? t : null));
    });
    r.on('error', () => resolve(null));
    r.on('timeout', () => { r.destroy(); resolve(null); });
    r.end();
  });
}
const pause = ms => new Promise(f => setTimeout(f, ms));

async function attendre(condition, ms) {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await condition()) return true;
    await pause(100);
  }
  return false;
}

const repond = async () => (await demander('/__serveur-cours')) === 'cours';

// Un serveur des cours plus ancien ne connait pas /arreter : on retrouve alors le
// programme qui ecoute sur le port, et on l'arrete. Seulement apres avoir verifie que
// c'est bien un serveur des cours (le temoin a repondu « cours »).
async function arreterLAncien() {
  await demander('/__serveur-cours/arreter', 'POST');
  if (await attendre(async () => !(await repond()), 2000)) return;
  if (!WINDOWS) return;
  try {
    const sortie = execSync('netstat -ano -p tcp', { encoding: 'utf8', windowsHide: true });
    const pids = new Set(sortie.split(/\r?\n/)
      .filter(l => /LISTENING/i.test(l) && new RegExp('[:.]' + PORT + '\\s').test(l))
      .map(l => l.trim().split(/\s+/).pop()));
    pids.forEach(pid => { try { execSync('taskkill /PID ' + pid + ' /F', { windowsHide: true, stdio: 'ignore' }); } catch (e) { /* deja parti */ } });
  } catch (e) { /* netstat indisponible : le demarrage dira que le port est pris */ }
  await attendre(async () => !(await repond()), 2000);
}

let serveurParti = false;
function demarrer() {
  const fd = fs.openSync(JOURNAL, 'w');
  const enfant = spawn(process.execPath, [path.join(__dirname, 'serveur-cours.js')], {
    cwd: path.join(__dirname, '..'), detached: true, windowsHide: true, stdio: ['ignore', fd, fd],
  });
  // S'il s'arrete tout de suite (port pris par un autre programme, erreur), inutile
  // d'attendre quinze secondes pour le dire.
  enfant.on('exit', () => { serveurParti = true; });
  enfant.unref();
  fs.closeSync(fd);
}

function ouvrirEdge() {
  if (!WINDOWS) { console.log('Ouvrir : ' + ADRESSE); return; }
  // « start » trouve msedge par le registre (App Paths), comme le menu Demarrer.
  spawn('cmd.exe', ['/d', '/c', 'start', '""', '/max', 'msedge', '--start-maximized', '--app=' + ADRESSE],
    { detached: true, windowsHide: true, stdio: 'ignore', windowsVerbatimArguments: true }).unref();
}

function echec(message) {
  let journal = '';
  try { journal = fs.readFileSync(JOURNAL, 'utf8'); } catch (e) { /* pas de journal */ }
  const texte = 'Les cours n\'ont pas pu s\'ouvrir.\r\n\r\n' + message + '\r\n\r\n'
    + 'Node : ' + process.version + '\r\nDossier : ' + path.join(__dirname, '..') + '\r\n\r\n'
    + 'Ce que le serveur a dit :\r\n' + (journal.trim() || '(rien)') + '\r\n\r\n'
    + 'Copie ce texte et envoie-le a Claude.\r\n';
  const rapport = path.join(os.tmpdir(), 'cours-pas-ouverts.txt');
  fs.writeFileSync(rapport, texte);
  console.error(texte);
  if (WINDOWS) spawn('notepad.exe', [rapport], { detached: true, stdio: 'ignore' }).unref();
  process.exitCode = 1;
}

(async () => {
  if (await repond()) {
    if ((await demander('/__serveur-cours/version')) === VERSION) { ouvrirEdge(); return; }
    await arreterLAncien();
  }
  demarrer();
  if (!(await attendre(async () => serveurParti || await repond(), 15000)) || !(await repond())) {
    echec(serveurParti ? 'Le serveur des cours s\'est arrete des son demarrage.'
      : 'Le serveur des cours ne repond pas apres 15 secondes.');
    return;
  }
  ouvrirEdge();
})();
