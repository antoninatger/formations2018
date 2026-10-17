/* Widgets transversaux : sondage à options multiples, échelle à curseur (zones qui
   révèlent un contenu selon la position), camembert statistique. Autonome — comme
   shared-comments-theme.js, s'ajoute à n'importe quelle formation de ce dossier sans
   rien y coder, insérable depuis le mode Édition (voir Deck.addPollWidget() et
   consorts dans shared-deck-engine.js). Chaque widget expose une paire :
     build*()  → construit le DOM d'une instance neuve (options par défaut)
     mount*()  → branche le comportement (vote, glisser, ajout de tranche) sur une
                 instance existante, qu'elle vienne d'être créée ou d'être rechargée
                 depuis le fichier HTML sauvegardé (état déjà présent dans le DOM). */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // Palette catégorielle (huit teintes, ordre fixe, validées pour la vision des
  // couleurs) : [valeur en thème clair, valeur en thème sombre].
  const PALETTE = [
    ['#2a78d6', '#3987e5'], ['#eb6834', '#d95926'], ['#1baf7a', '#199e70'],
    ['#eda100', '#c98500'], ['#e87ba4', '#d55181'], ['#008300', '#008300'],
    ['#4a3aa7', '#9085e9'], ['#e34948', '#e66767']
  ];
  function seriesColor(idx) {
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    return PALETTE[idx % PALETTE.length][light ? 0 : 1];
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
.wpoll,.wscale,.wpie{margin-top:26px;width:min(560px,86vw);background:var(--panel2);
  border:1px solid var(--bord);border-radius:16px;padding:18px 20px;}
.widget-ctl{font-size:.8rem;color:var(--mu);background:var(--panel);
  border:1px dashed var(--bord);border-radius:10px;cursor:pointer;padding:5px 12px;}
.widget-ctl:hover{border-color:var(--acc2);color:var(--tx);}

.wpoll-opt{display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;}
.wpoll-label{flex:0 0 auto;min-width:70px;font-weight:700;font-family:'Baloo 2',cursive;
  outline:none;padding:2px 6px;border-radius:6px;}
.wpoll-label:focus{background:var(--panel);box-shadow:0 0 0 2px var(--acc2);}
.wpoll-vote{font-family:'Baloo 2',cursive;font-weight:700;border-radius:14px;
  border:2px solid var(--bord);background:var(--panel);color:var(--tx);padding:6px 14px;cursor:pointer;}
.wpoll-vote:hover{border-color:var(--acc2);transform:translateY(-2px);}
.wpoll-track{flex:1 1 120px;height:14px;border-radius:8px;background:var(--panel);
  border:1px solid var(--bord);overflow:hidden;min-width:80px;}
.wpoll-fill{height:100%;width:0%;background:var(--acc);transition:width .3s ease;}
.wpoll-count{width:56px;border-radius:8px;border:1px solid var(--bord);background:var(--panel);
  color:var(--tx);text-align:center;padding:4px;}
/* Le pourcentage, contre le bâton : chiffres tabulaires et largeur fixe, sinon la colonne
   des comptes danse d'une ligne à l'autre pendant qu'on vote. Vide tant que personne n'a
   voté, et il ne prend alors aucune place. */
.wpoll-pct{flex:0 0 auto;min-width:3.2em;text-align:right;font-family:'DM Mono',monospace;
  font-variant-numeric:tabular-nums;font-size:.82rem;font-weight:700;color:var(--tx);}
.wpoll-pct:empty{min-width:0;}
.wpoll[data-sans-chiffres="1"] .wpoll-pct{display:none;}
.wpoll-chiffres.actif{border-style:solid;border-color:var(--acc);color:var(--tx);}
.wpoll-del{width:26px;height:26px;border-radius:50%;padding:0;color:var(--ko);}
.wpoll-add{margin-top:4px;}

.wscale-bar{position:relative;height:14px;border-radius:8px;
  background:linear-gradient(90deg,var(--wscale-a,var(--acc2)),var(--wscale-b,var(--acc)));
  border:1px solid var(--bord);margin-bottom:8px;cursor:pointer;}
/* Les deux bornes de l'échelle (10 septembre) : « je veux pouvoir mettre des noms
   spécifiques à gauche et à droite, en particulier 0 et 100 % ». Ce sont des textes, donc
   ils vivent dans la diapo et partent dans le fichier, comme le titre d'une zone. */
.wscale-bornes{display:flex;justify-content:space-between;gap:12px;margin-bottom:16px;
  font-size:.8rem;font-weight:800;color:var(--mu-diapo);}
.wscale-borne{outline:none;min-width:2em;}
.wscale-borne-droite{text-align:right;}
.slide.editing .wscale-borne:empty::before{content:'…';opacity:.5;}
.wscale-teintes{display:inline-flex;gap:4px;align-items:center;}
.wscale-teintes input[type=color]{width:26px;height:22px;padding:0;border:1px solid var(--bord);
  border-radius:6px;background:transparent;cursor:pointer;}
.wscale-tick{position:absolute;top:-4px;bottom:-4px;width:2px;background:var(--panel2);opacity:.7;}
.wscale-cursor{position:absolute;top:50%;left:50%;width:26px;height:26px;border-radius:50%;
  background:var(--panel);border:3px solid var(--acc);transform:translate(-50%,-50%);
  cursor:grab;touch-action:none;z-index:2;}
.wscale-cursor:active{cursor:grabbing;}
.wscale-panels{position:relative;min-height:64px;}
.wscale-zone{display:none;background:var(--panel);border:1px solid var(--bord);
  border-radius:12px;padding:12px 40px 12px 14px;position:relative;}
.wscale-zone.show{display:block;}
.wscale-zone-title{font-family:'Baloo 2',cursive;font-weight:700;margin-bottom:6px;outline:none;}
.wscale-zone-body{color:var(--mu-diapo);outline:none;}
.wscale-zone-del{position:absolute;top:8px;right:8px;width:24px;height:24px;
  border-radius:50%;padding:0;}
.wscale-add{margin-top:8px;}

.wpie-chart{width:160px;height:160px;border-radius:50%;margin:0 auto 16px;
  background:var(--bord);box-shadow:inset 0 0 0 1px var(--bord);}
.wpie-legend{list-style:none;margin:0 0 14px;padding:0;display:flex;flex-direction:column;gap:6px;}
.wpie-item{display:flex;align-items:center;gap:8px;}
.wpie-swatch{width:14px;height:14px;border-radius:4px;flex:0 0 auto;}
.wpie-text{flex:1;color:var(--tx);}
.wpie-del{width:24px;height:24px;border-radius:50%;border:1px solid var(--bord);
  background:var(--panel);cursor:pointer;font-size:.75rem;flex:0 0 auto;padding:0;}
.wpie-form{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
.wpie-input-label{flex:1 1 160px;border-radius:8px;border:1px solid var(--bord);
  background:var(--panel);color:var(--tx);padding:6px 10px;min-width:120px;}
.wpie-input-pct{width:70px;border-radius:8px;border:1px solid var(--bord);
  background:var(--panel);color:var(--tx);padding:6px 8px;text-align:center;}
.wpie-fill-btn,.wpie-add-btn{font-family:'Baloo 2',cursive;font-weight:700;border-radius:12px;
  border:2px solid var(--bord);background:var(--panel);color:var(--tx);padding:6px 14px;cursor:pointer;}
.wpie-add-btn{border-color:var(--acc);}
.wpie-fill-btn:hover,.wpie-add-btn:hover{border-color:var(--acc2);}

.whisto{margin-top:26px;width:min(560px,86vw);background:var(--panel2);
  border:1px solid var(--bord);border-radius:16px;padding:18px 20px;}
/* La hauteur du graphique suit sa largeur (aspect-ratio) : agrandir le widget à la poignée
   agrandit vraiment l'histogramme, au lieu d'étirer une bande de 220 px. */
.whisto-plot{display:flex;align-items:flex-end;gap:12px;aspect-ratio:12/5;min-height:120px;
  max-height:60vh;padding:6px 4px 0;border-bottom:2px solid var(--bord);}
.whisto-col{flex:1 1 0;min-width:0;height:100%;position:relative;display:flex;
  flex-direction:column;justify-content:flex-end;}
/* La transition EST l'animation : passer d'une etape a l'autre ne fait que changer
   la hauteur, le navigateur s'occupe du reste. */
.whisto-bar{width:100%;min-height:2px;border-radius:8px 8px 0 0;background:var(--acc);
  transition:height .7s cubic-bezier(.22,.61,.36,1);}
/* Le titre de l'étape affichée : « 2019 », « après la campagne »… Il change avec elle. */
.whisto-titre{font-family:'Baloo 2',cursive;font-weight:700;font-size:1rem;color:var(--tx);
  text-align:center;margin-bottom:8px;outline:none;border-radius:6px;min-height:1.3em;}
.whisto-titre:focus{background:var(--panel);box-shadow:0 0 0 2px var(--acc2);}
.whisto-titre:empty{display:none;}
.slide.editing .whisto-titre:empty{display:block;}
.slide.editing .whisto-titre:empty::before{content:'Titre de cette étape…';color:var(--mu);opacity:.7;}
.whisto-noms{display:flex;gap:12px;margin-top:8px;}
.whisto-nom{flex:1 1 0;min-width:0;text-align:center;font-family:'Baloo 2',cursive;
  font-weight:700;font-size:.85rem;color:var(--tx);outline:none;border-radius:6px;
  padding:2px 4px;overflow-wrap:anywhere;}
.whisto-nom:focus{background:var(--panel);box-shadow:0 0 0 2px var(--acc2);}
/* Marqueur d'etape : invisible, sans hauteur, il ne sert qu'a compter les paliers
   (les fleches du deroule le revelent, le widget en deduit l'etape a montrer). */
.whisto-step{display:none;}
.whisto-edit{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:14px;}
.whisto-etapes{display:flex;flex-wrap:wrap;gap:6px;align-items:center;}
.whisto-etape{min-width:30px;}
.whisto-etape.actif,.whisto-cent.actif{border-style:solid;border-color:var(--acc);color:var(--tx);}
.whisto-couleur{width:38px;height:30px;padding:0;border:1px solid var(--bord);
  border-radius:8px;background:var(--panel);cursor:pointer;}
/* Poignee de hauteur : en edition seulement, le haut du baton se saisit. */
.slide.editing .whisto-bar{cursor:ns-resize;}
.whisto-val{position:absolute;left:0;right:0;text-align:center;pointer-events:none;
  font-family:'DM Mono',monospace;font-size:.7rem;color:var(--tx);opacity:.75;}

/* ── Réponses à écrire ────────────────────────────────────────────────────────
   Le vert et le rouge sont les DEUX couleurs que la salle lit de loin : elles ne
   peuvent pas dépendre du thème. --ok et --ko conviennent sur fond sombre, mais
   sur le thème clair (fond blanc) ils passent sous le seuil de lisibilité d'un
   texte. Le widget se donne donc ses deux teintes, foncées sur fond clair. */
.wreponse{margin-top:26px;width:min(560px,86vw);background:var(--panel2);
  border:1px solid var(--bord);border-radius:16px;padding:18px 20px;
  --wrep-ok:#3ecf8e;--wrep-ko:#f75f5f;}
:root[data-theme="light"] .wreponse{--wrep-ok:#0d7a4f;--wrep-ko:#c02626;}
.wreponse-barre{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
.wreponse-saisie{flex:1 1 180px;min-width:110px;background:var(--panel);
  border:1px solid var(--bord);border-radius:10px;color:var(--tx);padding:9px 12px;font-size:1rem;}
.wreponse-saisie:focus-visible{outline:2px solid var(--acc2);outline-offset:2px;}
.wreponse-valider{font-family:'Baloo 2',cursive;font-weight:700;border-radius:12px;
  border:2px solid var(--acc);background:var(--panel);color:var(--tx);padding:8px 16px;cursor:pointer;}
.wreponse-valider:hover{border-color:var(--acc2);}
/* Antonin, 12 septembre, apres une seance : « le public a donne trop de mauvaises
   reponses et ca a allonge la taille du widget. et ca masquait ce qu'il y avait en bas
   de diapo, et impossible de reduire la taille ». C'etait exact : chaque envoi ajoutait
   une ligne de ~44 px a une colonne sans plafond, le widget est pose HORS DU FLUX depuis
   l'etape AB (il ne pousse donc plus, il RECOUVRE), et aucune poignee ne regle la hauteur
   d'un widget. La liste a maintenant un plafond et defile dedans : le widget ne grandit
   plus jamais, quoi que la salle tape.
   La regle overscroll-behavior:contain est indispensable : sans lui, un cran de molette de trop
   au bas de la liste remonterait au diaporama, qui CHANGE DE DIAPO depuis le 11 septembre. */
.wreponse-lignes{list-style:none;margin:14px 0 0;padding:0;display:flex;
  flex-direction:column;gap:8px;text-align:left;
  max-height:var(--wrep-liste-max,300px);overflow-y:auto;overscroll-behavior:contain;}
.wreponse-lignes:empty{margin:0;}
.wreponse-ligne{display:flex;align-items:baseline;gap:10px;background:var(--panel);
  border:1px solid var(--bord);border-radius:12px;padding:10px 14px;font-weight:700;}
.wreponse-marque{flex:0 0 auto;font-weight:800;}
.wreponse-dit{flex:1 1 auto;min-width:0;overflow-wrap:anywhere;}
.wreponse-echo{flex:0 0 auto;font-size:.72rem;font-weight:600;color:var(--mu-diapo);}
.wreponse-ligne.juste{border-color:var(--wrep-ok);background:rgba(62,207,142,.10);color:var(--wrep-ok);}
.wreponse-ligne.faux{border-color:var(--wrep-ko);background:rgba(247,95,95,.10);color:var(--wrep-ko);}
.wreponse-ligne.manquante{border-style:dashed;color:var(--mu);font-weight:600;}
.wreponse-manquantes{margin-top:14px;font-family:'Baloo 2',cursive;font-weight:700;
  border-radius:12px;border:2px dashed var(--bord);background:var(--panel);color:var(--mu);
  padding:7px 14px;cursor:pointer;}
.wreponse-manquantes:hover{border-color:var(--acc2);color:var(--tx);}

/* ── Étape AB, 11 septembre ───────────────────────────────────────────────────────────
   Antonin : « Ce que je veux, c'est que JAMAIS un bloc ne bouge à cause d'un autre bloc,
   jamais. »
   Ce panneau ne s'ouvre QUE dans l'éditeur, et il vivait DANS LE FLUX de la diapo : il
   rendait le widget près de sept cents pixels plus haut qu'en séance. Or une position
   n'est qu'un ÉCART par rapport à la place de flux : tout ce qui suit le widget voyait sa
   place descendre d'autant dans l'éditeur, et remonter d'autant en présentation. Un titre
   posé sous le widget sortait alors par le haut de l'écran, et devenait INVISIBLE en
   séance alors qu'il était bien enregistré. C'est le bug qui a déclenché cette étape.
   Il FLOTTE désormais sous le widget : il ne pousse plus rien, et l'éditeur montre enfin
   la même mise en page que la salle. Le widget porte déjà position:relative (il est
   .edit-candidate en édition), et les poignées ✥ / de taille se placent par rapport à lui
   depuis toujours : elles ne bougent pas. Rien ne change en présentation, ce panneau n'y
   existe pas. */
.ed-wreponse-edit{position:absolute;top:100%;left:0;right:0;z-index:7;margin-top:12px;
  border:1px dashed var(--bord);border-radius:12px;background:var(--panel2);
  padding:12px 14px;box-shadow:0 14px 34px rgba(0,0,0,.5);
  display:flex;flex-direction:column;gap:8px;}
.ed-wreponse-rangee{display:flex;gap:6px;align-items:center;}
.ed-wreponse-txt,.ed-wreponse-en,.ed-wreponse-keys{background:var(--panel);border:1px solid var(--bord);
  border-radius:8px;color:var(--tx);padding:6px 10px;font-size:.85rem;min-width:0;}
.ed-wreponse-rangee{flex-wrap:wrap;}
.ed-wreponse-txt{flex:2 1 130px;}
.ed-wreponse-en{flex:2 1 130px;font-style:italic;}
.ed-wreponse-keys{flex:1 1 110px;}
.ed-wreponse-sup{flex:0 0 auto;width:26px;height:26px;border-radius:50%;padding:0;color:var(--ko);}
.ed-wreponse-bascule.actif{border-style:solid;border-color:var(--acc);color:var(--tx);}
.ed-wreponse-aide{font-size:.72rem;color:var(--mu);line-height:1.45;}
.ed-wreponse-entete{display:flex;gap:6px;font-size:.68rem;color:var(--mu);text-transform:uppercase;
  letter-spacing:.04em;font-weight:800;}
.ed-wreponse-entete span:nth-child(1),.ed-wreponse-entete span:nth-child(2){flex:2 1 130px;}
.ed-wreponse-entete span:nth-child(3){flex:1 1 110px;}
`;
    document.head.appendChild(style);
  }

  // ───────────────────────── Sondage (options multiples) ─────────────────────────

  function buildPollOption(label) {
    const row = document.createElement('div');
    row.className = 'wpoll-opt';
    const lbl = document.createElement('span');
    lbl.className = 'wpoll-label';
    lbl.contentEditable = 'true';
    lbl.textContent = label;
    const vote = document.createElement('button');
    vote.type = 'button';
    vote.className = 'wpoll-vote';
    vote.textContent = 'Voter';
    const track = document.createElement('div');
    track.className = 'wpoll-track';
    const fill = document.createElement('div');
    fill.className = 'wpoll-fill';
    track.appendChild(fill);
    const pct = document.createElement('span');
    pct.className = 'wpoll-pct';
    const count = document.createElement('input');
    count.type = 'number';
    count.min = '0';
    count.value = '0';
    count.className = 'wpoll-count';
    row.append(lbl, vote, track, pct, count);
    return row;
  }

  // Antonin, 11 septembre : « option pour afficher les chiffres, pas juste les bâtons.
  // C'est l'option par défaut, mais tu peux l'enlever. »
  //
  // Le nombre de votes était déjà à l'écran — c'est le champ où on le saisit. Ce qui
  // manquait, c'est la PART : le bâton dit « une bonne moitié », et rien ne dit laquelle.
  // Le chiffre se pose donc contre le bâton, et c'est un pourcentage.
  //
  // Rien tant que personne n'a voté : au départ tous les bâtons sont vides, et une colonne
  // de « 0 % » serait du bruit, pas une information.
  //
  // L'attribut n'existe QUE si Antonin a retiré les chiffres : par défaut il n'y a rien
  // dans le fichier, comme pour le « Σ 100 % » de l'histogramme. Un sondage écrit avant
  // aujourd'hui affiche donc ses pourcentages sans qu'on ait à toucher au fichier.
  function pollChiffres(wrap) { return wrap.dataset.sansChiffres !== '1'; }

  // Les sondages déjà écrits dans les fichiers n'ont pas la case du pourcentage : on la
  // pose au montage, sinon le réglage n'aurait d'effet que sur les sondages neufs.
  function assurerPollPct(row) {
    let pct = row.querySelector(':scope > .wpoll-pct');
    if (pct) return pct;
    pct = document.createElement('span');
    pct.className = 'wpoll-pct';
    const count = row.querySelector(':scope > .wpoll-count');
    row.insertBefore(pct, count || null);
    return pct;
  }

  function attachPollOptionDelete(row) {
    if (row.querySelector(':scope > .wpoll-del')) return;
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'wpoll-del widget-ctl';
    del.textContent = '×';
    del.title = 'Retirer cette option';
    del.addEventListener('click', () => {
      const wrap = row.closest('.wpoll');
      row.remove();
      if (wrap) syncPoll(wrap);
    });
    row.appendChild(del);
  }

  // (Ré)attache le bouton "+ Ajouter une option" et le "×" de chaque option déjà
  // présente — appelé à la construction ET à chaque réouverture de l'éditeur, car
  // ces contrôles sont retirés du HTML à la fermeture/sauvegarde (cf. shared-deck-engine.js).
  function attachPollEditControls(wrap) {
    wrap.querySelectorAll(':scope > .wpoll-opt').forEach(attachPollOptionDelete);
    if (wrap.querySelector(':scope > .wpoll-add')) return;

    // L'interrupteur des chiffres. Il dit son état plutôt que son geste : on lit ce que la
    // salle verra, pas ce qui arrivera si on clique.
    const chiffres = document.createElement('button');
    chiffres.type = 'button';
    chiffres.className = 'wpoll-chiffres widget-ctl';
    chiffres.title = 'Afficher, ou non, le pourcentage à côté de chaque bâton';
    const majChiffres = () => {
      const on = pollChiffres(wrap);
      chiffres.classList.toggle('actif', on);
      chiffres.textContent = (on ? '☑' : '☐') + ' Les pourcentages';
    };
    chiffres.addEventListener('click', () => {
      // L'attribut ne reste dans le fichier que s'il dit quelque chose : par défaut, rien.
      if (pollChiffres(wrap)) wrap.dataset.sansChiffres = '1';
      else delete wrap.dataset.sansChiffres;
      majChiffres();
      syncPoll(wrap);
    });
    majChiffres();
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'wpoll-add widget-ctl';
    addBtn.textContent = '+ Ajouter une option';
    addBtn.addEventListener('click', () => {
      const row = buildPollOption('Nouvelle option');
      wrap.insertBefore(row, addBtn);
      attachPollOptionDelete(row);
      mountPoll(wrap);
    });
    wrap.appendChild(addBtn);
    wrap.appendChild(chiffres);
  }

  function buildPoll() {
    const wrap = document.createElement('div');
    wrap.className = 'wpoll';
    wrap.dataset.widget = 'poll';
    wrap.appendChild(buildPollOption('Oui'));
    wrap.appendChild(buildPollOption('Non'));
    attachPollEditControls(wrap);
    return wrap;
  }

  function syncPoll(wrap) {
    const opts = Array.from(wrap.querySelectorAll(':scope > .wpoll-opt'));
    // L'attribut value (et pas seulement la propriété) est mis à jour à chaque
    // changement : c'est lui qui est sérialisé dans le outerHTML à l'enregistrement
    // (buildCleanClone), sinon les votes seraient perdus à la réouverture du fichier.
    opts.forEach(o => {
      const count = o.querySelector('.wpoll-count');
      count.setAttribute('value', String(Number(count.value) || 0));
    });
    const total = opts.reduce((sum, o) => sum + (Number(o.querySelector('.wpoll-count').value) || 0), 0);
    opts.forEach(o => {
      const n = Number(o.querySelector('.wpoll-count').value) || 0;
      o.querySelector('.wpoll-fill').style.width = total ? (n / total * 100) + '%' : '0%';
      // Arrondi à l'entier : devant une salle, « 37,5 % » ne se lit pas mieux que « 38 % »,
      // et la somme des arrondis n'a pas à faire 100 — c'est un sondage, pas une comptabilité.
      const pct = assurerPollPct(o);
      pct.textContent = total ? Math.round(n / total * 100) + ' %' : '';
    });
  }

  // Garde d'idempotence : une propriété JS ordinaire (pas `dataset`, qui écrit un
  // attribut `data-*` réellement sérialisé dans le HTML sauvegardé — une diapo
  // rechargée depuis le fichier semblerait alors déjà "montée" sans qu'aucun
  // listener ne soit réellement attaché).
  function mountPoll(wrap) {
    wrap.querySelectorAll(':scope > .wpoll-opt').forEach(row => {
      const vote = row.querySelector('.wpoll-vote');
      const count = row.querySelector('.wpoll-count');
      if (vote._bound) return;
      vote._bound = true;
      vote.addEventListener('click', () => { count.value = (Number(count.value) || 0) + 1; syncPoll(wrap); });
      count.addEventListener('input', () => syncPoll(wrap));
    });
    syncPoll(wrap);
  }

  // ───────────────────── Échelle à curseur (zones révélées) ─────────────────────

  function buildScaleZone(label) {
    const zone = document.createElement('div');
    zone.className = 'wscale-zone';
    const title = document.createElement('div');
    title.className = 'wscale-zone-title';
    title.contentEditable = 'true';
    title.textContent = label;
    const body = document.createElement('div');
    body.className = 'wscale-zone-body';
    body.contentEditable = 'true';
    body.textContent = 'Contenu affiché quand le curseur est dans cette zone…';
    zone.append(title, body);
    return zone;
  }

  // Les deux bornes, sous la barre : à gauche ce que vaut 0, à droite ce que vaut 100 %.
  // Du texte que l'on tape, pas un réglage — donc contentEditable, comme les titres de zone.
  function buildScaleBornes(gauche, droite) {
    const ligne = document.createElement('div');
    ligne.className = 'wscale-bornes';
    [['wscale-borne-gauche', gauche], ['wscale-borne-droite', droite]].forEach(([cls, texte]) => {
      const b = document.createElement('div');
      b.className = 'wscale-borne ' + cls;
      b.contentEditable = 'true';
      b.textContent = texte;
      ligne.appendChild(b);
    });
    return ligne;
  }

  // Les échelles déjà posées dans les six formations n'ont pas de bornes : on les leur
  // ajoute au montage, plutôt que de repasser dans six fichiers. Elles arrivent vides —
  // une borne inventée mentirait sur une échelle qu'on n'a pas écrite.
  function assurerScaleBornes(wrap) {
    if (wrap.querySelector(':scope > .wscale-bornes')) return;
    const bar = wrap.querySelector(':scope > .wscale-bar');
    if (!bar) return;
    bar.insertAdjacentElement('afterend', buildScaleBornes('', ''));
  }

  function attachScaleZoneDelete(zone) {
    if (zone.querySelector(':scope > .wscale-zone-del')) return;
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'wscale-zone-del widget-ctl';
    del.textContent = '🗑';
    del.title = 'Retirer cette zone';
    del.addEventListener('click', () => {
      const wrap = zone.closest('.wscale');
      zone.remove();
      if (wrap) { renderScaleTicks(wrap); setZoneFromCursor(wrap); }
    });
    zone.appendChild(del);
  }

  // La teinte de chaque extrémité vit dans une variable CSS posée EN LIGNE sur le widget :
  // c'est du style, donc du contenu, donc enregistré — et la barre la lit directement, sans
  // qu'aucune fonction n'ait à repeindre quoi que ce soit. Sans variable, le dégradé garde
  // les couleurs du thème : les échelles déjà écrites ne changent pas d'aspect.
  function teinteScale(wrap, nom, defaut) {
    const v = (wrap.style.getPropertyValue(nom) || '').trim();
    if (/^#[0-9a-f]{6}$/i.test(v)) return v;
    // Les teintes du thème vivent sur :root, et le widget n'est pas encore dans le document
    // quand buildScale() pose ses commandes : on les lit là où elles sont écrites.
    const calc = getComputedStyle(document.documentElement).getPropertyValue(defaut).trim();
    if (/^#[0-9a-f]{6}$/i.test(calc)) return calc;
    return nom === '--wscale-a' ? '#a78bfa' : '#f5478c';
  }

  function attachScaleEditControls(wrap) {
    wrap.querySelectorAll(':scope > .wscale-panels > .wscale-zone').forEach(attachScaleZoneDelete);
    assurerScaleBornes(wrap);
    if (wrap.querySelector(':scope > .wscale-add')) return;
    const teintes = document.createElement('span');
    teintes.className = 'wscale-teintes widget-ctl';
    [['--wscale-a', '--acc2', 'Couleur de l’extrémité gauche'],
     ['--wscale-b', '--acc', 'Couleur de l’extrémité droite']].forEach(([nom, defaut, titre]) => {
      const c = document.createElement('input');
      c.type = 'color';
      c.title = titre;
      c.value = teinteScale(wrap, nom, defaut);
      c.addEventListener('input', () => wrap.style.setProperty(nom, c.value));
      teintes.appendChild(c);
    });
    wrap.appendChild(teintes);
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'wscale-add widget-ctl';
    addBtn.textContent = '+ Ajouter une zone';
    addBtn.addEventListener('click', () => {
      const panels = wrap.querySelector(':scope > .wscale-panels');
      const zone = buildScaleZone('Nouvelle zone');
      panels.appendChild(zone);
      attachScaleZoneDelete(zone);
      renderScaleTicks(wrap);
      setZoneFromCursor(wrap);
    });
    wrap.appendChild(addBtn);
  }

  function renderScaleTicks(wrap) {
    const bar = wrap.querySelector(':scope > .wscale-bar');
    bar.querySelectorAll(':scope > .wscale-tick').forEach(t => t.remove());
    const n = wrap.querySelectorAll(':scope > .wscale-panels > .wscale-zone').length || 1;
    for (let i = 1; i < n; i++) {
      const tick = document.createElement('div');
      tick.className = 'wscale-tick';
      tick.style.left = (i * 100 / n) + '%';
      bar.appendChild(tick);
    }
  }

  function setZoneFromCursor(wrap) {
    const cursor = wrap.querySelector('.wscale-cursor');
    const pct = parseFloat(cursor.style.left) || 0;
    const zones = Array.from(wrap.querySelectorAll(':scope > .wscale-panels > .wscale-zone'));
    const n = zones.length || 1;
    const idx = Math.min(n - 1, Math.floor(pct / 100 * n));
    zones.forEach((z, i) => z.classList.toggle('show', i === idx));
  }

  function buildScale() {
    const wrap = document.createElement('div');
    wrap.className = 'wscale';
    wrap.dataset.widget = 'scale';

    const bar = document.createElement('div');
    bar.className = 'wscale-bar';
    const cursor = document.createElement('div');
    cursor.className = 'wscale-cursor';
    cursor.tabIndex = 0;
    cursor.style.left = '50%';
    bar.appendChild(cursor);
    wrap.appendChild(bar);

    wrap.appendChild(buildScaleBornes('0 %', '100 %'));

    const panels = document.createElement('div');
    panels.className = 'wscale-panels';
    wrap.appendChild(panels);
    ['Gauche', 'Centre', 'Droite'].forEach(label => panels.appendChild(buildScaleZone(label)));

    renderScaleTicks(wrap);
    attachScaleEditControls(wrap);
    return wrap;
  }

  function mountScale(wrap) {
    assurerScaleBornes(wrap);
    const bar = wrap.querySelector(':scope > .wscale-bar');
    const cursor = bar.querySelector('.wscale-cursor');
    if (bar._bound) { setZoneFromCursor(wrap); return; }
    bar._bound = true;

    function currentPct() { return parseFloat(cursor.style.left) || 0; }
    function setPct(pct) {
      pct = Math.max(0, Math.min(100, pct));
      cursor.style.left = pct + '%';
      setZoneFromCursor(wrap);
    }
    function setFromClientX(clientX) {
      const rect = bar.getBoundingClientRect();
      setPct(((clientX - rect.left) / rect.width) * 100);
    }
    cursor.addEventListener('pointerdown', ev => { cursor.setPointerCapture(ev.pointerId); ev.preventDefault(); ev.stopPropagation(); });
    cursor.addEventListener('pointermove', ev => { if (ev.buttons === 1) setFromClientX(ev.clientX); });
    bar.addEventListener('pointerdown', ev => { if (ev.target === bar) setFromClientX(ev.clientX); });
    cursor.addEventListener('keydown', ev => {
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); ev.stopPropagation(); setPct(currentPct() - 5); }
      if (ev.key === 'ArrowRight') { ev.preventDefault(); ev.stopPropagation(); setPct(currentPct() + 5); }
    });
    renderScaleTicks(wrap);
    setZoneFromCursor(wrap);
  }

  // ───────────────────────── Camembert statistique ─────────────────────────

  function pieUsed(wrap) {
    const legend = wrap.querySelector(':scope > .wpie-legend');
    return Array.from(legend.children).reduce((s, li) => s + Number(li.dataset.pct), 0);
  }
  function pieRemaining(wrap) { return Math.max(0, 100 - pieUsed(wrap)); }

  function renderPieChart(wrap) {
    const chart = wrap.querySelector(':scope > .wpie-chart');
    const legend = wrap.querySelector(':scope > .wpie-legend');
    const items = Array.from(legend.children);
    let acc = 0;
    const stops = [];
    items.forEach((li, idx) => {
      const pct = Number(li.dataset.pct);
      li.querySelector('.wpie-swatch').style.background = seriesColor(idx);
      stops.push(`${seriesColor(idx)} ${acc}% ${acc + pct}%`);
      acc += pct;
    });
    if (100 - acc > 0.001) stops.push(`var(--bord) ${acc}% 100%`);
    chart.style.background = stops.length ? `conic-gradient(${stops.join(', ')})` : 'var(--bord)';
  }

  function bindPieDelete(wrap, li) {
    const del = li.querySelector('.wpie-del');
    // Une tranche enregistree n'a PAS de corbeille : elle porte `widget-ctl` et
    // l'enregistrement la retire. Sans ce garde-fou, monter un camembert relu depuis le
    // fichier levait « Cannot read properties of null (reading '_bound') » a chaque
    // chargement — et une erreur de page en presentation, c'est une diapo qui peut rester
    // muette.
    if (!del) return;
    if (del._bound) return;
    del._bound = true;
    del.addEventListener('click', () => { li.remove(); renderPieChart(wrap); });
  }

  function addPieSlice(wrap, label, pct) {
    const legend = wrap.querySelector(':scope > .wpie-legend');
    pct = Math.max(0, Math.min(pct, pieRemaining(wrap)));
    if (pct <= 0) return;
    const li = document.createElement('li');
    li.className = 'wpie-item';
    li.dataset.pct = String(pct);
    const swatch = document.createElement('span');
    swatch.className = 'wpie-swatch';
    const text = document.createElement('span');
    text.className = 'wpie-text';
    text.textContent = `${label} : ${pct}%`;
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'wpie-del widget-ctl';
    del.textContent = '🗑';
    del.title = 'Retirer cette tranche';
    li.append(swatch, text, del);
    legend.appendChild(li);
    bindPieDelete(wrap, li);
    renderPieChart(wrap);
  }

  function buildPieChart() {
    const wrap = document.createElement('div');
    wrap.className = 'wpie';
    wrap.dataset.widget = 'piechart';

    const chart = document.createElement('div');
    chart.className = 'wpie-chart';
    wrap.appendChild(chart);

    const legend = document.createElement('ul');
    legend.className = 'wpie-legend';
    wrap.appendChild(legend);

    const form = document.createElement('div');
    form.className = 'wpie-form widget-ctl';
    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.className = 'wpie-input-label';
    labelInput.placeholder = 'Libellé (ex. Chocolat)';
    const pctInput = document.createElement('input');
    pctInput.type = 'number';
    pctInput.className = 'wpie-input-pct';
    pctInput.min = '1';
    pctInput.max = '100';
    pctInput.placeholder = '%';
    const fillBtn = document.createElement('button');
    fillBtn.type = 'button';
    fillBtn.className = 'wpie-fill-btn';
    fillBtn.textContent = 'Compléter à 100%';
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'wpie-add-btn';
    addBtn.textContent = 'Ajouter';
    form.append(labelInput, pctInput, fillBtn, addBtn);
    wrap.appendChild(form);

    renderPieChart(wrap);
    return wrap;
  }

  // 9 septembre — le camembert etait le seul widget dont les affordances d'edition (le
  // formulaire « Libelle / % / Ajouter » et les corbeilles de la legende) vivaient dans le
  // HTML ENREGISTRE : elles ne portaient pas `widget-ctl`, donc buildCleanClone ne les
  // retirait pas, et elles s'affichaient EN PRESENTATION. Personne ne l'avait vu parce
  // qu'aucune formation n'utilisait de camembert ; la premiere diapo qui en a recu un (la
  // composition de l'atmosphere, formation climato) l'a montre tout de suite.
  //
  // Le formulaire est desormais OPTIONNEL dans le fichier : `mountPieChart` ne le suppose
  // plus present — c'est `setupEditControls` qui le pose, comme pour le sondage, l'echelle
  // et l'histogramme. Un camembert enregistre sans formulaire se monte, se dessine et se
  // recolore normalement.
  function mountPieChart(wrap) {
    const form = wrap.querySelector(':scope > .wpie-form');
    wrap.querySelectorAll(':scope > .wpie-legend > .wpie-item').forEach(li => bindPieDelete(wrap, li));
    if (!form) { renderPieChart(wrap); return; }
    if (!form._bound) {
      form._bound = true;
      const labelInput = form.querySelector('.wpie-input-label');
      const pctInput = form.querySelector('.wpie-input-pct');
      const fillBtn = form.querySelector('.wpie-fill-btn');
      const addBtn = form.querySelector('.wpie-add-btn');
      function doAdd() {
        const label = labelInput.value.trim() || 'Option';
        const pct = Number(pctInput.value);
        if (!pct || pct <= 0) return;
        addPieSlice(wrap, label, pct);
        labelInput.value = '';
        pctInput.value = '';
        labelInput.focus();
      }
      addBtn.addEventListener('click', doAdd);
      pctInput.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); doAdd(); } });
      labelInput.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); doAdd(); } });
      fillBtn.addEventListener('click', () => { pctInput.value = String(pieRemaining(wrap)); pctInput.focus(); });
    }
    renderPieChart(wrap);
  }

  // ───────────────────── Histogramme (bâtons animés par étapes) ─────────────────────
  // Antonin, 9 septembre : « je décide du nombre d'items, je les nomme, je choisis la
  // couleur des bâtons, et je crée une animation où je modifie leur taille à la main ;
  // ça s'enregistre et ça se déclenche au clic ou à la flèche ».
  //
  // Le widget garde donc une SUITE D'ÉTATS (data-etapes : un tableau de hauteurs en % par
  // étape, l'étape 0 étant celle qu'on voit au repos). En édition on choisit l'étape qu'on
  // règle et on tire le haut des bâtons ; en présentation on passe d'un état au suivant.
  //
  // Le passage d'un état à l'autre ne réinvente aucune navigation : chaque étape au-delà
  // de la première pose un marqueur .step (invisible, sans hauteur) dans le widget. La
  // flèche du déroulé le révèle comme n'importe quel palier — donc le retour arrière
  // fonctionne aussi — et un clic sur le graphique fait la même chose à la main.

  const HISTO_COULEUR = '#4f7cff';
  const HISTO_DEFAUT  = [55, 80, 35];

  // « Une option pour que toutes les barres aient un total de 100 % » (Antonin, 9 septembre).
  // Les hauteurs deviennent alors des PARTS : régler un bâton reprend (ou rend) aux autres
  // ce qu'il prend, au prorata de ce qu'ils valaient, et la somme fait 100 à tout instant.
  // C'est un mode, pas un calcul de plus : hors de lui, chaque bâton reste libre.
  function histoTotal100(wrap) { return wrap.dataset.total100 === '1'; }

  // Ramène une étape à un total de 100. L'arrondi laisse un point ou deux : ils vont au plus
  // gros bâton, jamais répartis en silence sur tous.
  function histoNormaliser(vals) {
    const n = vals.length;
    if (!n) return vals;
    const somme = vals.reduce((a, b) => a + b, 0);
    const out = somme > 0 ? vals.map(v => Math.round(v / somme * 100))
                          : vals.map(() => Math.floor(100 / n));
    const ecart = 100 - out.reduce((a, b) => a + b, 0);
    if (ecart) {
      let k = 0;
      out.forEach((v, i) => { if (v > out[k]) k = i; });
      out[k] = Math.max(0, out[k] + ecart);
    }
    return out;
  }

  // Poser une valeur en gardant le total à 100 : ce qui reste se partage entre les autres,
  // au prorata de ce qu'ils valaient — et à parts égales s'ils valaient tous zéro.
  function histoPoser100(vals, idx, valeur) {
    const n = vals.length;
    const v = Math.max(0, Math.min(100, Math.round(valeur)));
    if (n <= 1) return [100];
    const reste = 100 - v;
    const autres = vals.reduce((s, x, i) => s + (i === idx ? 0 : x), 0);
    const out = vals.map((x, i) => (i === idx) ? v
      : (autres > 0 ? Math.round(x / autres * reste) : Math.round(reste / (n - 1))));
    const ecart = 100 - out.reduce((a, b) => a + b, 0);
    if (ecart) {
      // Au plus gros des AUTRES : corriger le bâton qu'on vient de poser défairait le geste.
      let k = -1;
      out.forEach((x, i) => { if (i !== idx && (k === -1 || x > out[k])) k = i; });
      if (k >= 0) out[k] = Math.max(0, out[k] + ecart);
    }
    return out;
  }

  function histoCols(wrap)  { return Array.from(wrap.querySelectorAll(':scope > .whisto-plot > .whisto-col')); }
  function histoBarres(wrap) { return histoCols(wrap).map(c => c.querySelector('.whisto-bar')); }
  function histoMarqueurs(wrap) { return Array.from(wrap.querySelectorAll(':scope > .whisto-step')); }
  function histoCouleur(wrap) { return wrap.dataset.couleur || HISTO_COULEUR; }
  function histoEnEdition(wrap) { return !!wrap.closest('.slide.editing'); }

  // Hauteurs telles qu'elles sont dessinées (repli quand data-etapes manque ou est cassé :
  // un attribut illisible ne doit pas vider le graphique).
  function histoHauteursDOM(wrap) {
    return histoBarres(wrap).map(b => Math.round(parseFloat(b.style.height) || 0));
  }
  function histoEtapes(wrap) {
    let list = null;
    try { list = JSON.parse(wrap.dataset.etapes || 'null'); } catch (e) { list = null; }
    if (!Array.isArray(list) || !list.length || !Array.isArray(list[0])) list = [histoHauteursDOM(wrap)];
    const n = histoCols(wrap).length;
    // Une étape plus courte que le nombre de bâtons (un item ajouté depuis) est complétée,
    // une plus longue est coupée : le graphique reste lisible quoi qu'il arrive.
    return list.map(e => {
      const vals = Array.from({ length: n }, (_, i) => Math.max(0, Math.min(100, Math.round(Number(e[i]) || 0))));
      return vals;
    });
  }
  function histoSetEtapes(wrap, etapes) {
    wrap.dataset.etapes = JSON.stringify(etapes);
    histoSyncMarqueurs(wrap);
  }

  // Le titre de chaque étape (« 2019 », « après la campagne »…), rangé à part des hauteurs :
  // un histogramme écrit avant cette option n'a pas de titres, et n'en a pas besoin.
  function histoTitres(wrap) {
    let list = null;
    try { list = JSON.parse(wrap.dataset.titres || 'null'); } catch (e) { list = null; }
    if (!Array.isArray(list)) list = [];
    const n = histoEtapes(wrap).length;
    return Array.from({ length: n }, (_, i) => String(list[i] == null ? '' : list[i]));
  }
  function histoSetTitres(wrap, titres) {
    if (titres.some(t => t.trim())) wrap.dataset.titres = JSON.stringify(titres);
    else delete wrap.dataset.titres;   // pas d'attribut pour une liste de vides
  }

  // Un marqueur par étape au-delà de la première. data-order suit le rang : le déroulé de
  // la diapo les range avec les autres paliers.
  function histoSyncMarqueurs(wrap) {
    const voulus = Math.max(0, histoEtapes(wrap).length - 1);
    const marqs = histoMarqueurs(wrap);
    for (let k = marqs.length; k < voulus; k++) {
      const m = document.createElement('i');
      m.className = 'whisto-step step';
      wrap.appendChild(m);
    }
    for (let k = marqs.length - 1; k >= voulus; k--) marqs[k].remove();
    histoMarqueurs(wrap).forEach((m, idx) => m.setAttribute('data-order', String(idx + 1)));
  }

  // L'étape à montrer : en présentation, le nombre de marqueurs révélés ; en édition,
  // celle qu'on est en train de régler.
  function histoEtapeVue(wrap) {
    if (histoEnEdition(wrap)) return Math.min(wrap._histoEtape || 0, histoEtapes(wrap).length - 1);
    return histoMarqueurs(wrap).filter(m => m.classList.contains('shown')).length;
  }

  function histoRender(wrap) {
    const etapes = histoEtapes(wrap);
    const vals = etapes[Math.min(histoEtapeVue(wrap), etapes.length - 1)] || [];
    const couleur = histoCouleur(wrap);
    histoBarres(wrap).forEach((b, i) => {
      b.style.height = (vals[i] || 0) + '%';
      b.style.background = couleur;
    });
    histoMajValeurs(wrap, vals);
    histoMajTitre(wrap);
    const panneau = wrap.querySelector(':scope > .whisto-edit');
    if (panneau) histoRenderPanneau(wrap, panneau);
  }

  // Le titre suit l'étape affichée. On ne réécrit jamais la légende pendant qu'on y tape :
  // le curseur sauterait au début à chaque lettre.
  function histoMajTitre(wrap) {
    const t = wrap.querySelector(':scope > .whisto-titre');
    if (!t || document.activeElement === t) return;
    const titre = histoTitres(wrap)[histoEtapeVue(wrap)] || '';
    if (t.textContent !== titre) t.textContent = titre;
  }

  // Le chiffre au-dessus du bâton n'existe qu'en édition : on règle une hauteur à la
  // main, il faut bien la voir. Classe ed- : il ne part jamais dans le fichier.
  function histoMajValeurs(wrap, vals) {
    const edition = histoEnEdition(wrap);
    histoCols(wrap).forEach((col, i) => {
      let v = col.querySelector('.whisto-val');
      if (!edition) { if (v) v.remove(); return; }
      if (!v) {
        v = document.createElement('span');
        v.className = 'whisto-val ed-whisto-val';
        col.appendChild(v);
      }
      v.textContent = String(vals[i] || 0) + (histoTotal100(wrap) ? ' %' : '');
      v.style.bottom = 'calc(' + (vals[i] || 0) + '% + 3px)';
    });
  }

  function buildHistoCol(pct, couleur) {
    const col = document.createElement('div');
    col.className = 'whisto-col';
    const bar = document.createElement('div');
    bar.className = 'whisto-bar';
    bar.style.height = pct + '%';
    bar.style.background = couleur;
    col.appendChild(bar);
    return col;
  }
  function buildHistoNom(texte) {
    const nom = document.createElement('span');
    nom.className = 'whisto-nom';
    nom.textContent = texte;
    return nom;
  }

  function buildHistogram() {
    const wrap = document.createElement('div');
    wrap.className = 'whisto';
    wrap.dataset.widget = 'histogram';
    wrap.dataset.couleur = HISTO_COULEUR;
    const legende = document.createElement('div');
    legende.className = 'whisto-titre';
    wrap.appendChild(legende);
    const plot = document.createElement('div');
    plot.className = 'whisto-plot';
    const noms = document.createElement('div');
    noms.className = 'whisto-noms';
    HISTO_DEFAUT.forEach((pct, i) => {
      plot.appendChild(buildHistoCol(pct, HISTO_COULEUR));
      noms.appendChild(buildHistoNom('Item ' + (i + 1)));
    });
    wrap.append(plot, noms);
    wrap.dataset.etapes = JSON.stringify([HISTO_DEFAUT.slice()]);
    return wrap;
  }

  // ── Nombre d'items : chaque étape gagne (ou perd) une valeur, sinon les états
  // enregistrés ne décriraient plus le même graphique.
  function histoSetNbItems(wrap, n) {
    n = Math.max(1, Math.min(12, n));
    const plot = wrap.querySelector(':scope > .whisto-plot');
    const noms = wrap.querySelector(':scope > .whisto-noms');
    const etapes = histoEtapes(wrap);
    const actuel = histoCols(wrap).length;
    for (let i = actuel; i < n; i++) {
      plot.appendChild(buildHistoCol(40, histoCouleur(wrap)));
      noms.appendChild(buildHistoNom('Item ' + (i + 1)));
      etapes.forEach(e => e.push(40));
    }
    histoPreparerNoms(wrap);
    for (let i = actuel - 1; i >= n; i--) {
      histoCols(wrap)[i].remove();
      noms.children[i].remove();
      etapes.forEach(e => e.pop());
    }
    // Un bâton de plus ou de moins change la somme : en mode « total 100 % », les parts se
    // recalculent, sinon le compte affiché mentirait dès le premier ajout.
    histoSetEtapes(wrap, histoTotal100(wrap) ? etapes.map(histoNormaliser) : etapes);
    histoRender(wrap);
  }

  function histoPreparerNoms(wrap) {
    if (!histoEnEdition(wrap)) return;
    wrap.querySelectorAll(':scope > .whisto-noms > .whisto-nom').forEach(n => { n.contentEditable = 'true'; });
  }

  // La légende existe même sur un histogramme écrit avant qu'on ait des titres : elle est
  // posée au montage, vide, et ne se voit que lorsqu'elle porte quelque chose.
  function histoAssurerTitre(wrap) {
    let t = wrap.querySelector(':scope > .whisto-titre');
    if (!t) {
      t = document.createElement('div');
      t.className = 'whisto-titre';
      wrap.insertBefore(t, wrap.firstChild);
    }
    return t;
  }

  // En édition, le titre se tape directement au-dessus du graphique : il s'écrit dans
  // l'étape CHOISIE, celle qu'on est en train de régler.
  function histoPreparerTitre(wrap) {
    const t = histoAssurerTitre(wrap);
    if (histoEnEdition(wrap)) t.contentEditable = 'true';
    if (t._histoBound) return;
    t._histoBound = true;
    t.addEventListener('input', () => {
      const titres = histoTitres(wrap);
      const k = Math.min(wrap._histoEtape || 0, titres.length - 1);
      titres[k] = t.textContent.trim();
      histoSetTitres(wrap, titres);
      const panneau = wrap.querySelector(':scope > .whisto-edit');
      if (panneau) histoRenderPanneau(wrap, panneau);
    });
    // Écrire un titre n'est pas naviguer dans le diaporama, ni déplacer le bloc.
    t.addEventListener('keydown', ev => ev.stopPropagation());
    t.addEventListener('pointerdown', ev => ev.stopPropagation());
  }

  // ── Tirer le haut d'un bâton (édition) ──
  // La hauteur se lit sur le graphique, pas sur le bâton : un bâton à 5 % est trop court
  // pour qu'on le saisisse, alors que le rectangle du graphique, lui, est toujours là.
  function histoBindGlisser(wrap) {
    const plot = wrap.querySelector(':scope > .whisto-plot');
    if (!plot || plot._histoGlisserBound) return;
    plot._histoGlisserBound = true;
    let colGlissee = null;
    function pctDepuisY(clientY) {
      const r = plot.getBoundingClientRect();
      return Math.max(0, Math.min(100, Math.round((r.bottom - clientY) / r.height * 100)));
    }
    function poser(clientY) {
      if (!colGlissee) return;
      const idx = histoCols(wrap).indexOf(colGlissee);
      if (idx < 0) return;
      const etapes = histoEtapes(wrap);
      const k = Math.min(wrap._histoEtape || 0, etapes.length - 1);
      const pct = pctDepuisY(clientY);
      etapes[k] = histoTotal100(wrap)
        ? histoPoser100(etapes[k], idx, pct)
        : etapes[k].map((v, i) => (i === idx ? pct : v));
      histoSetEtapes(wrap, etapes);
      histoRender(wrap);
    }
    plot.addEventListener('pointerdown', ev => {
      if (!histoEnEdition(wrap)) return;
      const col = ev.target.closest('.whisto-col');
      if (!col) return;
      // Le glissement appartient au bâton : sans cet arrêt, l'éditeur croirait qu'on
      // déplace le bloc entier et le widget partirait à travers la diapo.
      ev.preventDefault();
      ev.stopPropagation();
      colGlissee = col;
      plot.setPointerCapture(ev.pointerId);
      poser(ev.clientY);
    });
    plot.addEventListener('pointermove', ev => { if (colGlissee && ev.buttons === 1) poser(ev.clientY); });
    plot.addEventListener('pointerup', () => { colGlissee = null; });
    plot.addEventListener('pointercancel', () => { colGlissee = null; });
  }

  // ── Le panneau d'édition (préfixe ed- : il ne part jamais dans le fichier) ──
  function histoRenderPanneau(wrap, panneau) {
    const etapes = histoEtapes(wrap);
    const k = Math.min(wrap._histoEtape || 0, etapes.length - 1);
    const titres = histoTitres(wrap);
    const liste = panneau.querySelector('.whisto-etapes');
    liste.innerHTML = '';
    etapes.forEach((e, idx) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'whisto-etape widget-ctl' + (idx === k ? ' actif' : '');
      // Une étape nommée s'appelle par son nom : c'est plus parlant qu'un numéro.
      const nom = (titres[idx] || '').trim();
      b.textContent = nom || (idx === 0 ? 'Départ' : String(idx));
      b.title = (idx === 0 ? 'L’état au repos' : 'Étape ' + idx + ' (flèche ou clic n° ' + idx + ')')
        + (nom ? ' : « ' + nom + ' »' : '');
      b.addEventListener('click', () => { wrap._histoEtape = idx; histoRender(wrap); });
      liste.appendChild(b);
    });
    const sup = panneau.querySelector('.whisto-suppr');
    if (sup) sup.disabled = (k === 0);
    const cent = panneau.querySelector('.whisto-cent');
    if (cent) cent.classList.toggle('actif', histoTotal100(wrap));
  }

  function attachHistoEditControls(wrap) {
    histoPreparerNoms(wrap);
    histoPreparerTitre(wrap);
    histoBindGlisser(wrap);
    if (wrap._histoEtape == null) wrap._histoEtape = 0;
    if (wrap.querySelector(':scope > .whisto-edit')) { histoRender(wrap); return; }

    const p = document.createElement('div');
    p.className = 'whisto-edit ed-whisto-edit';

    const moins = document.createElement('button');
    moins.type = 'button';
    moins.className = 'widget-ctl';
    moins.textContent = '−';
    moins.title = 'Un bâton de moins';
    moins.addEventListener('click', () => histoSetNbItems(wrap, histoCols(wrap).length - 1));

    const nb = document.createElement('span');
    nb.className = 'whisto-nb';

    const plus = document.createElement('button');
    plus.type = 'button';
    plus.className = 'widget-ctl';
    plus.textContent = '+';
    plus.title = 'Un bâton de plus';
    plus.addEventListener('click', () => histoSetNbItems(wrap, histoCols(wrap).length + 1));

    const couleur = document.createElement('input');
    couleur.type = 'color';
    couleur.className = 'whisto-couleur';
    couleur.value = histoCouleur(wrap);
    couleur.title = 'Couleur des bâtons';
    couleur.addEventListener('input', () => { wrap.dataset.couleur = couleur.value; histoRender(wrap); });

    // Le mode « part d'un tout » : une fois posé, chaque étape est une répartition.
    const cent = document.createElement('button');
    cent.type = 'button';
    cent.className = 'whisto-cent widget-ctl';
    cent.textContent = 'Σ 100 %';
    cent.title = 'Les bâtons se partagent 100 % : régler l’un ajuste les autres';
    cent.addEventListener('click', () => {
      const actif = !histoTotal100(wrap);
      if (actif) {
        wrap.dataset.total100 = '1';
        histoSetEtapes(wrap, histoEtapes(wrap).map(histoNormaliser));
      } else {
        delete wrap.dataset.total100;   // l'attribut ne reste pas dans le fichier pour rien
      }
      histoRender(wrap);
    });

    const liste = document.createElement('span');
    liste.className = 'whisto-etapes';

    const ajouter = document.createElement('button');
    ajouter.type = 'button';
    ajouter.className = 'widget-ctl';
    ajouter.textContent = '＋ Étape';
    ajouter.title = 'Enregistrer une étape de plus, à partir de l’état affiché';
    ajouter.addEventListener('click', () => {
      const etapes = histoEtapes(wrap);
      const titres = histoTitres(wrap);
      const k = Math.min(wrap._histoEtape || 0, etapes.length - 1);
      etapes.splice(k + 1, 0, etapes[k].slice());
      titres.splice(k + 1, 0, '');
      histoSetEtapes(wrap, etapes);
      histoSetTitres(wrap, titres);
      wrap._histoEtape = k + 1;
      histoRender(wrap);
    });

    const suppr = document.createElement('button');
    suppr.type = 'button';
    suppr.className = 'whisto-suppr widget-ctl';
    suppr.textContent = '🗑';
    suppr.title = 'Retirer l’étape choisie';
    suppr.addEventListener('click', () => {
      const etapes = histoEtapes(wrap);
      const titres = histoTitres(wrap);
      const k = Math.min(wrap._histoEtape || 0, etapes.length - 1);
      if (k === 0 || etapes.length <= 1) return;
      etapes.splice(k, 1);
      titres.splice(k, 1);
      histoSetEtapes(wrap, etapes);
      histoSetTitres(wrap, titres);
      wrap._histoEtape = k - 1;
      histoRender(wrap);
    });

    const aide = document.createElement('span');
    aide.className = 'whisto-aide';
    aide.style.cssText = 'font-size:.72rem;color:var(--mu);flex:1 1 100%;';
    aide.textContent = 'Tirez le haut des bâtons pour régler l’étape choisie. « Σ 100 % » fait des bâtons '
      + 'les parts d’un tout : régler l’un ajuste les autres. En présentation, chaque étape arrive à la '
      + 'flèche suivante (ou au clic sur le graphique).';

    p.append(moins, nb, plus, couleur, cent, liste, ajouter, suppr, aide);
    wrap.appendChild(p);
    const majNb = () => { nb.textContent = histoCols(wrap).length + ' bâtons'; };
    majNb();
    new MutationObserver(majNb).observe(wrap.querySelector(':scope > .whisto-plot'), { childList: true });
    histoRender(wrap);
  }

  function mountHistogram(wrap) {
    histoAssurerTitre(wrap);
    histoSyncMarqueurs(wrap);
    // Remonter, c'est repartir de l'état au repos : quitter l'édition doit défaire l'étape
    // qu'on était en train de régler, même si la classe « editing » n'est pas encore
    // retirée de la diapo au moment où le moteur nous rappelle.
    wrap._histoEtape = 0;
    if (!wrap._histoBound) {
      wrap._histoBound = true;
      // Le clic sur le graphique avance d'une étape (et revient au départ à la fin) :
      // c'est le « déclenche au clic » — la flèche, elle, passe par les marqueurs .step.
      wrap.addEventListener('click', ev => {
        if (histoEnEdition(wrap)) return;
        if (ev.target.closest('.whisto-edit')) return;
        const marqs = histoMarqueurs(wrap);
        if (!marqs.length) return;
        const vus = marqs.filter(m => m.classList.contains('shown')).length;
        if (vus >= marqs.length) marqs.forEach(m => m.classList.remove('shown'));
        else marqs[vus].classList.add('shown');
        histoRender(wrap);
      });
      // Les flèches du déroulé posent .shown sur les marqueurs : on suit ce que fait le
      // moteur plutôt que de lui demander de nous prévenir. Seuls les marqueurs comptent —
      // réagir à TOUT changement de classe du widget ferait boucler le rendu avec le
      // panneau d'édition, qui pose une classe « actif » sur l'étape choisie.
      new MutationObserver(recs => {
        if (recs.some(r => r.target.classList && r.target.classList.contains('whisto-step'))) histoRender(wrap);
      }).observe(wrap, { attributes: true, attributeFilter: ['class'], subtree: true });
    }
    histoRender(wrap);
  }

  // Repose le formulaire du camembert quand on rouvre la diapo en edition. Il ne vit plus
  // dans le fichier (il porte `widget-ctl`, que l'enregistrement retire) : c'est ici qu'il
  // revient, exactement comme les boutons du sondage et de l'echelle.
  function attachPieEditControls(wrap) {
    wrap.querySelectorAll(':scope > .wpie-legend > .wpie-item').forEach(li => {
      if (li.querySelector('.wpie-del')) { bindPieDelete(wrap, li); return; }
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'wpie-del widget-ctl';
      del.textContent = '🗑';
      del.title = 'Retirer cette tranche';
      li.appendChild(del);
      bindPieDelete(wrap, li);
    });
    if (wrap.querySelector(':scope > .wpie-form')) { mountPieChart(wrap); return; }
    const form = document.createElement('div');
    form.className = 'wpie-form widget-ctl';
    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.className = 'wpie-input-label';
    labelInput.placeholder = 'Libellé (ex. Chocolat)';
    const pctInput = document.createElement('input');
    pctInput.type = 'number';
    pctInput.className = 'wpie-input-pct';
    pctInput.min = '1';
    pctInput.max = '100';
    pctInput.placeholder = '%';
    const fillBtn = document.createElement('button');
    fillBtn.type = 'button';
    fillBtn.className = 'wpie-fill-btn';
    fillBtn.textContent = 'Compléter à 100%';
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'wpie-add-btn';
    addBtn.textContent = 'Ajouter';
    form.append(labelInput, pctInput, fillBtn, addBtn);
    wrap.appendChild(form);
    mountPieChart(wrap);
  }

  // ─────────────────── Réponses à écrire (barre de saisie + corrigé) ───────────────────
  /* Antonin, 10 septembre : « une barre de texte où tu peux écrire, et j'ai moi, dans le
     mode Édition, préparé des réponses. Si quand j'écris la bonne réponse, elle s'affiche
     en vert, sinon le mot qui ne fonctionne pas s'affiche en rouge. »

     Le geste est celui de la liste de critères du début de niveau 1 (createChecklist, dans
     shared-deck-engine.js) : on tape ce que la salle propose, la correspondance se fait par
     mots acceptés. Deux différences, et ce sont elles qui font un widget à part plutôt
     qu'un réglage de l'autre :
       — celui-ci s'INSÈRE depuis le rail, dans n'importe quelle diapo de n'importe quelle
         formation, sans écrire une ligne : les réponses préparées se saisissent dans un
         panneau, là où la liste de critères les lit dans un attribut JSON écrit à la main ;
       — ce qui est refusé se VOIT, en rouge. La liste de critères le laissait en neutre,
         et rien ne distinguait « pas encore reconnu » de « à côté ».

     Deux natures de données, deux endroits, et c'est la règle du 23 août :
       — les réponses PRÉPARÉES vivent dans `data-reponses`, parce que rien ne les rend à
         l'écran tant que personne ne les a trouvées. Elles partent dans le fichier ;
       — ce que la salle TAPE ne va jamais dans le fichier : la liste est vidée au montage
         (donc à chaque ouverture de la page) et à l'enregistrement. Une séance ne se grave
         pas dans la diapo — c'est le défaut qu'avait connu le quiz de la danse. */

  const REPONSE_DEFAUT = [{ txt: 'Première réponse attendue', en: '', keys: [] }];

  // Les libellés du widget lui-même. Ils NE passent PAS par des paires .t-fr/.t-en comme le
  // texte des diapos : le moteur retraduit ces paires à chaque bascule, et un bouton
  // engendré par un widget se retrouverait avec deux libellés dans le fichier, dont l'un
  // faux dès qu'on renomme. Ici c'est le montage qui écrit le bon, dans la langue du moment.
  const REP_MOTS = {
    valider:    { fr: 'Valider', en: 'Submit' },
    manquantes: { fr: 'Voir les réponses manquantes', en: 'See the missing answers' },
    invite:     { fr: 'Votre réponse…', en: 'Your answer…' },
    deja:       { fr: 'déjà trouvée', en: 'already found' },
    oubliee:    { fr: 'oubliée', en: 'missed' },
  };
  function repLangue() { return document.documentElement.lang === 'en' ? 'en' : 'fr'; }

  // « Mieux qu’un trou », la règle du moteur pour les paires .t-fr/.t-en, appliquée au widget
  // ENTIER : un widget dont aucune réponse n’est écrite en anglais reste en français, drapeau
  // anglais levé ou non.
  // Antonin, 11 septembre : « les mots en français dedans stp. Pas de "Your answer..." ».
  // Il avait raison, et le piège était plus vicieux qu’un oubli de traduction : le drapeau
  // anglais se retient d’une séance à l’autre (localStorage), et dans une formation
  // entièrement française il ne se voit NULLE PART — les .t-en y sont vides, donc le
  // français s’affiche quand même. Le widget était le seul endroit de la page à obtempérer,
  // et affichait « Your answer… » sous six réponses françaises sans que rien dise pourquoi.
  function repLangueDe(wrap) {
    if (repLangue() !== 'en') return 'fr';
    return wrap && repLire(wrap).some(r => (r.en || '').trim()) ? 'en' : 'fr';
  }
  // Sans wrap, on retombe sur la langue de la page. Les deux seuls appels sans wrap
  // (la construction du bouton et celle du widget) sont suivis d’un reponseTraduire qui
  // repasse dessus avec le wrap en main.
  function repDit(cle, wrap) { return REP_MOTS[cle][wrap ? repLangueDe(wrap) : repLangue()]; }
  // Une réponse dont l'anglais n'est pas écrit reste en français en mode anglais : c'est la
  // règle du moteur pour les paires .t-fr/.t-en (« mieux qu'un trou »), et il n'y a pas de
  // raison qu'un widget en applique une autre.
  function repTexte(r, wrap) {
    const en = (r.en || '').trim();
    return ((wrap ? repLangueDe(wrap) : repLangue()) === 'en' && en) ? en : r.txt;
  }

  // Comparer « Élève » et « eleve » : minuscules, accents retirés, ponctuation ramenée à
  // des espaces. Écrit ici plutôt qu'emprunté au moteur : ce fichier est autonome (il
  // s'ajoute à une formation sans rien y coder), et il doit le rester.
  function repNormaliser(s) {
    // Les diacritiques sont écrits en ÉCHAPPEMENTS, pas en caractères combinants : un
    // outil qui renormaliserait le fichier (NFC) les recollerait sur leur lettre, la classe
    // deviendrait vide, et la comparaison cesserait d’ignorer les accents sans qu’une seule
    // ligne n’ait changé à l’œil.
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Aucun filtrage ici : une réponse laissée vide pendant la saisie du panneau doit garder
  // sa place, sinon la rangée qu'on est en train de vider disparaîtrait sous les doigts.
  // C'est la correspondance qui ignore les vides, pas la lecture.
  function repLire(wrap) {
    let brut;
    try { brut = JSON.parse(wrap.dataset.reponses || '[]'); } catch (e) {
      console.error('data-reponses illisible :', e);
      return [];
    }
    if (!Array.isArray(brut)) return [];
    return brut.map(r => ({
      txt: String((r && r.txt) || ''),
      en: String((r && r.en) || ''),
      keys: Array.isArray(r && r.keys) ? r.keys.map(String) : []
    }));
  }
  function repEcrire(wrap, reponses) { wrap.dataset.reponses = JSON.stringify(reponses); }

  // Les mots qui font reconnaître une réponse : ceux que le formateur a listés, ou, s'il
  // n'en a listé aucun, la réponse elle-même. La colonne de droite peut donc rester vide.
  // Sans mots acceptés, ce sont les DEUX rédactions qui font mot-clé : en séance anglaise on
  // tape la réponse anglaise, et elle est reconnue sans que rien n'ait été listé.
  function repMots(r) {
    const mots = r.keys.map(repNormaliser).filter(Boolean);
    if (mots.length) return mots;
    return [repNormaliser(r.txt), repNormaliser(r.en)].filter(Boolean);
  }

  function buildReponseBoutonManquantes() {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'wreponse-manquantes';
    b.textContent = repDit('manquantes');
    return b;
  }

  // Le bouton est POSÉ ou RETIRÉ, il n'a pas de drapeau : sa présence dans la diapo est son
  // état. Un attribut de plus dirait la même chose deux fois, et les deux pourraient mentir.
  function reponseAssurerBouton(wrap, voulu) {
    const present = wrap.querySelector(':scope > .wreponse-manquantes');
    if (voulu && !present) {
      const b = buildReponseBoutonManquantes();
      const panneau = wrap.querySelector(':scope > .ed-wreponse-edit');
      wrap.insertBefore(b, panneau || null);   // le panneau d'édition reste en dernier
      mountReponse(wrap);
    } else if (!voulu && present) {
      present.remove();
    }
  }

  function buildReponse() {
    const wrap = document.createElement('div');
    wrap.className = 'wreponse';
    wrap.dataset.widget = 'reponse';
    repEcrire(wrap, REPONSE_DEFAUT.map(r => ({ txt: r.txt, en: r.en, keys: r.keys.slice() })));

    const barre = document.createElement('div');
    barre.className = 'wreponse-barre';
    const saisie = document.createElement('input');
    saisie.type = 'text';
    saisie.className = 'wreponse-saisie';
    // setAttribute, pas la propriété : c'est l'attribut qui part dans le fichier.
    saisie.setAttribute('placeholder', repDit('invite'));
    const valider = document.createElement('button');
    valider.type = 'button';
    valider.className = 'wreponse-valider';
    valider.textContent = repDit('valider');
    barre.append(saisie, valider);

    const lignes = document.createElement('ul');
    lignes.className = 'wreponse-lignes';

    wrap.append(barre, lignes, buildReponseBoutonManquantes());
    reponseTraduire(wrap);
    return wrap;
  }

  function reponseTrouvees(wrap) {
    if (!wrap._repTrouvees) wrap._repTrouvees = new Set();
    return wrap._repTrouvees;
  }

  // `idx` n'est renseigné que pour les lignes dont le texte APPARTIENT au widget (les
  // réponses oubliées) : ce sont les seules à retraduire. Ce que la salle a tapé reste tel
  // qu'elle l'a tapé, dans la langue où elle l'a dit. Propriétés JS et non dataset : ces
  // lignes ne vont jamais dans le fichier, mais l'invariant vaut partout.
  function buildReponseLigne(classe, marque, texte, cleEcho, idx, wrap) {
    const li = document.createElement('li');
    li.className = 'wreponse-ligne ' + classe;
    if (idx != null) li._repIdx = idx;
    const m = document.createElement('span');
    m.className = 'wreponse-marque';
    m.textContent = marque;
    const d = document.createElement('span');
    d.className = 'wreponse-dit';
    d.textContent = texte;
    li.append(m, d);
    if (cleEcho) {
      const e = document.createElement('span');
      e.className = 'wreponse-echo';
      e.textContent = repDit(cleEcho, wrap);
      li._repEcho = cleEcho;
      li.appendChild(e);
    }
    return li;
  }

  // Rejoue les libellés dans la langue du moment : au montage, et à chaque bascule du
  // drapeau. Le widget lit `document.documentElement.lang`, que le moteur tient à jour —
  // il n'appelle pas Deck, et reste donc greffable sur une page qui n'en a pas.
  function reponseTraduire(wrap) {
    const saisie = wrap.querySelector(':scope > .wreponse-barre > .wreponse-saisie');
    if (saisie) saisie.setAttribute('placeholder', repDit('invite', wrap));
    const valider = wrap.querySelector(':scope > .wreponse-barre > .wreponse-valider');
    if (valider) valider.textContent = repDit('valider', wrap);
    const manq = wrap.querySelector(':scope > .wreponse-manquantes');
    if (manq) manq.textContent = repDit('manquantes', wrap);
    const reponses = repLire(wrap);
    wrap.querySelectorAll(':scope > .wreponse-lignes > li').forEach(li => {
      if (li._repIdx != null && reponses[li._repIdx]) {
        const dit = li.querySelector('.wreponse-dit');
        if (dit) dit.textContent = repTexte(reponses[li._repIdx], wrap);
      }
      const echo = li.querySelector('.wreponse-echo');
      if (echo && li._repEcho) echo.textContent = repDit(li._repEcho, wrap);
    });
  }

  function reponseAjouterLigne(wrap, brut) {
    const texte = (brut || '').trim();
    if (!texte) return;
    const lignes = wrap.querySelector(':scope > .wreponse-lignes');
    if (!lignes) return;
    const tape = repNormaliser(texte);
    const trouvees = reponseTrouvees(wrap);
    let idx = -1;
    repLire(wrap).forEach((r, i) => {
      if (idx !== -1) return;
      if (repMots(r).some(m => tape.includes(m))) idx = i;
    });
    // Retrouver deux fois la même réponse reste VERT : voir rougir ce qu'on vient de voir
    // verdir ferait croire à la salle qu'elle s'est trompée.
    const deja = idx !== -1 && trouvees.has(idx);
    if (idx !== -1) trouvees.add(idx);
    lignes.appendChild(buildReponseLigne(idx === -1 ? 'faux' : 'juste',
      idx === -1 ? '✗' : '✓', texte, deja ? 'deja' : '', null, wrap));
    // La liste ayant un plafond, la ligne qu'on vient d'ajouter peut naitre hors de vue.
    // Ce que la salle veut voir, c'est SA reponse : on descend au bas de la liste.
    lignes.scrollTop = lignes.scrollHeight;
  }

  function reponseRevelerManquantes(wrap) {
    if (wrap._repRevele) return;
    wrap._repRevele = true;
    const lignes = wrap.querySelector(':scope > .wreponse-lignes');
    if (!lignes) return;
    const trouvees = reponseTrouvees(wrap);
    repLire(wrap).forEach((r, i) => {
      if (trouvees.has(i) || !r.txt.trim()) return;
      lignes.appendChild(buildReponseLigne('manquante', '·', repTexte(r, wrap), 'oubliee', i, wrap));
    });
    lignes.scrollTop = lignes.scrollHeight;
  }

  function resetReponse(wrap) {
    const lignes = wrap.querySelector(':scope > .wreponse-lignes');
    if (lignes) lignes.innerHTML = '';
    wrap._repTrouvees = new Set();
    wrap._repRevele = false;
    const saisie = wrap.querySelector(':scope > .wreponse-barre > .wreponse-saisie');
    if (saisie) { saisie.value = ''; saisie.removeAttribute('value'); }
  }

  function mountReponse(wrap) {
    // Monter, c'est repartir de zéro : ce qu'une salle a tapé appartient à sa séance.
    resetReponse(wrap);
    reponseTraduire(wrap);
    const saisie = wrap.querySelector(':scope > .wreponse-barre > .wreponse-saisie');
    const valider = wrap.querySelector(':scope > .wreponse-barre > .wreponse-valider');
    const envoyer = () => {
      if (!saisie) return;
      reponseAjouterLigne(wrap, saisie.value);
      saisie.value = '';
      saisie.focus();
    };
    if (saisie && !saisie._repBound) {
      saisie._repBound = true;
      // Entrée valide, et RIEN d'autre n'est confisqué : les flèches continuent de
      // naviguer, comme dans le champ de la liste de critères que niveau 1 utilise déjà.
      // (L'échappatoire data-fleches="moi" existe ; la poser ici mettrait la navigation en
      // panne dès que le champ garderait le focus après un Entrée, sans que rien le dise.)
      saisie.addEventListener('keydown', ev => {
        if (ev.key === 'Enter') { ev.preventDefault(); envoyer(); }
      });
    }
    if (valider && !valider._repBound) {
      valider._repBound = true;
      valider.addEventListener('click', envoyer);
    }
    const manq = wrap.querySelector(':scope > .wreponse-manquantes');
    if (manq && !manq._repBound) {
      manq._repBound = true;
      manq.addEventListener('click', () => reponseRevelerManquantes(wrap));
    }
  }

  // ── Le panneau d'édition : la liste des réponses préparées ──
  // Une rangée = une réponse. À gauche ce qu'on lira dans « les réponses manquantes », à
  // droite les mots qui la font reconnaître. Chaque frappe réécrit `data-reponses` : il n'y
  // a pas de bouton « appliquer », donc pas d'état à moitié enregistré.
  function buildReponseRangee(wrap, panneau, r, i) {
    const ligne = document.createElement('div');
    ligne.className = 'ed-wreponse-rangee';

    const txt = document.createElement('input');
    txt.type = 'text';
    txt.className = 'ed-wreponse-txt';
    txt.value = r.txt;
    txt.placeholder = 'La réponse attendue';
    txt.addEventListener('input', () => {
      const rs = repLire(wrap);
      if (!rs[i]) return;
      rs[i].txt = txt.value;
      repEcrire(wrap, rs);
    });

    const en = document.createElement('input');
    en.type = 'text';
    en.className = 'ed-wreponse-en';
    en.value = r.en;
    en.placeholder = 'The source is cited';
    en.addEventListener('input', () => {
      const rs = repLire(wrap);
      if (!rs[i]) return;
      rs[i].en = en.value;
      repEcrire(wrap, rs);
    });

    const keys = document.createElement('input');
    keys.type = 'text';
    keys.className = 'ed-wreponse-keys';
    keys.value = r.keys.join(', ');
    keys.placeholder = 'source, citée, auteur';
    keys.addEventListener('input', () => {
      const rs = repLire(wrap);
      if (!rs[i]) return;
      rs[i].keys = keys.value.split(',').map(s => s.trim()).filter(Boolean);
      repEcrire(wrap, rs);
    });

    const sup = document.createElement('button');
    sup.type = 'button';
    sup.className = 'ed-wreponse-sup widget-ctl';
    sup.textContent = '×';
    sup.title = 'Retirer cette réponse';
    sup.addEventListener('click', () => {
      const rs = repLire(wrap);
      rs.splice(i, 1);
      repEcrire(wrap, rs);
      reponseRenderPanneau(wrap, panneau);
    });

    ligne.append(txt, en, keys, sup);
    return ligne;
  }

  function reponseRenderPanneau(wrap, panneau) {
    const liste = panneau.querySelector('.ed-wreponse-liste');
    liste.innerHTML = '';
    repLire(wrap).forEach((r, i) => liste.appendChild(buildReponseRangee(wrap, panneau, r, i)));
    const bascule = panneau.querySelector('.ed-wreponse-bascule');
    if (bascule) {
      const present = !!wrap.querySelector(':scope > .wreponse-manquantes');
      bascule.classList.toggle('actif', present);
      bascule.textContent = (present ? '☑' : '☐') + ' Bouton « Voir les réponses manquantes »';
    }
  }

  function attachReponseEditControls(wrap) {
    // Entrer en édition efface la séance en cours : sinon l'auteur règle ses réponses sous
    // une pile de vert et de rouge tapés en salle dix minutes plus tôt, et le panneau se
    // retrouve poussé hors de l'écran. Il voit le widget tel que la salle le découvrira.
    resetReponse(wrap);
    let panneau = wrap.querySelector(':scope > .ed-wreponse-edit');
    if (panneau) { reponseRenderPanneau(wrap, panneau); return; }

    panneau = document.createElement('div');
    panneau.className = 'ed-wreponse-edit';

    const entete = document.createElement('div');
    entete.className = 'ed-wreponse-entete';
    const e1 = document.createElement('span');
    e1.textContent = 'La réponse';
    const e2 = document.createElement('span');
    e2.textContent = 'En anglais';
    const e3 = document.createElement('span');
    e3.textContent = 'Mots acceptés';
    entete.append(e1, e2, e3);

    const liste = document.createElement('div');
    liste.className = 'ed-wreponse-liste';

    const barre = document.createElement('div');
    barre.className = 'ed-wreponse-rangee';

    const ajouter = document.createElement('button');
    ajouter.type = 'button';
    ajouter.className = 'widget-ctl';
    ajouter.textContent = '＋ Une réponse';
    ajouter.title = 'Ajouter une réponse attendue';
    ajouter.addEventListener('click', () => {
      const rs = repLire(wrap);
      rs.push({ txt: '', en: '', keys: [] });
      repEcrire(wrap, rs);
      reponseRenderPanneau(wrap, panneau);
      const champs = panneau.querySelectorAll('.ed-wreponse-txt');
      if (champs.length) champs[champs.length - 1].focus();
    });

    const bascule = document.createElement('button');
    bascule.type = 'button';
    bascule.className = 'ed-wreponse-bascule widget-ctl';
    bascule.title = 'Afficher, ou non, le bouton qui révèle en fin de tour les réponses que personne n’a trouvées';
    bascule.addEventListener('click', () => {
      reponseAssurerBouton(wrap, !wrap.querySelector(':scope > .wreponse-manquantes'));
      reponseRenderPanneau(wrap, panneau);
    });

    barre.append(ajouter, bascule);

    const aide = document.createElement('div');
    aide.className = 'ed-wreponse-aide';
    aide.textContent = 'Une réponse par ligne. La dernière colonne porte les mots qui la font '
      + 'reconnaître, séparés par des virgules : la salle n’a pas à taper la phrase exacte, il '
      + 'suffit qu’un de ces mots soit dans ce qu’elle écrit. Laissez-la vide et ce sont les deux '
      + 'rédactions elles-mêmes qu’il faudra taper. La colonne du milieu ne sert qu’en séance '
      + 'anglaise, et peut rester vide : le français s’affiche alors dans les deux langues. '
      + 'Devant la classe, ce qui est reconnu s’inscrit en vert, le reste en rouge.';

    panneau.append(entete, liste, barre, aide);
    wrap.appendChild(panneau);
    reponseRenderPanneau(wrap, panneau);
  }

  // ───────────────────────────── Montage global ─────────────────────────────

  function mountOne(el) {
    const type = el.dataset.widget;
    if (type === 'poll') mountPoll(el);
    else if (type === 'scale') mountScale(el);
    else if (type === 'piechart') mountPieChart(el);
    else if (type === 'histogram') mountHistogram(el);
    else if (type === 'reponse') mountReponse(el);
  }

  function mountAll(root) {
    root = root || document;
    if (root.dataset && root.dataset.widget) mountOne(root);
    root.querySelectorAll('[data-widget]').forEach(mountOne);
  }

  // Re-pose les contrôles d'édition (option/zone à ajouter ou retirer) sur les
  // widgets déjà présents dans une diapo qu'on rouvre en édition — ces contrôles
  // ont été retirés du HTML à la fermeture précédente (cf. teardownEditAffordances
  // dans shared-deck-engine.js).
  function setupEditControls(root) {
    root.querySelectorAll('[data-widget="poll"]').forEach(attachPollEditControls);
    root.querySelectorAll('[data-widget="scale"]').forEach(attachScaleEditControls);
    root.querySelectorAll('[data-widget="histogram"]').forEach(attachHistoEditControls);
    root.querySelectorAll('[data-widget="piechart"]').forEach(attachPieEditControls);
    root.querySelectorAll('[data-widget="reponse"]').forEach(attachReponseEditControls);
  }

  // « Revoir depuis le début » efface ce qu'une salle a tapé. Les widgets de ce fichier
  // gardent leur contenu (les votes d'un sondage sont enregistrés, c'est voulu) ; seul
  // celui-ci porte de l'état de séance, et lui seul se remet à zéro.
  function resetAll(root) {
    (root || document).querySelectorAll('[data-widget="reponse"]').forEach(resetReponse);
  }

  // Recolore les camemberts existants au changement de thème clair/sombre, et retraduit les
  // widgets de réponses au changement de drapeau. On observe l'attribut plutôt que de
  // s'abonner à Deck.onLanguageChange : ce fichier s'ajoute à une page sans rien y coder,
  // et DeckWidgetSetLang appartient déjà à shared-comments-theme.js.
  new MutationObserver(recs => {
    if (recs.some(r => r.attributeName === 'data-theme')) {
      document.querySelectorAll('[data-widget="piechart"]').forEach(renderPieChart);
    }
    if (recs.some(r => r.attributeName === 'lang')) {
      document.querySelectorAll('[data-widget="reponse"]').forEach(reponseTraduire);
    }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'lang'] });

  ready(function () {
    injectStyles();
    mountAll(document);
  });

  // ── La langue du FICHIER (11 septembre) ─────────────────────────────────────────────
  // Les libellés du widget sont écrits dans le DOM, donc ils partent dans le fichier tels
  // qu'ils sont à l'écran — et un enregistrement fait un jour où le drapeau anglais était
  // levé y a gravé « Your answer… », « Submit », « See the missing answers ». Le fichier est
  // la RÉFÉRENCE : sa langue est le français, l'anglais n'est qu'un affichage, refait au
  // montage. On fige donc avant de cloner, et on retraduit juste après : entre les deux,
  // rien n'a été peint, l'écran ne bouge pas d'une image.
  function chaqueReponse(root, faire) {
    const r = root || document;
    if (r.matches && r.matches('[data-widget="reponse"]')) faire(r);
    r.querySelectorAll('[data-widget="reponse"]').forEach(faire);
  }
  function figerLibelles(root) {
    chaqueReponse(root, wrap => {
      const saisie = wrap.querySelector(':scope > .wreponse-barre > .wreponse-saisie');
      if (saisie) saisie.setAttribute('placeholder', REP_MOTS.invite.fr);
      const valider = wrap.querySelector(':scope > .wreponse-barre > .wreponse-valider');
      if (valider) valider.textContent = REP_MOTS.valider.fr;
      const manq = wrap.querySelector(':scope > .wreponse-manquantes');
      if (manq) manq.textContent = REP_MOTS.manquantes.fr;
    });
  }
  function retraduire(root) { chaqueReponse(root, reponseTraduire); }

  window.SharedWidgets = { buildPoll, buildScale, buildPieChart, buildHistogram, buildReponse,
    mountAll, setupEditControls, resetAll, figerLibelles, retraduire };
})();
