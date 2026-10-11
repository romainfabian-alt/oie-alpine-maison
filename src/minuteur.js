(function (global) {
  // Horloge fournie par l'appelant : le minuteur reste juste même si l'iPad
  // saute des images (onglet en arrière-plan, écran chargé).
  function creer(secondes) {
    var total = secondes * 1000, ecoule = 0, depuis = null;
    var m = {
      enMarche: false,
      demarrer: function (t) {
        if (m.fini(t)) ecoule = 0;
        depuis = t; m.enMarche = true;
      },
      pause: function (t) {
        if (!m.enMarche) return;
        ecoule += t - depuis; depuis = null; m.enMarche = false;
      },
      restant: function (t) {
        var e = ecoule + (m.enMarche ? t - depuis : 0);
        return Math.max(0, Math.ceil((total - e) / 1000 - 1e-9));
      },
      fini: function (t) { return m.restant(t) === 0; }
    };
    return m;
  }

  // Bips du minuteur (cahier des charges, 9.4) : un bip court à 3, 2 et 1 s,
  // le bip final à 0. precedent : secondes restantes à l'affichage précédent
  // (un écran resté en arrière-plan ne rattrape qu'un seul bip).
  function aBiper(precedent, reste) {
    if (reste === precedent) return null;
    if (reste === 0) return precedent > 0 ? "fin" : null;
    if (reste <= 3 && reste < precedent) return "court";
    return null;
  }

  var Minuteur = { creer: creer, aBiper: aBiper };
  if (typeof module !== "undefined" && module.exports) module.exports = Minuteur;
  else global.Minuteur = Minuteur;
})(typeof globalThis !== "undefined" ? globalThis : this);
