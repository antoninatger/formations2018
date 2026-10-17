/* Bibliothèque de modèles de diapo — étape B (proposition 3a).
 *
 * Version « fragments HTML » : chaque modèle fabrique directement la <section>,
 * sans changement d'architecture. L'étape F transformera ces modèles en gabarits
 * de données ; d'ici là, ce fichier sert à créer de vraies diapos et à vérifier
 * à l'usage lesquels des douze modèles comptent réellement.
 *
 * Les modèles ne reprennent que des classes présentes dans shared-deck.css :
 * un modèle qui dépendrait du <style> d'une formation ne marcherait pas dans une
 * intervention neuve. Cinq familles ont été promues dans le socle pour ça
 * (.cover, .quote-block, .quiz-slide et leurs enfants), après vérification au
 * banc d'essai : 276 diapos, 5691 éléments, 0 différence sur les deux thèmes.
 *
 * Les médias sont référencés par leur CHEMIN (../medias/images/…, ../medias/video/…),
 * comme les 275 diapos existantes. Depuis ⚠️ 4 (2026-08-20), importer un fichier le COPIE
 * dans medias/images ou medias/video — à la racine du dépôt depuis le 31 août — et renseigne
 * ce chemin ; le base64 n'est plus qu'un repli, chiffré et demandé explicitement. Depuis
 * l'étape O, le champ média propose D'ABORD la médiathèque : les 239 médias sont déjà là.
 *
 * API : window.SlideTemplates = { liste, construire(id, donnees) }
 */
(function () {
  'use strict';

  // ── Bilingue : chaque texte engendré produit la paire t-fr/t-en. Tant que la
  // proposition 5 n'est pas faite, l'anglais est rempli avec le français — visible
  // et manifestement à traduire — plutôt que laissé vide, donc invisible et oublié.
  function bilingue(texte, anglais) {
    const frag = document.createDocumentFragment();
    const fr = document.createElement('span');
    fr.className = 't-fr';
    fr.textContent = texte;
    const en = document.createElement('span');
    en.className = 't-en';
    en.hidden = true;
    en.setAttribute('hidden', '');   // l'attribut, pas seulement la propriété : sinon il ne survit pas à outerHTML
    en.textContent = anglais || texte;
    frag.append(fr, en);
    return frag;
  }

  function bloc(tag, classe, texte) {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texte !== undefined && texte !== null && texte !== '') e.appendChild(bilingue(texte));
    return e;
  }

  function lignes(valeur) {
    return String(valeur || '').split('\n').map(s => s.trim()).filter(Boolean);
  }

  function image(src, alt, classe) {
    const carte = document.createElement('div');
    carte.className = classe || 'imgcard';
    const img = document.createElement('img');
    img.setAttribute('src', src || '');
    img.setAttribute('alt', alt || '');
    carte.appendChild(img);
    return carte;
  }

  function boutonBilingue(libelle, onclick) {
    const b = document.createElement('button');
    b.className = 'bigbtn';
    b.setAttribute('onclick', onclick);
    b.appendChild(bilingue(libelle));
    return b;
  }

  // Liste à puces numérotées façon « objectifs » : <li><b>1.</b> texte</li>
  function listeObjectifs(items, numerotee) {
    const ul = document.createElement('ul');
    ul.className = 'objectifs';
    items.forEach((texte, i) => {
      const li = document.createElement('li');
      const fr = document.createElement('span');
      fr.className = 't-fr';
      const en = document.createElement('span');
      en.className = 't-en';
      en.setAttribute('hidden', '');
      [fr, en].forEach(span => {
        if (numerotee) {
          const b = document.createElement('b');
          b.textContent = (i + 1) + '.';
          span.append(b, document.createTextNode(' ' + texte));
        } else {
          span.textContent = texte;
        }
      });
      li.append(fr, en);
      ul.appendChild(li);
    });
    return ul;
  }

  // ── Les douze modèles. Le champ « appui » dit sur quoi chacun s'appuie dans les
  // 275 diapos existantes : la liste ne sort pas de nulle part, elle décrit ce qui
  // est déjà utilisé.
  const MODELES = [
    {
      cle: 'couverture', nom: 'Couverture', emoji: '🎬',
      appui: '1 par formation',
      champs: [
        { cle: 'emoji', label: 'Emoji', type: 'texte', defaut: '🕵️' },
        { cle: 'titre', label: 'Titre de l’intervention', type: 'texte', defaut: 'Titre de l’intervention' },
        { cle: 'objectifs', label: 'Objectifs (un par ligne)', type: 'multiligne', defaut: 'Premier objectif.\nDeuxième objectif.' },
        // Vide par defaut, et c'est une decision : la couverture posait un bouton
        // « Commencer → » sur CHAQUE intervention neuve, que personne n'avait demande.
        // Antonin, 7 septembre : « enleve le bouton commencer, que tu mets au debut de
        // chaque intervention automatiquement ». La fleche droite commence le diaporama,
        // le bouton faisait double emploi. Le champ reste : qui en veut un l'ecrit.
        { cle: 'bouton', label: 'Libellé du bouton (vide = pas de bouton)', type: 'texte', defaut: '' },
      ],
      construire(s, d) {
        s.className = 'slide short cover';
        const logo = document.createElement('div');
        logo.className = 'logo';
        logo.textContent = d.emoji || '';
        s.append(logo, bloc('h1', null, d.titre), listeObjectifs(lignes(d.objectifs), true));
        const libelle = (d.bouton || '').trim();
        if (libelle) s.appendChild(boutonBilingue(libelle, 'Deck.next()'));
      },
    },
    {
      cle: 'intertitre', nom: 'Intertitre', emoji: '🔖',
      appui: '11 diapos',
      champs: [
        { cle: 'surtitre', label: 'Surtitre (petit, au-dessus)', type: 'texte', defaut: 'Partie 2' },
        { cle: 'titre', label: 'Titre', type: 'texte', defaut: 'Titre de la partie' },
        { cle: 'accroche', label: 'Accroche', type: 'texte', defaut: '' },
      ],
      construire(s, d) {
        s.className = 'slide short divider-slide';
        s.append(bloc('div', 'em', d.surtitre), bloc('h2', null, d.titre));
        if (d.accroche) s.appendChild(bloc('p', 'lead', d.accroche));
      },
    },
    {
      cle: 'titre-accroche', nom: 'Titre + accroche', emoji: '🅰️',
      appui: 'kicker : 143 usages',
      champs: [
        { cle: 'kicker', label: 'Surtitre', type: 'texte', defaut: '' },
        { cle: 'titre', label: 'Titre', type: 'texte', defaut: 'Titre de la diapo' },
        { cle: 'accroche', label: 'Accroche', type: 'texte', defaut: 'Une phrase qui pose l’idée.' },
      ],
      construire(s, d) {
        s.className = 'slide short';
        if (d.kicker) s.appendChild(bloc('div', 'kicker', d.kicker));
        s.append(bloc('h2', null, d.titre), bloc('p', 'lead', d.accroche));
      },
    },
    {
      cle: 'image-legende', nom: 'Image + légende', emoji: '🖼',
      appui: 'imgcard : 141 usages',
      champs: [
        { cle: 'titre', label: 'Titre', type: 'texte', defaut: 'Titre de la diapo' },
        { cle: 'src', label: 'Image', type: 'media', accept: 'image/*', defaut: '../medias/images/' },
        { cle: 'alt', label: 'Description de l’image (alt)', type: 'texte', defaut: '' },
        { cle: 'legende', label: 'Légende', type: 'texte', defaut: '' },
      ],
      construire(s, d) {
        s.className = 'slide';
        s.append(bloc('h2', null, d.titre), image(d.src, d.alt));
        if (d.legende) s.appendChild(bloc('p', 'lead', d.legende));
      },
    },
    {
      cle: 'image-pleine', nom: 'Image pleine largeur', emoji: '🏞',
      appui: '10 usages',
      champs: [
        { cle: 'src', label: 'Image', type: 'media', accept: 'image/*', defaut: '../medias/images/' },
        { cle: 'alt', label: 'Description de l’image (alt)', type: 'texte', defaut: '' },
      ],
      construire(s, d) {
        s.className = 'slide';
        s.appendChild(image(d.src, d.alt, 'imgcard-full'));
      },
    },
    {
      cle: 'deux-images', nom: 'Deux images', emoji: '🖼🖼',
      appui: '23 usages',
      champs: [
        { cle: 'titre', label: 'Titre', type: 'texte', defaut: 'Titre de la diapo' },
        { cle: 'src1', label: 'Image de gauche', type: 'media', accept: 'image/*', defaut: '../medias/images/' },
        { cle: 'alt1', label: 'Description (alt) gauche', type: 'texte', defaut: '' },
        { cle: 'src2', label: 'Image de droite', type: 'media', accept: 'image/*', defaut: '../medias/images/' },
        { cle: 'alt2', label: 'Description (alt) droite', type: 'texte', defaut: '' },
        { cle: 'legende', label: 'Légende commune', type: 'texte', defaut: '' },
      ],
      construire(s, d) {
        s.className = 'slide';
        const paire = document.createElement('div');
        paire.className = 'two-imgs';
        paire.append(image(d.src1, d.alt1, 'imgcard small'), image(d.src2, d.alt2, 'imgcard small'));
        s.append(bloc('h2', null, d.titre), paire);
        if (d.legende) s.appendChild(bloc('p', 'lead', d.legende));
      },
    },
    {
      cle: 'video', nom: 'Vidéo', emoji: '🎞',
      appui: 'vidwrap : 45 usages',
      champs: [
        { cle: 'kicker', label: 'Surtitre', type: 'texte', defaut: '' },
        { cle: 'src', label: 'Vidéo', type: 'media', accept: 'video/*', defaut: '../medias/video/' },
        { cle: 'accroche', label: 'Accroche', type: 'texte', defaut: 'Cliquez pour lancer la vidéo.' },
      ],
      construire(s, d) {
        s.className = 'slide';
        if (d.kicker) s.appendChild(bloc('div', 'kicker', d.kicker));
        const wrap = document.createElement('div');
        wrap.className = 'vidwrap';
        const v = document.createElement('video');
        v.setAttribute('src', d.src || '');
        v.setAttribute('controls', '');
        // Pas de « loop » (5 octobre) : une vidéo s'arrête après son premier passage.
        v.setAttribute('playsinline', '');
        wrap.appendChild(v);
        s.append(wrap, bloc('p', 'lead', d.accroche));
      },
    },
    {
      cle: 'comparaison', nom: 'Comparaison en deux colonnes', emoji: '⚖️',
      appui: '11 usages',
      champs: [
        { cle: 'titre', label: 'Titre', type: 'texte', defaut: 'Titre de la diapo' },
        { cle: 'titre1', label: 'Titre colonne 1', type: 'texte', defaut: 'D’un côté' },
        { cle: 'points1', label: 'Points colonne 1 (un par ligne)', type: 'multiligne', defaut: 'Premier point.' },
        { cle: 'titre2', label: 'Titre colonne 2', type: 'texte', defaut: 'De l’autre' },
        { cle: 'points2', label: 'Points colonne 2 (un par ligne)', type: 'multiligne', defaut: 'Premier point.' },
      ],
      construire(s, d) {
        s.className = 'slide';
        const cmp = document.createElement('div');
        cmp.className = 'compare';
        [[d.titre1, d.points1], [d.titre2, d.points2]].forEach(([t, pts]) => {
          const col = document.createElement('div');
          col.className = 'col';
          col.appendChild(bloc('h3', null, t));
          const ul = document.createElement('ul');
          lignes(pts).forEach(p => ul.appendChild(bloc('li', null, p)));
          col.appendChild(ul);
          cmp.appendChild(col);
        });
        s.append(bloc('h2', null, d.titre), cmp);
      },
    },
    {
      cle: 'citation', nom: 'Citation', emoji: '❝',
      appui: '15 usages',
      champs: [
        { cle: 'citation', label: 'Citation', type: 'multiligne', defaut: '« La citation. »' },
        { cle: 'source', label: 'Source', type: 'texte', defaut: '' },
      ],
      construire(s, d) {
        s.className = 'slide short';
        const box = document.createElement('div');
        box.className = 'quote-block';
        box.appendChild(bilingue(d.citation));
        if (d.source) {
          const cite = document.createElement('cite');
          cite.appendChild(bilingue(d.source));
          box.appendChild(cite);
        }
        s.appendChild(box);
      },
    },
    {
      cle: 'enigme', nom: 'Énigme (question + réponse au bouton)', emoji: '🧩',
      appui: '18 usages',
      champs: [
        { cle: 'question', label: 'Question', type: 'multiligne', defaut: 'La question posée au public.' },
        { cle: 'bouton', label: 'Libellé du bouton', type: 'texte', defaut: 'Voir la réponse' },
        { cle: 'reponse', label: 'Réponse révélée', type: 'multiligne', defaut: 'La réponse.' },
      ],
      construire(s, d, id) {
        s.className = 'slide';
        const box = document.createElement('div');
        box.className = 'riddle-box';
        box.appendChild(bloc('p', 'q', d.question));
        const idRep = 'rep-' + id;
        const btn = document.createElement('button');
        btn.className = 'reveal-btn';
        btn.setAttribute('onclick', "Deck.revealBox('" + idRep + "')");
        btn.appendChild(bilingue(d.bouton || 'Voir la réponse'));
        const rep = document.createElement('div');
        rep.className = 'reveal-box';
        rep.id = idRep;
        rep.appendChild(bloc('p', 'lead', d.reponse));
        box.append(btn, rep);
        s.appendChild(box);
      },
    },
    {
      cle: 'quiz', nom: 'Quiz vrai/faux', emoji: '❓',
      appui: 'quiz-grid : présent dans 4 formations sur 5',
      champs: [
        { cle: 'titre', label: 'Titre', type: 'texte', defaut: 'Vrai ou faux ?' },
        { cle: 'accroche', label: 'Consigne', type: 'texte', defaut: 'Cliquez sur chaque carte pour révéler la réponse.' },
        {
          cle: 'questions', label: 'Questions', type: 'quiz',
          defaut: JSON.stringify([{
            txt: { fr: 'Le soleil est une étoile.', en: 'The sun is a star.' },
            vrai: true,
            expl: { fr: 'Vrai : c’est même l’étoile la plus proche de nous.', en: 'True: it is the closest star to us.' },
          }]),
        },
      ],
      // Le quiz est entièrement décrit dans le HTML : la grille porte son tableau de
      // questions en JSON, et init() la monte toute seule via createRevealQuiz. Aucune
      // ligne d'app.js. Le bilingue est une donnée ({fr, en}), pas du balisage dupliqué :
      // c'est refreshLabels() qui réécrit les textes à la bascule 🇬🇧.
      construire(s, d, id) {
        let questions;
        try {
          questions = JSON.parse(d.questions);
        } catch (e) {
          throw new Error('Les questions du quiz ne sont pas un JSON valide : ' + e.message);
        }
        if (!Array.isArray(questions) || !questions.length) {
          throw new Error('Il faut au moins une question.');
        }
        s.className = 'slide quiz-slide';
        s.append(bloc('h2', null, d.titre), bloc('p', 'lead', d.accroche));
        const grille = document.createElement('div');
        grille.className = 'quiz-grid';
        grille.id = 'quiz-' + id;
        grille.setAttribute('data-quiz', JSON.stringify(questions));
        const score = document.createElement('div');
        score.className = 'quiz-score';
        score.id = 'quiz-' + id + '-score';
        s.append(grille, score);
      },
    },
    {
      cle: 'sondage', nom: 'Sondage', emoji: '📊',
      appui: 'widget autonome, aucun JS à écrire',
      champs: [
        { cle: 'titre', label: 'Question posée', type: 'texte', defaut: 'La question du sondage ?' },
      ],
      construire(s, d) {
        s.className = 'slide';
        s.appendChild(bloc('h2', null, d.titre));
        if (window.SharedWidgets && window.SharedWidgets.buildPoll) {
          s.appendChild(window.SharedWidgets.buildPoll());
        } else {
          s.appendChild(bloc('p', 'lead', '(shared-widgets.js n’est pas chargé : sondage non inséré)'));
        }
      },
    },
    {
      cle: 'conclusion', nom: 'Conclusion', emoji: '🏁',
      appui: '1 par formation',
      champs: [
        { cle: 'titre', label: 'Titre', type: 'texte', defaut: 'Ce qu’on retient' },
        { cle: 'points', label: 'Points (un par ligne)', type: 'multiligne', defaut: 'Premier point à retenir.' },
        { cle: 'bouton', label: 'Libellé du bouton', type: 'texte', defaut: 'Recommencer' },
      ],
      construire(s, d) {
        s.className = 'slide';
        s.append(bloc('h2', null, d.titre), listeObjectifs(lignes(d.points), true),
          boutonBilingue(d.bouton || 'Recommencer', 'Deck.restart()'));
      },
    },
  ];

  // Le modèle « Quiz à révélation » n'est volontairement PAS ici : createRevealQuiz()
  // doit être appelée depuis l'app.js de la formation, donc un modèle qui produirait
  // seulement le balisage donnerait un quiz inerte. La piste retenue (questions dans
  // un attribut data-quiz monté par init()) a été vérifiée techniquement — le JSON
  // survit à cloneNode + outerHTML + écriture disque + rechargement, apostrophes,
  // accents, emoji et même « </section> » compris — mais elle attend une décision.

  function construire(id, donnees) {
    const modele = MODELES.find(m => m.cle === (donnees && donnees.modele));
    if (!modele) throw new Error('Modèle inconnu : ' + (donnees && donnees.modele));
    const s = document.createElement('section');
    s.id = id;
    // Valeurs par défaut pour tout champ non fourni : un modèle doit toujours
    // produire une diapo montrable, jamais un squelette vide.
    const d = {};
    modele.champs.forEach(c => {
      d[c.cle] = (donnees && donnees[c.cle] !== undefined && donnees[c.cle] !== '')
        ? donnees[c.cle] : c.defaut;
    });
    modele.construire(s, d, id);
    return s;
  }

  window.SlideTemplates = {
    liste: MODELES.map(m => ({ cle: m.cle, nom: m.nom, emoji: m.emoji, appui: m.appui, champs: m.champs })),
    construire,
  };
})();
