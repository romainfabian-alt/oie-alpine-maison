(function (global) {
  // Référentiel de L'Oie Alpine à la maison : matériel (sol, mur, tapis),
  // filtres de blessure, espace, familles de chaînes, thèmes et niveaux 1-20.
  var NIVEAU_MAX = 20;

  var MATERIEL = { aucun: "Sans matériel", mur: "Mur", tapis: "Tapis" };

  var FILTRES = {
    sans_saut: "Sans saut ni impact",
    sans_overhead: "Sans bras au-dessus de la tête",
    sans_genoux_sol: "Sans appui sur les genoux",
    sans_flexion_profonde: "Sans flexion profonde du genou",
    sans_charge_dos: "Sans charge sur le dos"
  };

  var ESPACES = {
    petit: { libelle: "Petit espace", detail: "2 × 2 m : tout se fait sur place." },
    grand: { libelle: "De la place", detail: "4 à 6 m : fentes marchées, déplacements, petites accélérations." }
  };

  var FAMILLES = {
    membre_inferieur: ["squat", "fente", "charniere", "pont_ischios", "mollet_cheville", "adducteurs",
      "stabilite_hanche", "equilibre", "plio_verticale", "plio_horizontale", "agilite"],
    tronc: ["gainage_anterieur", "gainage_lateral", "gainage_posterieur", "anti_rotation", "rotation", "flexion_controlee"],
    membre_superieur: ["poussee_horizontale", "poussee_verticale", "dos_omoplates", "coiffe_scapula",
      "poussee_explosive", "appuis_transferts"],
    complexe: ["complexe"],
    sports: ["isometrie_skieur", "appuis_lateraux", "excentrique_descente", "pied_cheville", "appuis_replacement",
      "epaule_rotation", "changements_direction", "ischios_vitesse", "tension_corps", "epaules_appui",
      "hanche_fessiers", "dos_cycliste"],
    mobilite: ["mob_hanches", "mob_thoracique", "mob_chevilles", "mob_epaules", "mob_chaine_posterieure", "respiration"]
  };

  function theme(libelle, groupe, propres, empruntees) {
    return { libelle: libelle, groupe: groupe, propres: propres, empruntees: empruntees };
  }
  var F = FAMILLES;
  // Un plateau de zone tire ses cases de toutes ses chaînes ; un plateau de
  // sport mêle ses 2 chaînes propres (40 % des cases) et 5 chaînes de zones.
  var THEMES = {
    membre_inferieur: theme("Membre inférieur", "zone", [], F.membre_inferieur),
    membre_superieur: theme("Membre supérieur", "zone", [], F.membre_superieur),
    tronc: theme("Tronc", "zone", [], F.tronc),
    full_body: theme("Full body", "zone", [], [].concat(F.membre_inferieur, F.tronc, F.membre_superieur, F.complexe)),
    ski_alpin: theme("Ski alpin", "sport", ["isometrie_skieur", "appuis_lateraux"],
      ["squat", "fente", "equilibre", "plio_horizontale", "gainage_lateral"]),
    trail: theme("Trail et course", "sport", ["excentrique_descente", "pied_cheville"],
      ["mollet_cheville", "fente", "equilibre", "plio_verticale", "stabilite_hanche"]),
    raquette: theme("Sports de raquette", "sport", ["appuis_replacement", "epaule_rotation"],
      ["fente", "agilite", "rotation", "anti_rotation", "coiffe_scapula"]),
    sports_collectifs: theme("Sports collectifs", "sport", ["changements_direction", "ischios_vitesse"],
      ["agilite", "plio_horizontale", "adducteurs", "pont_ischios", "gainage_anterieur"]),
    escalade: theme("Escalade", "sport", ["tension_corps", "epaules_appui"],
      ["dos_omoplates", "coiffe_scapula", "gainage_anterieur", "gainage_lateral", "stabilite_hanche"]),
    velo: theme("Vélo", "sport", ["hanche_fessiers", "dos_cycliste"],
      ["squat", "fente", "pont_ischios", "gainage_posterieur", "charniere"]),
    mobilite: theme("Mobilité et récupération", "mobilite", [], F.mobilite)
  };
  var ORDRE_THEMES = ["membre_inferieur", "membre_superieur", "tronc", "full_body", "ski_alpin", "trail",
    "raquette", "sports_collectifs", "escalade", "velo", "mobilite"];

  var PHASES = [
    { min: 1, max: 5, libelle: "Reprise", detail: "Aucun impact, isométrie, amplitude contrôlée." },
    { min: 6, max: 11, libelle: "Renforcement", detail: "Tempo, amplitude complète, unipodal, volume." },
    { min: 12, max: 16, libelle: "Réathlétisation", detail: "Pliométrie légère, vitesse, changements de direction." },
    { min: 17, max: 20, libelle: "Retour au sport", detail: "Pliométrie intense, réactivité, unipodal explosif." }
  ];

  var DUREES = [30, 45, 60];
  var DUREE_DEFAUT = 45;

  // Sans matériel : ni balle, ni lancer, ni objet du quotidien. La « chaise
  // contre le mur » (isométrie classique) reste permise ; « une chaise » non.
  var MOTS_INTERDITS = [
    /\bballes?\b|\bballons?\b|m[ée]decine-ball/i,
    /(^|[\s'’])lancers?\b/i,
    /halt[eè]res?/i, /kettlebells?/i, /[ée]lastiques?/i,
    /\b(une|la|sa|ta) chaise(?! (au|contre le) mur)/i,
    /canap[ée]s?/i, /escaliers?/i, /(^|\s)steps?\b/i, /serviettes?/i, /bouteilles?/i,
    /sac à dos/i, /barre de traction/i, /\bbancs?\b/i, /\btables?\b/i
  ];

  function familleDeChaine(id) {
    var noms = Object.keys(FAMILLES);
    for (var i = 0; i < noms.length; i++) if (FAMILLES[noms[i]].indexOf(id) !== -1) return noms[i];
    return null;
  }

  function phaseDe(niveau) {
    for (var i = 0; i < PHASES.length; i++) if (niveau >= PHASES[i].min && niveau <= PHASES[i].max) return PHASES[i];
    return null;
  }

  function chainesTheme(t) {
    var th = THEMES[t];
    return th ? th.propres.concat(th.empruntees) : [];
  }

  var Referentiel = {
    NIVEAU_MAX: NIVEAU_MAX, MATERIEL: MATERIEL, FILTRES: FILTRES, ESPACES: ESPACES, FAMILLES: FAMILLES,
    THEMES: THEMES, ORDRE_THEMES: ORDRE_THEMES, PHASES: PHASES, DUREES: DUREES, DUREE_DEFAUT: DUREE_DEFAUT,
    MOTS_INTERDITS: MOTS_INTERDITS, familleDeChaine: familleDeChaine, phaseDe: phaseDe, chainesTheme: chainesTheme
  };
  if (typeof module !== "undefined" && module.exports) module.exports = Referentiel;
  else global.Referentiel = Referentiel;
})(typeof globalThis !== "undefined" ? globalThis : this);
