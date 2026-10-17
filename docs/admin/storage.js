/* Seule couche d'accès disque réel : File System Access API sur le dossier
   racine "Cours/". Le handle de dossier est persisté en IndexedDB (même
   pattern que tryRestoreHandle()/idbSet() déjà utilisé dans
   formation-fake-news-niveau2/app.js pour un fichier unique), pour ne pas
   redemander la sélection du dossier à chaque session — seule une
   confirmation de permission est redemandée.

   Si un jour on remplace cette couche par des appels HTTP vers un serveur,
   seul ce fichier doit changer : le reste du code (admin.js, jeux-core.js,
   articles-core.js) ne connaît que readText/writeText/exists/listDirs. */
window.CoursAdmin = window.CoursAdmin || {};

CoursAdmin.Storage = (function () {
  const IDB_NAME = 'cours-admin';
  const IDB_STORE = 'handles';
  const IDB_KEY = 'root-dir';

  let rootHandle = null;

  function idbOpen() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbGet(key) {
    const db = await idbOpen();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const r = tx.objectStore(IDB_STORE).get(key);
      r.onsuccess = () => resolve(r.result || null);
      r.onerror = () => reject(r.error);
    });
  }

  async function idbSet(key, val) {
    const db = await idbOpen();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(val, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Tente de restaurer le handle mémorisé (session précédente) et redemande
  // juste la permission (pas de re-sélection du dossier). Retourne true/false.
  async function tryRestore(valider) {
    // Ouvert par « Ouvrir les cours » : le serveur local tient lieu de dossier connecte
    // (_lanceur/dossier-serveur.js), sans selecteur ni permission.
    if (window.CoursDossierServeur) {
      try { return !!(await retenir(window.CoursDossierServeur.racine(), valider, true)); } catch (e) { return false; }
    }
    try {
      const handle = await idbGet(IDB_KEY);
      if (!handle) return false;
      // queryPermission, PAS requestPermission : au chargement d'une page il n'y a aucun
      // geste utilisateur, et requestPermission echoue alors — c'est ce qui affichait
      // « Non connecte » a chaque ouverture de l'atelier alors que le dossier etait connu.
      // Quand la permission n'est plus acquise, on garde le handle sous le coude : le
      // premier clic sur « Connecter » la redemandera sans repasser par le selecteur.
      const perm = await handle.queryPermission({ mode: 'readwrite' });
      if (perm !== 'granted') return false;
      // Le tampon est vérifié ici aussi : le handle mémorisé désigne un dossier qui a pu
      // changer entre deux sessions (renommé, restauré, remplacé par une autre copie).
      return !!(await retenir(handle, valider));
    } catch (e) {
      return false;
    }
  }

  // ── ⚠️ 20 — le tampon du dossier ────────────────────────────────────────────────
  // L'API File System Access ne rend JAMAIS le chemin complet d'un dossier : handle.name
  // dit « Cours », et les deux copies du dépôt s'appellent Cours. Le 15 août, admin/ a
  // régénéré l'autre copie en annonçant un succès. On identifie donc le dossier par un
  // fichier qu'on y dépose, admin/data/.cours-id — ignoré par git, sans quoi tout clone
  // porterait la même empreinte.
  const TAMPON = ['admin', 'data', '.cours-id'];

  // Lit le tampon d'un handle QUELCONQUE, sans le retenir comme dossier courant. C'est
  // toute la garde : la vérification a lieu avant que rootHandle existe, donc avant que
  // la moindre écriture soit possible. Rend null si absent ou illisible.
  async function lireTamponDe(handle) {
    try {
      let dir = handle;
      for (const part of TAMPON.slice(0, -1)) dir = await dir.getDirectoryHandle(part, { create: false });
      const fh = await dir.getFileHandle(TAMPON[TAMPON.length - 1], { create: false });
      const texte = await (await fh.getFile()).text();
      const obj = JSON.parse(texte);
      return (obj && typeof obj.id === 'string' && obj.id) ? obj : null;
    } catch (e) {
      return null;
    }
  }

  async function lireTampon() {
    return rootHandle ? lireTamponDe(rootHandle) : null;
  }

  async function ecrireTampon(tampon) {
    await writeText(TAMPON, JSON.stringify(tampon, null, 2) + '\n');
    return tampon;
  }

  function nomDossier() {
    return rootHandle ? rootHandle.name : null;
  }

  // Retient le dossier — et rien avant. `valider` reçoit ({ tampon, nom }) et rend une
  // promesse : false relâche le dossier (aucune écriture n'a eu lieu, aucun handle n'est
  // mémorisé), true le retient. Sans `valider`, comportement d'avant l'étape 20.
  // `sur` : le dossier vient du serveur des cours, qui ne sert QUE le dossier ou il est
  // installe. La confusion entre deux copies du depot, que le tampon sert a deceler, ne
  // peut donc pas se produire : valider le sait, et ne pose pas la question.
  async function retenir(handle, valider, sur) {
    const tampon = await lireTamponDe(handle);
    if (valider && !(await valider({ tampon, nom: handle.name, sur: !!sur }))) return null;
    rootHandle = handle;
    idbSet(IDB_KEY, handle).catch(() => { /* stockage indisponible, tant pis */ });
    return { handle: rootHandle, tampon };
  }

  // Doit être appelée depuis un gestionnaire de clic (geste utilisateur requis).
  // Rend null si l'utilisateur a refusé le dossier au vu de son tampon.
  async function connect(valider) {
    if (window.CoursDossierServeur) return retenir(window.CoursDossierServeur.racine(), valider, true);
    if (!window.showDirectoryPicker) {
      throw new Error("Ce navigateur ne permet pas d'accéder aux fichiers locaux (utilisez Chrome ou Edge).");
    }
    // Un dossier deja connu ? On redemande la permission SUR LUI (le clic fournit le geste
    // utilisateur qui manquait au chargement) plutot que de rouvrir le selecteur : c'est un
    // clic au lieu d'une navigation dans l'arborescence, et surtout aucun risque de designer
    // par megarde l'autre copie du depot.
    try {
      const connu = await idbGet(IDB_KEY);
      if (connu) {
        const perm = await connu.requestPermission({ mode: 'readwrite' });
        if (perm === 'granted') return retenir(connu, valider);
      }
    } catch (e) { /* handle perime ou dossier disparu : on passe au selecteur */ }

    const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    const perm = await handle.requestPermission({ mode: 'readwrite' });
    if (perm !== 'granted') throw new Error("Permission d'accès au dossier refusée.");
    return retenir(handle, valider);
  }

  function isConnected() {
    return !!rootHandle;
  }

  function ensureConnected() {
    if (!rootHandle) throw new Error('Dossier non connecté — cliquez sur "Connecter le dossier Cours" d\'abord.');
    return rootHandle;
  }

  // Navigue jusqu'au dossier désigné par dirParts (array de noms), en créant
  // les sous-dossiers manquants si create=true.
  async function navigateDir(dirParts, create) {
    let dir = ensureConnected();
    for (const part of dirParts) {
      dir = await dir.getDirectoryHandle(part, { create: !!create });
    }
    return dir;
  }

  async function getFileHandleAt(pathParts, create) {
    const dir = await navigateDir(pathParts.slice(0, -1), create);
    return dir.getFileHandle(pathParts[pathParts.length - 1], { create: !!create });
  }

  // pathParts: ex ['formation-fake-news-niveau1', 'index.html'] ou ['data', 'registry.json']
  async function readText(pathParts) {
    const fh = await getFileHandleAt(pathParts, false);
    const file = await fh.getFile();
    return file.text();
  }

  async function writeText(pathParts, content) {
    const fh = await getFileHandleAt(pathParts, true);
    const writable = await fh.createWritable();
    await writable.write(content);
    await writable.close();
  }

  // Cree un dossier (et ses parents) sans y ecrire de fichier. C'est ce qu'il faut pour
  // les images/ et video/ d'une intervention neuve, vides a la naissance.
  async function ensureDir(dirParts) {
    await navigateDir(dirParts, true);
  }

  async function exists(pathParts) {
    try {
      await getFileHandleAt(pathParts, false);
      return true;
    } catch (e) {
      return false;
    }
  }

  // ── Ce qu'il faut à la médiathèque : lister, écrire un binaire, relire sa taille ──────
  // Les trois arrivent ici et nulle part ailleurs : storage.js est la seule couche qui
  // touche le disque, et une médiathèque qui listerait le dossier de son côté ferait une
  // seconde porte d'entrée — exactement ce que ce fichier existe pour empêcher.

  // Les noms des FICHIERS d'un dossier (ni sous-dossiers, ni fichiers cachés).
  // [] quand le dossier n'existe pas encore ; null quand le dossier n'est pas connecté ou
  // que le navigateur ne sait pas le parcourir — à l'appelant de se rabattre sur autre chose.
  async function listFiles(dirParts) {
    if (!rootHandle) return null;
    let dir;
    try { dir = await navigateDir(dirParts, false); } catch (e) { return []; }
    const noms = [];
    try {
      for await (const entree of dir.entries()) {
        const nom = entree[0];
        if (entree[1].kind !== 'file' || nom.charAt(0) === '.') continue;
        noms.push(nom);
      }
    } catch (e) {
      return null;
    }
    return noms;
  }

  // Les DOSSIERS d'un répertoire, à la différence de listFiles qui n'en donne que les
  // fichiers. Depuis l'étape Z6, c'est ainsi qu'on sait quelles interventions existent :
  // le registre le disait avant, le disque le dit aussi bien et ne retarde jamais.
  // Les noms qui commencent par un point ou un souligné sont sautés (.git, _harness).
  async function listDirs(dirParts) {
    if (!rootHandle) return null;
    let dir;
    try { dir = await navigateDir(dirParts || [], false); } catch (e) { return []; }
    const noms = [];
    try {
      for await (const entree of dir.entries()) {
        const nom = entree[0];
        if (entree[1].kind !== 'directory' || /^[._]/.test(nom)) continue;
        noms.push(nom);
      }
    } catch (e) {
      return null;
    }
    return noms;
  }

  // Une image ou une vidéo ne passe PAS par writeText : String(blob) donnerait
  // « [object File] », et le fichier écrit ferait treize octets sans que rien ne proteste.
  async function writeBlob(pathParts, blob) {
    const fh = await getFileHandleAt(pathParts, true);
    const writable = await fh.createWritable();
    await writable.write(blob);
    await writable.close();
  }

  // La taille du fichier TEL QU'IL EST SUR LE DISQUE, ou null s'il n'y est pas. C'est ce qui
  // permet de relire une écriture binaire avant de l'annoncer : readText, sur une image,
  // ne prouverait rien.
  async function fileSize(pathParts) {
    try {
      const fh = await getFileHandleAt(pathParts, false);
      return (await fh.getFile()).size;
    } catch (e) {
      return null;
    }
  }

  return { tryRestore, connect, isConnected, readText, writeText, exists, ensureDir,
           listFiles, listDirs, writeBlob, fileSize,
           lireTampon, lireTamponDe, ecrireTampon, nomDossier, TAMPON };
})();
