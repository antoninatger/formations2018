/* Les sources : le pont entre les formations et la bibliothèque d'articles.
   =========================================================================

   Antonin garde ses articles ailleurs que dans `Cours` :
   `…/Thesis/Articles/Articles CTs/`, rangés par thème, avec une page d'archive
   (`Conspiracy Theory Archive.html`) qui porte, pour chaque fichier reconnu, son titre,
   ses auteurs, son année, son DOI et sa citation APA.

   Un diaporama ouvert en file:// ne peut ni lister ce dossier ni lire cette page : même
   solution que pour les jeux et les médias — l'atelier balaie une fois et écrit
   `articles-manifest.js` à la racine de Cours, que les diaporamas lisent ensuite sans rien
   demander à personne.

   DEUX SOURCES, PAS UNE. Le balayage part des FICHIERS présents sur le disque, et va
   chercher dans l'archive ce qu'elle sait d'eux. C'est ce qui répond à la demande : un PDF
   déposé dans le dossier apparaît dans la recherche même si l'archive ne le connaît pas
   encore — il porte alors le nom de son fichier, et son lien marche. L'inverse (partir de
   l'archive) ferait disparaître les nouveautés.

   Le lien, lui, est ABSOLU (file:///…) : les articles ne sont pas sous Cours, et aucun
   chemin relatif ne survivrait au déplacement d'une formation. La racine est écrite une
   fois dans le manifeste et ne se retape pas.

   Ce fichier ne contient que du calcul pur — pas un accès disque, pas un accès au DOM.
   C'est ce qui permet à `test-articles-sources.js` de l'éprouver en Node nu, sur la VRAIE
   bibliothèque. Le balayage (File System Access) vit dans admin.js. */
window.CoursAdmin = window.CoursAdmin || {};

CoursAdmin.ArticlesCore = (function () {
  // Ce qu'on range : ce qui se lit. Un .docx ou un .xls de travail n'a rien à faire dans
  // une note de diapo.
  const EXTENSIONS = ['pdf', 'epub', 'html', 'htm'];

  function extensionDe(nom) {
    const m = String(nom || '').toLowerCase().match(/\.([a-z0-9]+)$/);
    return m ? m[1] : '';
  }

  function estArticle(nom) {
    if (!nom || nom.charAt(0) === '.') return false;
    return EXTENSIONS.indexOf(extensionDe(nom)) !== -1;
  }

  // La page d'archive est elle-même dans le dossier : elle n'est pas un article.
  function estPageDArchive(nom) {
    return /archive.*\.html?$/i.test(String(nom || ''));
  }

  // ── Lire l'archive ────────────────────────────────────────────────────────────────
  // `const DATA = [ … ];` sur une seule ligne, dans une page de 300 ko. On ne fait pas
  // confiance à une expression régulière gourmande pour trouver la fin du tableau : on
  // compte les crochets, en sautant ce qui est dans une chaîne. Une accolade dans un titre
  // (« The [mis]information age ») ne doit pas couper la lecture.
  function extraireDATA(html) {
    const texte = String(html || '');
    const marque = texte.indexOf('const DATA');
    if (marque === -1) return [];
    const debut = texte.indexOf('[', marque);
    if (debut === -1) return [];
    let profondeur = 0;
    let dansChaine = false;
    let echappe = false;
    for (let i = debut; i < texte.length; i++) {
      const c = texte.charAt(i);
      if (dansChaine) {
        if (echappe) echappe = false;
        else if (c === '\\') echappe = true;
        else if (c === '"') dansChaine = false;
        continue;
      }
      if (c === '"') { dansChaine = true; continue; }
      if (c === '[') profondeur++;
      else if (c === ']') {
        profondeur--;
        if (profondeur === 0) {
          try {
            const lu = JSON.parse(texte.slice(debut, i + 1));
            return Array.isArray(lu) ? lu : [];
          } catch (e) {
            return [];
          }
        }
      }
    }
    return [];
  }

  // ── Apparier un fichier du disque avec ce que l'archive en sait ───────────────────
  // Par le NOM de fichier, seule chose que les deux côtés partagent. Normalisé : l'archive
  // et le disque écrivent parfois le même nom avec des espaces ou des tirets différents
  // (un « – » devenu « - » au passage d'un système à l'autre).
  function clefDeFichier(nom) {
    return String(nom || '')
      .normalize('NFD')
      .replace(/[^A-Za-z0-9]+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function indexerArchive(donnees) {
    const par = new Map();
    (donnees || []).forEach(d => {
      if (!d || !d.fn) return;
      par.set(clefDeFichier(d.fn), d);
    });
    return par;
  }

  // Un fichier trouvé sur le disque + ce que l'archive en dit (ou rien). Les champs vides
  // restent vides : mieux vaut un titre égal au nom du fichier qu'un titre inventé.
  function entreeDArticle(fichier, chemin, meta) {
    const m = meta || {};
    const titre = (m.titre || '').trim() || fichier.replace(/\.[a-z0-9]+$/i, '');
    return {
      fichier,
      chemin: chemin || '',
      titre,
      auteur: (m.auteur || '').trim(),
      annee: String(m.annee || '').trim(),
      doi: (m.doi || '').trim(),
      apa: (m.apaLong || '').trim(),
      cat: (m.cat || premierSegment(chemin)).trim(),
      sub: (m.sub || dernierSegment(chemin)).trim(),
      tags: Array.isArray(m.tags) ? m.tags.slice() : [],
      ext: extensionDe(fichier),
      // « connu » dit si l'archive a IDENTIFIÉ ce fichier — titre, auteurs, année, DOI —,
      // et pas seulement s'il y figure : elle range aussi des fichiers dont elle n'a rien
      // tiré (statut « original »), dont le titre est le nom du fichier. Un article déposé
      // hier n'est connu ni de l'une ni de l'autre façon : il se cherche quand même, par son
      // nom, et son lien marche.
      connu: m.statut ? m.statut === 'identifie' : !!m.titre,
    };
  }

  function premierSegment(chemin) {
    const p = String(chemin || '').split('/').filter(Boolean);
    return p.length ? p[0] : '';
  }

  function dernierSegment(chemin) {
    const p = String(chemin || '').split('/').filter(Boolean);
    return p.length > 1 ? p[p.length - 1] : '';
  }

  // ── Le lien ───────────────────────────────────────────────────────────────────────
  // Chaque segment est encodé séparément : encodeURI laisserait passer un « # », qui
  // couperait l'adresse au milieu du nom de fichier, et un « ? » qui la transformerait en
  // requête. Les barres, elles, doivent rester des barres.
  function encoderChemin(chemin) {
    return String(chemin || '').split('/').filter(Boolean).map(encodeURIComponent).join('/');
  }

  function lienDArticle(racine, article) {
    if (!racine || !article) return '';
    const base = String(racine).replace(/\/+$/, '');
    const dedans = encoderChemin((article.chemin ? article.chemin + '/' : '') + article.fichier);
    return base + '/' + dedans;
  }

  // ── Chercher ──────────────────────────────────────────────────────────────────────
  // Tous les mots doivent se retrouver, dans n'importe quel ordre et n'importe quel champ :
  // « climat deni » et « deni climat » donnent la même liste. Les accents ne comptent pas —
  // on tape vite, en salle.
  function sansAccent(s) {
    return String(s || '').normalize('NFD').replace(/[^A-Za-z0-9 ]/g, ' ').toLowerCase();
  }

  function motsDe(requete) {
    return sansAccent(requete).split(/\s+/).filter(Boolean);
  }

  function champsDe(a) {
    return {
      titre: sansAccent(a.titre),
      auteur: sansAccent(a.auteur + ' ' + a.annee),
      reste: sansAccent([a.cat, a.sub, (a.tags || []).join(' '), a.fichier, a.doi].join(' ')),
    };
  }

  // Le score dit où le mot a été trouvé : un mot dans le titre pèse plus qu'un mot dans le
  // nom du dossier. Sans lui, une recherche sur « climat » remonterait d'abord les
  // soixante articles du dossier « Climate and Environment ».
  function chercher(articles, requete, limite) {
    const mots = motsDe(requete);
    const liste = articles || [];
    const trouves = [];
    liste.forEach(a => {
      const c = champsDe(a);
      let score = 0;
      for (let i = 0; i < mots.length; i++) {
        const m = mots[i];
        if (c.titre.indexOf(m) !== -1) score += 3;
        else if (c.auteur.indexOf(m) !== -1) score += 2;
        else if (c.reste.indexOf(m) !== -1) score += 1;
        else return;   // un mot absent partout : cet article n'est pas demandé
      }
      trouves.push({ article: a, score });
    });
    trouves.sort((x, y) => (y.score - x.score)
      || (Number(y.article.annee || 0) - Number(x.article.annee || 0))
      || x.article.titre.localeCompare(y.article.titre));
    const sortie = trouves.map(t => t.article);
    return limite ? sortie.slice(0, limite) : sortie;
  }

  // ── La ligne écrite dans les notes du présentateur ────────────────────────────────
  // Une ligne, lisible telle quelle, avec l'adresse du fichier au bout : c'est ce qu'on
  // relit à voix haute, et ce sur quoi on clique.
  // Le libellé d'une source POSÉE SUR UNE DIAPO : le titre, et qui l'a écrite quand.
  // Pas l'adresse — sur la diapo elle vit dans le lien, pas dans le texte que lit la salle.
  function libelleDeSource(article) {
    if (!article) return '';
    const qui = [article.auteur, article.annee].filter(Boolean).join(', ');
    return qui ? [article.titre, qui].join(' · ') : String(article.titre || '');
  }

  function ligneDeNote(article, racine) {
    const bouts = [libelleDeSource(article)];
    const lien = lienDArticle(racine, article);
    if (lien) bouts.push(lien);
    // Le point médian, jamais le cadratin : une note se relit à l'écran du présentateur,
    // et le dépôt bannit le cadratin de tout ce qui s'affiche.
    return bouts.join(' · ');
  }

  function trierArticles(articles) {
    return (articles || []).slice().sort((a, b) =>
      (a.cat || '').localeCompare(b.cat || '')
      || (a.sub || '').localeCompare(b.sub || '')
      || (a.titre || '').localeCompare(b.titre || ''));
  }

  // ── La bibliographie (8 septembre) ────────────────────────────────────────────────
  // Antonin : « un widget pour generer une bibliographie avec toutes les sources presentes
  // dans la formation en format APA 7 ».
  //
  // Rien a redacter : le manifeste porte DEJA le champ `apa` de chaque article, produit une
  // fois a l'indexation. Reformater une reference a la main dans le moteur aurait donne une
  // deuxieme verite sur la meme etude, et elles auraient divergé. Le travail est donc un
  // travail de JOINTURE : retrouver, pour chaque lien pose dans les diapos, l'article du
  // manifeste qui lui correspond.
  //
  // La jointure se fait sur la QUEUE du chemin (dossier + nom de fichier), jamais sur le
  // lien entier : la racine de la bibliotheque est absolue et propre a un poste
  // (« file:///C:/Users/ASUS/OneDrive/… »). Le jour ou l'archive demenage, les liens deja
  // poses dans les diapos continuent de se reconnaitre.
  function cleDeLien(lien) {
    let s = String(lien || '');
    try { s = decodeURIComponent(s); } catch (e) { /* pourcentage mal forme : tel quel */ }
    return s.replace(/\\/g, '/').toLowerCase();
  }

  function articleDuLien(lien, articles) {
    const cle = cleDeLien(lien);
    if (!cle) return null;
    let trouve = null;
    (articles || []).forEach(a => {
      if (trouve) return;
      const queue = cleDeLien((a.chemin ? a.chemin + '/' : '') + a.fichier);
      if (queue && cle.length >= queue.length && cle.slice(-queue.length) === queue) trouve = a;
    });
    return trouve;
  }

  // Trois listes, et c'est voulu : une bibliographie qui laisserait tomber en silence ce
  // qu'elle n'a pas su traiter serait pire que pas de bibliographie du tout — on la
  // recopierait dans un memoire sans savoir qu'il manque trois references.
  //   references   : les APA du manifeste, triees (elles commencent par le nom de famille,
  //                  donc l'ordre alphabetique d'APA 7 est celui des chaines) ;
  //   sansApa      : l'article est connu mais son champ apa est vide ;
  //   introuvables : le lien ne correspond a aucun article du manifeste.
  function bibliographieAPA(liens, articles) {
    const vus = {};
    const references = [];
    const sansApa = [];
    const introuvables = [];
    (liens || []).forEach(lien => {
      const art = articleDuLien(lien, articles);
      if (!art) {
        const cle = cleDeLien(lien);
        if (cle && !vus['?' + cle]) { vus['?' + cle] = true; introuvables.push(String(lien)); }
        return;
      }
      const cle = cleDeLien((art.chemin ? art.chemin + '/' : '') + art.fichier);
      if (vus[cle]) return;
      vus[cle] = true;
      if (art.apa) references.push(String(art.apa).trim());
      else sansApa.push(libelleDeSource(art));
    });
    const alpha = (a, b) => a.localeCompare(b, 'fr');
    return { references: references.sort(alpha), sansApa: sansApa.sort(alpha), introuvables };
  }

  function construireManifeste(racine, articles, quand) {
    const obj = {
      racine: String(racine || '').replace(/\/+$/, '') + '/',
      genere: quand || new Date().toISOString().slice(0, 10),
      articles: trierArticles(articles),
    };
    return 'window.COURS_ARTICLES = ' + JSON.stringify(obj, null, 1) + ';\n';
  }

  return {
    EXTENSIONS,
    extensionDe, estArticle, estPageDArchive,
    extraireDATA, clefDeFichier, indexerArchive, entreeDArticle,
    encoderChemin, lienDArticle,
    sansAccent, motsDe, chercher, ligneDeNote, libelleDeSource,
    cleDeLien, articleDuLien, bibliographieAPA,
    trierArticles, construireManifeste,
  };
})();
