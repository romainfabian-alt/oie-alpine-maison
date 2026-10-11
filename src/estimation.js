(function (global) {
  // Durée estimée d'une partie (écran « Ta partie ») et chrono réel (podium).
  // Modèle de L'Oie Alpine : 2,4 min par tour seul (mesure du 29/09/2026),
  // +14 % par joueur en plus (jamais mesuré). À recaler avec le chrono.
  var MINUTES_PAR_TOUR = 2.4;
  var SURCOUT_PAR_JOUEUR = 0.14;

  function minutes(tours, nbJoueurs) {
    return Math.round(tours * MINUTES_PAR_TOUR * (1 + SURCOUT_PAR_JOUEUR * (nbJoueurs - 1)) * 10) / 10;
  }

  // Une durée utilisable est un nombre fini et positif ou nul.
  function valide(min) { return typeof min === "number" && isFinite(min) && min >= 0; }
  function toursValides(t) { return typeof t === "number" && isFinite(t) && t > 0; }

  function texteDuree(min) {
    if (!valide(min)) return "";
    var arrondi = Math.max(5, Math.round(min / 5) * 5);
    if (arrondi < 60) return "≈ " + arrondi + " min";
    var h = Math.floor(arrondi / 60), reste = arrondi % 60;
    return "≈ " + h + " h" + (reste ? " " + (reste < 10 ? "0" : "") + reste : "");
  }

  // « ≈ 45 min seul · ≈ 1 h 05 à 4 » ; vide sans plateau ou sans durée calculée
  // complète (deux nombres de tours strictement positifs).
  function resume(plateau, durees) {
    var d = plateau && durees && durees[plateau.id];
    if (!d || !toursValides(d[0]) || !toursValides(d[1])) return "";
    return texteDuree(minutes(d[0], 1)) + " seul · " + texteDuree(minutes(d[1], 4)) + " à 4";
  }

  function texteChrono(min) {
    if (!valide(min)) return "";
    var m = Math.round(min);
    if (m < 60) return m + " min";
    return Math.floor(m / 60) + " h " + (m % 60 < 10 ? "0" : "") + (m % 60);
  }

  // chrono : { debut (échauffement), depart (premier lancer), fin (podium) } en ms.
  function chronoPartie(chrono, tours, nbJoueurs) {
    if (!chrono || !chrono.depart || !chrono.fin || !(tours >= 1)) return "";
    // Jamais de durée négative (horloge reculée, dates inversées) : 0 au minimum.
    var jeu = Math.max(0, (chrono.fin - chrono.depart) / 60000), echauffement = Math.max(0, (chrono.depart - chrono.debut) / 60000);
    if (!isFinite(jeu)) return "";
    return "Chrono : " + texteChrono(jeu) + " de jeu" +
      (echauffement >= 1 ? " + " + texteChrono(echauffement) + " d'échauffement" : "") +
      " · " + (jeu / tours).toFixed(1).replace(".", ",") + " min par tour" +
      (nbJoueurs > 1 ? " à " + nbJoueurs : " seul");
  }

  var Estimation = { minutes: minutes, texteDuree: texteDuree, resume: resume, texteChrono: texteChrono,
    chronoPartie: chronoPartie, MINUTES_PAR_TOUR: MINUTES_PAR_TOUR };
  if (typeof module !== "undefined" && module.exports) module.exports = Estimation;
  else global.Estimation = Estimation;
})(typeof globalThis !== "undefined" ? globalThis : this);
