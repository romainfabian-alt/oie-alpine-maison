(function (global) {
  var R = (typeof require !== "undefined") ? require("./referentiel.js") : global.Referentiel;

  function creer(chaines) {
    var parId = {};
    chaines.forEach(function (c) { parId[c.id] = c; });
    function presentes(ids) { return ids.filter(function (id) { return !!parId[id]; }); }
    return {
      chaine: function (id) { return parId[id] || null; },
      ids: function () { return Object.keys(parId); },
      idsFamille: function (f) { return presentes(R.FAMILLES[f] || []); },
      idsTheme: function (t) { return presentes(R.chainesTheme(t)); }
    };
  }

  var NOMS = [
    ["chaines-membre-inferieur.js", "CHAINES_MEMBRE_INFERIEUR"],
    ["chaines-tronc.js", "CHAINES_TRONC"],
    ["chaines-membre-superieur.js", "CHAINES_MEMBRE_SUPERIEUR"],
    ["chaines-complexe.js", "CHAINES_COMPLEXE"],
    ["chaines-sports.js", "CHAINES_SPORTS"],
    ["chaines-mobilite.js", "CHAINES_MOBILITE"]
  ];

  // Charge les chaînes présentes : sous Node par require, dans le navigateur
  // par les globales posées par les scripts de contenu/.
  function defaut() {
    var toutes = [];
    NOMS.forEach(function (n) {
      var liste = null;
      if (typeof require !== "undefined") {
        try { liste = require("../contenu/" + n[0]); } catch (e) {
          // Fichier pas encore écrit : normal. Toute autre erreur (syntaxe,
          // référence) doit se voir, sinon une famille entière disparaîtrait.
          if (!(e && e.code === "MODULE_NOT_FOUND" && String(e.message).indexOf(n[0]) !== -1)) throw e;
          liste = null;
        }
      } else {
        liste = global[n[1]] || null;
      }
      if (liste) toutes = toutes.concat(liste);
    });
    return creer(toutes);
  }

  var Bibliotheque = { creer: creer, defaut: defaut, NOMS: NOMS };
  if (typeof module !== "undefined" && module.exports) module.exports = Bibliotheque;
  else global.Bibliotheque = Bibliotheque;
})(typeof globalThis !== "undefined" ? globalThis : this);
