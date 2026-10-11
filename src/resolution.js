(function (global) {
  var F = (typeof require !== "undefined") ? require("./format.js") : global.Format;
  var R = (typeof require !== "undefined") ? require("./referentiel.js") : global.Referentiel;

  // joueur : { niveau, filtres, espace }. En « petit » espace, les variantes
  // avec déplacement sont écartées comme par un filtre.
  function compatible(v, joueur) {
    if (joueur.espace === "petit" && v.deplacement) return false;
    for (var i = 0; i < joueur.filtres.length; i++) {
      if (v.incompatible.indexOf(joueur.filtres[i]) !== -1) return false;
    }
    return true;
  }

  // Un filtre qui ôte tout sens à une chaîne la fait remplacer (exclueParFiltre).
  function chaineEffective(bib, id, joueur) {
    var c = bib.chaine(id);
    var exclue = (c && c.exclueParFiltre) || {};
    for (var i = 0; i < joueur.filtres.length; i++) {
      if (exclue[joueur.filtres[i]]) return bib.chaine(exclue[joueur.filtres[i]]);
    }
    return c;
  }

  // Sûreté : on part du niveau du joueur (20 au plus) et on ne fait que descendre.
  // options : { alea,
  //   eviter    : nom de la variante à éviter, tel quel ;
  //   dernieres : table { idChaine: nomDeVariante } des dernières variantes
  //               faites par le joueur. Elle est lue une fois la chaîne
  //               effective connue (après substitution par un filtre), pas avec
  //               l'identifiant demandé. Ignorée si eviter est fourni. }
  function resoudre(bib, idChaine, joueur, options) {
    var c = chaineEffective(bib, idChaine, joueur);
    if (!c) return { recuperation: true };
    var eviter = options.eviter;
    if (!eviter && options.dernieres && Object.prototype.hasOwnProperty.call(options.dernieres, c.id)) {
      eviter = options.dernieres[c.id];
    }
    for (var n = Math.min(R.NIVEAU_MAX, joueur.niveau); n >= 1; n--) {
      var candidates = c.niveaux[String(n)].filter(function (v) { return compatible(v, joueur); });
      if (!candidates.length) continue;
      if (eviter && candidates.length > 1) {
        var autres = candidates.filter(function (v) { return v.nom !== eviter; });
        if (autres.length) candidates = autres;
      }
      return { recuperation: false, chaine: c.id, niveau: n, variante: options.alea.parmi(candidates) };
    }
    return { recuperation: true };
  }

  function carte(resultat, evenements, multiplicateur) {
    var m = multiplicateur || 1;
    if (resultat.recuperation) {
      var r = evenements.recuperation;
      return { titre: r.nom, description: r.description, materiel: "", dosage: F.dosage(r.dosage, false),
        secondes: r.dosage.valeur, unilateral: false };
    }
    var v = resultat.variante, materiel = v.materiel.filter(function (k) { return k !== "aucun"; });
    return {
      titre: v.nom, description: v.description, materiel: materiel.length ? F.materiel(materiel) : "",
      dosage: F.dosage(v.dosage, v.unilateral, m),
      secondes: v.dosage.type === "duree" ? Math.round(v.dosage.valeur * m) : null,
      unilateral: v.unilateral
    };
  }

  // Lignes d'échauffement compatibles avec tous les filtres réunis des joueurs
  // et l'espace choisi, en texte « Nom : dosage ».
  function lignesEchauffement(ev, theme, filtres, espace) {
    return ((ev.echauffements || {})[theme] || []).filter(function (l) {
      if (espace === "petit" && l.deplacement) return false;
      return !l.incompatible.some(function (f) { return filtres.indexOf(f) !== -1; });
    }).map(function (l) { return l.texte; });
  }

  var Resolution = { resoudre: resoudre, carte: carte, lignesEchauffement: lignesEchauffement };
  if (typeof module !== "undefined" && module.exports) module.exports = Resolution;
  else global.Resolution = Resolution;
})(typeof globalThis !== "undefined" ? globalThis : this);
