/* Etape T1 — le manifeste des jeux.
   =================================

   Un diaporama ouvert en file:// ne peut lire que le dossier qu'on lui a connecte, et
   c'est `Cours`. `Jeux` est son VOISIN, pas son enfant : aucun diaporama ne peut donc le
   balayer tout seul. La solution est deja dans la maison — `media-manifest.js` : l'atelier
   balaie une fois et ecrit un fichier que les diaporamas lisent ensuite sans rien demander
   a personne. `jeux-manifest.js` fait pareil.

   Le manifeste est du CACHE, jamais une source. Ce qui part dans une diapo est le chemin
   relatif complet, lisible dans le fichier et vivant sans manifeste : un jeu retire du
   manifeste ne casse aucune diapo deja posee.

   Ce fichier ne contient que du calcul pur — pas un acces disque, pas un acces au DOM.
   C'est ce qui permet a `test-jeux-manifest.js` de l'eprouver en Node nu, sur le VRAI
   dossier Jeux. Le balayage lui-meme (File System Access) vit dans admin.js, ou il n'a que
   trois lignes a faire. */
window.CoursAdmin = window.CoursAdmin || {};

CoursAdmin.JeuxCore = (function () {
  // Le chemin qu'une diapo ecrit : elle vit dans Cours/<formation>/index.html, donc deux
  // crans au-dessus pour retrouver le voisin Jeux. C'est exactement la forme des 19 liens
  // deja poses a la main, et celle des iframes d'illusions de niveau1 (s8, s9).
  const BASE_DEPUIS_FORMATION = 'https://antoninatger.github.io/jeux/';

  // Un dossier dont le nom commence par « _ » est un atelier interne, pas un jeu :
  // `_gabarit` (que T nomme) et `_prive`. La regle vaut mieux que la liste.
  function estDossierDeJeu(nom) {
    return !!nom && nom.charAt(0) !== '_' && nom.charAt(0) !== '.';
  }

  // Trois dossiers de jeux portent une espace (« Biais cognitifs », « Ilusions d'optique »,
  // « Arcade quizz »). Les liens deja poses a la main et les iframes d'illusions de niveau1
  // l'ecrivent « %20 », et l'apostrophe telle quelle : on suit cette convention plutot que
  // d'en inventer une seconde. encodeURIComponent echapperait aussi l'apostrophe et les
  // barres, et donnerait des chemins differents de ceux qui marchent deja.
  function encoderSegment(nom) {
    return String(nom || '').replace(/ /g, '%20');
  }

  function decoderSegment(nom) {
    const s = String(nom || '');
    // decodeURIComponent d'abord : la barre du navigateur encode aussi l'apostrophe
    // (« Ilusions%20d%27optique »), et les liens deja poses l'ecrivent en clair.
    try { return decodeURIComponent(s); } catch (e) { return s.replace(/%20/gi, ' '); }
  }

  const ENTITES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

  function decoderEntites(s) {
    return String(s).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (tout, corps) => {
      if (corps.charAt(0) === '#') {
        const n = corps.charAt(1).toLowerCase() === 'x'
          ? parseInt(corps.slice(2), 16)
          : parseInt(corps.slice(1), 10);
        return isNaN(n) ? tout : String.fromCodePoint(n);
      }
      const v = ENTITES[corps.toLowerCase()];
      return v === undefined ? tout : v;
    });
  }

  // Le <title> peut tenir sur plusieurs lignes : on ne lit pas ligne a ligne.
  function titreDeHtml(html) {
    const m = String(html || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (!m) return '';
    return decoderEntites(m[1]).replace(/\s+/g, ' ').trim();
  }

  // « Sans emoji » : Antonin les veut absents, du manifeste comme des libelles. Les titres
  // des jeux en portent (« FakeMetre 🔍 », « Radar de la Desinfo 🛰️ »).
  // On retire les pictogrammes, les selecteurs de variante et les liants, puis les
  // separateurs restes orphelins en bout de chaine.
  function sansEmoji(s) {
    return String(s || '')
      // Les trois blocs ou vivent les emojis employes ici (symboles divers, dingbats,
      // pictogrammes supplementaires), plus les selecteurs de variante et le liant. Bornes
      // volontairement etroites : elargir a « tout ce qui n'est pas une lettre » mangerait
      // des caracteres legitimes d'un titre.
      .replace(/[\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F000}-\u{1FAFF}\u{FE0E}\u{FE0F}\u{200D}\u{20E3}]/gu, '')
      .replace(/\s+/g, ' ')
      .replace(/^[\s\-–—:·|]+/, '')
      .replace(/[\s\-–—:·|]+$/, '')
      .trim();
  }

  // Le cadratin est proscrit dans tout texte affiche depuis le 31 aout (P1b, demande
  // d'Antonin), et le titre d'un jeu FINIT dans une diapo : trois des jeux en portent un
  // (« Rhetor — l'arsenal du discours »). On le convertit ici, une fois, plutot que de
  // laisser chaque libelle pose le reintroduire.
  function sansCadratin(s) {
    return String(s || '').replace(/\s*[—–]\s*/g, ' - ');
  }

  // Le titre d'un jeu : celui de son <title>, sinon le nom de son dossier. On n'invente
  // rien — un dossier sans <title> exploitable garde son nom, et `titreSource` le dit,
  // pour que l'atelier puisse le signaler au lieu de le maquiller.
  function entreeDeJeu(dossier, html) {
    const brut = sansCadratin(sansEmoji(titreDeHtml(html)));
    const titre = brut || dossier;
    return {
      dossier,
      titre,
      titreSource: brut ? 'title' : 'dossier',
      chemin: BASE_DEPUIS_FORMATION + encoderSegment(dossier) + '/index.html',
    };
  }

  // ── Etape T2 — coller un lien, et le rendre relatif ──────────────────────────────
  // Le geste reel d'Antonin : il ouvre le jeu, va sur la fiche, copie l'adresse de la barre
  // du navigateur. Ce qu'il colle ressemble donc a
  //   file:///C:/Users/ASUS/Documents/Web%20apps/Jeux/rhetor/index.html#/outils/homme-de-paille
  //
  // Un chemin absolu file:// ecrit dans une diapo est un POISON connu de ce projet : c'est
  // le defaut du mode statique du 30 aout, qui avait grave « file:///C:/Users/ASUS/… » dans
  // niveau1 — un fichier qui ne marche plus que sur un poste. Le widget convertit donc, ou
  // il REFUSE en disant pourquoi. Il n'ecrit jamais un chemin qu'il n'a pas compris.
  function convertirLienColle(texte) {
    const brut = String(texte || '').trim();
    if (!brut) return { ok: false, raison: 'Rien n’a été collé.' };

    // Un jeu en ligne : rien a convertir, et rien a inventer.
    if (/^https?:\/\//i.test(brut)) return { ok: true, chemin: brut, forme: 'http', dossier: null };

    // Deja relatif : on n'y touche pas non plus — mais il doit bien designer un jeu.
    if (brut.indexOf('../') === 0) {
      const seg = brut.split('#')[0].split('/');
      const k = seg.lastIndexOf('Jeux');
      if (k === -1 || !seg[k + 1]) {
        return { ok: false, raison: 'Ce chemin relatif ne passe pas par un dossier « Jeux » : rien n’a été posé.' };
      }
      return { ok: true, chemin: brut, forme: 'relatif', dossier: decoderSegment(seg[k + 1]) };
    }

    // Tout le reste doit contenir un segment /Jeux/. Les antislashs de l'explorateur
    // Windows deviennent des barres ; le prefixe file:// saute.
    const plat = brut.replace(/\\/g, '/').replace(/^file:\/+/i, '/');
    const m = plat.match(/\/Jeux\/(.+)$/i);
    if (!m) {
      return {
        ok: false,
        raison: 'Cette adresse ne passe pas par un dossier « Jeux » : le widget ne sait pas '
          + 'la rendre relative, et il n’écrira pas un chemin absolu dans la diapo. '
          + 'Ouvrez le jeu depuis le dossier Jeux, puis recopiez l’adresse.',
      };
    }

    const coupe = m[1].indexOf('#');
    let chemin = coupe === -1 ? m[1] : m[1].slice(0, coupe);
    const ancre = coupe === -1 ? '' : m[1].slice(coupe);
    chemin = chemin.replace(/\?.*$/, '').replace(/\/+$/, '');
    const parts = decoderSegment(chemin).split('/').filter(p => p && p !== '.');
    if (!parts.length) {
      return { ok: false, raison: 'Cette adresse s’arrête au dossier « Jeux » sans nommer de jeu : rien n’a été posé.' };
    }
    const dossier = parts[0];
    if (!estDossierDeJeu(dossier)) {
      return { ok: false, raison: '« ' + dossier + ' » n’est pas un dossier de jeu : rien n’a été posé.' };
    }
    // Une adresse qui s'arrete au dossier vise sa page d'accueil.
    if (parts.length === 1 || !/\.[a-z0-9]+$/i.test(parts[parts.length - 1])) parts.push('index.html');
    return {
      ok: true,
      forme: 'absolu',
      dossier,
      chemin: BASE_DEPUIS_FORMATION + parts.map(encoderSegment).join('/') + ancre,
    };
  }

  function trierJeux(jeux) {
    return jeux.slice().sort((a, b) => a.titre.localeCompare(b.titre, 'fr', { sensitivity: 'base' }));
  }

  // Le fichier ecrit. Meme forme que media-manifest.js : un seul objet global, pose par
  // une balise <script>, donc lisible en file:// sans fetch.
  function construireManifeste(jeux, quand) {
    const obj = {
      base: BASE_DEPUIS_FORMATION,
      genere: quand || new Date().toISOString().slice(0, 10),
      jeux: trierJeux(jeux),
    };
    return 'window.COURS_JEUX = ' + JSON.stringify(obj, null, 2) + ';\n';
  }

  return {
    BASE_DEPUIS_FORMATION,
    estDossierDeJeu, encoderSegment, decoderSegment,
    titreDeHtml, sansEmoji, sansCadratin, convertirLienColle,
    entreeDeJeu, trierJeux, construireManifeste,
  };
})();
