(function (global) {
  // Cartes du jeu : météo, échauffements par thème, cases de repos.
  // Météo : cartes du cabinet, validées par Romain.
  // Échauffements et cases de repos (tout le reste du fichier) :
  // Contenu soumis à la relecture du kiné : ne jamais modifier une variante sans son accord.
  // Échauffements : chaque ligne déclare les filtres qui l'excluent et si elle
  // se déplace ; l'écran n'affiche que les lignes compatibles avec tous les
  // joueurs (src/resolution.js, lignesEchauffement).
  // Règles de sécurité des lignes : toute flexion du genou porte sa profondeur
  // (quart de la hauteur ou mi-hauteur), tout appui loin du mur dit « sur un
  // sol non glissant », aucun geste lancé ni sautillé, jamais de recul en
  // courant. Un geste tenu ou balancé sur un pied garde une main au mur
  // (rotations de cheville, balancés de jambe, ouverture de hanche) ; les
  // gestes qui alternent les appuis (montées de genoux lentes, talons-fesses
  // en marchant, transferts d'appui) n'en demandent pas.

  var METEO = [
    { id: "grand_beau", titre: "Grand beau",
      texte: "Ciel dégagé sur toute la vallée, la trace est rapide : tout le monde avance de 2 cases.",
      effet: { type: "deplacement", cible: "tous", valeur: 2 } },
    { id: "poudreuse", titre: "Poudreuse",
      texte: "Trente centimètres de fraîche : le dernier ouvre la trace et avance de 3 cases.",
      effet: { type: "deplacement", cible: "dernier", valeur: 3 } },
    { id: "brouillard", titre: "Brouillard",
      texte: "La purée de pois efface les balises, tout le monde recule d'une case.",
      effet: { type: "deplacement", cible: "tous", valeur: -1 } },
    { id: "vent_du_nord", titre: "Vent du nord",
      texte: "Le vent de face freine la tête de course, le premier recule de 2 cases.",
      effet: { type: "deplacement", cible: "premier", valeur: -2 } },
    { id: "redoux", titre: "Redoux",
      texte: "La neige colle moins et la montée passe mieux, tout le monde avance d'une case.",
      effet: { type: "deplacement", cible: "tous", valeur: 1 } },
    { id: "coup_de_foehn", titre: "Coup de foehn",
      texte: "Le foehn pousse dans le dos du dernier, il avance de 2 cases.",
      effet: { type: "deplacement", cible: "dernier", valeur: 2 } },
    { id: "orage", titre: "Orage",
      texte: "Tout le monde s'abrite sous le rocher et gaine en attendant l'accalmie.",
      effet: { type: "exercice", chaine: "gainage_anterieur" } },
    { id: "tempete", titre: "Tempête",
      texte: "Bourrasques de travers : il faut tenir de profil sans se laisser pousser.",
      effet: { type: "exercice", chaine: "gainage_lateral" } },
    { id: "verglas", titre: "Verglas",
      texte: "La plaque de glace oblige à poser chaque appui avec précision.",
      effet: { type: "exercice", chaine: "equilibre" } },
    { id: "jour_blanc", titre: "Jour blanc",
      texte: "Plus d'horizon ni de relief : le bassin doit rester stable à chaque pas.",
      effet: { type: "exercice", chaine: "stabilite_hanche" } },
    { id: "arc_en_ciel", titre: "Arc-en-ciel",
      texte: "L'averse s'éloigne et le moral remonte, tout le monde avance d'une case.",
      effet: { type: "deplacement", cible: "tous", valeur: 1 } },
    { id: "chute_de_neige", titre: "Chute de neige",
      texte: "Il neige serré et la trace se referme, le premier recule d'une case.",
      effet: { type: "deplacement", cible: "premier", valeur: -1 } }
  ];

  function l(texte, o) { o = o || {}; return { texte: texte, incompatible: o.incompatible || [], deplacement: !!o.deplacement }; }
  var MARCHE = l("Marche sur place en déroulant le pied : 45 s");
  var MARCHE_BRAS = l("Marche sur place en balançant les bras : 45 s");
  var GENOUX = l("Montées de genoux lentes sur place : 30 s");
  var CHEVILLES = l("Rotations de cheville, pied en l'air, main au mur : × 10 / côté");
  var SQUATS = l("Squats au poids du corps, jusqu'au quart de la hauteur, genoux dans l'axe : × 10");
  var FENTES = l("Fentes arrière lentes, à mi-hauteur, genou dans l'axe : × 6 / côté");
  var FENTES_LAT = l("Fentes latérales lentes, à mi-hauteur, sur un sol non glissant : × 6 / côté");
  var BALANCES = l("Balancés de jambe avant-arrière, petits et lents, main au mur, sans cambrer : × 10 / côté");
  var BUSTE = l("Rotations du buste, bras croisés sur la poitrine : × 10");
  var EPAULES = l("Cercles d'épaules vers l'arrière : × 10");
  var ROT_EXT = l("Rotations externes, avant-bras vers l'extérieur, coudes pliés collés au corps : × 10 / côté");
  var MUR_HAUT = l("Dos au mur, glissements des bras le long du mur jusqu'au-dessus de la tête, sans forcer : × 8", { incompatible: ["sans_overhead"] });
  var POMPES_MUR = l("Pompes contre le mur, pieds à un grand pas, sur un sol non glissant, amplitude confortable : × 10");
  var HANCHES = l("Ouverture de hanche debout, main au mur, genou vers l'extérieur : × 8 / côté");
  var BASSIN = l("Rotations de bassin debout : 30 s");
  var RESPIRATION = l("Respiration ample par les côtes basses : 30 s");

  var ECHAUFFEMENTS = {
    membre_inferieur: [MARCHE, CHEVILLES, GENOUX, SQUATS, FENTES, BALANCES],
    membre_superieur: [EPAULES, l("Ouverture de poitrine, bras écartés à hauteur d'épaules, sans forcer : 30 s"), ROT_EXT, MUR_HAUT, POMPES_MUR,
      l("Glissements des omoplates vers le bas, bras le long du corps, épaules loin des oreilles : × 10")],
    tronc: [BASSIN, l("Inclinaisons latérales du buste : × 8 / côté"), BUSTE, l("Sur le dos, genoux en l'air à angle droit, descendre un talon vers le tapis, bas du dos plaqué : × 8 / côté"),
      l("Chat-vache à quatre pattes : × 8", { incompatible: ["sans_genoux_sol"] }), RESPIRATION],
    full_body: [MARCHE_BRAS, GENOUX, BUSTE, EPAULES, SQUATS],
    ski_alpin: [MARCHE, l("Flexions de chevilles, genoux au-dessus des orteils, talons au sol, au quart de la hauteur : × 12"), l("Transferts d'appui latéraux, genoux fléchis au quart de la hauteur : 30 s"),
      SQUATS, BUSTE, l("Chaise contre le mur, genoux fléchis au quart de la hauteur, sur un sol non glissant : 20 s")],
    trail: [MARCHE, CHEVILLES, l("Montées sur pointes de pieds : × 15"), GENOUX, FENTES],
    raquette: [EPAULES, ROT_EXT, BUSTE, l("Pas chassés sur place, genoux fléchis au quart de la hauteur, pieds au ras du sol, sans sauter : 30 s"), FENTES_LAT],
    sports_collectifs: [MARCHE_BRAS, GENOUX, l("Talons-fesses en marchant sur place : 30 s"), FENTES_LAT, BALANCES,
      l("Courses de 4 m en avant, retour à reculons en marchant à petits pas, sol dégagé et non glissant : 30 s", { incompatible: ["sans_saut"], deplacement: true })],
    escalade: [l("Cercles de poignets et de doigts : × 10"), EPAULES, MUR_HAUT, BUSTE, POMPES_MUR, HANCHES],
    velo: [MARCHE, HANCHES, BALANCES, BUSTE, SQUATS],
    mobilite: [l("Respiration ample par les côtes basses : 1 min"), l("Marche lente sur place : 45 s"), EPAULES, BASSIN, CHEVILLES]
  };

  var EVENEMENTS = {
    meteo: METEO,
    echauffements: ECHAUFFEMENTS,
    recuperation: { nom: "Récupération active",
      description: "Marche lente sur place pendant 20 s, trois grandes respirations calmes, puis des cercles d'épaules lents jusqu'à la fin.",
      dosage: { type: "duree", valeur: 60 } },
    refuge: { nom: "Refuge", description: "Pause : tu te reposes pendant ce tour." },
    // Crevasse : le gainage imposé est tiré au hasard parmi ces chaînes du
    // tronc (au niveau du joueur, avec ses filtres et son espace), à chaque
    // carte de crevasse : le gainage de la case, puis celui de la reprise.
    chainesCrevasse: ["gainage_anterieur", "gainage_lateral", "gainage_posterieur"]
  };

  if (typeof module !== "undefined" && module.exports) module.exports = EVENEMENTS;
  else global.EVENEMENTS = EVENEMENTS;
})(typeof globalThis !== "undefined" ? globalThis : this);
