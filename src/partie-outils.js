(function (global) {
  // Aides de l'écran de partie : textes (purs, testés sous Node) et petits
  // morceaux de DOM partagés par les vues du lancer, de l'effort et du podium.
  // Repris de src/ecran-partie.js de L'Oie Alpine.
  var RP = (typeof require !== "undefined") ? require("./rendu-plateau.js") : global.RenduPlateau;
  var couleurTexte = RP.couleurTexte;

  // Espaces insécables : « 30 s », « 2 750 m », « × 12 » ne se coupent jamais.
  // Seul un nombre suivi d'une unité (ou d'un compte : cases, tours, pas...) est
  // lié : « 12 en » ou « 30 sur » restent coupables (le plan liait tout nombre
  // à tout mot suivant, ce que son propre test « × 12 en 30 s » n'attend pas).
  var UNITES = "s|m|cm|mm|min|h|kg|cases?|tours?|pas|fois|répétitions?|séries?|pompes?";
  var NOMBRE_UNITE = new RegExp("(\\d) (?=(?:" + UNITES + ")(?![A-Za-zÀ-ÿ]))", "g");
  function insecable(t) {
    return String(t).replace(/(\d) (?=\d{3}\b)/g, "$1 ").replace(NOMBRE_UNITE, "$1 ").replace(/× /g, "× ");
  }

  function altitude(m) { return insecable(String(m).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " m"); }

  // « × 10 / côté » → valeur « × 10 », côté « / côté » (affiché plus petit).
  function morceauxDosage(dosage) {
    var d = String(dosage || ""), cote = /\s*\/ côté$/.test(d);
    var valeur = d.replace(/\s*\/ côté$/, "");
    var texte = !/^(× ?\d+|\d+ (s|min))/.test(valeur);
    return { valeur: insecable(valeur), cote: cote ? "/ côté" : "", texte: texte, long: !texte && valeur.length > 6 };
  }

  function rang(n) { return { nombre: String(n), suffixe: n === 1 ? "er" : "e" }; }

  // Groupes du podium dans l'ordre d'affichage : 2e groupe à gauche, 1er au
  // centre, puis les suivants à droite.
  function groupesPodium(classement) {
    var groupes = [];
    classement.forEach(function (j) {
      var g = groupes[groupes.length - 1];
      if (g && g.rang === j.rang) g.joueurs.push(j); else groupes.push({ rang: j.rang, joueurs: [j] });
    });
    if (groupes.length < 2) return groupes;
    return [groupes[1], groupes[0]].concat(groupes.slice(2));
  }

  function nomChaine(p, id) { var c = p.ctx.bib.chaine(id); return c ? c.nom : ""; }

  // Phrase sous « X a fait 5 » : ce que la case d'arrivée déclenche.
  function texteEffet(p, r) {
    var arrivee = r.arrivee, c = p.plateau.cases[arrivee];
    var lieu = "case " + (arrivee + 1) + ", " + altitude(p.plateau.altitudes[arrivee]);
    if (r.effets.some(function (e) { return e.type === "avalanche"; })) return "Avalanche : descente à la " + lieu + ".";
    switch (c.type) {
      case "col": return "Col : choix du passage.";
      case "crevasse": return "Crevasse : pas de lancer au prochain tour.";
      case "refuge": return "Refuge : repos pendant l'effort.";
      case "meteo": return "Météo : surprise à l'effort.";
      case "sommet": return "Sommet atteint, bravo !";
      case "exercice": return nomChaine(p, c.chaine) + ", " + lieu + ".";
      default: return "";
    }
  }

  // Ce que dit la zone d'annonce (lecteur d'écran) au lancer : « Léa a fait 4, case 23, Gainage latéral ».
  // Même case et même effet que la phrase affichée, dans l'ordre où on les dit à voix haute.
  function annonceLancer(p, r) {
    var debut = p.joueurs[r.joueur].prenom + " a fait " + r.de, lieu = "case " + (r.arrivee + 1), c = p.plateau.cases[r.arrivee];
    if (r.effets.some(function (e) { return e.type === "avalanche"; })) return debut + ", avalanche, descente à la " + lieu;
    switch (c.type) {
      case "exercice": return debut + ", " + lieu + ", " + nomChaine(p, c.chaine);
      case "col": return debut + ", " + lieu + ", col";
      case "crevasse": return debut + ", " + lieu + ", crevasse";
      case "refuge": return debut + ", " + lieu + ", refuge";
      case "meteo": return debut + ", " + lieu + ", météo";
      case "sommet": return debut + ", " + lieu + ", sommet atteint";
      default: return debut + ", " + lieu;
    }
  }

  // Le classement à voix haute : « 1er Léa, 2e Tom et Inès ex aequo ». classement : Regles.classement(p).
  function texteClassement(classement) {
    var groupes = [];
    classement.forEach(function (j) {
      var g = groupes[groupes.length - 1];
      if (g && g.rang === j.rang) g.noms.push(j.prenom); else groupes.push({ rang: j.rang, noms: [j.prenom] });
    });
    return groupes.map(function (g) {
      var r = rang(g.rang), noms = g.noms.length > 1 ? g.noms.slice(0, -1).join(", ") + " et " + g.noms[g.noms.length - 1] : g.noms[0];
      return r.nombre + r.suffixe + " " + noms + (g.noms.length > 1 ? " ex aequo" : "");
    }).join(", ");
  }

  // Le mouvement affiché est celui réellement résolu (c.chaine), après une
  // éventuelle substitution par un filtre de blessure.
  function libelleType(p, c) {
    var j = p.joueurs[c.joueur];
    if (c.recuperation) return "Récupération";
    if (c.type === "exercice") return nomChaine(p, c.chaine || p.plateau.cases[j.caseDuTour].chaine);
    if (c.type === "col") return "Col · " + (j.choixCol === "difficile" ? "difficile +3 cases" : "facile +1 case");
    // Crevasse et météo imposent un mouvement : la carte porte la chaîne réellement
    // jouée (le gainage tiré, par exemple), qui se lit après le type de case.
    var mouvement = c.chaine ? nomChaine(p, c.chaine) : "";
    return (RP.NOMS[c.type] || "") + (mouvement && RP.NOMS[c.type] ? " · " + mouvement : "");
  }

  function texteReste(p, j) {
    var n = p.plateau.cases.length - 1 - j.position;
    return n <= 0 ? "Au sommet" : "Sommet dans " + n + (n === 1 ? " case" : " cases");
  }

  function creerOutils(doc, UI) {
    function depuisHTML(html) { var d = doc.createElement("div"); d.innerHTML = html; return d.firstElementChild; }
    function picto(corps, taille, classe) {
      return depuisHTML('<svg class="picto' + (classe ? " " + classe : "") + '" width="' + taille + '" height="' + taille +
        '" viewBox="0 0 12 12" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">' +
        corps + "</g></svg>");
    }
    var ICO = {
      drapeau: '<line x1="3" y1="11" x2="3" y2="1.2"/><path d="M3,1.6 L9.6,3.4 L3,5.4"/>',
      piolet: '<line x1="3" y1="11" x2="7.6" y2="2.2"/><path d="M4.4,3 C6.6,1.2 9,1.4 11,3.4"/><line x1="7.6" y1="2.2" x2="8.6" y2="1.2"/>',
      retour: '<polyline points="6.5,2.5 3,6 6.5,9.5"/><line x1="3" y1="6" x2="10" y2="6"/>',
      coche: '<polyline points="2.4,6.4 5,9 9.8,3.4"/>'
    };
    var POINTS = { 1: [[6, 6]], 2: [[3.2, 3.2], [8.8, 8.8]], 3: [[3.2, 3.2], [6, 6], [8.8, 8.8]],
      4: [[3.2, 3.2], [8.8, 3.2], [3.2, 8.8], [8.8, 8.8]], 5: [[3.2, 3.2], [8.8, 3.2], [6, 6], [3.2, 8.8], [8.8, 8.8]],
      6: [[3.4, 3], [8.6, 3], [3.4, 6], [8.6, 6], [3.4, 9], [8.6, 9]] };
    // Le dé porte toujours six pastilles : changer de face ne fait que les
    // déplacer, sans recréer de nœud (le roulé CSS n'est jamais relancé).
    function poserFace(svgDe, valeur) {
      var v = POINTS[valeur] ? valeur : 6, pts = POINTS[v], cercles = svgDe.getElementsByTagName("circle"), i;
      for (i = 0; i < 6; i++) {
        if (i < pts.length) {
          cercles[i].setAttribute("cx", pts[i][0]); cercles[i].setAttribute("cy", pts[i][1]); cercles[i].setAttribute("r", "1.05");
        } else cercles[i].setAttribute("r", "0");
      }
      svgDe.setAttribute("aria-label", "Dé : " + v);
    }
    function de(valeur, taille) {
      var pastilles = "", i;
      for (i = 0; i < 6; i++) pastilles += '<circle cx="6" cy="6" r="0" fill="#3A2E22"/>';
      var svgDe = depuisHTML('<svg class="de" width="' + taille + '" height="' + taille + '" viewBox="0 0 12 12">' +
        '<rect x="0.5" y="0.5" width="11" height="11" rx="2.2" fill="#FFFDF8" stroke="#3A2E22" stroke-width="0.45"/>' + pastilles + "</svg>");
      poserFace(svgDe, valeur);
      return svgDe;
    }
    function pastille(j, taille) { return UI.el("span", { classe: "pastille-joueur", style: "--joueur:" + j.couleur + ";--taille:" + taille + "px" }); }
    function boutonNu(classe, action, enfants) { return UI.el("button", { type: "button", classe: classe, onclick: action }, enfants || []); }
    function styleJoueur(j) { return "--joueur:" + j.couleur + ";--joueur-texte:" + couleurTexte(j.couleur); }
    // En Italiana, un « 1 » se lit comme un « I » : le chiffre du dé passe en Jura.
    function chiffreDe(n) { return UI.el("b", { classe: "chiffre-de", texte: String(n) }); }
    // Montagne en filigrane au bas des écrans d'annonce (météo, refuge) et du podium (maquette, vues 11 et 12) :
    // relief seul (m1) pour le podium, avec la crête (m2) sinon.
    function montagne(reliefSeul) {
      return depuisHTML('<svg class="decor-montagne' + (reliefSeul ? " decor-podium" : "") + '" viewBox="0 0 390 200" preserveAspectRatio="none" aria-hidden="true">' +
        (reliefSeul ? "" : '<polyline class="m2" points="0,166 46,127 76,146 126,96 155,116 195,46 231,89 261,73 307,123 344,104 390,146"/>') +
        '<polyline class="m1" points="0,200 0,181 59,150 99,169 149,131 195,158 251,123 297,154 347,135 390,162 390,200"/></svg>');
    }
    return { depuisHTML: depuisHTML, picto: picto, ICO: ICO, de: de, poserFace: poserFace, pastille: pastille,
      boutonNu: boutonNu, styleJoueur: styleJoueur, chiffreDe: chiffreDe, montagne: montagne };
  }

  var PartieOutils = { insecable: insecable, altitude: altitude, morceauxDosage: morceauxDosage, rang: rang,
    groupesPodium: groupesPodium, nomChaine: nomChaine, texteEffet: texteEffet, annonceLancer: annonceLancer,
    texteClassement: texteClassement, libelleType: libelleType,
    texteReste: texteReste, couleurTexte: couleurTexte, creerOutils: creerOutils };
  if (typeof module !== "undefined" && module.exports) module.exports = PartieOutils;
  else global.PartieOutils = PartieOutils;
})(typeof globalThis !== "undefined" ? globalThis : this);
