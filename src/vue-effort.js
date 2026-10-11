(function (global) {
  // Vue de l'effort : l'échauffement, les cartes d'exercice (côte à côte en
  // mode « large » quand la fenêtre leur laisse la place, sinon en onglets comme sur
  // le téléphone ; maquette validée le 10/10/2026, vues 5, 9, 10, 11 et 16, voir
  // MiseEnPage.disposition), les minuteurs et leurs bips, le piolet,
  // « Trop dur / douleur » et la météo. Reprend les cartes de L'Oie Alpine.
  var CIRCONFERENCE = 138.2;   // anneau du minuteur : 2 × π × 22
  var PANNEAU = "panneau-effort";   // le panneau de l'onglet choisi : une seule carte à la fois dans la page
  var SECURITE = (typeof require !== "undefined") ? require("./ecran-regles.js").SECURITE : global.EcranRegles.SECURITE;

  function creer(env) {
    var Regles = global.Regles, F = global.Format, PO = global.PartieOutils, RP = global.RenduPlateau,
      Res = global.Resolution, M = global.Minuteur, R = global.Referentiel;
    var p = env.p, UI = env.UI, doc = env.doc, O = env.O, son = env.son;
    var minuteurs = [];               // { carte, m, precedent, cote, cotes, etiquettes, maj } : survivent aux redessins
    var tic = null, onglet = null, ongletEtape = null, chronosEchauffement = {};
    var cotesDessine = null;          // disposition de l'écran d'effort en place (true : cartes côte à côte), null : pas d'écran d'effort
    var zonesSuite = [];              // zones qui défilent dans les cartes : elles portent l'indice « il y a une suite »

    function idOnglet(joueur) { return "onglet-" + joueur; }

    function nettoyer() { if (tic !== null) { global.clearInterval(tic); tic = null; } }
    function detruire() { nettoyer(); minuteurs = []; }

    // Un minuteur par carte. Une carte en durée « / côté » se fait des deux côtés : le minuteur
    // enchaîne le côté 1, puis le côté 2 (cote, cotes).
    function minuteurDe(c) {
      for (var i = 0; i < minuteurs.length; i++) if (minuteurs[i].carte === c) return minuteurs[i];
      var e = { carte: c, m: M.creer(c.secondes), precedent: c.secondes, cote: 1, cotes: c.unilateral ? 2 : 1, etiquettes: [], maj: null };
      minuteurs.push(e);
      return e;
    }

    // Rafraîchit les minuteurs (même ceux d'un onglet caché) tant que l'écran est en place.
    function lancerTic(ecran) {
      if (!minuteurs.length) return;
      tic = global.setInterval(function () {
        var racine = doc.documentElement || doc.body;
        if (env.quitte() || (racine && racine.contains && !racine.contains(ecran))) { nettoyer(); return; }
        minuteurs.forEach(function (x) {
          if (x.carte.fait || !x.maj) return;
          try { x.maj(); } catch (err) { if (global.console) global.console.error(err); }
        });
      }, 200);
    }

    // Anneau, temps, bouton « Démarrer / Pause / Reprendre / Encore » et, pour une durée « / côté »,
    // l'étiquette « Côté 1 sur 2 ». o :
    //   ligne : la ligne d'une liste (échauffement), compacte ;
    //   principal : le minuteur tient lieu de dosage (« 30 s » ne s'affiche pas deux fois), en très gros ;
    //   cote : « / côté » à garder à côté du temps ; large : disposition de la tablette (anneau, temps, bouton).
    function blocMinuteur(c, o) {
      var e = minuteurDe(c);
      var taille = o.ligne ? 30 : o.large ? 56 : 48;
      var anneau = O.depuisHTML('<svg class="minuteur-anneau anneau" viewBox="0 0 52 52" width="' + taille + '" height="' + taille + '" aria-hidden="true">' +
        '<circle cx="26" cy="26" r="22" class="fond"/>' +
        '<circle cx="26" cy="26" r="22" class="reste" stroke-dasharray="' + CIRCONFERENCE + " " + CIRCONFERENCE + '" transform="rotate(-90 26 26)"/></svg>');
      var arc = anneau.querySelector(".reste");
      var temps = UI.el("span", { classe: "minuteur-temps" });
      var etape = e.cotes > 1 ? UI.el("p", { classe: "minuteur-etape" }) : null;
      var classeBloc = o.ligne ? "chrono" : "minuteur" + (o.principal ? " minuteur-principal" : "") + (o.principal && o.cote ? " minuteur-cotes" : "");
      var bouton = UI.bouton("", function () {
        env.geste();
        var t = Date.now();
        if (e.m.enMarche) e.m.pause(t);
        else {
          if (e.m.fini(t)) e.cote = 1;                 // « Encore » : on repart du premier côté
          e.m.demarrer(t); e.precedent = e.m.restant(t); son.bipCourt();
        }
        e.maj();
      }, "bouton-minuteur");
      var cote = o.principal && o.cote ? UI.el("small", { classe: "minuteur-cote", texte: o.cote }) : null;
      var bloc;
      if (o.ligne) {
        bloc = UI.el("span", { classe: classeBloc }, [UI.el("span", { classe: "chrono-temps" }, [anneau, temps]), etape, bouton]);
      } else if (o.large) {
        bloc = UI.el("div", { classe: classeBloc }, [anneau, UI.el("div", { classe: "minuteur-bloc" }, [UI.el("p", { classe: "minuteur-affichage" }, [temps, cote]), etape]), bouton]);
      } else {
        bloc = UI.el("div", { classe: classeBloc }, [UI.el("p", { classe: "minuteur-affichage" }, [temps, cote]), etape,
          UI.el("div", { classe: "minuteur-commande" }, [anneau, bouton])]);
      }
      e.maj = function () {
        var t = Date.now(), reste = e.m.restant(t);
        if (e.m.enMarche) {
          var bipe = M.aBiper(e.precedent, reste);
          if (bipe === "court") son.bipCourt();
          if (bipe === "fin") son.bip();
          e.precedent = reste;
          if (reste === 0) {
            if (e.cote < e.cotes) {                    // côté suivant : durée pleine, bip court de départ
              e.cote++;
              e.m.demarrer(t); e.precedent = e.m.restant(t); reste = e.precedent; son.bipCourt();
            } else e.m.pause(t);
          }
        }
        var termine = !e.m.enMarche && reste === 0;
        temps.textContent = PO.insecable(F.duree(reste));
        arc.setAttribute("stroke-dasharray", (CIRCONFERENCE * reste / c.secondes).toFixed(1) + " " + CIRCONFERENCE);
        bloc.className = classeBloc + (e.m.enMarche ? " en-cours" : "");
        bouton.textContent = e.m.enMarche ? "Pause" : termine ? "Encore" : (reste === c.secondes && e.cote === 1) ? "Démarrer" : "Reprendre";
        if (etape) etape.textContent = termine ? "Les deux côtés sont faits" : "Côté " + e.cote + " sur " + e.cotes;
        var demarre = e.m.enMarche || (reste > 0 && (reste < c.secondes || e.cote > 1));
        e.etiquettes.forEach(function (n) { n.textContent = demarre ? " · " + PO.insecable(F.duree(reste)) : ""; });
      };
      e.maj();
      return bloc;
    }

    function aValider(c) { return !c.fait && p.phase === "effort" && p.etapes[p.etape].cartes.indexOf(c) !== -1; }

    // Le verrou contre le double appui : en onglets, il est commun à tout l'écran (après « Fait » ou le
    // piolet, l'onglet passe tout seul au joueur suivant, dont le bouton « Fait » tombe au même endroit : un
    // double appui ne doit pas valider l'exercice d'un autre joueur). Côte à côte, chaque carte a le sien : deux
    // joueurs appuient presque en même temps, chacun sur sa carte, et aucun des deux appuis n'est perdu.
    function cleVerrou(c, cotes) { return cotes ? "carte" + c.joueur : null; }

    // Verrouillé après coup (forcer) : un double appui sur la même carte est ignoré.
    function valider(c, cotes) {
      env.agir(function () {
        if (!aValider(c)) return;
        Regles.valider(p, c.joueur);
        if (onglet === c.joueur) onglet = null;
      }, true, false, cleVerrou(c, cotes));
    }

    // Verrouillé après coup (forcer) : un double appui ne descend pas de deux niveaux.
    function tropDur(c, cotes) {
      env.agir(function () { if (aValider(c) && c.tropDurPossible) Regles.tropDur(p, c.joueur); }, true, false, cleVerrou(c, cotes));
    }

    function actions(c, j, cotes) {
      if (c.fait) {
        return UI.el("p", { classe: "carte-bilan" }, [O.picto(O.ICO.coche, 28, "bilan-coche"),
          doc.createTextNode(c.piolet ? "Piolet utilisé" : c.type === "sommet" ? "Au sommet" : c.type === "refuge" ? "Au repos" : "Fait")]);
      }
      var liens = UI.el("div", { classe: "carte-liens" });
      if (c.tropDurPossible) {
        liens.appendChild(O.boutonNu("lien-carte lien-trop-dur", function () { tropDur(c, cotes); }, [doc.createTextNode("Trop dur / douleur")]));
      }
      if (c.pioletPossible && j.piolet) {
        liens.appendChild(O.boutonNu("lien-carte lien-piolet", function () {
          env.confirmer("Piolet de " + j.prenom + " ?", "Un par joueur et par partie : l'exercice du tour est passé, sans le bonus de la case.", [
            { texte: "Annuler" },
            { texte: "Utiliser", classe: "bouton-principal", action: function () {
              env.agir(function () {
                if (!aValider(c) || !p.joueurs[c.joueur].piolet) return;
                Regles.utiliserPiolet(p, c.joueur);
                if (onglet === c.joueur) onglet = null;
              }, false, true);
            } }]);
        }, [O.picto(O.ICO.piolet, 20), doc.createTextNode("Piolet")]));
      }
      return UI.el("div", { classe: "carte-actions" }, [UI.bouton("Fait", function () { valider(c, cotes); }, "bouton-principal bouton-fait bouton-bloc"),
        liens.firstChild ? liens : null]);
    }

    // Indice « il y a une suite » : une zone qui défile se fond en bas (style.css, .a-suite) tant qu'on n'est pas
    // arrivé au bout de son contenu, et se montre en entier dès qu'il n'y a plus rien à lire dessous.
    function majSuite(z) {
      if (typeof z.scrollHeight !== "number" || typeof z.clientHeight !== "number") return;
      var suite = z.scrollHeight - z.clientHeight - (z.scrollTop || 0) > 2;
      var classes = String(z.className || "").split(" ").filter(function (k) { return k && k !== "a-suite"; });
      if (suite) classes.push("a-suite");
      var nouveau = classes.join(" ");
      if (nouveau !== z.className) z.className = nouveau;
    }
    function zoneSuite(z) {
      zonesSuite.push(z);
      if (z.addEventListener) z.addEventListener("scroll", function () { majSuite(z); });
      return z;
    }
    // À rappeler dès que la place change sans redessin (fenêtre redimensionnée).
    function rafraichirSuites() { zonesSuite.forEach(majSuite); }

    // cotes : la carte de la tablette, côte à côte (bandeau prénom + niveau) ; sinon celle du téléphone (niveau dans la ligne « sommet »).
    // panneau : en onglets, la carte est le panneau de l'onglet choisi (rôle, identifiant, onglet qui l'étiquette).
    // Le haut de la carte (type, titre, description) prend la place que le bas (dosage, minuteur, « Fait », liens) laisse : le bas
    // n'est jamais rogné, et la description défile dans la carte quand elle ne tient pas.
    function carte(c, cotes, panneau) {
      var j = p.joueurs[c.joueur], m = PO.morceauxDosage(c.dosage), type = PO.libelleType(p, c);
      var pictoType = RP.ICONES[c.type] && c.type !== "exercice" && !c.recuperation ? O.picto(RP.ICONES[c.type], cotes ? 22 : 18) : UI.el("span", { classe: "puce-exo" });
      var enCours = !c.fait, chronoSeul = enCours && c.secondes && !m.texte;
      var bas = [
        c.dosage && !chronoSeul ? UI.el("p", { classe: "carte-dosage" + (m.texte ? " carte-dosage-texte" : m.long ? " carte-dosage-long" : "") },
          [doc.createTextNode(m.valeur), m.cote ? UI.el("small", { texte: m.cote }) : null]) : null,
        enCours && c.secondes ? blocMinuteur(c, { principal: chronoSeul, cote: m.cote, large: cotes }) : null,
        actions(c, j, cotes)
      ];
      var niveau = UI.el("span", { classe: "carte-niveau", texte: PO.insecable("Niveau " + j.niveau) });
      var attributs = { classe: "carte" + (c.fait ? " faite" : ""), style: O.styleJoueur(j) };
      if (panneau) { attributs.role = "tabpanel"; attributs.id = PANNEAU; attributs["aria-labelledby"] = idOnglet(c.joueur); }
      return UI.el("article", attributs, [
        cotes ? UI.el("header", { classe: "carte-entete" }, [UI.el("span", { classe: "carte-prenom", texte: j.prenom }), niveau]) : null,
        UI.el("p", { classe: "carte-reste" }, [O.picto(RP.ICONES.sommet, cotes ? 24 : 20), doc.createTextNode(PO.insecable(PO.texteReste(p, j))),
          cotes ? null : niveau]),
        UI.el("div", { classe: "carte-corps" }, [
          zoneSuite(UI.el("div", { classe: "carte-haut" }, [
            type || c.materiel ? UI.el("p", { classe: "carte-type" }, [type ? pictoType : null, UI.el("span", { classe: "carte-type-nom", texte: type }),
              c.materiel ? UI.el("span", { classe: "carte-materiel", texte: c.materiel }) : null]) : null,
            UI.el("h3", { classe: "carte-titre", texte: c.titre }),
            c.allege ? UI.el("p", { classe: "carte-allege", texte: "Version plus facile" }) : null,
            zoneSuite(UI.el("p", { classe: "carte-description", texte: PO.insecable(c.description) }))
          ])),
          UI.el("div", { classe: "carte-bas" }, bas)
        ])
      ]);
    }

    // Onglet affiché : celui touché par le joueur, sinon la première carte à faire.
    function ongletCourant(cartes) {
      if (cartes.some(function (c) { return c.joueur === onglet; })) return onglet;
      var suivante = cartes.filter(function (c) { return !c.fait; })[0];
      return (suivante || cartes[0]).joueur;
    }

    // Choisir un onglet (touche, flèche) : un geste comme un autre. Le focus reste sur l'onglet, pas sur « Fait ».
    function choisirOnglet(joueur) {
      env.geste();
      onglet = joueur;
      env.dessiner(function (ecran) { return ecran.querySelector('[role="tab"][aria-selected="true"]'); });
    }

    // Flèches gauche et droite (retour au bout), Origine et Fin, comme tout motif d'onglets.
    function toucheOnglet(e, cartes, k) {
      var cle = e.key, cible = null;
      if (e.altKey || e.ctrlKey || e.metaKey) return;   // Alt + flèche gauche = page précédente : pas touche
      if (cle === "ArrowRight" || cle === "Right") cible = (k + 1) % cartes.length;
      else if (cle === "ArrowLeft" || cle === "Left") cible = (k + cartes.length - 1) % cartes.length;
      else if (cle === "Home") cible = 0;
      else if (cle === "End") cible = cartes.length - 1;
      if (cible === null) return;
      if (e.preventDefault) e.preventDefault();
      choisirOnglet(cartes[cible].joueur);
    }

    // Un onglet par joueur, à sa couleur. Le prénom a son propre élément (il rétrécit avec des points de
    // suspension, sa première lettre ne disparaît jamais) ; à côté, la coche quand il a fait ou le temps restant
    // de son minuteur. Motif complet : tablist, tab, tabindex itinérant, panneau étiqueté par l'onglet choisi.
    function onglets(cartes, actuel) {
      return UI.el("nav", { classe: "onglets onglets-" + cartes.length + (cartes.length > 2 ? " onglets-serres" : ""), role: "tablist", "aria-label": "Joueurs" },
        cartes.map(function (c, k) {
          var j = p.joueurs[c.joueur], etiquette = UI.el("span", { classe: "onglet-temps" }), choisi = c.joueur === actuel;
          if (c.secondes && !c.fait) minuteurDe(c).etiquettes.push(etiquette);
          var b = UI.el("button", { type: "button", role: "tab", id: idOnglet(c.joueur), classe: "onglet" + (choisi ? " actif" : "") + (c.fait ? " fait" : ""),
            "aria-selected": String(choisi), "aria-controls": PANNEAU, tabindex: choisi ? "0" : "-1", style: O.styleJoueur(j),
            onclick: function () { choisirOnglet(c.joueur); },
            onkeydown: function (e) { toucheOnglet(e, cartes, k); } },
            [UI.el("span", { classe: "onglet-nom", texte: j.prenom }), c.fait ? O.picto(O.ICO.coche, 18, "onglet-coche") : null, etiquette]);
          if (c.fait) b.setAttribute("aria-label", j.prenom + ", fait");   // la coche seule ne se lit pas
          return b;
        }));
    }

    // Titre du bandeau : le sous-titre sous le titre sur le téléphone, à sa droite sur la tablette.
    function bandeauTitre(titre, sous) {
      var h = UI.el("h2", { classe: "titre-ecran", texte: titre }), s = sous ? UI.el("p", { classe: "bandeau-sous", texte: F.typo(sous) }) : null;
      return [UI.el("div", { classe: env.mode() === "large" ? "bandeau-titre bandeau-titre-ligne" : "bandeau-titre" }, [h, s])];
    }

    // Les cartes se mettent côte à côte quand l'écran est en mode « large » et que la fenêtre leur laisse la place
    // (mise-en-page.js, disposition) ; sinon la disposition du téléphone : une carte à la fois, joueurs en onglets.
    function cartesCoteACote(nbCartes) { return env.mode() === "large" && env.disposition(nbCartes) === "cotes"; }

    // Vrai quand la fenêtre a changé au point que la disposition de l'écran d'effort affiché n'est plus la bonne.
    function dispositionChangee() {
      if (cotesDessine === null || p.phase !== "effort") return false;
      var e = p.etapes[p.etape];
      return !!e && e.cartes.length > 0 && cartesCoteACote(e.cartes.length) !== cotesDessine;
    }

    function oublierDisposition() { cotesDessine = null; }

    function ecranEffort() {
      var e = p.etapes[p.etape], total = p.etapes.length, suite = total > 1 ? " · étape " + (p.etape + 1) + " sur " + total : "";
      var cotes = cartesCoteACote(e.cartes.length);
      var droite = [env.boutonSon(), env.boutonTerminer()];
      zonesSuite = [];
      minuteurs = minuteurs.filter(function (x) { return !x.carte.fait && e.cartes.indexOf(x.carte) !== -1; });
      minuteurs.forEach(function (x) { x.etiquettes = []; });
      var etape = p.tour + "|" + p.etape;
      if (etape !== ongletEtape) { ongletEtape = etape; onglet = null; }
      var annonceCol = p.etape === 0 && p.colAnnule ? UI.el("p", { classe: "etape-annulation", texte: "Le col de ce tour est annulé par la météo." }) : null;

      // Météo sans carte : un écran à part (picto, titre, texte, « Continuer »), vue 11 de la maquette.
      if (!e.cartes.length) {
        cotesDessine = null;
        env.annoncerUnique("meteo|" + p.tour + "|" + p.etape, e.titre + ". " + e.texte);
        return UI.el("section", { classe: "ecran ecran-effort ecran-meteo" }, [
          env.bandeau([UI.el("h2", { classe: "titre-ecran", texte: "Météo" })], droite),
          UI.el("main", { classe: "etape-seule" }, [
            O.montagne(),
            UI.el("span", { classe: "etape-picto" }, [O.picto(RP.ICONES.meteo, 76)]),
            UI.el("h1", { classe: "etape-titre", texte: e.titre }),
            UI.el("p", { classe: "etape-texte", texte: F.typo(e.texte) }),
            annonceCol,
            UI.bouton("Continuer", function () {
              env.agir(function () { if (p.phase === "effort" && p.etapes[p.etape] === e) Regles.continuer(p); });
            }, "bouton-principal bouton-large")
          ])
        ]);
      }

      var titre = e.type === "individuel" ? "L'effort" : e.titre;
      var sous = e.type === "individuel" ? "Tour " + p.tour + " · chacun sa carte" + (cotes ? ", puis « Fait »" : "") : "Tour " + p.tour + suite + " · tous ensemble";
      var enfants = [env.bandeau(bandeauTitre(titre, sous), droite)];
      if (e.type === "meteo") enfants.push(UI.el("p", { classe: "etape-bandeau" }, [O.picto(RP.ICONES.meteo, 24), doc.createTextNode(F.typo(e.texte))]));
      if (annonceCol) enfants.push(annonceCol);
      cotesDessine = cotes;
      if (cotes || e.cartes.length === 1) {
        enfants.push(UI.el("main", { classe: "cartes cartes-" + e.cartes.length }, e.cartes.map(function (c) { return carte(c, cotes); })));
      } else {
        var actuel = ongletCourant(e.cartes);
        enfants.push(onglets(e.cartes, actuel));
        enfants.push(UI.el("main", { classe: "cartes cartes-onglet" }, [carte(e.cartes.filter(function (c) { return c.joueur === actuel; })[0], false, true)]));
      }
      var ecran = UI.el("section", { classe: "ecran ecran-effort" + (cotes ? " ecran-effort-cotes" : "") }, enfants);
      ecran.apresAjout = rafraichirSuites;   // la place n'est connue qu'une fois l'écran dans la page
      lancerTic(ecran);
      return ecran;
    }

    // Lignes en durée (« 45 s », « 1 min », « 30 s / côté ») : une fausse carte par ligne, gardée d'un
    // redessin à l'autre pour que le temps écoulé survive.
    function chronoEchauffement(i, dose) {
      var s = /^(\d+) (s|min)( \/ côté)?$/.exec(dose);
      if (!s) return null;
      if (!chronosEchauffement[i]) chronosEchauffement[i] = { secondes: Number(s[1]) * (s[2] === "min" ? 60 : 1), unilateral: !!s[3], fait: false };
      return chronosEchauffement[i];
    }

    function ecranEchauffement() {
      cotesDessine = null;
      var filtres = [];
      p.joueurs.forEach(function (j) { j.filtres.forEach(function (f) { if (filtres.indexOf(f) === -1) filtres.push(f); }); });
      var lignes = Res.lignesEchauffement(p.ctx.ev, p.plateau.theme, filtres, p.espace).map(function (l, i) {
        var k = l.lastIndexOf(" : "), nom = k === -1 ? l : l.slice(0, k), dose = k === -1 ? "" : l.slice(k + 3);
        var m = PO.morceauxDosage(dose), chrono = chronoEchauffement(i, dose);
        return UI.el("li", { classe: "echauffement-ligne" }, [
          UI.el("span", { classe: "echauffement-nom", texte: PO.insecable(nom) }),
          chrono ? blocMinuteur(chrono, { ligne: true })
            : dose ? UI.el("span", { classe: "echauffement-dose" }, [doc.createTextNode(m.valeur), m.cote ? UI.el("small", { texte: m.cote }) : null]) : null
        ]);
      });
      // La règle de sécurité validée par Romain, mot pour mot, au-dessus du bouton.
      var deuxPoints = SECURITE.indexOf(":") + 1;
      var ecran = UI.el("section", { classe: "ecran ecran-echauffement" }, [
        env.bandeau(bandeauTitre("Échauffement", R.THEMES[p.plateau.theme].libelle + " · tous ensemble"), [env.boutonSon(), env.boutonQuitter()]),
        UI.el("main", { classe: "echauffement" }, [UI.el("ol", { classe: "echauffement-liste" }, lignes)]),
        UI.el("footer", { classe: "pied" }, [
          UI.el("p", { classe: "securite-ligne" }, [UI.el("b", { texte: F.typo(SECURITE.slice(0, deuxPoints)) }), doc.createTextNode(F.typo(SECURITE.slice(deuxPoints)))]),
          UI.bouton("C'est parti", function () {
            env.agir(function () { if (p.phase === "echauffement") { Regles.demarrer(p); p.chrono.depart = Date.now(); } });
          }, "bouton-principal bouton-large bouton-bloc")
        ])
      ]);
      lancerTic(ecran);
      return ecran;
    }

    return { ecranEchauffement: ecranEchauffement, ecranEffort: ecranEffort, nettoyer: nettoyer, detruire: detruire,
      dispositionChangee: dispositionChangee, oublierDisposition: oublierDisposition, rafraichirSuites: rafraichirSuites };
  }

  global.VueEffort = { creer: creer };
})(typeof globalThis !== "undefined" ? globalThis : this);
