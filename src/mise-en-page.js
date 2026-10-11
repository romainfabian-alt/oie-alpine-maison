(function (global) {
  // Mise en page selon l'écran (cahier des charges, 9.2) : « large » (plateau
  // entier, cartes côte à côte) en paysage à partir de 900 px de large ;
  // « tourner » (message) en paysage sous 500 px de haut, soit un téléphone
  // couché ; « etroit » (sentier, onglets) partout ailleurs. En mode large, les cartes d'effort se mettent côte à côte ou en
  // onglets selon la place (disposition, plus bas).
  function mode(largeur, hauteur) {
    var paysage = largeur > hauteur;
    if (paysage && hauteur < 500) return "tourner";
    if (paysage && largeur >= 900) return "large";
    return "etroit";
  }

  // Cartes d'effort en mode « large » : côte à côte, ou en onglets (la disposition du téléphone, une carte à la fois).
  // Côte à côte seulement quand la fenêtre est assez grande pour que le contenu LE PLUS LONG de la bibliothèque tienne dans chaque
  // carte : titre sur 4 lignes, type sur 2 lignes, « Version plus facile », matériel, minuteur « / côté » à deux côtés, les deux
  // liens, avec « Fait », « Trop dur / douleur » et « Piolet » entiers et au moins 3 lignes de description visibles (le reste défile
  // dans la carte). Sinon, la disposition du téléphone, qui tient dès 900 × 500.
  //
  // SEUILS : pour chaque nombre de cartes, les fenêtres (largeur mini, hauteur mini) où les cartes tiennent côte à côte ; il suffit
  // qu'une des paires soit atteinte. Mesurés dans Chrome (écran de partie réel, contenu le plus long, 10 largeurs de 900 à 1440 px,
  // hauteurs de 500 à 1100 px par pas de 20) : la plus petite hauteur dont toutes les hauteurs supérieures sont saines vaut
  //   1 carte  : 680 px à toute largeur
  //   2 cartes : 720 px jusqu'à 1024 de large, 700 à 1100-1180, 680 au-delà
  //   3 cartes : 720 px dès 1000 de large (740 à 960, 880 à 900)
  //   4 cartes : 950 px à 1133 de large, 820 à 1180, 740 à 1280, 720 à 1366 et plus ; rien d'assez petit sous 1133
  // Les seuils ci-dessous ajoutent 20 px de marge à ces mesures (polices et arrondis d'un autre navigateur). 3 cartes sur
  // 1366 × 1024, la maquette validée, restent côte à côte, comme 4 cartes sur 1366 × 1000 (iPad Pro 12,9).
  var SEUILS = {
    1: [[900, 700]],
    2: [[900, 740]],
    3: [[1000, 740]],
    4: [[1366, 740], [1280, 760], [1180, 840], [1133, 970]]
  };

  // « cotes » ou « onglets », pour une fenêtre largeur × hauteur (en px) et nbCartes cartes à faire. Ne tient pas compte du
  // mode : l'appelant ne la consulte qu'en mode « large ». Un nombre de cartes hors de 1 à 4 est ramené dans cet intervalle.
  function disposition(largeur, hauteur, nbCartes) {
    var n = Math.floor(nbCartes);
    var seuils = SEUILS[n >= 4 ? 4 : n >= 1 ? n : 1];
    for (var i = 0; i < seuils.length; i++) {
      if (largeur >= seuils[i][0] && hauteur >= seuils[i][1]) return "cotes";
    }
    return "onglets";
  }

  var MiseEnPage = { mode: mode, disposition: disposition, SEUILS: SEUILS };
  if (typeof module !== "undefined" && module.exports) module.exports = MiseEnPage;
  else global.MiseEnPage = MiseEnPage;
})(typeof globalThis !== "undefined" ? globalThis : this);
