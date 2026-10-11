(function (global) {
  // Ce que l'app garde sur l'appareil, et seulement là : derniers réglages,
  // partie en cours, historique. Rien n'est transmis. Toute lecture ou
  // écriture est protégée : un stockage absent, plein, bloqué ou abîmé ne
  // bloque jamais le jeu (on repart de zéro).
  var CLES = { reglages: "oieMaison.reglages", partie: "oieMaison.partie", historique: "oieMaison.historique" };
  // Version de la partie enregistrée. À INCRÉMENTER quand contenu/plateaux.js est régénéré après une publication (une partie
  // en cours enregistrée avec les anciens plateaux ne se restaurerait plus, et échouerait à chaque « Reprendre » jusqu'à
  // « Abandonner ») ou quand la forme de l'état d'une partie change. Une sauvegarde d'une autre version est ignorée et
  // effacée à l'ouverture de l'application (app.js, reprisePossible) : le joueur repart d'une partie neuve, sans blocage.
  var VERSION = 1;
  var HISTORIQUE_MAX = 200;

  function entierEntre(n, min, max) { return typeof n === "number" && n % 1 === 0 && n >= min && n <= max; }

  function joueurDeReglagesValide(j) {
    return !!j && typeof j === "object" && typeof j.prenom === "string" && entierEntre(j.niveau, 1, 20) && Array.isArray(j.filtres);
  }

  function entreeValide(e) {
    return !!e && typeof e === "object" && typeof e.date === "number" && typeof e.theme === "string" && Array.isArray(e.joueurs);
  }

  function creer(stockage) {
    function lire(cle) {
      try { var t = stockage.getItem(cle); return t ? JSON.parse(t) : null; } catch (e) { return null; }
    }
    function ecrire(cle, valeur) {
      try { stockage.setItem(cle, JSON.stringify(valeur)); return true; } catch (e) { return false; }
    }
    function effacer(cle) {
      try { stockage.removeItem(cle); } catch (e) { /* stockage bloqué : sans gravité */ }
    }
    function lireHistorique() {
      var h = lire(CLES.historique);
      return Array.isArray(h) ? h.filter(entreeValide) : [];
    }
    return {
      lireReglages: function () {
        var r = lire(CLES.reglages);
        return r && typeof r === "object" && typeof r.theme === "string" && Array.isArray(r.joueurs) && r.joueurs.length > 0 &&
          r.joueurs.every(joueurDeReglagesValide) ? r : null;
      },
      ecrireReglages: function (r) { return ecrire(CLES.reglages, r); },
      // Rend la partie seulement si son état a la forme d'une partie (joueurs et
      // tour présents). Règle d'usage pour l'écran de reprise : on appelle
      // ensuite Regles.restaurer, et si elle lève, on efface la sauvegarde
      // (effacerPartie) et on démarre normalement.
      lirePartie: function () {
        var s = lire(CLES.partie);
        return s && s.version === VERSION && typeof s.plateau === "string" && s.etat && typeof s.etat === "object" &&
          Array.isArray(s.etat.joueurs) && s.etat.joueurs.length > 0 && typeof s.etat.tour === "number" ? s : null;
      },
      // ecritA (facultatif) : l'heure de l'écriture, à côté de l'état. Le chrono de l'état est fait
      // d'horodatages absolus : à la reprise, l'app s'en sert pour ne pas compter le temps où elle était fermée.
      ecrirePartie: function (plateauId, etat, ecritA) {
        var s = { version: VERSION, plateau: plateauId, etat: etat };
        if (typeof ecritA === "number" && isFinite(ecritA)) s.ecrit = ecritA;
        return ecrire(CLES.partie, s);
      },
      effacerPartie: function () { effacer(CLES.partie); },
      lireHistorique: lireHistorique,
      ajouterHistorique: function (e) { return ecrire(CLES.historique, [e].concat(lireHistorique()).slice(0, HISTORIQUE_MAX)); },
      effacerHistorique: function () { effacer(CLES.historique); }
    };
  }

  // Ligne d'historique d'une partie finie (podium atteint).
  function entree(p, maintenant) {
    var c = p.chrono || {}, derniere = p.plateau.cases.length - 1;
    return {
      date: maintenant, theme: p.plateau.theme, niveau: p.plateau.niveau, duree: p.plateau.duree,
      minutes: typeof c.depart === "number" && typeof c.fin === "number" ? Math.round((c.fin - c.depart) / 60000) : null,
      tours: p.tour,
      complete: p.joueurs.every(function (j) { return j.position === derniere; }),
      joueurs: p.joueurs.slice().sort(function (a, b) { return a.rang - b.rang || a.id - b.id; })
        .map(function (j) { return { prenom: j.prenom, niveau: j.niveau, rang: j.rang }; })
    };
  }

  function duMois(historique, maintenant) {
    var d = new Date(maintenant);
    return historique.filter(function (e) {
      var x = new Date(e.date);
      return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth();
    }).length;
  }

  var Sauvegarde = { creer: creer, entree: entree, duMois: duMois, CLES: CLES, HISTORIQUE_MAX: HISTORIQUE_MAX };
  if (typeof module !== "undefined" && module.exports) module.exports = Sauvegarde;
  else global.Sauvegarde = Sauvegarde;
})(typeof globalThis !== "undefined" ? globalThis : this);
