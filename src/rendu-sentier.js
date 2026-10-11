(function (global) {
  // Le plateau sur téléphone (maquette B validée le 06/10/2026) : un sentier
  // vertical en lacets, sommet en haut, que l'on fait défiler au doigt, et une
  // jauge d'altitude à droite pour toute la partie. Le HTML est produit en
  // texte (testable sous Node) ; l'écran le pose, fait défiler jusqu'au
  // joueur suivi et place la fenêtre visible sur la jauge.
  var RP = (typeof require !== "undefined") ? require("./rendu-plateau.js") : global.RenduPlateau;
  var LACETS = [0, 1, 2, 1];
  var esc = RP.esc, altitude = RP.altitude, couleurTexte = RP.couleurTexte, initiale = RP.initiale;

  function cran(i) { return LACETS[i % LACETS.length]; }
  // Position sur la jauge, en % depuis le haut (sommet = 0 %).
  function hauteur(position, n) { return n > 1 ? Math.round((1 - position / (n - 1)) * 1000) / 10 : 0; }

  // Couleur du joueur et texte lisible dessus (cacao sur le jaune), lus par le CSS.
  function couleurs(j) { return "--joueur:" + esc(j.couleur) + ";--joueur-texte:" + couleurTexte(j.couleur); }

  // Le pion montre l'initiale ; le prénom entier est lu par les lecteurs d'écran.
  function pion(j, actif) {
    return '<span class="sentier-pion' + (j.id === actif ? " sentier-pion-actif" : "") + '" role="img" aria-label="' +
      esc(j.prenom || "") + '" style="' + couleurs(j) + '">' + esc(initiale(j.prenom)) + "</span>";
  }

  // Repères de la jauge, dans l'ordre des joueurs. Deux repères à moins de
  // PROCHE % l'un de l'autre se masqueraient : on les décale de part et d'autre
  // de la jauge, et en escalier au-delà de deux (maquette, vue 7).
  var PROCHE = 3.5;
  function reperes(visibles, n) {
    var tries = visibles.map(function (j, k) { return { j: j, k: k, h: hauteur(j.position, n), decale: "" }; })
      .sort(function (a, b) { return a.h - b.h || a.k - b.k; });
    var groupes = [];
    tries.forEach(function (t, i) {
      if (i > 0 && t.h - tries[i - 1].h < PROCHE) groupes[groupes.length - 1].push(t);
      else groupes.push([t]);
    });
    groupes.forEach(function (g) {
      if (g.length < 2) return;
      g.forEach(function (t, i) {
        t.decale = ";left:" + (i % 2 ? 3 : -11) + "px" + (i > 1 ? ";margin-top:" + (12 * Math.floor(i / 2) - 11) + "px" : "");
      });
    });
    return tries.sort(function (a, b) { return a.k - b.k; }).map(function (t) {
      return '<span class="jauge-pion" style="top:' + t.h + "%;" + couleurs(t.j) + t.decale + '"></span>';
    });
  }

  function picto(type) {
    return '<svg class="sentier-picto" viewBox="0 0 12 12" aria-hidden="true"><g fill="none" stroke="currentColor" ' +
      'stroke-width="1" stroke-linecap="round" stroke-linejoin="round">' + RP.ICONES[type] + "</g></svg>";
  }

  // o : { actif (id du joueur cerclé), arrivee (index de la case mise en valeur) }
  function html(plateau, joueurs, bib, o) {
    o = o || {};
    var n = plateau.cases.length, parCase = {};
    var visibles = RP.visibles(joueurs, n);
    visibles.forEach(function (j) { (parCase[j.position] = parCase[j.position] || []).push(j); });
    var lignes = [];
    for (var i = n - 1; i >= 0; i--) {
      var c = plateau.cases[i], type = RP.typeCase(c), special = type !== "exercice" && type !== "neutre";
      var nom = special ? RP.NOMS[type] : type === "exercice" ? ((bib.chaine(c.chaine) || {}).nom || "") : "";
      var vers = RP.destination(c);
      var fond = type === "sommet" ? "var(--cuivre)" : RP.teinte(i, n, special);
      lignes.push('<li class="sentier-case case-' + type + (special ? " sentier-speciale" : "") +
        (i === o.arrivee ? " sentier-arrivee" : "") + '" data-case="' + i + '" style="--cran:' + cran(i) + ";background:" + fond + '">' +
        '<span class="sentier-num">' + (i + 1) + "</span>" + (special ? picto(type) : "") +
        '<span class="sentier-nom">' + esc(nom) +
        (vers !== null ? '<small class="sentier-cible">vers ' + vers + "</small>" : "") + "</span>" +
        '<span class="sentier-alt">' + altitude(plateau.altitudes[i]) + "</span>" +
        (parCase[i] ? '<span class="sentier-pions">' + parCase[i].map(function (j) { return pion(j, o.actif); }).join("") + "</span>" : "") +
        "</li>");
    }
    return '<div class="sentier"><ol class="sentier-cases" reversed>' + lignes.join("") + "</ol>" +
      '<div class="jauge" aria-hidden="true"><span class="jauge-sommet">' + altitude(plateau.altitudes[n - 1]) +
      '</span><span class="jauge-depart">' + altitude(plateau.altitudes[0]) +
      '</span><span class="jauge-fenetre"></span>' + reperes(visibles, n).join("") + "</div></div>";
  }

  var RenduSentier = { html: html, hauteur: hauteur, cran: cran };
  if (typeof module !== "undefined" && module.exports) module.exports = RenduSentier;
  else global.RenduSentier = RenduSentier;
})(typeof globalThis !== "undefined" ? globalThis : this);
