(function (global) {
  // Mise en forme des dosages et du matériel, partagée par les écrans du jeu et
  // par le document de relecture. Un seul endroit décide de « × 12 » ou « 1 min 30 s ».
  var R = (typeof require !== "undefined") ? require("./referentiel.js") : global.Referentiel;

  function duree(s) {
    if (s < 60) return s + " s";
    var m = Math.floor(s / 60), r = s % 60;
    return r ? m + " min " + r + " s" : m + " min";
  }

  // multiplicateur facultatif (défaut 1) : les cases « col difficile » majorent le
  // dosage. Le résultat est toujours arrondi à l'entier, jamais affiché en décimal.
  function dosage(d, unilateral, multiplicateur) {
    var valeur = Math.round(d.valeur * (multiplicateur || 1));
    var base = d.type === "reps" ? "× " + valeur : duree(valeur);
    return unilateral ? base + " / côté" : base;
  }

  function materiel(cles) {
    return cles.map(function (c) { return R.MATERIEL[c] || c; }).join(", ");
  }

  // Typographie française des textes affichés (espaces insécables) : un « : », un « ? » ou
  // une unité ne se retrouve jamais seul en début de ligne. Les textes gardés dans les
  // données restent en espaces simples ; on l'applique au moment de les écrire à l'écran.
  var NB = "\u00A0";
  function typo(texte) {
    return String(texte == null ? "" : texte)
      .replace(/ ([:;?!»])/g, NB + "$1")                                         // avant : ; ? ! »
      .replace(/« /g, "«" + NB)                                                  // après «
      .replace(/(\d) (?=\d{3}(?!\d))/g, "$1" + NB)                              // 3 656
      .replace(/(\d) (?=(?:m|min|h|s|cases?)(?![A-Za-zÀ-ÿ]))/g, "$1" + NB)       // 45 min, 1 h, +3 cases
      .replace(/(^|[^A-Za-zÀ-ÿ])(h|à|sur|niveau|tour) (?=\d)/g, "$1$2" + NB)     // h 20, à 4, sur 20, niveau 12
      .replace(/([≈×]) /g, "$1" + NB)
      .replace(/ ×/g, NB + "×");
  }

  var Format = { dosage: dosage, materiel: materiel, duree: duree, typo: typo };
  if (typeof module !== "undefined" && module.exports) module.exports = Format;
  else global.Format = Format;
})(typeof globalThis !== "undefined" ? globalThis : this);
