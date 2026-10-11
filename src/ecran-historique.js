(function (global) {
  // Mes parties : ce qui a été joué sur cet appareil, du plus récent au plus
  // ancien, et le nombre de parties du mois. Rien ne quitte l'appareil.
  var R = (typeof require !== "undefined") ? require("./referentiel.js") : global.Referentiel;
  var S = (typeof require !== "undefined") ? require("./sauvegarde.js") : global.Sauvegarde;
  var F = (typeof require !== "undefined") ? require("./format.js") : global.Format;

  var JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
  var MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

  // « mar. 6 oct. » ; « mer. 31 déc. 2025 » quand la partie date d'une autre année que maintenant (par défaut, l'heure
  // de l'appareil) ; vide si la date n'est pas lisible (entrée abîmée).
  function date(ms, maintenant) {
    var d = new Date(ms);
    if (isNaN(d.getTime())) return "";
    var ref = new Date(typeof maintenant === "number" ? maintenant : Date.now());
    var annee = !isNaN(ref.getTime()) && ref.getFullYear() !== d.getFullYear() ? " " + d.getFullYear() : "";
    return JOURS[d.getDay()] + " " + d.getDate() + " " + MOIS[d.getMonth()] + annee;
  }
  function rangTexte(r) { return r === 1 ? "1er" : r + "e"; }
  function entier(n) { return typeof n === "number" && n % 1 === 0 && n > 0; }

  // Une entrée vient de l'appareil : ce qui manque ou est abîmé est simplement omis.
  function lignes(e, maintenant) {
    var theme = Object.prototype.hasOwnProperty.call(R.THEMES, e.theme) ? R.THEMES[e.theme].libelle : "";
    var temps = entier(e.minutes) ? e.minutes + " min de jeu" : entier(e.duree) ? e.duree + " min" : "";
    var titre = [theme, entier(e.niveau) ? "niveau " + e.niveau : "", temps].filter(function (m) { return m; }).join(" · ");
    var liste = Array.isArray(e.joueurs) ? e.joueurs : [];
    var nom = function (j, i) { return j && typeof j.prenom === "string" && j.prenom ? j.prenom : "Joueur " + (i + 1); };
    var joueurs = liste.length === 1
      ? nom(liste[0], 0) + (e.complete ? ", au sommet" : ", partie arrêtée en route")
      : liste.map(function (j, i) { return (j && entier(j.rang) ? rangTexte(j.rang) + " " : "") + nom(j, i); }).join(" · ");
    return { date: date(e.date, maintenant), titre: titre, joueurs: joueurs };
  }

  // « Ce mois-ci : 5 parties », en trois morceaux pour que le nombre ressorte à l'écran.
  function morceauxCompteur(n) { return ["Ce mois-ci : ", String(n), n > 1 ? " parties" : " partie"]; }
  function compteur(n) { return morceauxCompteur(n).join(""); }

  function afficher(racine, o) {
    var UI = global.UI;
    UI.vider(racine);
    var historique = Array.isArray(o.historique) ? o.historique : [];
    var maintenant = typeof o.maintenant === "number" ? o.maintenant : Date.now();
    var m = morceauxCompteur(S.duMois(historique, maintenant));
    var liste = historique.length
      ? historique.map(function (e) {
          var l = lignes(e, maintenant);
          return UI.el("li", { classe: "partie-passee" }, [UI.el("p", { classe: "partie-date", texte: l.date }),
            UI.el("p", { classe: "partie-titre", texte: F.typo(l.titre) }), UI.el("p", { classe: "partie-joueurs", texte: l.joueurs })]);
        })
      : [UI.el("li", { classe: "historique-vide", texte: "Aucune partie pour l'instant. La première t'attend !" })];
    racine.appendChild(UI.el("section", { classe: "ecran ecran-historique" }, [
      UI.el("header", { classe: "bandeau" }, [
        UI.el("div", { classe: "bandeau-gauche" }, [UI.retour(o.surRetour),
          UI.el("h2", { classe: "titre-ecran", texte: "Mes parties" })])
      ]),
      UI.el("main", { classe: "historique" }, [
        UI.el("p", { classe: "historique-compteur" }, [F.typo(m[0]), UI.el("b", { classe: "nombre", texte: m[1] }), m[2]]),
        UI.el("p", { classe: "aide", texte: "Gardé sur cet appareil seulement." }),
        UI.el("ul", { classe: "historique-liste" }, liste)
      ]),
      historique.length ? UI.el("footer", { classe: "pied" }, [UI.bouton("Tout effacer", function () {
        UI.modal("Tout effacer ?", "L'historique de cet appareil sera supprimé.", [
          { texte: "Annuler" }, { texte: "Effacer", classe: "bouton-principal", action: o.surEffacer }]);
      }, "bouton-bloc")]) : null
    ]));
  }

  var EcranHistorique = { afficher: afficher, date: date, lignes: lignes, compteur: compteur };
  if (typeof module !== "undefined" && module.exports) module.exports = EcranHistorique;
  else global.EcranHistorique = EcranHistorique;
})(typeof globalThis !== "undefined" ? globalThis : this);
