(function (global) {
  // Dessin du plateau en spirale : grille, position de chaque case, puis SVG
  // complet (cases + flèches + pions). Copié de L'Oie Alpine et adapté : sept
  // cases spéciales seulement, trois longueurs de plateau (40, 60 et 82 cases),
  // cœur central du lancer. Classes CSS de la maquette validée le 10/10/2026
  // (maquettes/ecrans.html).
  var COULEURS = ["#D9483B", "#2E6FB0", "#E0A526", "#3F9A5B"];
  var T = 170, ESPACE = 10, COTE = T - ESPACE;

  // Pictogrammes au trait (viewBox 12 × 12), repris de L'Oie Alpine pour les
  // seules cases de la maison.
  var ICONES = {
    depart: '<circle cx="6" cy="6" r="4.6"/><polyline points="6,3.4 6,6 8.2,7.4"/>',
    crevasse: '<polyline points="1,3 4,3 6,9 8,3 11,3"/><line x1="6" y1="9" x2="6" y2="11"/>',
    refuge: '<polyline points="1.5,6.5 6,2 10.5,6.5"/><polyline points="3,5.5 3,10.5 9,10.5 9,5.5"/>',
    avalanche: '<polyline points="1,10.5 6,2 11,10.5"/><line x1="4.2" y1="6.5" x2="6.8" y2="6.5"/><line x1="3.2" y1="8.5" x2="8.2" y2="8.5"/>',
    sommet: '<polyline points="0.8,11 4.5,4.5 7,8 9,5 11.2,11"/><line x1="6" y1="1" x2="6" y2="4"/><polyline points="6,1 8.4,1.9 6,2.8"/>',
    col: '<path d="M0.8,10.5 L3.6,3.5 C4.8,7.6 7.2,7.6 8.4,3.5 L11.2,10.5"/><polyline points="4.8,9.4 6,8.2 7.2,9.4"/>',
    meteo: '<circle cx="4.2" cy="4.2" r="1.9"/><line x1="4.2" y1="0.8" x2="4.2" y2="1.3"/><line x1="0.8" y1="4.2" x2="1.3" y2="4.2"/><line x1="1.8" y1="1.8" x2="2.2" y2="2.2"/><path d="M4.2,10.6 L9.3,10.6 A1.9,1.9 0 0 0 9.3,6.8 A2.6,2.6 0 0 0 4.6,7.6 A1.5,1.5 0 0 0 4.2,10.6 Z"/>'
  };
  var NOMS = { depart: "Départ", crevasse: "Crevasse", refuge: "Refuge", avalanche: "Avalanche", sommet: "Sommet",
    col: "Col", meteo: "Météo" };

  // SEULES TROIS LONGUEURS sont prises en charge : 40, 60 et 82 cases (30, 45 et
  // 60 min, outils/generateur.js). Chacune laisse au centre de la spirale un
  // vide net, sans case orpheline, pour le lancer (zonesLibres) :
  //   40 cases : 10 × 6, vide de 7 × 2 puis 6 × 1 ;
  //   60 cases : 12 × 8, vide de 9 × 4 (maquette validée) ;
  //   82 cases : 14 × 8, vide de 10 × 3.
  // Les seuils (48, 72) ne servent qu'à les distinguer. Une autre longueur
  // (41 à 48, 61 à 72, plus de 82) se dessinerait encore, mais avec un trou au
  // centre : il faut alors choisir une grille pour elle (outils de calage).
  function grille(n) {
    if (n <= 48) return { colonnes: 10, lignes: 6 };
    if (n <= 72) return { colonnes: 12, lignes: 8 };
    return { colonnes: Math.max(14, Math.ceil((n + 30) / 8)), lignes: 8 };
  }

  function spirale(n, colonnes, lignes) {
    var res = [], haut = 0, bas = lignes - 1, gauche = 0, droite = colonnes - 1, c, l;
    while (res.length < n && haut <= bas && gauche <= droite) {
      for (c = gauche; c <= droite; c++) res.push([haut, c]);
      haut++;
      for (l = haut; l <= bas; l++) res.push([l, droite]);
      droite--;
      if (haut <= bas) { for (c = droite; c >= gauche; c--) res.push([bas, c]); bas--; }
      if (gauche <= droite) { for (l = bas; l >= haut; l--) res.push([l, gauche]); gauche++; }
    }
    return res.slice(0, n);
  }

  // Cases vides du centre de la spirale. Le cœur accueille le lancer : un bloc
  // libre d'au moins 4 colonnes, sur 3 lignes quand le vide en compte 4 (60
  // cases : 9 × 3), sinon sur 2. La ligne libre qui suit accueille la liste des
  // positions, dans les colonnes du cœur. Les colonnes retenues sont contiguës.
  function zonesLibres(n) {
    var g = grille(n), pris = {};
    spirale(n, g.colonnes, g.lignes).forEach(function (q) { pris[q[0] + "," + q[1]] = true; });
    // Colonnes libres sur toutes les lignes de l à l + h - 1.
    function communes(l, h) {
      var res = [];
      for (var c = 0; c < g.colonnes; c++) {
        var libre = l + h <= g.lignes;
        for (var k = 0; k < h && libre; k++) if (pris[(l + k) + "," + c]) libre = false;
        if (libre) res.push(c);
      }
      return res;
    }
    // La plus longue suite de colonnes qui se touchent (la première à égalité).
    function contigues(cols) {
      var meilleure = [], courante = [];
      cols.forEach(function (c, i) {
        courante = i > 0 && c === cols[i - 1] + 1 ? courante.concat(c) : [c];
        if (courante.length > meilleure.length) meilleure = courante;
      });
      return meilleure;
    }
    function bloc(cols, l, h) { return { l: l, c: cols[0], largeur: cols.length, hauteur: h }; }
    var coeur = null, liste = null;
    for (var l = 0; l < g.lignes - 1 && !coeur; l++) {
      var quatre = contigues(communes(l, 4)), deux = contigues(communes(l, 2));
      if (quatre.length >= 4) coeur = bloc(quatre, l, 3);
      else if (deux.length >= 4) coeur = bloc(deux, l, 2);
    }
    if (coeur) {
      var sous = contigues(communes(coeur.l + coeur.hauteur, 1).filter(function (c) {
        return c >= coeur.c && c < coeur.c + coeur.largeur;
      }));
      if (sous.length) liste = bloc(sous, coeur.l + coeur.hauteur, 1);
    }
    return { g: g, coeur: coeur, liste: liste };
  }

  // Couleur de fond d'une case selon sa hauteur sur le plateau (retour de
  // Romain du 01/10) : prairie en bas, rocher à mi-pente, neige en haut. On
  // suit la montée d'un coup d'oeil, sans lire les numéros. Les teintes
  // restent très claires : le nom de l'exercice doit se lire à 2 m.
  var PALIERS = [[0, [215, 229, 207]], [0.5, [232, 225, 211]], [1, [238, 243, 248]]];
  var SAPIN = [47, 70, 57];
  function hex(rgb) {
    return "#" + rgb.map(function (v) { var h = Math.round(v).toString(16); return h.length < 2 ? "0" + h : h; }).join("");
  }
  function melanger(a, b, t) { return [0, 1, 2].map(function (k) { return a[k] + (b[k] - a[k]) * t; }); }
  function teinte(i, n, speciale) {
    var t = n > 1 ? i / (n - 1) : 0, k = t <= PALIERS[1][0] ? 0 : 1;
    var a = PALIERS[k], b = PALIERS[k + 1];
    var rgb = melanger(a[1], b[1], (t - a[0]) / (b[0] - a[0]));
    // Une case spéciale se détache par un voile de sapin, en plus de son picto.
    return hex(speciale ? melanger(rgb, SAPIN, 0.12) : rgb);
  }

  function esc(t) {
    return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  // Une altitude absente ne s'écrit pas (jamais « undefined m »).
  function altitude(m) {
    return typeof m === "number" && isFinite(m) ? String(m).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " m" : "";
  }

  // Type de case dessiné : « exercice », l'un des sept types de la maison, ou
  // « neutre » pour tout le reste (case ni nommée ni illustrée, mais présente).
  function typeCase(c) {
    var t = c && c.type;
    return t === "exercice" || (typeof t === "string" && NOMS.hasOwnProperty(t)) ? t : "neutre";
  }
  // Numéro (de 1) de la case visée par une avalanche, null si la cible n'est pas un entier de 0 ou plus.
  function destination(c) {
    return c && c.type === "avalanche" && typeof c.cible === "number" && isFinite(c.cible) && c.cible >= 0 && c.cible % 1 === 0
      ? c.cible + 1 : null;
  }
  // Initiale du pion : majuscule du premier caractère, paire de substitution
  // (émoji, lettre hors plan de base) gardée entière.
  function initiale(prenom) {
    var t = String(prenom || "");
    if (!t) return "?";
    var h = t.charCodeAt(0);
    return (h >= 0xD800 && h <= 0xDBFF && t.length > 1 ? t.slice(0, 2) : t.charAt(0)).toUpperCase();
  }
  // Joueurs à dessiner sur le plateau : ceux en course et ceux arrivés au sommet.
  function visibles(joueurs, n) {
    return joueurs.filter(function (j) { return j.rang === null || j.position === n - 1; });
  }

  // Texte lisible sur la couleur d'un joueur : cacao sur le jaune, blanc ailleurs.
  function couleurTexte(c) { return String(c).toUpperCase() === COULEURS[2].toUpperCase() ? "#3A2E22" : "#FFFFFF"; }

  // Découpe un nom d'exercice pour qu'il tienne dans sa case (repère visuel de la
  // maquette : « Pont et » / « ischios », « Charnière » / « de hanche »...).
  // La largeur d'une ligne est estimée à longueur × corps × FACTEUR (le Jura
  // semi-gras mesure de 0,49 à 0,64 corps par caractère) et ne doit pas dépasser
  // LARGEUR_UTILE : une case fait 160 unités, 7 de marge de chaque côté. On
  // essaie, du plus lisible au moins lisible : deux lignes en corps normal,
  // deux lignes serrées, trois lignes serrées, deux lignes très serrées, trois
  // lignes très serrées. Un nom qui ne tient toujours pas (un seul mot
  // démesuré) est comprimé à la largeur de la case par textLength. Les corps
  // suivent style.css (.case-chaine, -serre, -tres-serre), un test les relit.
  var FACTEUR = 0.6, LARGEUR_UTILE = 146, LIGNE_MAX = 11;
  var CORPS = { normal: 22, serre: 18.5, tresSerre: 15 };

  function couper(mots, max) {
    var lignes = [], courante = "";
    mots.forEach(function (m) {
      var essai = courante ? courante + " " + m : m;
      if (!courante || essai.length <= max) courante = essai;
      else { lignes.push(courante); courante = m; }
    });
    if (courante) lignes.push(courante);
    return lignes;
  }
  function tient(lignes, corps) {
    return lignes.every(function (l) { return l.length * corps * FACTEUR <= LARGEUR_UTILE; });
  }
  // Rend { lignes (1 à 3), corps, serre } : « serre » signale un corps réduit.
  function ligniser(nom) {
    var mots = String(nom || "").split(" ").filter(Boolean), lignes = couper(mots, LIGNE_MAX);
    var deux = lignes.length > 2 ? [lignes[0], lignes.slice(1).join(" ")] : lignes;
    var trois = lignes.length > 3 ? [lignes[0], lignes[1], lignes.slice(2).join(" ")] : lignes;
    var essais = [[deux, CORPS.normal], [deux, CORPS.serre], [trois, CORPS.serre], [deux, CORPS.tresSerre], [trois, CORPS.tresSerre]];
    for (var k = 0; k < essais.length; k++) {
      if (tient(essais[k][0], essais[k][1])) return { lignes: essais[k][0], corps: essais[k][1], serre: essais[k][1] < CORPS.normal };
    }
    return { lignes: trois, corps: CORPS.tresSerre, serre: true };
  }

  // Géométrie d'une case (unités du viewBox, case de 160) : bande du haut
  // (numéro, pions, « vers N ») jusqu'à 44, contenu au milieu, altitude en bas
  // (ligne de base à 146). Lignes de base du nom selon le nombre de lignes et le corps.
  var BASES = { 1: { 22: [92], 18.5: [92], 15: [92] }, 2: { 22: [80, 106], 18.5: [80, 106], 15: [84, 104] },
    3: { 18.5: [73, 95, 117], 15: [74, 92, 110] } };
  function texteChaine(nom) {
    var d = ligniser(nom), cx = COTE / 2;
    if (!d.lignes.length) return "";
    var classe = "case-chaine" + (d.corps === CORPS.tresSerre ? " case-chaine-tres-serre" : d.serre ? " case-chaine-serre" : "");
    var bases = BASES[d.lignes.length][d.corps];
    var tspans = d.lignes.map(function (l, k) {
      var trop = l.length * d.corps * FACTEUR > LARGEUR_UTILE;
      return '<tspan x="' + cx + '" y="' + bases[k] + '"' + (trop ? ' textLength="' + LARGEUR_UTILE + '" lengthAdjust="spacingAndGlyphs"' : "") + ">" + esc(l) + "</tspan>";
    });
    return '<text class="' + classe + '" text-anchor="middle">' + tspans.join("") + "</text>";
  }

  // actif (facultatif) : id du joueur dont c'est le tour, pion cerclé.
  function svg(plateau, joueurs, bib, actif) {
    var n = plateau.cases.length, g = grille(n), pos = spirale(n, g.colonnes, g.lignes);
    var largeur = g.colonnes * T, hauteur = g.lignes * T;
    // Au-delà de 72 cases (82), les cases sont plus petites à l'écran : la classe
    // « plateau-dense » agrandit numéro, « vers N » et libellé du type (style.css),
    // et le numéro descend pour tenir dans la bande du haut.
    var dense = n > 72, yHaut = dense ? 36 : 26;
    var morceaux = ['<svg class="plateau-svg' + (dense ? " plateau-dense" : "") + '" role="group" aria-label="Plateau de ' + n +
      ' cases" viewBox="0 0 ' + largeur + " " + hauteur + '" xmlns="http://www.w3.org/2000/svg">'];

    plateau.cases.forEach(function (c, i) {
      var p = pos[i], x = p[1] * T + ESPACE / 2, y = p[0] * T + ESPACE / 2;
      var type = typeCase(c), special = type !== "exercice" && type !== "neutre";
      var classes = "case " + type + (special ? " case-speciale" : "") + (type === "sommet" ? " case-sommet" : "");
      var corps;
      if (special) {
        var libLong = NOMS[type].length > 10;
        corps = '<g class="case-picto" transform="translate(' + (COTE / 2 - 18) + ',52) scale(3)">' +
          '<g fill="none" stroke="currentColor" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round">' + ICONES[type] + "</g></g>" +
          '<text class="case-lib' + (libLong ? " case-lib-long" : "") + '" x="' + (COTE / 2) + '" y="113" text-anchor="middle">' +
          esc(NOMS[type].toUpperCase()) + "</text>";
      } else {
        corps = type === "exercice" ? texteChaine(((bib.chaine(c.chaine) || {}).nom) || "") : "";
      }
      var vers = destination(c);
      var cible = vers !== null
        ? '<text class="case-cible" x="' + (COTE - 10) + '" y="' + yHaut + '" text-anchor="end">vers ' + vers + "</text>" : "";
      var fond = type === "sommet" ? "" : ' style="fill:' + teinte(i, n, special) + '"';
      morceaux.push('<g class="' + classes + '" transform="translate(' + x + "," + y + ')">' +
        '<rect width="' + COTE + '" height="' + COTE + '" rx="10"' + fond + '/>' +
        '<text class="case-num" x="11" y="' + yHaut + '">' + (i + 1) + "</text>" + cible + corps +
        '<text class="case-alt" x="' + (COTE / 2) + '" y="' + (COTE - 14) + '" text-anchor="middle">' +
        altitude(plateau.altitudes[i]) + "</text></g>");
    });

    for (var i = 1; i < n; i++) {
      var a = pos[i - 1], b = pos[i];
      var dl = b[0] - a[0], dc = b[1] - a[1];
      var angle = dc === 1 ? 0 : dc === -1 ? 180 : dl === 1 ? 90 : 270;
      var cx = ((a[1] + b[1]) / 2) * T + T / 2, cy = ((a[0] + b[0]) / 2) * T + T / 2;
      morceaux.push('<path class="chevron" transform="translate(' + cx + "," + cy + ") rotate(" + angle + ')" d="M-2.6,-5 L2.8,0 L-2.6,5"/>');
    }

    // Pions : regroupés par case pour placer côte à côte ceux qui partagent
    // une même position, toujours dans le coin haut-droit (jamais sur le nom,
    // le pictogramme ou l'altitude).
    var parPosition = {};
    visibles(joueurs, n).forEach(function (j) {
      (parPosition[j.position] = parPosition[j.position] || []).push(j);
    });
    Object.keys(parPosition).forEach(function (k) {
      var p = pos[Number(k)], baseX = p[1] * T + ESPACE / 2, baseY = p[0] * T + ESPACE / 2;
      // Pions agrandis (retour du 01/10) : 48 unités de diamètre au lieu de
      // 32, soit la moitié de la largeur d'une case, pour les suivre à 2 m.
      // Ils se resserrent à trois et à quatre sur la même case.
      var groupe = parPosition[k], nb = groupe.length, serres = nb > 2;
      var r = nb <= 2 ? 24 : nb === 3 ? 21 : 18, pas = 2 * r + 3, depart = COTE - r - 4;
      groupe.forEach(function (j, idx) {
        // Une rangée dans la bande du haut, de droite à gauche : jamais sur le
        // numéro (à gauche), le nom, le pictogramme ou l'altitude (plus bas).
        var cx = baseX + depart - idx * pas, cy = baseY + r + 4;
        var lettre = initiale(j.prenom);
        var texte = couleurTexte(j.couleur);
        var cercle = actif !== undefined && actif !== null && j.id === actif
          ? '<circle class="pion-actif" r="' + (r + 5) + '" fill="none" stroke="' + esc(j.couleur) + '" stroke-width="2.5" stroke-dasharray="4 3"/>' : "";
        morceaux.push('<g class="pion' + (cercle ? " pion-en-cours" : "") + '" role="img" aria-label="' + esc(j.prenom || "") + '" transform="translate(' + cx + "," + cy + ')">' + cercle +
          '<circle r="' + r + '" fill="' + esc(j.couleur) + '" stroke="#FAF6EE" stroke-width="3"/>' +
          '<text class="pion-lettre' + (serres ? " pion-lettre-serree" : "") + '" text-anchor="middle" dy="' + (serres ? 7 : 9) + '" fill="' + texte + '">' + esc(lettre) + "</text></g>");
      });
    });

    morceaux.push("</svg>");
    return morceaux.join("");
  }

  var RenduPlateau = { grille: grille, spirale: spirale, zonesLibres: zonesLibres, svg: svg, ligniser: ligniser,
    teinte: teinte, esc: esc, altitude: altitude, couleurTexte: couleurTexte, initiale: initiale, visibles: visibles,
    typeCase: typeCase, destination: destination, COULEURS: COULEURS, NOMS: NOMS, ICONES: ICONES };
  if (typeof module !== "undefined" && module.exports) module.exports = RenduPlateau;
  else global.RenduPlateau = RenduPlateau;
})(typeof globalThis !== "undefined" ? globalThis : this);
