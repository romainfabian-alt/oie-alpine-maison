(function (global) {
  // Vue du lancer : le dé, le pion qui avance case par case, puis le bouton
  // vers les cartes. Deux dispositions : le plateau entier (mode « large »,
  // comme au cabinet) ou le sentier (mode « etroit », maquette validée le
  // 10/10/2026, vues 6 à 8 et 15). Reprend la présentation de L'Oie Alpine : le
  // dé cherche sa face, le pion marche, un appui saute à l'arrivée.
  // Un tour peut se terminer dans le lancer lui-même, sans carte d'effort (tous
  // les joueurs en course au refuge, ou arrivés au sommet) : la vue l'annonce
  // (« Refuge : pause pour ce tour », « Voir le podium ») avant de passer à la suite.
  var ROULE_MS = 640;   // durée du roulé du dé, cf. « de-roule » en CSS
  var PRENOM_LONG = 10; // au-delà, le titre « À Jean-Sébastien de lancer » passe en caractères réduits (style.css, .titre-long)

  function creer(env) {
    var Regles = global.Regles, DP = global.Deplacement, RP = global.RenduPlateau, RS = global.RenduSentier,
      PO = global.PartieOutils, R = global.Referentiel, F = global.Format;
    var p = env.p, UI = env.UI, doc = env.doc, O = env.O;
    // dernier : { tour (celui qu'affiche l'écran après le lancer), tourJoue (le tour du lancer : le sous-titre
    //             le garde même quand le moteur est déjà au suivant), r, effet, anime, images, i, vue,
    //             sansEffort : null, « refuge » ou « podium » (le tour s'est fini dans le lancer),
    //             refuges : prénoms des joueurs au refuge ce tour-là }
    var dernier = null;
    var anim = null, animDe = null, deNode = null, ligneEffet = null;
    var aleaEcran = global.Aleatoire.creer(Date.now() % 4294967296);   // hasard de l'affichage, jamais celui du moteur

    function nettoyer() {
      if (anim) { anim.arreter(); anim = null; }
      if (animDe) { animDe.arreter(); animDe = null; }
    }

    // « anime » : le pion se déplace ; « cartes » : arrivé, l'effort a commencé (ou le
    // tour s'est fini sans effort), un bouton mène à la suite ; « annonce » : écran
    // « Refuge : pause pour ce tour » ; null : écran de lancer habituel.
    function presentation() {
      if (!dernier || dernier.tour !== p.tour || !dernier.vue) return null;
      var podium = p.phase === "fini" && dernier.sansEffort === "podium";
      if (p.phase !== "lancer" && p.phase !== "effort" && !podium) return null;
      return dernier.vue;
    }

    function mouvementReduit() {
      try { return !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches); }
      catch (e) { return false; }
    }

    // La phrase d'effet ne se montre qu'une fois le pion posé.
    function effetVisible() { return !dernier || !dernier.images || DP.effetVisible(dernier.i, dernier.images.length); }
    function classeEffet() { return "lancer-effet" + (effetVisible() ? "" : " lancer-effet-cache"); }
    function vueApres() { return p.phase === "effort" || (dernier && dernier.sansEffort) ? "cartes" : null; }

    function libelleCartes() {
      if (dernier && dernier.sansEffort === "podium") return "Voir le podium";
      if (dernier && dernier.sansEffort) return "Voir la suite";
      var e = p.etapes && p.etapes[p.etape];
      if (e && !e.cartes.length) return "Voir la suite";
      return Regles.enCourse(p).length === 1 ? "Voir ma carte" : "Voir les cartes";
    }

    // Le pion attend sur sa case que le dé ait fini de rouler.
    function attendreLeDe(suite) {
      var res = [], n = Math.round(ROULE_MS / DP.PAS_MS) - 1, i;
      for (i = 0; i < n; i++) res.push(suite[0]);
      return res.concat(suite);
    }

    function chercherFace() {
      animDe = DP.animer({
        images: DP.facesDe(dernier.r.de, DP.FACES_DE, aleaEcran), depuis: 0, pas: DP.PAS_DE_MS,
        poser: function (fn, ms) { return global.setInterval(fn, ms); },
        annuler: function (id) { global.clearInterval(id); },
        rendre: function (i, face) { if (deNode) O.poserFace(deNode, face); },
        fin: function () { animDe = null; }
      });
    }

    function finirDe() {
      var a = animDe;
      animDe = null;
      if (a) a.finir();
      if (deNode && dernier) O.poserFace(deNode, dernier.r.de);
      if (deNode) deNode.setAttribute("class", "de lancer-de");
    }

    function presenter(suite, attendreDe) {
      if (attendreDe && !mouvementReduit()) suite = attendreLeDe(suite);
      dernier.images = suite;
      if (mouvementReduit() || suite.length < 2) { dernier.i = suite.length - 1; dernier.vue = vueApres(); }
      else { dernier.i = 0; dernier.vue = "anime"; }
    }

    function finPresentation() {
      if (env.quitte() || !dernier) return;
      dernier.vue = vueApres();
      env.dessiner();
    }

    // Joueurs au refuge parmi ceux en course avant le lancer r (les autres ont déjà
    // joué leur lancer du tour : leur case du tour est connue, celle du lanceur est r.arrivee).
    function auRefuge(avant, r) {
      return avant.filter(function (a) {
        var c = p.plateau.cases[a.id === r.joueur ? r.arrivee : a.caseDuTour];
        return c && c.type === "refuge";
      }).map(function (a) { return a.prenom; });
    }

    function lancerLeDe(actif) {
      env.agir(function () {
        if (Regles.joueurActif(p) !== actif) return;
        var tour = p.tour, avant = Regles.enCourse(p).map(function (j) { return { id: j.id, prenom: j.prenom, caseDuTour: j.caseDuTour }; });
        var r = Regles.lancer(p);
        // Un tour qui se termine dans le lancer (tous au refuge ou au sommet) n'a pas de carte d'effort :
        // le moteur est déjà au tour suivant (ou à la fin), l'écran doit l'annoncer.
        var fini = p.phase === "fini", sansEffort = fini ? "podium" : (p.tour !== tour ? "refuge" : null);
        var effet = PO.texteEffet(p, r);
        if (sansEffort === "refuge" && !r.effets.length && p.plateau.cases[r.arrivee].type === "refuge") effet = "Refuge : pause pour ce tour.";
        dernier = { tour: p.tour, tourJoue: tour, r: r, effet: PO.insecable(effet), anime: true, images: [], i: 0, vue: null,
          sansEffort: sansEffort, refuges: sansEffort === "refuge" ? auRefuge(avant, r) : [] };
        env.annoncer(PO.annonceLancer(p, r));   // lu tout de suite, sans attendre la fin de la marche du pion
        presenter(DP.images(r, Regles.derniere(p)), true);
      }, true);
    }

    // Les éléments du lancer, communs aux deux dispositions : le dé et son texte (ligne), puis
    // le bouton du moment. o : { taille du dé, enBarre (sentier : la barre du bas), resteDansTitre
    // (le titre dit déjà « Léa a fait 4 » : la barre ne le répète pas) }.
    function elementsLancer(actif, o) {
      var ligne = [], bouton = null;
      ligneEffet = null; deNode = null;
      if (dernier && dernier.tour === p.tour) {
        var j = p.joueurs[dernier.r.joueur], anime = dernier.anime;
        dernier.anime = false;
        deNode = O.de(dernier.r.de, o.taille);
        deNode.setAttribute("class", "de lancer-de" + (anime ? " lancer-de-anime" : ""));
        ligne.push(deNode);
        if (anime && !mouvementReduit()) chercherFace();
        var avalanche = dernier.r.effets.length > 0;
        if (dernier.effet) {
          ligneEffet = UI.el("p", { classe: classeEffet() }, [avalanche ? O.picto(RP.ICONES.avalanche, 20) : null, doc.createTextNode(dernier.effet)]);
        }
        ligne.push(UI.el("div", { classe: "lancer-texte" }, [
          UI.el("p", { classe: "lancer-sur", texte: "Dernier lancer" }),
          o.enBarre && o.resteDansTitre ? null : UI.el("p", { classe: "lancer-res", style: O.styleJoueur(j) }, [
            UI.el("span", { classe: "nom-joueur", texte: j.prenom }), doc.createTextNode(" a fait "), O.chiffreDe(dernier.r.de)]),
          ligneEffet
        ]));
      } else {
        var bloques = p.joueurs.filter(function (k) { return k.rang === null && k.passeCrevasse; });
        deNode = O.de(6, o.taille);
        deNode.setAttribute("class", "de lancer-de lancer-de-attente");
        ligne.push(deNode);
        ligne.push(UI.el("div", { classe: "lancer-texte" }, [
          UI.el("p", { classe: "lancer-sur", texte: "Tour " + p.tour }),
          o.enBarre ? null : UI.el("p", { classe: "lancer-res", texte: p.tour === 1 ? "En route" : "Nouveau tour" }),
          UI.el("p", { classe: "lancer-effet", texte: bloques.length
            ? bloques.map(function (k) { return k.prenom; }).join(", ") + (bloques.length > 1 ? " restent" : " reste") + " dans la crevasse ce tour."
            : "Chacun lance à son tour, puis place à l'effort." })
        ]));
      }
      if (presentation() === "cartes") {
        bouton = O.boutonNu("bouton bouton-principal bouton-lancer", allerALaSuite, [doc.createTextNode(libelleCartes())]);
      } else if (actif) {
        bouton = O.boutonNu("bouton bouton-principal bouton-lancer", function () { lancerLeDe(actif); },
          [O.de(6, o.enBarre ? 30 : 46), doc.createTextNode("Lancer le dé")]);
      }
      return { ligne: ligne, bouton: bouton };
    }

    // « Voir les cartes » : une transition d'écran, sans effet sur la partie. Elle verrouille les
    // appuis qui suivent (le bouton « Fait » de la première carte se trouve presque au même endroit).
    function allerALaSuite() {
      if (!dernier) return;
      env.transition(function () { dernier.vue = dernier.sansEffort === "refuge" ? "annonce" : null; });
    }

    function imageCourante(vue) {
      return vue && dernier && dernier.tour === p.tour && dernier.images && dernier.images.length
        ? dernier.images[Math.min(dernier.i, dernier.images.length - 1)] : null;
    }

    // Pendant un déplacement, le pion du lanceur est dessiné à la position de
    // l'image courante, pas à celle du moteur (déjà à l'arrivée).
    function joueursDessines(vue) {
      var img = imageCourante(vue);
      if (!img) return p.joueurs;
      return p.joueurs.map(function (j) {
        if (j.id !== dernier.r.joueur) return j;
        // rang null : le moteur a pu classer le lanceur (arrivée au sommet), son pion marche encore.
        return { id: j.id, prenom: j.prenom, couleur: j.couleur, position: img.position, rang: null };
      });
    }

    function arriveeVisible(vue) {
      var img = imageCourante(vue);
      return img && dernier.i >= dernier.images.length - 1 ? img.position : null;
    }

    function cercle(vue, actif) {
      if (vue) return dernier.r.joueur;
      return actif ? actif.id : (p.attente ? p.attente.joueur : null);
    }

    // Joueur que le sentier suit : le lanceur pendant la présentation, sinon
    // celui qui doit lancer ou choisir, sinon le premier encore en course.
    function suivi(vue, actif) {
      if (vue && dernier) return p.joueurs[dernier.r.joueur];
      if (actif) return actif;
      if (p.attente) return p.joueurs[p.attente.joueur];
      return Regles.enCourse(p)[0] || p.joueurs[0];
    }

    // Titre du bandeau : le prénom en pastille pleine à la couleur du joueur (maquette du 10/10/2026),
    // « À Léa de lancer », « Léa a fait 4 », « À Inès de choisir » (col reprise après une interruption).
    function titre(vue, actif) {
      var lanceur = p.attente ? p.joueurs[p.attente.joueur] : (vue ? p.joueurs[dernier.r.joueur] : null), j, texte;
      function nom(k) { return UI.el("span", { classe: "nom-joueur", texte: k.prenom }); }
      if (lanceur && dernier && dernier.tour === p.tour && dernier.r.joueur === lanceur.id) {
        j = lanceur; texte = [nom(j), " a fait ", O.chiffreDe(dernier.r.de)];
      } else if (lanceur) { j = lanceur; texte = ["À ", nom(j), " de choisir"]; }
      else if (actif) { j = actif; texte = ["À ", nom(j), " de lancer"]; }
      else return UI.el("h2", { classe: "titre-ecran", texte: "Le plateau" });
      // Un long prénom (« Jean-Sébastien ») garde la pastille et le titre sur une ligne : style.css réduit un peu les caractères.
      return UI.el("h2", { classe: "titre-tour" + (j.prenom.length > PRENOM_LONG ? " titre-long" : ""), style: O.styleJoueur(j) }, texte);
    }

    // Tant que le dernier lancer est à l'écran, le sous-titre garde le tour qui vient d'être joué, même si le
    // moteur est déjà au suivant (tour terminé dans le lancer : « Léa a fait 1 / Voir la suite »).
    function sousTitre(vue) {
      var tour = vue && dernier && dernier.tourJoue ? dernier.tourJoue : p.tour;
      return F.typo(R.THEMES[p.plateau.theme].libelle + " · niveau " + p.plateau.niveau + " · tour " + tour);
    }

    // Téléphone : le titre et son sous-titre à gauche ; tablette : le sous-titre passe à droite, avec les boutons.
    function bandeauJeu(vue, actif) {
      if (env.mode() === "large") {
        return env.bandeau([titre(vue, actif)], [UI.el("p", { classe: "bandeau-sous", texte: sousTitre(vue) }), env.boutonTerminer()]);
      }
      return env.bandeau([UI.el("div", { classe: "bandeau-titre" }, [titre(vue, actif), UI.el("p", { classe: "bandeau-sous", texte: sousTitre(vue) })])],
        [env.boutonTerminer()]);
    }

    // Un appui n'importe où sur le plateau saute la fin du déplacement.
    function animer(zone, rafraichir) {
      zone.addEventListener("click", function () {
        env.verrouiller();   // « Lancer le dé » du joueur suivant apparaît au même endroit : pas de double appui
        finirDe();
        var a = anim;
        if (!a) return;
        anim = null;
        a.finir();
      });
      anim = DP.animer({
        images: dernier.images, depuis: dernier.i, pas: DP.PAS_MS,
        poser: function (fn, ms) { return global.setInterval(fn, ms); },
        annuler: function (id) { global.clearInterval(id); },
        rendre: function (i) { dernier.i = i; rafraichir(); },
        fin: function () { anim = null; finPresentation(); }
      });
    }

    function placer(bloc, g) {
      var T = 170, L = g.colonnes * T, H = g.lignes * T;
      return "left:" + ((bloc.c * T + 5) / L * 100) + "%;top:" + ((bloc.l * T + 5) / H * 100) + "%;width:" +
        ((bloc.largeur * T - 10) / L * 100) + "%;height:" + ((bloc.hauteur * T - 10) / H * 100) + "%";
    }

    function listePositions(joueurs) {
      return joueurs.slice().sort(function (a, b) { return b.position - a.position || a.id - b.id; }).map(function (j) {
        return UI.el("p", { style: O.styleJoueur(j) }, [O.pastille(j, 22), UI.el("b", { texte: j.prenom }),
          UI.el("span", { texte: j.rang !== null ? "Sommet" : PO.altitude(p.plateau.altitudes[j.position]) })]);
      });
    }

    function ecranLarge(vue, actif) {
      var z = RP.zonesLibres(p.plateau.cases.length);
      var cadre = UI.el("div", { classe: "plateau-cadre", style: "--colonnes:" + z.g.colonnes + ";--lignes:" + z.g.lignes });
      function nouveauSvg() {
        var n = O.depuisHTML(RP.svg(p.plateau, joueursDessines(vue), p.ctx.bib, cercle(vue, actif))), a = arriveeVisible(vue);
        if (a !== null) {
          var c = n.querySelectorAll(".case")[a];
          if (c) c.setAttribute("class", c.getAttribute("class") + " case-arrivee");
        }
        return n;
      }
      cadre.appendChild(nouveauSvg());
      var lancer = elementsLancer(actif, { taille: 150, enBarre: false, resteDansTitre: false });
      var coeur = lancer.ligne.concat(lancer.bouton ? [lancer.bouton] : []);
      // Longueur de plateau sans vide central (non prévue) : le lancer passe dans une barre sous le plateau.
      if (z.coeur) cadre.appendChild(UI.el("div", { classe: "coeur", style: placer(z.coeur, z.g) }, coeur));
      // À trois joueurs ou plus, la liste se range sur deux colonnes : les quatre tiennent dans la ligne libre du plateau.
      var liste = z.liste ? UI.el("div", { classe: "liste-positions" + (p.joueurs.length > 2 ? " liste-positions-grille" : ""), style: placer(z.liste, z.g) },
        listePositions(joueursDessines(vue))) : null;
      if (liste) cadre.appendChild(liste);
      var zone = UI.el("main", { classe: "plateau" }, [cadre]);
      if (vue === "anime" && dernier.i < dernier.images.length - 1) {
        animer(zone, function () {
          cadre.replaceChild(nouveauSvg(), cadre.firstElementChild);
          if (liste) { UI.vider(liste); listePositions(joueursDessines(vue)).forEach(function (n) { liste.appendChild(n); }); }
          if (ligneEffet) ligneEffet.className = classeEffet();
        });
      }
      return UI.el("section", { classe: "ecran ecran-jeu ecran-jeu-large" }, [
        bandeauJeu(vue, actif), zone,
        z.coeur ? null : UI.el("div", { classe: "lancer-barre" }, [UI.el("div", { classe: "lancer-ligne" }, lancer.ligne)].concat(lancer.bouton ? [lancer.bouton] : []))
      ]);
    }

    function ecranEtroit(vue, actif) {
      var zone = UI.el("main", { classe: "plateau-sentier" }), sentier = null;
      // Pose (ou remplace) le sentier et rend la fonction qui le fait défiler
      // jusqu'au joueur suivi et place la fenêtre visible sur la jauge.
      function poser() {
        var nouveau = O.depuisHTML(RS.html(p.plateau, joueursDessines(vue), p.ctx.bib, { actif: cercle(vue, actif), arrivee: arriveeVisible(vue) }));
        if (sentier) zone.replaceChild(nouveau, sentier); else zone.appendChild(nouveau);
        sentier = nouveau;
        var liste = sentier.querySelector(".sentier-cases"), fenetre = sentier.querySelector(".jauge-fenetre");
        function majFenetre() {
          if (!liste.scrollHeight) return;
          fenetre.style.top = (liste.scrollTop / liste.scrollHeight * 100) + "%";
          fenetre.style.height = Math.min(100, liste.clientHeight / liste.scrollHeight * 100) + "%";
        }
        liste.addEventListener("scroll", majFenetre);
        return function () {
          var j = suivi(vue, actif), position = j ? joueursDessines(vue)[j.id].position : 0;
          var li = liste.querySelector('[data-case="' + position + '"]');
          // Le joueur suivi se place au tiers inférieur du sentier ; plus haut quand la feuille du col monte du bas.
          if (li) liste.scrollTop = Math.max(0, li.offsetTop - liste.clientHeight * (p.attente ? 0.3 : 0.6) + li.offsetHeight / 2);
          majFenetre();
        };
      }
      var suivre = poser();
      var lancer = elementsLancer(actif, { taille: 52, enBarre: true, resteDansTitre: !!(vue || p.attente) });
      var barre = UI.el("div", { classe: "lancer-barre" }, [UI.el("div", { classe: "lancer-ligne" }, lancer.ligne)].concat(lancer.bouton ? [lancer.bouton] : []));
      if (vue === "anime" && dernier.i < dernier.images.length - 1) {
        animer(zone, function () { suivre = poser(); suivre(); if (ligneEffet) ligneEffet.className = classeEffet(); });
      }
      var ecran = UI.el("section", { classe: "ecran ecran-jeu ecran-jeu-etroit" }, [bandeauJeu(vue, actif), zone, barre]);
      // Le défilement ne se calcule qu'une fois le sentier dans la page.
      ecran.apresAjout = function () { suivre(); };
      return ecran;
    }

    function ecran() {
      var vue = presentation(), actif = vue ? null : Regles.joueurActif(p);
      // Le joueur qui doit lancer est dit une fois, quand le pion est posé et que l'écran lui laisse la main.
      if (actif && p.phase === "lancer" && !p.attente) env.annoncerUnique("lancer|" + p.tour + "|" + actif.id, "À " + actif.prenom + " de lancer");
      return env.mode() === "large" ? ecranLarge(vue, actif) : ecranEtroit(vue, actif);
    }

    // Ce que le patient lit quand le tour s'est fini sans effort : tous au refuge (le tour ne
    // compte aucune carte). Un joueur seul ou plusieurs, les mêmes mots simples.
    function texteAnnonce() {
      var noms = (dernier && dernier.refuges) || [];
      if (p.joueurs.length === 1) return "Tu n'as pas d'exercice à faire ce tour : repose-toi. Tu relances le dé au prochain tour.";
      if (noms.length >= p.joueurs.length) return "Tout le monde se repose : pas d'exercice à faire ce tour. On relance le dé au prochain tour.";
      var liste = noms.length > 1 ? noms.slice(0, -1).join(", ") + " et " + noms[noms.length - 1] : (noms[0] || "Personne");
      return liste + (noms.length > 1 ? " se reposent" : " se repose") + " : pas d'exercice à faire ce tour. On relance le dé au prochain tour.";
    }

    function annonce() {
      env.annoncerUnique("annonce|" + p.tour, "Refuge : pause pour ce tour. " + texteAnnonce());
      return UI.el("section", { classe: "ecran ecran-annonce" }, [
        env.bandeau([UI.el("h2", { classe: "titre-ecran", texte: "Refuge" })], [env.boutonTerminer()]),
        UI.el("main", { classe: "etape-seule" }, [
          O.montagne(),
          UI.el("span", { classe: "etape-picto" }, [O.picto(RP.ICONES.refuge, 76)]),
          UI.el("h1", { classe: "etape-titre", texte: F.typo("Refuge : pause pour ce tour") }),
          UI.el("p", { classe: "etape-texte", texte: F.typo(texteAnnonce()) }),
          UI.bouton("Continuer", function () { env.transition(function () { dernier = null; }); }, "bouton-principal bouton-large")
        ])
      ]);
    }

    // Après le choix du col : la phrase d'effet le dit, et, si le col était le dernier lancer du
    // tour, l'écran reste sur le sentier avec « Voir les cartes ».
    function apresCol(valeur) {
      if (!dernier) return;
      dernier.effet = valeur === "difficile" ? "Col : passage difficile, +3 cases." : "Col : passage facile, +1 case.";
      if (dernier.tour === p.tour && !dernier.vue) dernier.vue = vueApres();
    }

    return { ecran: ecran, annonce: annonce, nettoyer: nettoyer, presentation: presentation, apresCol: apresCol };
  }

  global.VueLancer = { creer: creer };
})(typeof globalThis !== "undefined" ? globalThis : this);
