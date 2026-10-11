(function (global) {
  // Moteur de partie, sans DOM. Repris de L'Oie Alpine (src/regles.js) et
  // réduit aux cases de la maison : avalanche, crevasse, refuge, météo, col.
  // L'espace choisi (« petit » ou « grand ») vaut pour toutes les cartes.
  var Res = (typeof require !== "undefined") ? require("./resolution.js") : global.Resolution;
  // Phases du moteur, dans l'ordre d'une partie.
  var PHASES = ["echauffement", "lancer", "effort", "fini"];

  function derniere(p) { return p.plateau.cases.length - 1; }
  function enCourse(p) { return p.joueurs.filter(function (j) { return j.rang === null; }); }

  function creerPartie(plateau, joueurs, ctx, options) {
    return {
      plateau: plateau, ctx: ctx, espace: (options && options.espace) || "petit",
      tour: 0, phase: "echauffement", lanceur: null, attente: null,
      bonus: {}, etapes: null, etape: 0, colAnnule: false, chrono: null,
      joueurs: joueurs.map(function (j, i) {
        return { id: i, prenom: j.prenom || ("Joueur " + (i + 1)), couleur: j.couleur, niveau: j.niveau,
          filtres: j.filtres.slice(), position: 0, rang: null, piolet: true, crevasseAVenir: false,
          passeCrevasse: false, caseDuTour: null, lanceFait: false, choixCol: null, dernieres: {} };
      })
    };
  }

  function demarrer(p) {
    if (p.phase !== "echauffement") throw new Error("La partie a déjà commencé");
    nouveauTour(p);
  }

  function nouveauTour(p) {
    p.tour++;
    p.phase = "lancer";
    p.bonus = {};
    p.etapes = null;
    p.etape = 0;
    p.attente = null;
    p.colAnnule = false;
    enCourse(p).forEach(function (j) {
      j.lanceFait = false; j.caseDuTour = null; j.choixCol = null; j.passeCrevasse = false;
      // Crevasse : pas de lancer au tour suivant, le gainage est refait sur place.
      if (j.crevasseAVenir) {
        j.crevasseAVenir = false; j.passeCrevasse = true; j.lanceFait = true; j.caseDuTour = j.position;
      }
    });
    passerAuSuivant(p);
  }

  function passerAuSuivant(p) {
    var restants = enCourse(p).filter(function (j) { return !j.lanceFait; });
    if (restants.length) { p.lanceur = restants[0].id; return; }
    p.lanceur = null;
    p.phase = "effort";
    construireEffort(p);
  }

  function joueurActif(p) {
    if (p.phase !== "lancer" || p.attente || p.lanceur === null) return null;
    return p.joueurs[p.lanceur];
  }

  function lancer(p, de) {
    var j = joueurActif(p);
    if (!j) throw new Error("Aucun lancer possible maintenant");
    if (de === undefined) de = p.ctx.alea.entier(6) + 1;
    else if (typeof de !== "number" || de % 1 !== 0 || de < 1 || de > 6) throw new Error("Dé invalide : " + de);
    var res = { joueur: j.id, de: de, depart: j.position, arrivee: null, effets: [], attente: null };
    j.position = Math.min(j.position + de, derniere(p));
    var c = p.plateau.cases[j.position];
    if (c.type === "avalanche") {
      res.effets.push({ type: "avalanche", de: j.position, vers: c.cible });
      j.position = c.cible;
      c = p.plateau.cases[j.position];
    }
    res.arrivee = j.position;
    j.caseDuTour = j.position;
    j.lanceFait = true;
    if (c.type === "crevasse") j.crevasseAVenir = true;
    if (c.type === "col") p.attente = { joueur: j.id, type: "col", options: ["facile", "difficile"] };
    res.attente = p.attente;
    if (!p.attente) passerAuSuivant(p);
    return res;
  }

  function choisir(p, valeur) {
    var a = p.attente;
    if (p.phase !== "lancer" || !a) throw new Error("Aucun choix en attente");
    if (a.options.indexOf(valeur) === -1) throw new Error("Choix impossible : " + valeur);
    p.joueurs[a.joueur].choixCol = valeur;
    p.attente = null;
    passerAuSuivant(p);
  }

  // o : { niveau (sinon celui du joueur), multiplicateur, bonus }
  function carteExercice(p, j, idChaine, type, o) {
    o = o || {};
    var niveau = o.niveau !== undefined ? o.niveau : j.niveau, m = o.multiplicateur || 1;
    // La variante à éviter est cherchée sous la chaîne réellement jouée (celle
    // d'un filtre de remplacement le cas échéant) et mémorisée sous cette même clé.
    var r = Res.resoudre(p.ctx.bib, idChaine, { niveau: niveau, filtres: j.filtres, espace: p.espace },
      { alea: p.ctx.alea, dernieres: j.dernieres });
    if (!r.recuperation) j.dernieres[r.chaine] = r.variante.nom;
    var c = Res.carte(r, p.ctx.ev, m);
    c.joueur = j.id; c.type = type; c.recuperation = r.recuperation;
    // chaine : la chaîne réellement résolue (après substitution par un filtre),
    // c'est elle que l'écran affiche. chaineCase : celle de la case (pour une
    // crevasse, la chaîne tirée pour cette carte), que « Trop dur » résout de
    // nouveau un niveau plus bas, sans nouveau tirage.
    c.chaine = r.recuperation ? null : r.chaine;
    c.chaineCase = idChaine;
    c.niveauJoue = r.recuperation ? 0 : r.niveau;
    c.multiplicateur = m;
    c.bonus = o.bonus || 0;
    c.pioletPossible = true;
    c.tropDurPossible = !r.recuperation;
    c.fait = false; c.piolet = false; c.allege = 0;
    return c;
  }

  function carteSimple(j, type, titre, description, fait) {
    return { joueur: j.id, type: type, titre: titre, description: description, materiel: "", dosage: "",
      secondes: null, unilateral: false, recuperation: false, chaine: null, chaineCase: null, niveauJoue: 0,
      multiplicateur: 1, bonus: 0, pioletPossible: false, tropDurPossible: false, fait: !!fait, piolet: false, allege: 0 };
  }

  function carteIndividuelle(p, j) {
    var ev = p.ctx.ev;
    if (j.position === derniere(p)) return carteSimple(j, "sommet", "Au sommet !", "Bravo, tu as terminé l'ascension.", true);
    // Reprise de crevasse : le gainage est refait même si une météo a déplacé
    // le joueur entre-temps (caseDuTour ne désigne alors plus la crevasse).
    // Chaque carte de crevasse tire sa chaîne : la reprise peut différer.
    if (j.passeCrevasse) return carteExercice(p, j, p.ctx.alea.parmi(ev.chainesCrevasse), "crevasse");
    var c = p.plateau.cases[j.caseDuTour];
    if (c.type === "exercice") return carteExercice(p, j, c.chaine, "exercice");
    if (c.type === "col") {
      return carteExercice(p, j, c.chaine, "col", j.choixCol === "difficile" ? { multiplicateur: 1.5, bonus: 3 } : { bonus: 1 });
    }
    if (c.type === "crevasse") return carteExercice(p, j, p.ctx.alea.parmi(ev.chainesCrevasse), "crevasse");
    if (c.type === "refuge") return carteSimple(j, "refuge", ev.refuge.nom, ev.refuge.description, true);
    throw new Error("Type de case inattendu à l'effort : " + c.type);
  }

  function participants(p) { return enCourse(p).filter(function (j) { return j.position !== derniere(p); }); }

  function etapeMeteo(p) {
    var ctx = p.ctx, qui = participants(p), m = ctx.alea.parmi(ctx.ev.meteo);
    var etape = { type: "meteo", titre: m.titre, texte: m.texte, continue: false, cartes: [] };
    if (m.effet.type === "exercice") {
      etape.cartes = qui.map(function (j) { return carteExercice(p, j, m.effet.chaine, "meteo"); });
      return etape;
    }
    // Déplacement : calculé ici, appliqué seulement par continuer(), une fois
    // l'écran de la météo vu (« Terminer » avant ne le compte pas).
    var positions = qui.map(function (j) { return j.position; });
    var extreme = m.effet.cible === "dernier" ? Math.min.apply(null, positions) : Math.max.apply(null, positions);
    etape.deplacements = [];
    qui.forEach(function (j) {
      if (m.effet.cible === "tous" || j.position === extreme) etape.deplacements.push({ id: j.id, valeur: m.effet.valeur });
    });
    return etape;
  }

  function construireEffort(p) {
    var vues = [];
    // Une météo par case de météo occupée (deux joueurs sur la même case = une
    // seule carte), dans l'ordre des joueurs.
    var meteos = participants(p).filter(function (j) {
      if (j.passeCrevasse || p.plateau.cases[j.caseDuTour].type !== "meteo" || vues.indexOf(j.caseDuTour) !== -1) return false;
      vues.push(j.caseDuTour);
      return true;
    });
    // Une météo remplace l'effort individuel de tout le monde : un col atterri
    // le même tour perd son choix et son bonus, et l'écran l'annonce.
    p.colAnnule = meteos.length > 0 && participants(p).some(function (j) {
      return !j.passeCrevasse && p.plateau.cases[j.caseDuTour].type === "col";
    });
    p.etapes = meteos.length
      ? meteos.map(function () { return etapeMeteo(p); })
      : [{ type: "individuel", titre: null, texte: null, continue: false,
           cartes: enCourse(p).map(function (j) { return carteIndividuelle(p, j); }) }];
    p.etape = 0;
    verifierFinEtape(p);
  }

  function continuer(p) {
    if (p.phase !== "effort") throw new Error("Pas de phase d'effort en cours");
    var e = p.etapes[p.etape];
    if (e.cartes.length) throw new Error("Cette étape attend la validation des cartes");
    (e.deplacements || []).forEach(function (d) { ajouterBonus(p, d.id, d.valeur); });
    e.continue = true;
    verifierFinEtape(p);
  }

  function carteDe(p, id) {
    if (p.phase !== "effort") throw new Error("Pas de phase d'effort en cours");
    var c = p.etapes[p.etape].cartes.filter(function (k) { return k.joueur === id; })[0];
    if (!c) throw new Error("Aucune carte pour ce joueur");
    return c;
  }

  function ajouterBonus(p, id, n) { if (n) p.bonus[id] = (p.bonus[id] || 0) + n; }

  function valider(p, id) {
    var c = carteDe(p, id);
    if (c.fait) throw new Error("Carte déjà validée");
    ajouterBonus(p, id, c.bonus);
    c.fait = true;
    verifierFinEtape(p);
  }

  // Le piolet passe l'exercice du tour sans le faire, et sans le bonus de la case.
  function utiliserPiolet(p, id) {
    var c = carteDe(p, id), j = p.joueurs[id];
    if (c.fait || !c.pioletPossible || !j.piolet) throw new Error("Piolet impossible");
    j.piolet = false; c.fait = true; c.piolet = true;
    verifierFinEtape(p);
  }

  function verifierFinEtape(p) {
    var e = p.etapes[p.etape];
    if (e.cartes.length === 0 && !e.continue) return;          // météo : attendre « Continuer »
    if (!e.cartes.every(function (k) { return k.fait; })) return;
    if (p.etape < p.etapes.length - 1) { p.etape++; verifierFinEtape(p); return; }
    finirTour(p);
  }

  // « Trop dur / douleur » : l'exercice est remplacé, pour ce tour seulement,
  // par le même mouvement un niveau plus bas (filtres et espace toujours
  // respectés). Sous le niveau 1 : récupération active. Le bonus de la case
  // (col) est conservé, le niveau du joueur ne change pas.
  function tropDur(p, id) {
    var c = carteDe(p, id), e = p.etapes[p.etape];
    if (c.fait || !c.tropDurPossible) throw new Error("Trop dur impossible");
    var k = carteExercice(p, p.joueurs[id], c.chaineCase, c.type,
      { niveau: c.niveauJoue - 1, multiplicateur: c.multiplicateur, bonus: c.bonus });
    k.pioletPossible = c.pioletPossible;
    k.allege = c.allege + 1;
    e.cartes[e.cartes.indexOf(c)] = k;
    return k;
  }

  // Sauvegarde : tout l'état sauf le contexte (bibliothèque, événements,
  // hasard), et le plateau réduit à son id. Le résultat est du JSON pur.
  function exporter(p) {
    var etat = {};
    Object.keys(p).forEach(function (k) { if (k !== "ctx" && k !== "plateau") etat[k] = p[k]; });
    etat.plateau = p.plateau.id;
    return JSON.parse(JSON.stringify(etat));
  }

  function entierEntre(n, min, max) { return typeof n === "number" && n % 1 === 0 && n >= min && n <= max; }

  // Forme minimale d'un état sauvegardé, pas davantage : de quoi ne jamais
  // rendre une partie vide, tronquée ou d'une ancienne forme. Lève une erreur
  // courte sinon.
  function verifierEtat(etat, plateau) {
    var js = etat.joueurs, i, j;
    if (!Array.isArray(js) || js.length < 1 || js.length > 4) throw new Error("Sauvegarde abîmée : joueurs absents ou en nombre invalide");
    for (i = 0; i < js.length; i++) {
      j = js[i];
      if (!j || typeof j !== "object" || typeof j.prenom !== "string" || !entierEntre(j.niveau, 1, 20) || !Array.isArray(j.filtres)) {
        throw new Error("Sauvegarde abîmée : joueur mal formé");
      }
      if (!entierEntre(j.position, 0, plateau.cases.length - 1)) throw new Error("Sauvegarde abîmée : position hors du plateau");
    }
    if (PHASES.indexOf(etat.phase) === -1) throw new Error("Sauvegarde abîmée : phase inconnue");
    if (typeof etat.tour !== "number") throw new Error("Sauvegarde abîmée : tour invalide");
    if (etat.phase === "effort" && (!Array.isArray(etat.etapes) || !etat.etapes.length || !entierEntre(etat.etape, 0, etat.etapes.length - 1))) {
      throw new Error("Sauvegarde abîmée : étapes d'effort invalides");
    }
  }

  // Règle d'usage pour l'écran de reprise : si restaurer lève (sauvegarde d'un
  // autre plateau, vide, tronquée ou d'une ancienne forme), l'appelant efface
  // la sauvegarde (Sauvegarde.effacerPartie) et démarre normalement. Une
  // sauvegarde inutilisable ne doit jamais bloquer le jeu à chaque ouverture.
  function restaurer(etat, plateau, ctx) {
    if (!etat || etat.plateau !== plateau.id) throw new Error("Sauvegarde d'un autre plateau");
    verifierEtat(etat, plateau);
    var p = JSON.parse(JSON.stringify(etat));
    p.plateau = plateau;
    p.ctx = ctx;
    return p;
  }

  function prochainRang(p) { return p.joueurs.filter(function (j) { return j.rang !== null; }).length + 1; }

  // Applique les cases gagnées ce tour (écrêtées comme une case normale), puis
  // classe au rang courant, ex aequo, ceux qu'elles amènent au sommet.
  function appliquerBonusEtArrivees(p) {
    Object.keys(p.bonus).forEach(function (id) {
      var j = p.joueurs[Number(id)];
      if (j.rang === null) j.position = Math.max(0, Math.min(derniere(p), j.position + p.bonus[id]));
    });
    var arrives = enCourse(p).filter(function (j) { return j.position === derniere(p); });
    if (arrives.length) {
      var rang = prochainRang(p);
      arrives.forEach(function (j) { j.rang = rang; });
    }
  }

  function finirTour(p) {
    appliquerBonusEtArrivees(p);
    if (!enCourse(p).length) { p.phase = "fini"; return; }
    nouveauTour(p);
  }

  function terminer(p) {
    if (p.phase === "effort") appliquerBonusEtArrivees(p);
    var restants = enCourse(p).sort(function (a, b) { return b.position - a.position; });
    var base = prochainRang(p);
    restants.forEach(function (j, i) {
      j.rang = (i > 0 && restants[i - 1].position === j.position) ? restants[i - 1].rang : base + i;
    });
    // Plus rien n'est attendu : ni choix de col, ni lanceur.
    p.attente = null;
    p.lanceur = null;
    p.phase = "fini";
  }

  // Les joueurs arrivés d'abord, par rang (ex aequo par ordre de joueur), puis
  // ceux encore en course, de la position la plus haute à la plus basse. Le rang
  // vaut null tant qu'un joueur n'est pas arrivé.
  function classement(p) {
    return p.joueurs.slice().sort(function (a, b) {
      if (a.rang !== null && b.rang !== null) return a.rang - b.rang || a.id - b.id;
      if (a.rang !== null) return -1;
      if (b.rang !== null) return 1;
      return b.position - a.position || a.id - b.id;
    });
  }

  var Regles = {
    creerPartie: creerPartie, demarrer: demarrer, joueurActif: joueurActif, lancer: lancer, choisir: choisir,
    enCourse: enCourse, derniere: derniere, carteDe: carteDe, valider: valider, utiliserPiolet: utiliserPiolet,
    continuer: continuer, terminer: terminer, classement: classement,
    tropDur: tropDur, exporter: exporter, restaurer: restaurer
  };
  if (typeof module !== "undefined" && module.exports) module.exports = Regles;
  else global.Regles = Regles;
})(typeof globalThis !== "undefined" ? globalThis : this);
