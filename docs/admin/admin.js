/* Les trois gestes qui écrivent hors d'une présentation : créer une intervention, relire
   les articles, relire les jeux. Ils vivent dans le menu de la page d'accueil et passent
   tous par storage.js pour l'accès disque.

   Ce fichier orchestrait l'atelier — import, absorption, régénération des index.html
   depuis un registre. L'étape Z a rendu les fichiers seuls maîtres de leur contenu ET de
   leur composition ; Z6b a donc retiré le registre, la régénération et l'écran qui les
   montrait. Ce qui reste écrit un fichier neuf, jamais n'en réécrit un existant. */
window.CoursAdmin = window.CoursAdmin || {};

CoursAdmin.App = (function () {
  const Storage = CoursAdmin.Storage;
  const JeuxCore = CoursAdmin.JeuxCore;
  const ArticlesCore = CoursAdmin.ArticlesCore;

  const el = id => document.getElementById(id);

  function toast(msg, isError) {
    const t = el('toast');
    t.textContent = msg;
    t.className = isError ? 'toast show error' : 'toast show';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.className = 'toast'; }, 3500);
  }

  async function init() {
    bindTopBar();
    const restored = await Storage.tryRestore(validerDossier);
    if (restored) await finaliserTampon();
    refreshTopBar();
  }

  // Connecter le dossier Cours. Sortie en un booleen : « on peut ecrire ». Avant Z6b, ce
  // booleen disait « le registre est la » ; il n'y a plus de registre, et c'est le dossier
  // lui-meme qui suffit. Les trois boutons du menu s'en servent, chacun depuis sa propre
  // fenetre.
  async function connecterDossier() {
    try {
      const retenu = await Storage.connect(validerDossier);
      if (!retenu) { toast('Dossier non retenu : rien n’a été écrit.'); return false; }
      await finaliserTampon();
      refreshTopBar();
      return true;
    } catch (e) {
      // Fermer le selecteur de dossier n'est pas une panne : le dire en francais, et sans
      // rouge, plutot que de recopier « The user aborted a request ».
      if (e && (e.name === 'AbortError' || /aborted/i.test(e.message || ''))) {
        toast('Aucun dossier choisi : rien n’a été fait.');
      } else {
        toast(e.message, true);
      }
      return false;
    }
  }

  // Le seul element de barre qui subsiste apres Z6b : le nom du dossier connecte. Les trois
  // boutons du menu se cablent dans index.html, pres d'ou ils s'affichent.
  function bindTopBar() {
    const st = el('conn-status');
    if (st) st.addEventListener('click', onRenommerDossier);
  }

  // Le bandeau nomme le dossier, il ne se contente pas de dire qu'il y en a un : c'est
  // toute la leçon du 15 août, où « 🟢 Dossier connecté » désignait l'autre copie du dépôt.
  // Tant qu'aucun dossier n'est connecté, il ne dit rien : la page d'accueil est celle
  // qu'on ouvre pour présenter, et « Non connecté » y serait du bruit.
  function refreshTopBar() {
    const st = el('conn-status');
    if (!st) return;
    if (!Storage.isConnected()) {
      st.textContent = '';
      st.title = '';
      st.classList.remove('alerte', 'renommable');
      return;
    }
    const nom = (etatDossier && etatDossier.nom) || 'dossier inconnu';
    const alerte = !!(etatDossier && etatDossier.alerte);
    st.textContent = (alerte ? '🟠 ' : '🟢 ') + (Storage.nomDossier() || 'Cours') + ' · ' + nom;
    st.title = 'Cliquer pour renommer ce dossier';
    st.classList.toggle('alerte', alerte);
    st.classList.add('renommable');
  }


  // ── Etape T1 — relire les jeux, et ecrire leur manifeste ────────────────────────
  // Le balayage vit dans l'atelier, sous un bouton nomme, et il demande le dossier PARENT
  // de Cours : `Jeux` est le VOISIN de `Cours`, et le dossier connecte ne donne acces qu'a
  // Cours. Une fois, pas a chaque fois — le manifeste est du cache.
  //
  // Il n'ecrit qu'un seul fichier, `jeux-manifest.js`, a la racine de Cours. Toute la
  // logique (titres, emojis, chemins) vit dans jeux-core.js, sans acces disque : c'est ce
  // qui permet a test-jeux-manifest.js de l'eprouver en Node nu.
  async function onRelireJeux() {
    if (!Storage.isConnected()) {
      toast('Connectez d’abord le dossier Cours : c’est là que le manifeste s’écrit.', true);
      return;
    }
    if (!window.showDirectoryPicker) {
      toast("Ce navigateur ne permet pas d'accéder aux fichiers locaux (utilisez Chrome ou Edge).", true);
      return;
    }
    let dossierJeux = null;
    try {
      const choisi = await window.showDirectoryPicker({ mode: 'read' });
      dossierJeux = await trouverDossierJeux(choisi);
    } catch (e) {
      if (e && (e.name === 'AbortError' || /aborted/i.test(e.message || ''))) {
        toast('Aucun dossier choisi : rien n’a été fait.');
      } else {
        toast(e.message, true);
      }
      return;
    }
    if (!dossierJeux) {
      toast('Ce dossier ne contient aucun dossier « Jeux ». Choisissez le dossier qui contient '
        + 'Cours et Jeux, ou le dossier Jeux lui-même. Rien n’a été écrit.', true);
      return;
    }
    let jeux = [];
    try {
      jeux = await balayerJeux(dossierJeux);
    } catch (e) {
      toast('Le balayage a échoué : ' + (e && e.message ? e.message : e) + '. Rien n’a été écrit.', true);
      return;
    }
    if (!jeux.length) {
      toast('Aucun jeu trouvé (un jeu est un sous-dossier avec un index.html). Rien n’a été écrit.', true);
      return;
    }
    // Ecrit, puis RELU : une ecriture annoncee sans relecture est le bogue du 15 aout.
    const texte = JeuxCore.construireManifeste(jeux);
    await Storage.writeText(['jeux-manifest.js'], texte);
    const relu = await Storage.readText(['jeux-manifest.js']);
    if (relu !== texte) {
      toast('jeux-manifest.js ne relit pas ce qui vient d’y être écrit : écriture NON confirmée.', true);
      return;
    }
    const sansTitre = jeux.filter(j => j.titreSource === 'dossier').length;
    toast(jeux.length + ' jeu(x) relus, jeux-manifest.js est à jour'
      + (sansTitre ? ' (' + sansTitre + ' sans <title> : le nom du dossier fait office de titre)' : '') + '.');
  }

  // Le dossier choisi EST « Jeux », ou il le contient (« Web apps »). Les deux gestes sont
  // naturels ; n'en accepter qu'un serait un piege.
  async function trouverDossierJeux(handle) {
    if (handle && handle.name === 'Jeux') return handle;
    try { return await handle.getDirectoryHandle('Jeux', { create: false }); } catch (e) { return null; }
  }

  // ── Relire les articles : la bibliotheque de these entre dans les formations ────────
  // Le dossier des articles n'est pas sous Cours (il vit dans OneDrive) : aucune formation
  // ne peut le lister toute seule. Meme geste que pour les jeux — on le choisit une fois,
  // on balaie, on ecrit `articles-manifest.js` a la racine de Cours, et les diaporamas s'en
  // servent ensuite sans rien demander.
  //
  // Le balayage part des FICHIERS, pas de la page d'archive : un PDF depose la veille doit
  // apparaitre dans la recherche meme si l'archive ne le connait pas encore. L'archive, si
  // elle est la, ne fait qu'ajouter ce qu'elle sait (titre, auteurs, annee, DOI, APA).
  //
  // La RACINE (file:///C:/…) ne se devine pas : l'API des fichiers ne donne jamais le
  // chemin complet d'un dossier choisi. On garde donc celle du manifeste precedent, et a
  // defaut on la demande — une fois.
  async function onRelireArticles() {
    if (!Storage.isConnected()) {
      toast('Connectez d’abord le dossier Cours : c’est là que le manifeste s’écrit.', true);
      return;
    }
    if (!window.showDirectoryPicker) {
      toast("Ce navigateur ne permet pas d'accéder aux fichiers locaux (utilisez Chrome ou Edge).", true);
      return;
    }
    const racine = await racineDesArticles();
    if (!racine) return;

    let dossier = null;
    try {
      dossier = await window.showDirectoryPicker({ mode: 'read' });
    } catch (e) {
      if (e && (e.name === 'AbortError' || /aborted/i.test(e.message || ''))) {
        toast('Aucun dossier choisi : rien n’a été fait.');
      } else {
        toast(e.message, true);
      }
      return;
    }

    let articles = [];
    try {
      const index = await lireArchiveDesArticles(dossier);
      articles = await balayerArticles(dossier, '', index);
    } catch (e) {
      toast('Le balayage a échoué : ' + (e && e.message ? e.message : e) + '. Rien n’a été écrit.', true);
      return;
    }
    if (!articles.length) {
      toast('Aucun article trouvé dans ce dossier (PDF, EPUB ou HTML). Rien n’a été écrit.', true);
      return;
    }

    const texte = ArticlesCore.construireManifeste(racine, articles);
    await Storage.writeText(['articles-manifest.js'], texte);
    const relu = await Storage.readText(['articles-manifest.js']);
    if (relu !== texte) {
      toast('articles-manifest.js ne relit pas ce qui vient d’y être écrit : écriture NON confirmée.', true);
      return;
    }
    memoriserRacineArticles(racine);
    const inconnus = articles.filter(a => !a.connu).length;
    toast(articles.length + ' article(s) relus, articles-manifest.js est à jour'
      + (inconnus ? ' (' + inconnus + ' que l’archive ne connaît pas encore : ils portent le nom de leur fichier)' : '')
      + '.');
  }

  const CLE_RACINE_ARTICLES = 'cours-admin-racine-articles';

  function memoriserRacineArticles(racine) {
    try { localStorage.setItem(CLE_RACINE_ARTICLES, racine); } catch (e) { /* stockage indisponible */ }
  }

  // Celle du manifeste deja ecrit d'abord : elle a fait ses preuves. Puis celle que ce
  // navigateur a retenue. Sinon, on la demande, en montrant a quoi elle ressemble.
  async function racineDesArticles() {
    let connue = '';
    try {
      const manifeste = await Storage.readText(['articles-manifest.js']);
      const m = manifeste.match(/"racine":\s*"([^"]+)"/);
      if (m) connue = m[1];
    } catch (e) { /* pas encore de manifeste */ }
    if (!connue) {
      try { connue = localStorage.getItem(CLE_RACINE_ARTICLES) || ''; } catch (e) { /* rien */ }
    }
    if (connue) return connue;

    const corps = document.createElement('div');
    corps.appendChild(paragraphe('Les articles ne sont pas dans Cours : le lien posé dans une note '
      + 'doit donc porter leur adresse complète. Copiez le chemin du dossier depuis la barre '
      + 'd’adresse de l’explorateur.', 'panneau-sous-titre'));
    corps.appendChild(paragraphe('Exemple : C:\\Users\\vous\\OneDrive\\Documents\\Articles CTs',
      'panneau-sous-titre'));
    const reponse = await ouvrirPanneau({
      id: 'panneau-racine-articles', titre: 'Où sont les articles ?', corps,
      champ: { label: 'Chemin du dossier ', valeur: '' },
      boutonOk: 'Continuer',
    });
    if (!reponse || !reponse.valeur) return null;
    return cheminEnUrlFichier(reponse.valeur);
  }

  // « C:\Users\… » devient « file:///C:/Users/… ». Un chemin deja donne sous forme d'URL
  // passe tel quel : les deux se collent naturellement, autant les accepter tous les deux.
  function cheminEnUrlFichier(brut) {
    const propre = String(brut).trim().replace(/^"|"$/g, '').replace(/\\/g, '/').replace(/\/+$/, '');
    if (/^file:\/\//i.test(propre)) return propre + '/';
    return 'file:///' + propre.replace(/^\/+/, '') + '/';
  }

  // L'archive du dossier, si elle est la : une page HTML qui porte `const DATA = […]`.
  // Sans elle, le balayage marche quand meme — les articles portent le nom de leur fichier.
  async function lireArchiveDesArticles(dossier) {
    for await (const [nom, h] of dossier.entries()) {
      if (h.kind !== 'file' || !ArticlesCore.estPageDArchive(nom)) continue;
      if (/sauvegarde/i.test(nom)) continue;   // la copie de secours n'est pas la source
      const texte = await (await h.getFile()).text();
      const donnees = ArticlesCore.extraireDATA(texte);
      if (donnees.length) return ArticlesCore.indexerArchive(donnees);
    }
    return new Map();
  }

  async function balayerArticles(dossier, chemin, index) {
    const trouves = [];
    for await (const [nom, h] of dossier.entries()) {
      if (nom.charAt(0) === '.') continue;
      if (h.kind === 'directory') {
        const dedans = await balayerArticles(h, chemin ? chemin + '/' + nom : nom, index);
        dedans.forEach(a => trouves.push(a));
        continue;
      }
      if (!ArticlesCore.estArticle(nom) || ArticlesCore.estPageDArchive(nom)) continue;
      trouves.push(ArticlesCore.entreeDArticle(nom, chemin, index.get(ArticlesCore.clefDeFichier(nom))));
    }
    return trouves;
  }

  async function balayerJeux(dirJeux) {
    const jeux = [];
    for await (const [nom, h] of dirJeux.entries()) {
      if (h.kind !== 'directory' || !JeuxCore.estDossierDeJeu(nom)) continue;
      let fh = null;
      try { fh = await h.getFileHandle('index.html', { create: false }); } catch (e) { continue; }
      jeux.push(JeuxCore.entreeDeJeu(nom, await (await fh.getFile()).text()));
    }
    return JeuxCore.trierJeux(jeux);
  }

  // ── ⚠️ 20 — panneaux, tampon du dossier, confirmation avant régénération ─────────
  // confirm() natif ne sait afficher ni une liste de fichiers ni un champ de saisie ; le
  // 15 août, c'est justement l'absence de détail qui a laissé régénérer une AUTRE copie du
  // dépôt en annonçant un succès. Les panneaux sont attachés à document.body et retirés à
  // la fermeture — ils ne touchent jamais au DOM d'une formation.
  function ouvrirPanneau(opts) {
    return new Promise(resolve => {
      const fond = document.createElement('div');
      fond.className = 'panneau-fond';
      fond.id = opts.id;
      fond.tabIndex = -1;
      const boite = document.createElement('div');
      boite.className = 'panneau';
      const titre = document.createElement('h2');
      titre.textContent = opts.titre;
      boite.appendChild(titre);
      boite.appendChild(opts.corps);

      let input = null;
      if (opts.champ) {
        const lab = document.createElement('label');
        lab.className = 'panneau-champ';
        lab.appendChild(document.createTextNode(opts.champ.label));
        input = document.createElement('input');
        input.type = 'text';
        input.id = opts.id + '-nom';
        input.value = opts.champ.valeur || '';
        lab.appendChild(input);
        boite.appendChild(lab);
      }

      const actions = document.createElement('div');
      actions.className = 'panneau-actions';
      // Un compte rendu n'a rien à annuler : il raconte ce qui vient d'avoir lieu. Lui
      // laisser un bouton « Annuler » serait promettre un retour en arrière qui n'existe pas.
      const annuler = opts.sansAnnuler ? null : document.createElement('button');
      if (annuler) {
        annuler.id = opts.id + '-annuler';
        annuler.textContent = 'Annuler';
      }
      const ok = document.createElement('button');
      ok.id = opts.id + '-ok';
      ok.className = 'primary';
      ok.textContent = opts.boutonOk;
      if (annuler) actions.appendChild(annuler);
      actions.appendChild(ok);
      boite.appendChild(actions);
      fond.appendChild(boite);
      document.body.appendChild(fond);

      const fermer = val => { fond.remove(); resolve(val); };
      if (annuler) annuler.addEventListener('click', () => fermer(null));
      ok.addEventListener('click', () => fermer({ valeur: input ? input.value.trim() : '' }));
      fond.addEventListener('keydown', ev => { if (ev.key === 'Escape') fermer(null); });
      if (input) { input.focus(); input.select(); } else { fond.focus(); }
    });
  }

  function paragraphe(texte, classe) {
    const p = document.createElement('p');
    if (classe) p.className = classe;
    p.textContent = texte;
    return p;
  }

  // Le dernier dossier connu de CE navigateur. Le tampon, lui, vit dans le dossier :
  // c'est la comparaison des deux qui distingue une copie d'une autre.
  const CLE_DERNIER = 'cours-admin-dernier-dossier';

  function dernierDossier() {
    try { return JSON.parse(localStorage.getItem(CLE_DERNIER) || 'null'); } catch (e) { return null; }
  }

  function memoriserDossier(t) {
    try { localStorage.setItem(CLE_DERNIER, JSON.stringify({ id: t.id, nom: t.nom })); } catch (e) { /* stockage indisponible */ }
  }

  function idTampon() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'x' + Math.random().toString(16).slice(2) + '-' + Date.now().toString(16);
  }

  // Ce que le bandeau affiche : { nom, alerte }. Vaut null tant qu'aucun dossier n'est retenu.
  let etatDossier = null;
  // Tampon à déposer APRÈS que l'utilisateur a confirmé et que le dossier est retenu.
  // Jamais avant : un dossier inconnu ne reçoit pas d'empreinte en silence.
  let tamponAEcrire = null;

  // Passée à Storage.connect()/tryRestore() : appelée le tampon en main mais AVANT que le
  // dossier soit retenu. Rendre false relâche le dossier — aucune écriture n'est alors
  // possible, puisque storage.js n'a pas de rootHandle.
  async function validerDossier(info) {
    const tampon = info.tampon;
    const dernier = dernierDossier();
    // Par le serveur des cours (info.sur), c'est forcement le dossier d'ou la page est servie.
    const alerte = !info.sur && !!dernier && (!tampon || tampon.id !== dernier.id);

    if (tampon && !alerte) {
      etatDossier = { nom: tampon.nom || 'sans nom', alerte: false };
      memoriserDossier(tampon);
      return true;
    }

    const corps = document.createElement('div');
    if (alerte) {
      corps.appendChild(paragraphe(
        'Ce dossier n’est pas celui de la dernière session ('
        + (tampon ? '« ' + (tampon.nom || 'sans nom') + ' »' : 'aucun tampon')
        + ', au lieu de « ' + (dernier.nom || 'sans nom') + ' »). Une autre copie du dépôt ?',
        'panneau-alerte'));
      corps.appendChild(paragraphe('Rien n’a encore été écrit.', 'panneau-sous-titre'));
    } else {
      corps.appendChild(paragraphe(
        'Ce dossier n’a pas encore de tampon. Donnez-lui un nom : c’est lui que le bandeau '
        + 'affichera, pour qu’une autre copie du dépôt ne passe plus pour celle-ci.',
        'panneau-sous-titre'));
    }
    corps.appendChild(paragraphe(
      'Dossier choisi : « ' + info.nom + ' ». Le navigateur n’en dit pas plus, jamais le chemin complet.',
      'panneau-sous-titre'));

    const reponse = await ouvrirPanneau({
      id: 'panneau-dossier',
      titre: alerte ? 'Est-ce bien le bon dossier ?' : 'Nommer ce dossier',
      corps,
      // Le champ ne propose JAMAIS de nom quand ce dossier-ci n’est pas celui attendu :
      // un clic distrait, et l’intrus porterait le nom du vrai. La garde deviendrait
      // aveugle — les deux copies s’appelleraient « principal ». Défaut proposé seulement
      // quand rien ne cloche.
      champ: tampon ? null : { label: 'Nom de ce dossier ', valeur: alerte ? '' : 'principal' },
      boutonOk: alerte ? 'Je sais ce que je fais, continuer' : 'Enregistrer ce nom',
    });
    if (!reponse) return false;

    if (tampon) {
      etatDossier = { nom: tampon.nom || 'sans nom', alerte: true };
      memoriserDossier(tampon);
    } else {
      tamponAEcrire = { id: idTampon(), nom: reponse.valeur || (alerte ? 'dossier sans nom' : 'principal'), cree: new Date().toISOString() };
      etatDossier = { nom: tamponAEcrire.nom, alerte: alerte };
    }
    return true;
  }

  // Le dépôt du tampon a lieu ici, une fois le dossier retenu : c'est la première écriture
  // de la session, et elle suit la confirmation.
  async function finaliserTampon() {
    if (!tamponAEcrire) return;
    const t = tamponAEcrire;
    tamponAEcrire = null;
    try {
      await Storage.ecrireTampon(t);
      memoriserDossier(t);
    } catch (e) {
      toast('Le tampon n’a pas pu être écrit : ' + e.message, true);
    }
  }

  // « nom modifiable ensuite » : un clic sur le bandeau.
  async function onRenommerDossier() {
    if (!Storage.isConnected()) return;
    const tampon = await Storage.lireTampon();
    if (!tampon) return;
    const corps = document.createElement('div');
    corps.appendChild(paragraphe('L’empreinte du dossier ne change pas, seul le nom affiché.',
      'panneau-sous-titre'));
    const reponse = await ouvrirPanneau({
      id: 'panneau-renommer', titre: 'Renommer ce dossier', corps,
      champ: { label: 'Nom de ce dossier ', valeur: tampon.nom || '' },
      boutonOk: 'Renommer',
    });
    if (!reponse || !reponse.valeur) return;
    tampon.nom = reponse.valeur;
    await Storage.ecrireTampon(tampon);
    memoriserDossier(tampon);
    etatDossier = { nom: tampon.nom, alerte: etatDossier ? etatDossier.alerte : false };
    refreshTopBar();
  }


  // Appelee depuis le menu de l'index : « Nouvelle intervention » SANS quitter le menu.
  // C'est le retour du 6 septembre — « c'est complique » : l'ancien chemin basculait dans
  // l'atelier, exigeait d'aller trouver le bouton de connexion, puis enchainait cinq
  // prompt() successifs. Ici, une seule fenetre : le dossier se connecte depuis elle, et
  // tout se remplit d'un coup.
  // Retour : l'identifiant cree, ou null si rien n'a ete cree.
  // Depuis Z6, la creation ne demande plus le REGISTRE mais le DOSSIER : c'est lui qui
  // recoit l'intervention, et c'est lui qui dit quels identifiants sont deja pris.
  async function nouvelleIntervention() {
    const pret = await demanderLeDossier('panneau-connecter-pour-creer', 'Nouvelle intervention',
      'Pour créer une intervention, il faut d’abord ouvrir le dossier Cours : c’est lui qui '
      + 'reçoit le dossier de l’intervention, sa page et son app.js.');
    if (!pret) return null;
    return onNewFormation();
  }

  // ── Z6b — les trois gestes de l'atelier vivent dans le menu ─────────────────────
  // L'atelier a disparu avec le registre : privé de sa liste de formations et de sa
  // bibliothèque de séries, il ne lui restait qu'une barre de boutons. Les trois qui
  // servent encore sont donc sur la page d'accueil, et chacun demande le dossier Cours
  // depuis sa propre fenêtre — personne n'a plus à aller chercher un bouton « Connecter »
  // ailleurs. C'est le « c'est compliqué » du 6 septembre, réglé pour les trois.
  async function demanderLeDossier(idPanneau, titre, phrase) {
    if (Storage.isConnected()) return true;
    const corps = document.createElement('div');
    corps.appendChild(paragraphe(phrase, 'panneau-sous-titre'));
    const reponse = await ouvrirPanneau({
      id: idPanneau, titre, corps, boutonOk: 'Connecter le dossier Cours',
    });
    if (!reponse) return false;
    return !!(await connecterDossier());
  }

  async function relireArticles() {
    const pret = await demanderLeDossier('panneau-connecter-pour-articles', 'Relire les articles',
      'Pour relire les articles, il faut d’abord ouvrir le dossier Cours : c’est là que '
      + 'articles-manifest.js s’écrit.');
    if (!pret) return;
    return onRelireArticles();
  }

  async function relireJeux() {
    const pret = await demanderLeDossier('panneau-connecter-pour-jeux', 'Relire les jeux',
      'Pour relire les jeux, il faut d’abord ouvrir le dossier Cours : c’est là que '
      + 'jeux-manifest.js s’écrit.');
    if (!pret) return;
    return onRelireJeux();
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  }

  // ---- Étape D : « Nouvelle intervention » ----
  //
  // Cette fonction existait déjà et clonait une formation existante. Trois défauts, tous
  // trouvés en la relisant le 2026-08-20 :
  //   - la marque du bandeau n'était PAS remplacée : l'intervention neuve affichait
  //     « 💅 Fake News et esprit critique — Les influenceurs » quel que soit son sujet ;
  //   - elle héritait des 67 à 199 règles de CSS propre d'un autre sujet ;
  //   - elle recopiait l'app.js de la source tel quel, avec ses données, ses
  //     COMPLEX_SLIDE_IDS et ses registerGate('s5') pointant sur des diapos absentes.
  // Elle part désormais d'un gabarit commun (admin/data/templates/_commun/), établi en
  // diffusant réellement les 5 head.html : ils ne diffèrent qu'en trois endroits — le
  // <title>, le contenu du <style>, et la ligne .brand.

  // Le strict nécessaire d'un app.js, mesuré sur le plus court existant
  // (formation-raisonnements-fallacieux, 69 lignes, dont 65 de données propres).
  function appJsMinimal(prefixe) {
    return '// Intervention créée avec « Nouvelle intervention ».\n'
      + '// Tout le reste (quiz, sondages, jauges) s\'ajoute par les modèles de diapo,\n'
      + '// sans code : ce fichier n\'a besoin de rien d\'autre pour qu\'une formation vive.\n'
      + 'const Deck = createDeckEngine({\n'
      + '  storagePrefix: \'' + prefixe + '\',\n'
      + '});\n'
      + 'window.Deck = Deck;\n'
      + 'Deck.init();\n';
  }

  // Le CSS propre d'une intervention neuve : la couleur d'accent, et rien de plus. Tout le
  // reste vient du socle commun (shared-deck.css), et les modèles de l'étape B n'utilisent
  // que des classes du socle — c'est ce qui rend une intervention neuve utilisable tout de
  // suite plutôt qu'après avoir recopié le style d'un autre sujet.
  function cssPropreInitial(accent) {
    return '/* Propre à cette intervention. Le reste vient de ../shared-deck.css.\n'
      + '   Ajoutez ici ce qui ne concerne qu\'elle. */\n'
      + ':root{--acc:' + accent + '}';
  }

  // Un identifiant de stockage court, dérivé du dossier. Il préfixe les clés localStorage
  // ET la base IndexedDB qui garde le handle du fichier : deux interventions qui le
  // partageraient écriraient dans le fichier l'une de l'autre. C'est exactement le piège
  // du 2026-08-15. Personne ne le tient en liste — il vit dans chaque app.js — donc on va
  // les lire pour de bon, plutôt que de parier sur l'unicité des identifiants.
  async function prefixeLibre(id, dossiers) {
    const mots = id.replace(/^formation-/, '').split('-').filter(Boolean);
    const base = (mots.map(m => m.slice(0, 3)).join('') || 'deck').slice(0, 10);
    const pris = new Set();
    for (const dossier of (dossiers || [])) {
      try {
        const src = await Storage.readText([dossier, 'app.js']);
        const m = src.match(/storagePrefix:\s*['"]([^'"]+)['"]/);
        if (m) pris.add(m[1]);
      } catch (e) { /* pas d'app.js lisible : rien a eviter de ce cote */ }
    }
    let candidat = base;
    for (let n = 2; pris.has(candidat); n++) candidat = base + n;
    return candidat;
  }

  // ── Le formulaire, à la place des cinq prompt() ─────────────────────────────────
  // Un prompt() ne sait ni montrer une couleur, ni cocher une liste, ni dire ce qui cloche
  // sans tout redemander depuis le début. Le 6 septembre, créer une intervention voulait
  // dire : basculer dans l'atelier, trouver le bouton de connexion, puis répondre à cinq
  // boîtes grises l'une après l'autre — et un tiret oublié dans l'identifiant renvoyait à
  // la première. Une seule fenêtre, donc, où tout se voit d'un coup.

  // Le dossier se déduit du nom : « Comment convaincre un climato-sceptique » donne
  // « comment-convaincre-un-climato-sceptique ». Il suit le nom tant qu'on n'y touche pas ;
  // dès qu'on le corrige à la main, il ne bouge plus.
  function slugifier(texte) {
    // NFD sépare « é » en « e » + un signe combinant ; le filtre qui suit ne garde que les
    // lettres ASCII, les chiffres, l'espace et le tiret, donc le signe combinant tombe avec
    // la ponctuation. Les apostrophes deviennent des espaces d'abord, sans quoi
    // « L'esprit critique » donnerait « lesprit-critique ».
    return String(texte).normalize('NFD')
      .replace(/['’]/g, ' ')
      .replace(/[^A-Za-z0-9 -]/g, '')
      .trim().toLowerCase()
      .replace(/[ -]+/g, '-')
      .slice(0, 60)
      .replace(/^-+|-+$/g, '');
  }

  // ── Z6 — ce que le disque sait, et que le registre disait avant ─────────────────
  // Creer une intervention avait besoin du registre pour deux choses : savoir quels
  // identifiants sont pris, et lire les app.js des autres pour ne pas repeter un
  // storagePrefix. Le dossier Cours repond aux deux — et lui, il ne retarde jamais d'une
  // edition faite en page.
  async function interventionsSurLeDisque() {
    const dossiers = await Storage.listDirs([]);
    if (!dossiers) return [];
    const gardes = [];
    for (const nom of dossiers) {
      if (/-backup$/.test(nom)) continue;
      if (await Storage.exists([nom, 'index.html'])) gardes.push(nom);
    }
    return gardes;
  }

  function identifiantLibre(base, pris) {
    const socle = base || 'intervention';
    const occupe = new Set(pris || []);
    let candidat = socle;
    for (let n = 2; occupe.has(candidat); n++) candidat = socle + '-' + n;
    return candidat;
  }

  function champDePanneau(label, valeur, opts) {
    opts = opts || {};
    const lab = document.createElement('label');
    lab.className = 'panneau-champ';
    lab.appendChild(document.createTextNode(label));
    const input = document.createElement('input');
    input.type = opts.type || 'text';
    input.id = opts.id;
    input.value = valeur || '';
    if (opts.placeholder) input.placeholder = opts.placeholder;
    lab.appendChild(input);
    return { lab, input };
  }

  function formulaireIntervention(dossiersPris) {
    const corps = document.createElement('div');
    corps.appendChild(paragraphe('Le dossier, la page, l’app.js et une diapo de couverture '
      + 'sont créés d’un coup, et la carte apparaît dans le menu. Tout reste modifiable ensuite.',
    'panneau-sous-titre'));

    const erreur = paragraphe('', 'panneau-alerte');
    erreur.hidden = true;
    corps.appendChild(erreur);

    const nom = champDePanneau('Nom de l’intervention (titre de la page et du bandeau) ', '',
      { id: 'ni-nom', placeholder: 'Comment convaincre un climato-sceptique' });
    corps.appendChild(nom.lab);

    const desc = champDePanneau('Une ligne pour la carte du menu (facultatif) ', '',
      { id: 'ni-description', placeholder: 'Ce que l’intervention raconte, en une phrase.' });
    corps.appendChild(desc.lab);

    const ligne = document.createElement('div');
    ligne.className = 'panneau-ligne';
    const emoji = champDePanneau('Emoji du bandeau ', '🗂', { id: 'ni-emoji' });
    const accent = champDePanneau('Couleur d’accent ', '#5b8cff', { id: 'ni-accent', type: 'color' });
    ligne.appendChild(emoji.lab);
    ligne.appendChild(accent.lab);
    corps.appendChild(ligne);

    const dossier = champDePanneau('Dossier sur le disque (minuscules, chiffres et tirets) ', '',
      { id: 'ni-dossier' });
    corps.appendChild(dossier.lab);
    let dossierAlaMain = false;
    dossier.input.addEventListener('input', () => { dossierAlaMain = true; });
    nom.input.addEventListener('input', () => {
      if (!dossierAlaMain) dossier.input.value = identifiantLibre(slugifier(nom.input.value), dossiersPris);
    });

    // Les séries ne se cochent plus ici (Z6). Elles se posaient par le registre, qui
    // s'éteint ; et une intervention neuve reçoit désormais ses séries comme n'importe
    // quelle autre diapo, depuis « Toutes les diapos » de sa propre page. Un seul geste
    // pour ajouter une série, au lieu d'un à la création et d'un autre après.

    return {
      corps,
      erreur,
      focus() { nom.input.focus(); },
      lire() {
        return {
          label: nom.input.value.trim(),
          description: desc.input.value.trim(),
          emoji: emoji.input.value.trim() || '🗂',
          accent: accent.input.value.trim(),
          id: dossier.input.value.trim() || identifiantLibre(slugifier(nom.input.value), dossiersPris),
        };
      },
    };
  }

  // Tout ce qui empêche d'écrire, dit en une phrase et AVANT la moindre écriture.
  async function cequiCloche(v, dossiersPris) {
    if (!v.label) return 'Il manque le nom de l’intervention.';
    if (!/^[a-z0-9-]+$/.test(v.id)) return 'Dossier invalide : lettres minuscules, chiffres et tirets uniquement.';
    if ((dossiersPris || []).indexOf(v.id) !== -1) {
      return 'Le dossier Cours contient déjà une intervention « ' + v.id + ' ».';
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(v.accent)) return 'Couleur invalide : attendu #rrggbb.';
    if (await Storage.exists([v.id, 'index.html'])) {
      return 'Un dossier « ' + v.id + ' » avec un index.html existe déjà sur le disque.';
    }
    return null;
  }

  // Retour : l'identifiant créé, ou null si on a renoncé.
  async function onNewFormation() {
    if (!Storage.isConnected()) return null;
    const dossiersPris = await interventionsSurLeDisque();
    const form = formulaireIntervention(dossiersPris);
    for (;;) {
      const attente = ouvrirPanneau({
        id: 'panneau-nouvelle-intervention', titre: 'Nouvelle intervention',
        corps: form.corps, boutonOk: 'Créer l’intervention',
      });
      form.focus();
      const reponse = await attente;
      if (!reponse) return null;
      const valeurs = form.lire();
      const souci = await cequiCloche(valeurs, dossiersPris);
      if (!souci) return creerIntervention(valeurs, dossiersPris);
      // Le panneau se rouvre avec ce qui a déjà été saisi : le formulaire est le MÊME
      // élément d'un tour à l'autre, seule la ligne rouge change.
      form.erreur.hidden = false;
      form.erreur.textContent = souci;
    }
  }

  // ── Z6 — l'intervention naît d'un FICHIER, pas d'une entrée de registre ─────────
  // Avant : on créait la formation dans le registre, puis on régénérait son index.html
  // depuis les gabarits. Deux écritures, deux sources de vérité, et une régénération à
  // faire pour que le dossier existe vraiment. Maintenant : le gabarit commun, une diapo
  // de couverture, et le fichier est écrit — tel qu'il sera lu. Le fichier fait foi dès
  // sa naissance, comme il fait foi ensuite à chaque enregistrement en page.
  //
  // Aucune estampille `data-registry-build` : c'était la marque du registre, et il n'y a
  // plus rien à comparer. Le moteur lit son absence comme une chaîne vide, des deux côtés.
  async function creerIntervention({ id, label, description, emoji, accent }, dossiersPris) {
    try {
      const gabaritHead = await Storage.readText(['admin', 'data', 'templates', '_commun', 'head.html']);
      const gabaritFoot = await Storage.readText(['admin', 'data', 'templates', '_commun', 'foot.html']);

      const head = gabaritHead
        .split('{{TITRE}}').join(escapeHtml(label))
        // L’emoji est saisi librement comme le reste : un « < » tapé là casserait le
        // <span class="brand">. Échappé ici comme le titre et la marque ; la couverture,
        // elle, passe par textContent, donc rien à échapper de ce côté.
        .split('{{EMOJI}}').join(escapeHtml(emoji))
        .split('{{MARQUE}}').join(escapeHtml(label))
        .split('{{CSS_PROPRE}}').join(cssPropreInitial(accent));
      if (head.indexOf('{{') !== -1) {
        // Un emplacement oublié partirait dans le fichier de l'utilisateur, visible à
        // l'écran. Mieux vaut refuser que livrer une page qui affiche « {{MARQUE}} ».
        throw new Error('le gabarit contient encore un emplacement non remplacé');
      }

      await Storage.writeText([id, 'app.js'], appJsMinimal(await prefixeLibre(id, dossiersPris)));

      // Les médias sont transversaux depuis le 31 août : « medias/ » à la racine, commun aux
      // cinq interventions. Une intervention neuve n'a donc plus ses propres images/ et
      // video/ — elle pointe vers ../medias/… comme les autres.
      await Storage.ensureDir(['medias', 'images']);
      await Storage.ensureDir(['medias', 'video']);

      // Une diapo de couverture, engendrée par le modèle « Couverture » de l'étape B :
      // une intervention neuve s'ouvre sur quelque chose, pas sur le vide.
      const couverture = construireCouverture(label, emoji);
      const sectionsHtml = couverture
        ? '  <section ' + couverture.attrsRaw + '>' + couverture.contentHtml + '</section>'
        : '';
      const page = head + '\n\n' + sectionsHtml + '\n\n' + gabaritFoot;
      await Storage.writeText([id, 'index.html'], page);

      // Relecture : une écriture annoncée sans avoir été relue est exactement ce qui a
      // laissé passer les pertes de septembre. Si le fichier ne revient pas tel qu'on
      // l'a écrit, on le dit et on s'arrête là.
      const relu = await Storage.readText([id, 'index.html']);
      if (relu !== page) {
        throw new Error('le fichier ' + id + '/index.html n’a pas été relu tel qu’il a été écrit');
      }

      // Le catalogue (« Toutes les diapos ») est une VUE : on y ajoute ce qu'on vient
      // d'écrire, plutôt que de tout relire. Il se reconstruit entièrement depuis les
      // fichiers au premier enregistrement fait dans une page (Z4). S'il est absent ou
      // illisible, on n'y touche pas : cette reconstruction-là le remettra d'aplomb.
      await ajouterAuCatalogue(id, label, couverture);

      // La carte du menu, sinon l'intervention existe sans que la page d'accueil la
      // montre : c'est ce qui est arrivé le 6 septembre.
      const carte = await ajouterCarteAuMenu(id, label, description);
      poserCarteDansLaPage(id, label, description);

      toast('Intervention « ' + label + ' » créée : dossier, app.js, une couverture'
        + (carte ? ' et sa carte dans le menu.' : '. Carte du menu à ajouter à la main.'));
      return id;
    } catch (e) {
      console.error(e);
      toast('Échec de la création : ' + e.message, true);
      return null;
    }
  }

  // Le catalogue est un fichier .js (le navigateur refuse fetch sur file://), de la forme
  // « window.COURS_DIAPOS = {…}; ». On le relit, on y ajoute la formation et sa couverture,
  // on le réécrit — même forme, même indentation que le moteur (JSON.stringify(cat, null, 1)),
  // sinon deux écritures successives feraient un diff illisible.
  async function ajouterAuCatalogue(id, label, couverture) {
    try {
      const texte = await Storage.readText(['slides-manifest.js']);
      const json = texte.slice(texte.indexOf('{'), texte.lastIndexOf('}') + 1);
      const cat = JSON.parse(json);
      if (!cat || !cat.formations || !Array.isArray(cat.diapos)) return;
      cat.formations[id] = label;
      if (couverture) {
        const idHtml = (couverture.attrsRaw.match(/\bid="([^"]+)"/) || [, 's0'])[1];
        cat.diapos.push({
          id: id + '#' + idHtml,
          titre: label,
          formation: id,
          kind: 'simple',
          attrsRaw: couverture.attrsRaw,
          contentHtml: couverture.contentHtml,
        });
      }
      cat.genere = new Date().toISOString().slice(0, 10);
      await Storage.writeText(['slides-manifest.js'],
        'window.COURS_DIAPOS = ' + JSON.stringify(cat, null, 1) + ';\n');
    } catch (e) {
      // Catalogue absent, illisible, ou non écrit : ce n'est pas une raison de perdre
      // l'intervention qui vient d'être créée. Le premier enregistrement en page le
      // reconstruira depuis les fichiers.
      console.warn('catalogue non mis à jour :', e);
    }
  }

  // ── Renommer une intervention (10 septembre) ────────────────────────────────────
  // Antonin : « comment changer un titre d'intervention ? »
  //
  // Nulle part. Il fallait ouvrir trois fichiers et corriger le même nom à QUATRE
  // endroits : la carte du menu (index.html), le <title> et la ligne .brand de la page de
  // l'intervention, et le catalogue (slides-manifest.js), d'où viennent la pioche et la
  // vue « Toutes les diapos ». En oublier un, c'est se retrouver avec deux noms pour une
  // même intervention et ne plus savoir lequel fait foi.
  //
  // Les quatre réécritures sont des fonctions PURES (texte en entrée, texte en sortie) :
  // c'est ce qui les rend éprouvables sans navigateur, et ce qui évite qu'un remplacement
  // trop large ne morde sur la carte voisine.

  function echapperRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // 1. La carte du menu : le <h2> et la <p class="desc"> de CETTE carte, pas d'une autre.
  function renommerDansMenu(html, id, label, description) {
    const bloc = new RegExp('(<a class="card linked" href="' + echapperRegex(id)
      + '/index\\.html">)([\\s\\S]*?)(</a>)');
    const m = html.match(bloc);
    if (!m) return null;
    let dedans = m[2];
    if (!/<h2>[\s\S]*?<\/h2>/.test(dedans)) return null;
    dedans = dedans.replace(/<h2>[\s\S]*?<\/h2>/, '<h2>' + escapeHtml(label) + '</h2>');
    const desc = String(description || '').trim();
    if (/<p class="desc">[\s\S]*?<\/p>/.test(dedans)) {
      dedans = desc
        ? dedans.replace(/<p class="desc">[\s\S]*?<\/p>/, '<p class="desc">' + escapeHtml(desc) + '</p>')
        : dedans.replace(/[ \t]*<p class="desc">[\s\S]*?<\/p>\n?/, '');
    } else if (desc) {
      dedans = dedans.replace(/(<\/h2>)/, '$1\n        <p class="desc">' + escapeHtml(desc) + '</p>');
    }
    return html.replace(bloc, m[1] + dedans + m[3]);
  }

  // 2. La page de l'intervention : son <title> et la marque du bandeau. L'emoji de la
  // marque est CONSERVÉ — c'est un choix de l'auteur, pas une partie du nom.
  function renommerDansPage(html, label) {
    let sortie = html.replace(/<title>[\s\S]*?<\/title>/, '<title>' + escapeHtml(label) + '</title>');
    sortie = sortie.replace(/(<span class="brand">)([\s\S]*?)(<\/span>)/, (tout, avant, dedans, apres) => {
      const emoji = (dedans.match(/^\s*([^\p{L}\p{N}]*)/u) || [, ''])[1];
      return avant + emoji + escapeHtml(label) + apres;
    });
    return sortie;
  }

  // 3. Le catalogue : le nom de la formation, et le titre des diapos qui portaient encore
  // l'ancien nom (la couverture créée avec l'intervention, typiquement).
  function renommerDansCatalogue(texte, id, label, ancien) {
    const debut = texte.indexOf('{');
    const fin = texte.lastIndexOf('}');
    if (debut === -1 || fin === -1) return null;
    let cat;
    try { cat = JSON.parse(texte.slice(debut, fin + 1)); } catch (e) { return null; }
    if (!cat || !cat.formations) return null;
    cat.formations[id] = label;
    (cat.diapos || []).forEach(d => {
      if (d.formation === id && ancien && d.titre === ancien) d.titre = label;
    });
    return 'window.COURS_DIAPOS = ' + JSON.stringify(cat, null, 1) + ';\n';
  }

  function litLaCarte(html, id) {
    const bloc = new RegExp('<a class="card linked" href="' + echapperRegex(id)
      + '/index\\.html">([\\s\\S]*?)</a>');
    const m = html.match(bloc);
    if (!m) return null;
    const titre = (m[1].match(/<h2>([\s\S]*?)<\/h2>/) || [, ''])[1];
    const desc = (m[1].match(/<p class="desc">([\s\S]*?)<\/p>/) || [, ''])[1];
    const detexte = t => String(t).replace(/&amp;/g, '&').replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').trim();
    return { titre: detexte(titre), description: detexte(desc) };
  }

  async function renommerIntervention(id) {
    const pret = await demanderLeDossier('panneau-connecter-pour-renommer', 'Renommer l’intervention',
      'Pour renommer une intervention, il faut d’abord ouvrir le dossier Cours : le nom '
      + 'est écrit dans la page d’accueil, dans la page de l’intervention et dans le catalogue.');
    if (!pret) return false;

    let menu;
    try { menu = await Storage.readText(['index.html']); } catch (e) { menu = null; }
    const actuel = menu ? litLaCarte(menu, id) : null;
    if (!actuel) { toast('Carte introuvable dans la page d’accueil : rien renommé.', true); return false; }

    const corps = document.createElement('div');
    corps.appendChild(paragraphe('Le nom sera repris dans la page d’accueil, dans le bandeau '
      + 'de l’intervention, dans l’onglet du navigateur et dans le catalogue des diapos.',
    'panneau-sous-titre'));
    const labDesc = document.createElement('label');
    labDesc.className = 'panneau-champ';
    labDesc.appendChild(document.createTextNode('Sous-titre de la carte (facultatif)'));
    const champDesc = document.createElement('input');
    champDesc.type = 'text';
    champDesc.id = 'panneau-renommer-desc';
    champDesc.value = actuel.description || '';
    labDesc.appendChild(champDesc);
    corps.appendChild(labDesc);

    const reponse = await ouvrirPanneau({
      id: 'panneau-renommer', titre: 'Renommer l’intervention', corps,
      champ: { label: 'Nouveau nom', valeur: actuel.titre },
      boutonOk: 'Renommer',
    });
    if (!reponse) return false;
    const label = String(reponse.valeur || '').trim();
    if (!label) { toast('Un nom vide : rien renommé.', true); return false; }
    const description = String(champDesc.value || '').trim();

    const fait = [];
    try {
      const nouveauMenu = renommerDansMenu(menu, id, label, description);
      if (!nouveauMenu) { toast('Carte introuvable : rien renommé.', true); return false; }
      await Storage.writeText(['index.html'], nouveauMenu);
      fait.push('la page d’accueil');
    } catch (e) {
      console.error(e);
      toast('Échec de l’écriture de la page d’accueil : ' + e.message, true);
      return false;
    }

    // La page de l'intervention et le catalogue peuvent manquer : ce n'est pas une raison
    // d'annuler un renommage déjà écrit. On dit ce qui a été fait, et ce qui ne l'a pas été.
    try {
      const page = await Storage.readText([id, 'index.html']);
      await Storage.writeText([id, 'index.html'], renommerDansPage(page, label));
      fait.push('la page de l’intervention');
    } catch (e) { console.warn('page non renommée :', e); }

    try {
      const cat = await Storage.readText(['slides-manifest.js']);
      const neuf = renommerDansCatalogue(cat, id, label, actuel.titre);
      if (neuf) { await Storage.writeText(['slides-manifest.js'], neuf); fait.push('le catalogue'); }
    } catch (e) { console.warn('catalogue non renommé :', e); }

    // Et la carte sous les yeux : sans ça, il faudrait recharger pour voir son propre geste.
    const carte = document.querySelector('#menu .card[href="' + id + '/index.html"]');
    if (carte) {
      const h2 = carte.querySelector('h2');
      if (h2) h2.textContent = label;
      let p = carte.querySelector('.desc');
      if (description && !p) {
        p = document.createElement('p');
        p.className = 'desc';
        carte.insertBefore(p, carte.querySelector('.status'));
      }
      if (p) { if (description) p.textContent = description; else p.remove(); }
    }
    toast('Renommée « ' + label + ' », ' + fait.join(', ') + ' à jour.');
    return true;
  }

  // ── La carte du menu de l'index ─────────────────────────────────────────────────
  // Le menu liste les interventions en dur, une <a class="card"> par intervention. Une
  // intervention créée sans carte existe sur le disque et dans le registre, mais rien ne
  // permet de l'ouvrir depuis la page d'accueil. La carte s'écrit donc dans index.html,
  // juste avant le repère, ET se pose dans la page ouverte — sans quoi il faudrait
  // recharger pour voir ce qu'on vient de créer.
  const REPERE_CARTES = '<!-- Repère : l’atelier insère ici la carte des interventions créées. -->';

  function carteHtml(id, label, description) {
    return '      <a class="card linked" href="' + id + '/index.html">\n'
      + '        <h2>' + escapeHtml(label) + '</h2>\n'
      + (description ? '        <p class="desc">' + escapeHtml(description) + '</p>\n' : '')
      + '        <span class="status">Disponible</span>\n'
      + '      </a>\n\n';
  }

  async function ajouterCarteAuMenu(id, label, description) {
    let html;
    try {
      html = await Storage.readText(['index.html']);
    } catch (e) {
      return false;
    }
    if (html.indexOf('href="' + id + '/index.html"') !== -1) return true;
    if (html.indexOf(REPERE_CARTES) === -1) return false;
    await Storage.writeText(['index.html'],
      html.replace(REPERE_CARTES, carteHtml(id, label, description) + REPERE_CARTES));
    return true;
  }

  // ── Les deux categories du menu (13 septembre) ──────────────────────────────────
  // Antonin : « je veux deux catégories de formations : les centrales, et les spécifiques,
  // dans index, et je veux un moyen de passer les formations de l'un à l'autre ».
  // Chaque categorie est une <section data-categorie> avec sa grille et son repere. Une
  // intervention creee arrive dans « specifiques » (le repere historique y est reste) ;
  // ⇄ sur une carte la fait passer dans l'autre. Fonctions pures, comme le renommage.
  const REPERE_CENTRALES = '<!-- Repère : les cartes des formations centrales. -->';
  const NOMS_CATEGORIES = { centrales: 'formations centrales', specifiques: 'formations spécifiques' };

  function blocDeCarte(html, id) {
    const re = new RegExp('[ \\t]*<a class="card linked" href="' + echapperRegex(id)
      + '/index\\.html">[\\s\\S]*?</a>[ \\t]*\\n(?:[ \\t]*\\n)?');
    return html.match(re);
  }

  function categorieDeCarte(html, id) {
    const m = blocDeCarte(html, id);
    const debutSpec = html.indexOf('data-categorie="specifiques"');
    if (!m || debutSpec === -1 || html.indexOf(REPERE_CENTRALES) === -1) return null;
    return m.index > debutSpec ? 'specifiques' : 'centrales';
  }

  // Renvoie { html, vers } ou null si la carte ou un repere manque : rien n'est ecrit au hasard.
  function deplacerDansMenu(html, id) {
    const depuis = categorieDeCarte(html, id);
    if (!depuis || html.indexOf(REPERE_CARTES) === -1) return null;
    const m = blocDeCarte(html, id);
    const carte = '      ' + m[0].trim() + '\n\n';
    const sans = html.slice(0, m.index) + html.slice(m.index + m[0].length);
    const vers = depuis === 'centrales' ? 'specifiques' : 'centrales';
    const repere = vers === 'centrales' ? REPERE_CENTRALES : REPERE_CARTES;
    return { html: sans.replace(repere, carte + repere), vers };
  }

  async function deplacerIntervention(id) {
    const pret = await demanderLeDossier('panneau-connecter-pour-deplacer', 'Changer de catégorie',
      'Pour changer une intervention de catégorie, il faut d’abord ouvrir le dossier Cours : '
      + 'les catégories sont écrites dans la page d’accueil.');
    if (!pret) return false;
    let menu;
    try { menu = await Storage.readText(['index.html']); } catch (e) { menu = null; }
    const r = menu ? deplacerDansMenu(menu, id) : null;
    if (!r) { toast('Carte ou catégorie introuvable dans la page d’accueil : rien déplacé.', true); return false; }
    try {
      await Storage.writeText(['index.html'], r.html);
      if (await Storage.readText(['index.html']) !== r.html) throw new Error('la page d’accueil n’a pas été relue telle qu’écrite');
    } catch (e) {
      console.error(e);
      toast('Échec de l’écriture de la page d’accueil : ' + e.message, true);
      return false;
    }
    const carte = document.querySelector('#menu .card[href="' + id + '/index.html"]');
    const grille = document.querySelector('#menu [data-categorie="' + r.vers + '"] .grid');
    if (carte && grille) grille.appendChild(carte);
    const lue = litLaCarte(r.html, id);
    toast('« ' + (lue ? lue.titre : id) + ' » passe dans les ' + NOMS_CATEGORIES[r.vers] + '.');
    return true;
  }

  function poserCarteDansLaPage(id, label, description) {
    const grille = document.querySelector('#menu [data-categorie="specifiques"] .grid')
      || document.querySelector('#menu .grid');
    if (!grille || grille.querySelector('a[href="' + id + '/index.html"]')) return;
    const boite = document.createElement('div');
    boite.innerHTML = carteHtml(id, label, description).trim();
    grille.appendChild(boite.firstElementChild);
  }

  // shared-slide-templates.js ne dépend que de `document` : il tourne donc ici comme dans
  // une formation. Si jamais il n'était pas chargé, l'intervention est créée quand même,
  // simplement sans couverture — c'est un agrément, pas une condition.
  function construireCouverture(label, emoji) {
    if (!window.SlideTemplates) return null;
    const modele = window.SlideTemplates.liste.find(m => m.cle === 'couverture');
    if (!modele) return null;
    const donnees = { modele: 'couverture' };
    modele.champs.forEach(c => { donnees[c.cle] = c.defaut || ''; });
    donnees.titre = label;
    donnees.emoji = emoji;
    const el = window.SlideTemplates.construire('s0', donnees);
    el.classList.remove('custom-slide', 'active');
    const ouvrante = el.outerHTML.match(/^<section\s*([^>]*)>/);
    return {
      attrsRaw: ouvrante ? ouvrante[1].trim() : 'id="s0" class="slide cover"',
      contentHtml: el.innerHTML,
    };
  }

  return { init, nouvelleIntervention, relireArticles, relireJeux, renommerIntervention, deplacerIntervention,
    _deplacerDansMenu: deplacerDansMenu, _categorieDeCarte: categorieDeCarte,
    // Exposées pour le banc : ce sont elles qui font le travail, et elles n'ont besoin ni
    // de dossier connecté ni de navigateur pour être éprouvées.
    _renommerDansMenu: renommerDansMenu, _renommerDansPage: renommerDansPage,
    _renommerDansCatalogue: renommerDansCatalogue, _litLaCarte: litLaCarte };
})();
