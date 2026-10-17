/* Couper un fichier de formation en diapos, et nommer une diapo. Trois fonctions pures,
   sans acces disque et sans dependance : c'est la SEULE facon de couper un index.html dans
   tout le depot.

   Pourquoi ce fichier existe (etape Z6, 9 septembre 2026). Ces trois fonctions vivaient
   dans `admin/migrate.js` et `admin/registry-core.js`, c'est-a-dire dans l'atelier, alors
   que ce sont la presentation (`shared-deck-engine.js`) et le catalogue qui s'en servent
   tous les jours. Le registre s'eteint et l'atelier avec ; ces trois-la restent. Elles
   deviennent donc un module a elles, a la racine, a cote de `shared-deck-engine.js`.

   Charge par une balise <script> (le navigateur refuse fetch sur file://) ou par
   `require()` en Node : les bancs et les outils du depot s'en servent tels quels. */
(function (racine) {
  const SECTION_TAG_RE = /<section\b[^>]*>|<\/section>/g;

  // Decoupe html en {head, sections:[{attrsRaw, legacyId, contentHtml, comment}], foot}.
  // Utilise un compteur de profondeur pour retrouver la fermeture correspondant a chaque
  // <section> de premier niveau, meme si des <section> imbriquees apparaissaient un jour
  // (aucune actuellement, mais plus robuste qu'un split naif).
  function splitSections(html) {
    SECTION_TAG_RE.lastIndex = 0;
    const stack = [];
    const ranges = [];
    let m;
    while ((m = SECTION_TAG_RE.exec(html))) {
      const isClose = m[0] === '</section>';
      if (!isClose) {
        stack.push(m.index);
      } else if (stack.length) {
        const start = stack.pop();
        if (stack.length === 0) {
          ranges.push({ start, end: m.index + m[0].length });
        }
      }
    }
    if (!ranges.length) {
      return { head: html, sections: [], foot: '' };
    }
    let head = html.slice(0, ranges[0].start);
    const foot = html.slice(ranges[ranges.length - 1].end);
    // Le commentaire HTML juste avant une <section> (ex. "<!-- 5b. Verite-metre -->")
    // n'appartient a aucune section ni a head/foot une fois les diapos separees —
    // capture ici sur la diapo qui suit, pour ne pas le perdre. Seul le dernier
    // commentaire du "gap" est repris (habituellement le seul).
    function captureTrailingComment(gap) {
      const m = gap.match(/<!--[\s\S]*?-->\s*$/);
      return m ? m[0].trim() : null;
    }
    const firstComment = captureTrailingComment(head);
    if (firstComment) head = head.slice(0, head.lastIndexOf(firstComment));
    const sections = ranges.map((r, i) => {
      const block = html.slice(r.start, r.end);
      const openMatch = block.match(/^<section\s*([^>]*)>/);
      const attrsRaw = openMatch ? openMatch[1].trim() : '';
      const openLen = openMatch ? openMatch[0].length : 0;
      const contentHtml = block.slice(openLen, block.length - '</section>'.length);
      const idMatch = attrsRaw.match(/\bid="([^"]+)"/);
      const comment = i === 0 ? firstComment : captureTrailingComment(html.slice(ranges[i - 1].end, r.start));
      return {
        attrsRaw,
        legacyId: idMatch ? idMatch[1] : null,
        contentHtml,
        comment,
      };
    });
    return { head, sections, foot };
  }

  // Le texte, sans les balises ni les entites : ce qu'on lit dans une liste.
  function texteNu(html) {
    return String(html || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, '\'')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Le titre qu'on cherche des yeux : le h1/h2 francais, sinon le kicker, sinon le debut du
  // texte. Une diapo sans titre n'est pas une erreur — beaucoup n'en ont pas — mais elle
  // doit rester reconnaissable dans une liste de 330.
  function titreDeDiapo(html) {
    const s = String(html || '');
    // Un bloc marque « titre de la diapo » l'emporte sur la devinette (13 septembre) : c'est
    // l'auteur qui a dit lequel nomme la diapo. Le moteur lit la meme marque, a l'ecran.
    const marque = s.match(/<(h1|h2|h3|p|li|blockquote|div|span)\b[^>]*\bclass="[^"]*\btitre-diapo\b[^"]*"[^>]*>([\s\S]*?)<\/\1>/i);
    if (marque) {
      const fr = marque[2].match(/<span[^>]*\bt-fr\b[^>]*>([\s\S]*?)<\/span>/i);
      const t = texteNu(fr ? fr[1] : marque[2]);
      if (t) return t;
    }
    const bloc = s.match(/<(h1|h2)\b[^>]*>([\s\S]*?)<\/\1>/i);
    if (bloc) {
      const fr = bloc[2].match(/<span[^>]*\bt-fr\b[^>]*>([\s\S]*?)<\/span>/i);
      const t = texteNu(fr ? fr[1] : bloc[2]);
      if (t) return t;
    }
    const kicker = s.match(/\bkicker\b[^>]*>([\s\S]*?)<\/[a-z]/i);
    if (kicker) {
      const t = texteNu(kicker[1]);
      if (t) return t;
    }
    const tout = texteNu(s);
    return tout ? tout.slice(0, 80) : '';
  }

  const api = { splitSections, texteNu, titreDeDiapo };
  racine.CoursDiapos = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
