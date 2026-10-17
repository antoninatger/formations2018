/* Le dossier Cours, tel que le voit une page ouverte par « Ouvrir les cours ».

   Sous file://, la seule porte vers le disque est l'API File System Access : un dossier
   choisi a la main (« Connecter le dossier »), et une permission que le navigateur oublie
   a chaque session. Ouvertes par le lanceur, les pages ont mieux : le serveur local
   (serveur-cours.js) sait lire et ecrire le dossier Cours lui-meme. Ce fichier, que le
   serveur glisse en tete de chaque page HTML, habille ce serveur en « dossier » : un objet
   qui repond aux memes methodes qu'un FileSystemDirectoryHandle (getDirectoryHandle,
   getFileHandle, entries, removeEntry ; getFile et createWritable pour un fichier). Le
   moteur et l'atelier le prennent comme s'il avait ete choisi au selecteur, et n'ont donc
   plus rien a demander.

   Sous file://, ce fichier n'est jamais charge : rien ne change pour le double-clic.

   Une suppression ne detruit rien : le serveur range le fichier dans Cours/_to_delete/. */
(function () {
  'use strict';
  if (window.CoursDossierServeur) return;
  const API = '/__dossier';

  function introuvable(chemin) {
    return new DOMException('Introuvable : ' + chemin, 'NotFoundError');
  }

  async function appel(op, chemin, options) {
    const r = await fetch(API + '?op=' + op + '&p=' + encodeURIComponent(chemin), Object.assign({
      method: 'POST', cache: 'no-store', headers: { 'X-Cours': '1' },
    }, options || {}));
    if (r.status === 404) throw introuvable(chemin);
    if (!r.ok) throw new Error('Le serveur des cours n’a pas pu faire « ' + op + ' » sur ' + chemin
      + ' : ' + (await r.text()));
    return r;
  }

  function verifierNom(nom) {
    if (typeof nom !== 'string' || !nom || nom === '.' || nom === '..' || /[\\/]/.test(nom)) {
      throw new TypeError('Nom invalide : ' + nom);
    }
  }

  function joindre(dossier, nom) {
    return dossier ? dossier + '/' + nom : nom;
  }

  const PERMISSION = {
    queryPermission: async () => 'granted',
    requestPermission: async () => 'granted',
  };

  function fichier(chemin, nom) {
    return Object.assign({
      kind: 'file', name: nom, __cheminServeur: chemin,
      isSameEntry: async (autre) => !!autre && autre.__cheminServeur === chemin && autre.kind === 'file',
      getFile: async () => {
        const r = await appel('lire', chemin, { method: 'GET' });
        const blob = await r.blob();
        const modif = Number(r.headers.get('X-Modifie-Le')) || Date.now();
        return new File([blob], nom, { type: blob.type, lastModified: modif });
      },
      // Comme le vrai : rien n'arrive sur le disque avant close(). Le serveur ecrit d'abord
      // a cote, puis remplace : un enregistrement interrompu ne laisse pas un fichier coupe.
      createWritable: async () => {
        const morceaux = [];
        return {
          write: async (d) => {
            if (d && typeof d === 'object' && d.type === 'write' && 'data' in d) d = d.data;
            morceaux.push(d);
          },
          close: async () => { await appel('ecrire', chemin, { method: 'PUT', body: new Blob(morceaux) }); },
          abort: async () => { morceaux.length = 0; },
        };
      },
    }, PERMISSION);
  }

  function dossier(chemin, nom) {
    async function liste() {
      const r = await appel('liste', chemin, { method: 'GET' });
      return (await r.json()).map(([n, sorte]) => [n, sorte === 'directory'
        ? dossier(joindre(chemin, n), n) : fichier(joindre(chemin, n), n)]);
    }
    return Object.assign({
      kind: 'directory', name: nom, __cheminServeur: chemin,
      isSameEntry: async (autre) => !!autre && autre.__cheminServeur === chemin && autre.kind === 'directory',
      getDirectoryHandle: async (n, opt) => {
        verifierNom(n);
        const c = joindre(chemin, n);
        let sorte = null;
        try { sorte = (await (await appel('stat', c, { method: 'GET' })).json()).kind; }
        catch (e) { if (e.name !== 'NotFoundError') throw e; }
        if (sorte === 'file') throw new DOMException(c + ' est un fichier', 'TypeMismatchError');
        if (!sorte) {
          if (!opt || !opt.create) throw introuvable(c);
          await appel('creer-dossier', c);
        }
        return dossier(c, n);
      },
      getFileHandle: async (n, opt) => {
        verifierNom(n);
        const c = joindre(chemin, n);
        let sorte = null;
        try { sorte = (await (await appel('stat', c, { method: 'GET' })).json()).kind; }
        catch (e) { if (e.name !== 'NotFoundError') throw e; }
        if (sorte === 'directory') throw new DOMException(c + ' est un dossier', 'TypeMismatchError');
        if (!sorte) {
          if (!opt || !opt.create) throw introuvable(c);
          await appel('ecrire', c, { method: 'PUT', body: '' });
        }
        return fichier(c, n);
      },
      removeEntry: async (n) => {
        verifierNom(n);
        await appel('supprimer', joindre(chemin, n));
      },
      entries: async function* () { for (const e of await liste()) yield e; },
      values: async function* () { for (const e of await liste()) yield e[1]; },
      keys: async function* () { for (const e of await liste()) yield e[0]; },
      [Symbol.asyncIterator]: async function* () { for (const e of await liste()) yield e; },
    }, PERMISSION);
  }

  // La fenetre des cours s'ouvre en grand (Antonin, 18 octobre : « je veux que la fenetre
  // s'ouvre en grand quand je clique »). Edge, deja lance, ignore --start-maximized et
  // reprend la taille d'avant : on agrandit donc depuis la page, une fois par fenetre (si on
  // la retrecit ensuite a la main, elle le reste). Dans un onglet ordinaire, resizeTo est
  // sans effet : rien ne change pour qui ouvre les cours dans le navigateur.
  try {
    if (!sessionStorage.getItem('cours-fenetre-agrandie')) {
      sessionStorage.setItem('cours-fenetre-agrandie', '1');
      const ecran = window.screen;
      if (window.outerWidth < ecran.availWidth - 8 || window.outerHeight < ecran.availHeight - 8) {
        window.moveTo(ecran.availLeft || 0, ecran.availTop || 0);
        window.resizeTo(ecran.availWidth, ecran.availHeight);
      }
    }
  } catch (e) { /* stockage ou redimensionnement refuses : tant pis */ }

  const racine = dossier('', 'Cours');
  window.CoursDossierServeur = { racine: () => racine };
})();
