(function (global) {
  var R = (typeof require !== "undefined") ? require("./referentiel.js") : global.Referentiel;

  // Quand un filtre (ou le petit espace) écarte les variantes du niveau du
  // joueur, la résolution descend. Elle ne doit pas descendre de plus de
  // 2 crans : une variante compatible doit exister sur 3 niveaux d'affilée.
  var FENETRE = 3;

  // Mots qui trahissent un exercice concerné par un filtre : la variante doit
  // alors le déclarer dans « incompatible ». C'est le filet qui empêche un
  // saut d'arriver chez un patient « sans saut » par oubli de saisie.
  var INDICES_FILTRES = {
    sans_saut: /saut|sauté|\bbond|rebond|\bhops?\b|pogo|skater|jumping|réception|claqu|pliométri|burpee|décoll\w* (du sol|les mains)|mains? décoll|pompes? décoll|quitt\w* le sol|\bcourir|en courant|trottin/i,
    sans_overhead: /au-dessus de la tête|overhead|bras tendus vers le haut|poirier|appui tendu renversé|pompes? piquées?|\bpike\b/i,
    sans_genoux_sol: /à genoux|genou au sol|genoux au sol|sur les genoux|genoux? posés? au sol|quadrupédie|chevalier servant|à quatre pattes/i,
    sans_flexion_profonde: /squat profond|pistol|fente profonde|accroupi complet|cosaque/i,
    sans_charge_dos: /charge[^.]*sur (les [ée]paules|le dos|la nuque)|partenaire sur le dos/i
  };
  // Un déplacement de plus de 2 m doit se déclarer (deplacement: true), sinon
  // il arriverait chez un joueur qui a choisi « petit espace ».
  var INDICE_DEPLACEMENT = /pas chass[ée]s|fentes? marchées?|courir|\bsprint|navette|se déplacer|déplacement|aller-retour|sur \d+ m\b|sur \d+ mètres/i;

  var TYPES_CASES = ["depart", "exercice", "avalanche", "crevasse", "refuge", "col", "meteo", "sommet"];

  function texte(v) { return (v.nom || "") + " " + (v.description || ""); }
  // « sans saut », « sans décoller » décrivent l'absence d'impact : on les
  // retire avant de chercher les indices de filtres.
  function texteIndices(v) { return texte(v).replace(/sans (saut|sauter|sautiller|impact|décoll\w*|quitter le sol)/gi, ""); }
  // Un texte qui précise « sur place » ou « sans déplacement » ne se déplace
  // pas, même s'il cite des pas chassés.
  function sembleSeDeplacer(v) {
    var t = texte(v);
    if (/sur place|sans (déplacement|se déplacer)/i.test(t)) return false;
    return INDICE_DEPLACEMENT.test(t);
  }

  function compatibleAvec(v, filtres, petit) {
    if (petit && v.deplacement) return false;
    return filtres.every(function (f) { return (v.incompatible || []).indexOf(f) === -1; });
  }

  // Contrôles de rédaction communs aux variantes et aux lignes d'échauffement.
  function erreursTexte(v, ou) {
    var e = [];
    R.MOTS_INTERDITS.forEach(function (re) {
      if (re.test(texte(v))) e.push(ou + " : objet ou lancer interdit (" + re.source + ")");
    });
    Object.keys(INDICES_FILTRES).forEach(function (f) {
      if (INDICES_FILTRES[f].test(texteIndices(v)) && (v.incompatible || []).indexOf(f) === -1) {
        e.push(ou + " : semble concerné par " + f + " sans le déclarer incompatible");
      }
    });
    if (sembleSeDeplacer(v) && v.deplacement !== true) {
      e.push(ou + " : semble se déplacer sans déclarer deplacement: true");
    }
    return e;
  }

  function varianteErreurs(v, ou) {
    var e = [];
    if (!v.nom || v.nom.length > 40) e.push(ou + " : nom absent ou plus de 40 caractères");
    if (!v.description || v.description.length < 20 || v.description.length > 220) {
      e.push(ou + " : description entre 20 et 220 caractères");
    }
    if (!Array.isArray(v.materiel) || v.materiel.length === 0) e.push(ou + " : matériel absent");
    else {
      v.materiel.forEach(function (m) { if (!(m in R.MATERIEL)) e.push(ou + " : matériel non autorisé « " + m + " »"); });
      if (v.materiel.length > 1 && v.materiel.indexOf("aucun") !== -1) e.push(ou + " : « aucun » ne se combine pas avec un autre matériel");
    }
    var d = v.dosage || {};
    var dosageOk = (d.type === "reps" && d.valeur >= 1 && d.valeur <= 50) ||
                   (d.type === "duree" && d.valeur >= 5 && d.valeur <= 180);
    if (!dosageOk || Math.round(d.valeur) !== d.valeur) e.push(ou + " : dosage invalide");
    if (typeof v.unilateral !== "boolean") e.push(ou + " : unilateral doit être true ou false");
    if (typeof v.deplacement !== "boolean") e.push(ou + " : deplacement doit être true ou false");
    if ("charge" in v || "balle" in v) e.push(ou + " : champs charge et balle sans objet sans matériel");
    if (!Array.isArray(v.incompatible)) e.push(ou + " : incompatible doit être un tableau");
    else v.incompatible.forEach(function (f) { if (!(f in R.FILTRES)) e.push(ou + " : filtre inconnu « " + f + " »"); });
    return e.concat(erreursTexte(v, ou));
  }

  function chaine(c) {
    var e = [];
    var famille = R.familleDeChaine(c.id);
    if (!famille) return ["chaîne « " + c.id + " » : id inconnu du référentiel"];
    if (c.famille !== famille) e.push(c.id + " : famille « " + c.famille + " » au lieu de « " + famille + " »");
    if (!c.nom) e.push(c.id + " : nom absent");
    var exclue = c.exclueParFiltre || {};
    Object.keys(exclue).forEach(function (f) {
      if (!(f in R.FILTRES)) e.push(c.id + " : exclueParFiltre, filtre inconnu « " + f + " »");
      if (!R.familleDeChaine(exclue[f])) e.push(c.id + " : substitut inconnu « " + exclue[f] + " »");
      if (exclue[f] === c.id) e.push(c.id + " : une chaîne ne peut pas se substituer à elle-même");
    });
    for (var n = 1; n <= R.NIVEAU_MAX; n++) {
      var liste = (c.niveaux || {})[String(n)];
      if (!Array.isArray(liste) || liste.length < 1 || liste.length > 3) {
        e.push(c.id + " niveau " + n + " : 1 à 3 variantes attendues");
        continue;
      }
      liste.forEach(function (v, i) { e = e.concat(varianteErreurs(v, c.id + " niveau " + n + " variante " + (i + 1))); });
    }
    if (e.length) return e;

    function couvre(niveau, filtres, petit) {
      for (var k = niveau; k >= Math.max(1, niveau - FENETRE + 1); k--) {
        if (c.niveaux[String(k)].some(function (v) { return compatibleAvec(v, filtres, petit); })) return true;
      }
      return false;
    }
    var filtresSuivis = Object.keys(R.FILTRES).filter(function (f) { return !exclue[f]; });
    var cas = filtresSuivis.map(function (f) { return { nom: f, filtres: [f], petit: false }; });
    cas.push({ nom: "petit espace", filtres: [], petit: true });
    for (var niv = 1; niv <= R.NIVEAU_MAX; niv++) {
      cas.forEach(function (x) {
        if (!couvre(niv, x.filtres, x.petit)) {
          e.push(c.id + " niveau " + niv + " : rien de compatible « " + x.nom + " » sur les " + FENETRE + " niveaux jusqu'à celui-ci");
        }
      });
    }
    // Filtre et petit espace ensemble : la résolution peut descendre jusqu'au
    // niveau 1, qui doit donc toujours offrir une variante.
    filtresSuivis.forEach(function (f) {
      if (!c.niveaux["1"].some(function (v) { return compatibleAvec(v, [f], true); })) {
        e.push(c.id + " : aucune variante compatible « " + f + " » en petit espace");
      }
    });
    return e;
  }

  function uniques(liste, quoi, e) {
    var vus = {};
    liste.forEach(function (x) {
      if (vus[x.id]) e.push(quoi + " : id « " + x.id + " » non unique");
      vus[x.id] = true;
    });
  }

  function evenements(ev, bib) {
    var e = [];
    function chaineConnue(id, ou) {
      if (!bib.chaine(id)) { e.push(ou + " : chaîne inconnue « " + id + " »"); return false; }
      return true;
    }
    if (!Array.isArray(ev.meteo) || ev.meteo.length < 10) e.push("météo : au moins 10 cartes attendues");
    else {
      uniques(ev.meteo, "météo", e);
      ev.meteo.forEach(function (m) {
        var ou = "météo « " + m.id + " »";
        if (!m.titre || !m.texte || m.texte.length > 120) e.push(ou + " : titre et texte (120 caractères max) obligatoires");
        R.MOTS_INTERDITS.forEach(function (re) { if (re.test(m.texte || "")) e.push(ou + " : formulation interdite"); });
        var f = m.effet || {};
        if (f.type === "deplacement") {
          var okCible = ["tous", "dernier", "premier"].indexOf(f.cible) !== -1;
          var okValeur = f.valeur === Math.round(f.valeur) && f.valeur !== 0 && Math.abs(f.valeur) <= 3;
          if (!okCible || !okValeur) e.push(ou + " : effet de déplacement invalide");
        } else if (f.type === "exercice") {
          chaineConnue(f.chaine, ou);
        } else e.push(ou + " : type d'effet invalide");
      });
    }
    R.ORDRE_THEMES.forEach(function (t) {
      var liste = (ev.echauffements || {})[t], ou = "échauffement " + t;
      if (!Array.isArray(liste) || liste.length < 4 || liste.length > 7) { e.push(ou + " : 4 à 7 lignes attendues"); return; }
      var bonnes = liste.filter(function (l, i) {
        var ici = ou + " ligne " + (i + 1);
        if (!l || typeof l.texte !== "string" || l.texte.indexOf(" : ") === -1) { e.push(ici + " : texte « Nom : dosage » attendu"); return false; }
        if (!Array.isArray(l.incompatible) || typeof l.deplacement !== "boolean") { e.push(ici + " : incompatible et deplacement obligatoires"); return false; }
        e = e.concat(erreursTexte({ nom: "", description: l.texte, incompatible: l.incompatible, deplacement: l.deplacement }, ici));
        return true;
      });
      var tousFiltres = Object.keys(R.FILTRES);
      if (bonnes.filter(function (l) { return compatibleAvec(l, tousFiltres, true); }).length < 3) {
        e.push(ou + " : moins de 3 lignes pour un joueur qui coche tous les filtres en petit espace");
      }
    });
    ["recuperation", "refuge"].forEach(function (k) {
      if (!ev[k] || !ev[k].nom || !ev[k].description) e.push(k + " : nom et description obligatoires");
    });
    if (!ev.recuperation || !ev.recuperation.dosage || ev.recuperation.dosage.type !== "duree") {
      e.push("récupération : dosage en durée attendu");
    }
    // Crevasse : une liste non vide, sans doublon, de chaînes de la bibliothèque.
    // L'ancienne forme (une seule chaîne, chaineCrevasse) est refusée.
    if (ev.chaineCrevasse !== undefined) e.push("crevasse : ancienne clé chaineCrevasse, à remplacer par la liste chainesCrevasse");
    if (!Array.isArray(ev.chainesCrevasse) || !ev.chainesCrevasse.length) {
      e.push("crevasse : au moins une chaîne attendue dans chainesCrevasse");
    } else {
      var vues = [];
      ev.chainesCrevasse.forEach(function (id) {
        if (vues.indexOf(id) !== -1) e.push("crevasse : chaîne « " + id + " » en double");
        vues.push(id);
        chaineConnue(id, "crevasse");
      });
    }
    return e;
  }

  function plateau(pl, bib) {
    var e = [], cases = pl.cases || [], fin = cases.length - 1;
    var ou = "plateau « " + pl.id + " »";
    if (!R.THEMES[pl.theme]) e.push(ou + " : thème inconnu");
    if (!(pl.niveau >= 1 && pl.niveau <= R.NIVEAU_MAX)) e.push(ou + " : niveau hors 1-" + R.NIVEAU_MAX);
    if (R.DUREES.indexOf(pl.duree) === -1) e.push(ou + " : durée inconnue");
    if (cases.length < 10) return e.concat([ou + " : trop court"]);
    if (cases[0].type !== "depart") e.push(ou + " : la première case doit être le départ");
    if (cases[fin].type !== "sommet") e.push(ou + " : la dernière case doit être le sommet");
    var ids = bib.idsTheme(pl.theme), precedente = null;
    cases.forEach(function (c, i) {
      var ici = ou + " case " + i;
      if (TYPES_CASES.indexOf(c.type) === -1) { e.push(ici + " : type inconnu « " + c.type + " »"); return; }
      if ((c.type === "depart" && i !== 0) || (c.type === "sommet" && i !== fin)) e.push(ici + " : départ ou sommet mal placé");
      if (c.type === "exercice" || c.type === "col") {
        if (ids.indexOf(c.chaine) === -1) e.push(ici + " : chaîne « " + c.chaine + " » hors thème");
        if (c.chaine === precedente) e.push(ici + " : même chaîne deux fois de suite");
        precedente = c.chaine;
      }
      if (c.type === "avalanche") {
        var cible = cases[c.cible];
        if (typeof c.cible !== "number" || c.cible <= 0 || c.cible >= i || !cible || cible.type !== "exercice") e.push(ici + " : cible invalide");
      }
    });
    var alt = pl.altitudes || [];
    if (alt.length !== cases.length) e.push(ou + " : une altitude par case attendue");
    for (var k = 1; k < alt.length; k++) if (!(alt[k] > alt[k - 1])) e.push(ou + " : altitudes non croissantes en " + k);
    return e;
  }

  var Validation = { chaine: chaine, evenements: evenements, plateau: plateau, compatibleAvec: compatibleAvec,
    INDICES_FILTRES: INDICES_FILTRES, INDICE_DEPLACEMENT: INDICE_DEPLACEMENT, TYPES_CASES: TYPES_CASES, FENETRE: FENETRE };
  if (typeof module !== "undefined" && module.exports) module.exports = Validation;
  else global.Validation = Validation;
})(typeof globalThis !== "undefined" ? globalThis : this);
