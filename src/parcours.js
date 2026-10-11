(function (global) {
  // Les 660 plateaux sont stockés compacts (contenu/plateaux.js, généré) : une
  // chaîne de jetons par plateau, décodée à la demande. Les altitudes sont
  // recalculées, jamais stockées.
  var ALTITUDE_DEPART = 2100, ALTITUDE_SOMMET = 3656;   // Tignes, la Grande Motte

  function id(theme, niveau, duree) { return theme + "-" + niveau + "-" + duree; }

  function altitudes(n) {
    var res = [];
    for (var i = 0; i < n; i++) {
      res.push(i === n - 1 ? ALTITUDE_SOMMET
        : Math.round((ALTITUDE_DEPART + ((ALTITUDE_SOMMET - ALTITUDE_DEPART) * i) / (n - 1)) / 10) * 10);
    }
    return res;
  }

  // Jetons : D départ, S sommet, R refuge, C crevasse, M météo, A<cible>
  // avalanche, col:<chaîne> col, <chaîne> exercice.
  var SIMPLES = { depart: "D", sommet: "S", refuge: "R", crevasse: "C", meteo: "M" };
  var INVERSES = { D: "depart", S: "sommet", R: "refuge", C: "crevasse", M: "meteo" };

  function jeton(c) {
    if (SIMPLES[c.type]) return SIMPLES[c.type];
    if (c.type === "avalanche") {
      // Le décodage relit « A<chiffres> » : une cible absente ou non entière deviendrait un exercice.
      if (typeof c.cible !== "number" || !isFinite(c.cible) || c.cible < 0 || c.cible % 1 !== 0) {
        throw new Error("Avalanche sans cible entière : " + c.cible);
      }
      return "A" + c.cible;
    }
    if (c.type === "col") return "col:" + c.chaine;
    if (c.type === "exercice") return c.chaine;
    throw new Error("Case impossible à encoder : " + c.type);
  }

  function lireJeton(t) {
    if (INVERSES[t]) return { type: INVERSES[t] };
    if (/^A\d+$/.test(t)) return { type: "avalanche", cible: Number(t.slice(1)) };
    if (t.indexOf("col:") === 0) return t.length > 4 ? { type: "col", chaine: t.slice(4) } : null;
    return t ? { type: "exercice", chaine: t } : null;
  }

  function encoder(pl) {
    return { id: pl.id, theme: pl.theme, niveau: pl.niveau, duree: pl.duree, cases: pl.cases.map(jeton).join(" ") };
  }

  // null si l'entrée est absente ou mal formée (pas de cases, jeton vide).
  function decoder(c) {
    if (!c || typeof c.cases !== "string") return null;
    var cases = c.cases.split(" ").map(lireJeton);
    for (var i = 0; i < cases.length; i++) if (!cases[i]) return null;
    return { id: c.id, theme: c.theme, niveau: c.niveau, duree: c.duree, altitudes: altitudes(cases.length), cases: cases };
  }

  function trouverParId(compacts, ident) {
    if (!Array.isArray(compacts)) return null;
    for (var i = 0; i < compacts.length; i++) if (compacts[i] && compacts[i].id === ident) return decoder(compacts[i]);
    return null;
  }

  function trouver(compacts, theme, niveau, duree) { return trouverParId(compacts, id(theme, niveau, duree)); }

  var Parcours = { id: id, altitudes: altitudes, encoder: encoder, decoder: decoder, trouver: trouver,
    trouverParId: trouverParId, ALTITUDE_SOMMET: ALTITUDE_SOMMET };
  if (typeof module !== "undefined" && module.exports) module.exports = Parcours;
  else global.Parcours = Parcours;
})(typeof globalThis !== "undefined" ? globalThis : this);
