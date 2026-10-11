(function (global) {
  // Nettoyage du prénom saisi : retire les espaces de début et de fin avant
  // stockage ou affichage. Le champ de saisie garde la valeur brute pendant
  // la frappe (voir ecran-joueurs.js) pour ne pas gêner un prénom composé
  // comme « Marie Laure » ; ce nettoyage n'intervient qu'au moment de
  // constituer la liste des joueurs ou d'afficher le prénom ailleurs.
  function nettoyer(prenom) {
    return String(prenom == null ? "" : prenom).replace(/^\s+|\s+$/g, "");
  }

  var Prenoms = { nettoyer: nettoyer };
  if (typeof module !== "undefined" && module.exports) module.exports = Prenoms;
  else global.Prenoms = Prenoms;
})(typeof globalThis !== "undefined" ? globalThis : this);
