/* ═══════════════════════════════════════════════════════════════════════
   « Pas si vite ! » — lecture d'une réponse écrite librement (25/09/2026)

   Le joueur écrit comme il écrirait à un copain : fautes, abréviations,
   majuscules en vrac. On ne corrige pas l'orthographe, on cherche des IDÉES.

   1. On normalise : minuscules, sans accents, sans ponctuation, lettres
      doublées réduites (« trooop » = « trop », « inteligence » =
      « intelligence »). Les mots-clés subissent le même traitement.
   2. Un mot-clé est un DÉBUT de mot : « recadr » reconnaît « recadrée ».
      Un mot-clé de 3 lettres ou moins, ou terminé par « $ », doit être
      un mot entier (au pluriel près) : « ia » ne reconnaît pas « iamais ».
   3. Tolérance aux fautes, seulement sur les mots-clés assez longs pour
      qu'elle ne crée pas de confusion : 1 faute à partir de 7 lettres,
      2 fautes à partir de 10. La première lettre doit être juste.
   4. Un mot-clé de plusieurs mots (« coupe du monde ») doit apparaître
      dans cet ordre, mots consécutifs.
   5. `contre` (ce qu'il ne fallait PAS conclure) ne compte que s'il n'est
      ni nié ni présenté comme une hypothèse dans la même proposition :
      « c'est de l'IA » déclenche ; « c'est pas de l'IA » et « vérifie si
      c'est de l'IA » non.

   Aucun accès au réseau : tout se passe dans le navigateur. Le module est
   aussi chargeable par Node, pour les tests (tests/analyse.test.js).
   ═══════════════════════════════════════════════════════════════════════ */
(function (racine) {
  'use strict';

  var NEGATIONS = ['pas', 'ne', 'n', 'non', 'jamais', 'aucun', 'aucune', 'rien', 'ni',
                   'not', 'no', 'never', 'isn', 'isnt', 'doesn', 'doesnt', 'dont', 'don',
                   'aren', 'arent', 'nothing'];
  var APRES = ['pas', 'not', 'point'];          // « l'IA peut pas… »
  /* Une hypothèse n'est pas une conclusion : « vérifie SI c'est de l'IA ». */
  var HYPOTHESES = ['si', 'if', 'whether', 'peut', 'maybe', 'perhaps', 'might'];

  /* « ai » est un mot-clé anglais (AI)… et un verbe français (j'ai). */
  var AMBIGUS = { fr: ['ai'], en: [] };

  function normaliser(s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/([a-z])\1+/g, '$1')
      .trim();
  }

  /* Les propositions : on coupe sur la ponctuation forte et sur « mais »,
     pour qu'une négation ne porte pas sur toute la réponse. */
  function propositions(texte) {
    return String(texte || '')
      .split(/[.!?;:\n]+|\bmais\b|\bbut\b|\bpourtant\b|\bhowever\b/i)
      .map(function (p) { return normaliser(p); })
      .filter(Boolean)
      .map(function (p) { return p.split(' '); });
  }

  /* Distance d'édition avec transposition (« recadrée » / « recardée »). */
  function distance(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) { d[i] = [i]; }
    for (j = 0; j <= n; j++) { d[0][j] = j; }
    for (i = 1; i <= m; i++) {
      for (j = 1; j <= n; j++) {
        var c = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
    }
    return d[m][n];
  }

  function preparer(cle) {
    var entier = /\$$/.test(cle);
    if (entier) cle = cle.slice(0, -1);
    return { mots: normaliser(cle).split(' ').filter(Boolean), entier: entier, brut: cle };
  }

  function motCorrespond(tok, m, entier) {
    if (!tok || !m) return false;
    if (entier || m.length <= 3) {
      if (tok === m || tok === m + 's') return true;
      return m.length >= 7 && tok[0] === m[0] && distance(tok, m) <= 1;
    }
    if (tok.lastIndexOf(m, 0) === 0) return true;          // début de mot
    if (m.length < 7 || tok[0] !== m[0]) return false;
    var tol = m.length >= 10 ? 2 : 1;
    var min = Math.max(1, m.length - tol), max = Math.min(tok.length, m.length + tol);
    for (var L = min; L <= max; L++) {
      if (distance(tok.slice(0, L), m) <= tol) return true;
    }
    return false;
  }

  /* Toutes les positions [proposition, indice] où la clé apparaît. */
  function positions(props, cle) {
    var res = [];
    props.forEach(function (toks, p) {
      for (var i = 0; i + cle.mots.length <= toks.length; i++) {
        var ok = true;
        for (var k = 0; k < cle.mots.length && ok; k++) {
          var dernier = (k === cle.mots.length - 1);
          ok = motCorrespond(toks[i + k], cle.mots[k], cle.entier || !dernier && cle.mots[k].length <= 3);
        }
        if (ok) res.push([p, i]);
      }
    });
    return res;
  }

  function utilisable(cle, lang) {
    var amb = AMBIGUS[lang] || [];
    return cle.mots.length && !(cle.mots.length === 1 && amb.indexOf(cle.mots[0]) >= 0);
  }

  function estNie(toks, i, long) {
    for (var a = 0; a < i; a++) {
      if (NEGATIONS.indexOf(toks[a]) >= 0 || HYPOTHESES.indexOf(toks[a]) >= 0) return true;
    }
    for (var b = i + long; b < Math.min(toks.length, i + long + 3); b++) {
      if (APRES.indexOf(toks[b]) >= 0) return true;
    }
    return false;
  }

  /* → { idees: [indices des idées reconnues], contre: bool, vide: bool } */
  function analyser(texte, scenario, lang) {
    lang = lang === 'en' ? 'en' : 'fr';
    var props = propositions(texte);
    var nbMots = props.reduce(function (n, t) { return n + t.length; }, 0);
    var idees = [];
    (scenario.idees || []).forEach(function (idee, n) {
      var vu = idee.mots.some(function (brut) {
        var cle = preparer(brut);
        return utilisable(cle, lang) && positions(props, cle).length > 0;
      });
      if (vu) idees.push(n);
    });
    var contre = false;
    if (scenario.contre) {
      contre = scenario.contre.mots.some(function (brut) {
        var cle = preparer(brut);
        if (!utilisable(cle, lang)) return false;
        return positions(props, cle).some(function (pos) {
          return !estNie(props[pos[0]], pos[1], cle.mots.length);
        });
      });
    }
    return { idees: idees, contre: contre, vide: nbMots === 0 };
  }

  var api = { normaliser: normaliser, distance: distance, analyser: analyser, motCorrespond: motCorrespond };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  racine.PSV_ANALYSE = api;
})(typeof window !== 'undefined' ? window : globalThis);
