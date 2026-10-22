(function (global) {
  // Écran de partie : orchestre l'échauffement et l'effort (vue-effort.js), le
  // lancer (vue-lancer.js), le col et le podium (vue-podium.js). Toute action
  // du moteur passe par agir() : verrou contre le double appui, filet en cas
  // d'erreur, puis avis à l'appelant (surChangement) pour qu'il enregistre la
  // partie : cet écran n'écrit rien lui-même dans le stockage. L'appelant fournit :
  //   partie, mode() (« large » ou « etroit », sinon la classe du body),
  //   taille() (facultatif : { largeur, hauteur } de la fenêtre, pour choisir entre cartes côte à côte et onglets en mode
  //   « large » ; sans elle, les cartes se mettent côte à côte),
  //   surChangement(p) après chaque action qui change l'état, surFin(p) une fois, quand la
  //   partie est finie, surNouvelle() et surQuitter() depuis le podium et l'abandon,
  //   surPause() (partie gardée), veille (facultatif : sinon une veille propre à l'écran).
  // Accessibilité : une zone d'annonce (aria-live) posée dans la page, hors de #racine, dit le résultat du lancer,
  // le joueur qui doit lancer, les écrans d'annonce, le décompte des minuteurs (« 3 », « 2 », « 1 », « Temps écoulé ») et la fin de
  // partie ; après chaque redessin, le focus va au
  // bouton principal de la vue (ou à la cible que la vue demande, comme l'onglet choisi).
  var VERROU_MS = 500;
  var ANNONCES_GARDEES = 4;   // messages que la zone d'annonce garde (les plus anciens sont retirés)

  function afficher(racine, o) {
    var Regles = global.Regles, UI = global.UI, doc = global.document, PO = global.PartieOutils, RP = global.RenduPlateau, F = global.Format;
    var p = o.partie, fermerCol = null, fermerConfirmation = null, verrouJusqua = 0, quitte = false, panne = false;
    var verrousCartes = {};   // clé de carte -> instant jusqu'où elle est verrouillée (cartes côte à côte, voir agir)
    var derniereCle = null, messages = [];
    var finSignalee = p.phase === "fini";
    if (!p.chrono) p.chrono = { debut: Date.now() };
    var O = PO.creerOutils(doc, UI);
    // Mode de mise en page : celui que l'appelant fournit, sinon la classe posée sur le body.
    var mode = o.mode || function () { return doc.body.className.indexOf("mode-large") !== -1 ? "large" : "etroit"; };
    // Disposition des cartes d'effort pour nbCartes cartes : « cotes » ou « onglets » (mise-en-page.js).
    function disposition(nbCartes) {
      var t = o.taille ? o.taille() : null;
      return t && global.MiseEnPage ? global.MiseEnPage.disposition(t.largeur, t.hauteur, nbCartes) : "cotes";
    }
    var env = { p: p, UI: UI, doc: doc, O: O, mode: mode, disposition: disposition, quitte: function () { return quitte; },
      agir: agir, transition: transition, verrouiller: verrouiller, dessiner: dessiner, confirmer: confirmer, bandeau: bandeau,
      boutonTerminer: boutonTerminer, boutonQuitter: boutonQuitter, quitter: quitter, nouvelle: nouvelle,
      annoncer: annoncer, annoncerUnique: annoncerUnique };

    // Zone d'annonce pour les lecteurs d'écran : hors de #racine (chaque redessin la vide), donc elle survit aux redessins ;
    // visuellement masquée (style.css). Les messages s'ajoutent un à un, les plus anciens partent.
    var zone = UI.el("div", { classe: "annonces", "aria-live": "polite", "aria-atomic": "false", "aria-relevant": "additions" });
    doc.body.appendChild(zone);
    function annoncer(texte) {
      if (quitte || !texte) return;
      var m = UI.el("p", { texte: texte });
      zone.appendChild(m);
      messages.push(m);
      while (messages.length > ANNONCES_GARDEES) zone.removeChild(messages.shift());
    }
    // Une annonce liée à l'état affiché (« À Tom de lancer ») ne se répète pas quand l'écran se redessine sans changer.
    function annoncerUnique(cle, texte) {
      if (cle === derniereCle) return;
      derniereCle = cle;
      annoncer(texte);
    }

    var lancer = global.VueLancer.creer(env), effort = global.VueEffort.creer(env);

    // L'écran reste allumé pendant la partie, relâché au podium et à la sortie. Un échec de la veille
    // (navigateur sans Wake Lock, refus) ne doit jamais toucher la partie.
    var veille = o.veille || null, veillePropre = false;
    if (!veille && global.Veille) { try { veille = global.Veille.creer(); veillePropre = true; } catch (e) { veille = null; } }
    function veillePrendre() { try { if (veille) veille.prendre(); } catch (e) { /* sans gravité */ } }
    function veilleRelacher() { try { if (veille) veille.relacher(); } catch (e) { /* sans gravité */ } }
    function veilleDetacher() { try { if (veille) { if (veillePropre) veille.detacher(); else veille.relacher(); } } catch (e) { /* sans gravité */ } }

    // Le redessin ferme la feuille du col (dessiner() la rouvre si le choix est encore à faire), mais pas une
    // confirmation : la fenêtre « Terminer la partie ? » ouverte pendant la marche du pion doit rester.
    function nettoyer() {
      lancer.nettoyer();
      effort.nettoyer();
      if (fermerCol) { fermerCol(); fermerCol = null; }
    }
    function detruire() {
      quitte = true;
      nettoyer();
      if (fermerConfirmation) { fermerConfirmation(); fermerConfirmation = null; }
      effort.detruire();
      veilleDetacher();
      if (zone.parentNode) zone.parentNode.removeChild(zone);
    }
    function appeler(f) { if (f) f(); }
    function quitter() { if (quitte) return; detruire(); appeler(o.surQuitter); }   // partie effacée par l'app
    function nouvelle() { if (quitte) return; detruire(); appeler(o.surNouvelle || o.surQuitter); }   // depuis le podium : « Ta partie »
    function pause() { if (quitte) return; detruire(); appeler(o.surPause); }       // partie gardée, reprise possible

    function signature() {
      return [p.phase, p.tour, p.etape, p.lanceur, p.attente ? p.attente.type + p.attente.joueur : ""].join("|");
    }

    // forcer : verrouille même si la disposition ne change pas. libre : réponse
    // à une fenêtre de confirmation, jamais avalée par le verrou. carte : clé d'une carte d'effort affichée
    // côte à côte ; le verrou de l'action ne protège alors que cette carte (un autre joueur peut appuyer sur la
    // sienne tout de suite), sauf si l'action change l'écran (le verrou est alors celui de tout l'écran).
    function agir(action, forcer, libre, carte) {
      if (quitte) return false;
      var maintenant = Date.now();
      if (!libre && (maintenant < verrouJusqua || (carte && maintenant < (verrousCartes[carte] || 0)))) return false;
      var avant = signature();
      try { action(); } catch (e) { if (global.console) global.console.error(e); panne = true; }
      if (signature() !== avant) verrouJusqua = Date.now() + VERROU_MS;
      else if (forcer) {
        if (carte) verrousCartes[carte] = Date.now() + VERROU_MS;
        else verrouJusqua = Date.now() + VERROU_MS;
      }
      // La partie finie date sa fin tout de suite : l'appelant en a besoin (historique) avant le podium.
      if (p.phase === "fini" && !p.chrono.fin) p.chrono.fin = Date.now();
      if (!panne && o.surChangement) {
        try { o.surChangement(p); } catch (e2) { if (global.console) global.console.error(e2); }
      }
      dessiner();
      return true;
    }

    function verrouiller() { verrouJusqua = Date.now() + VERROU_MS; }

    // Changement d'écran sans effet sur la partie (« Voir les cartes », « Continuer » après un refuge) :
    // rien à enregistrer, mais le même verrou, pour qu'un double appui ne tombe pas sur le bouton qui suit.
    function transition(fn) {
      if (quitte) return false;
      if (Date.now() < verrouJusqua) return false;
      fn();
      verrouiller();
      dessiner();
      return true;
    }

    // Fenêtre de confirmation. Le choix sans action est l'annulation (Échap le prend aussi). Elle reste ouverte
    // quand l'écran se redessine derrière (fin de la marche du pion) ; si elle s'annule alors que le redessin a
    // détruit l'élément qui avait le focus, le focus va au bouton principal de la vue.
    function confirmer(titre, texte, choix) {
      if (fermerConfirmation) fermerConfirmation();
      fermerConfirmation = UI.modal(F.typo(titre), F.typo(texte), choix.map(function (c) {
        return { texte: c.texte, classe: c.classe, annuler: !c.action, action: function () {
          fermerConfirmation = null;
          if (c.action) c.action(); else if (!focusDansLEcran()) placerFocus();
        } };
      }));
    }

    function focusDansLEcran() { var a = doc.activeElement; return !!a && a !== doc.body && !!racine.contains && racine.contains(a); }

    // Le focus ne retombe jamais sur le body après un redessin : il va à la cible que la vue demande (une
    // fonction qui rend un élément de l'écran), sinon au bouton principal de la vue.
    function placerFocus(cible) {
      var n = null;
      if (cible) { try { n = cible(racine); } catch (e) { n = null; } }
      if (!n && racine.querySelector) n = racine.querySelector(".bouton-principal");
      if (n && n.focus) { try { n.focus({ preventScroll: true }); } catch (e2) { /* focus refusé : sans gravité */ } }
    }

    function confirmerAbandon() {
      confirmer("Abandonner la partie ?", "Elle ne sera pas enregistrée dans Mes parties.", [
        { texte: "Annuler" }, { texte: "Abandonner", classe: "bouton-principal", action: quitter }]);
    }

    // Boutons du bandeau : une icône seule sur le téléphone (maquette, vues 5 à 11), l'icône et son
    // mot sur la tablette (vues 15 et 16).
    // « Terminer » : une fenêtre de choix, puis le classement des joueurs encore en course sur leur position.
    // Une fois la partie finie (écran « Voir le podium »), il n'y a plus rien à terminer : pas de bouton.
    function boutonTerminer() {
      if (p.phase === "fini") return null;
      var large = mode() === "large";
      var b = O.boutonNu(large ? "bouton" : "bouton bouton-discret bouton-icone", function () {
        confirmer("Terminer la partie ?", "Le classement se fait selon la position de chacun.", [
          { texte: "Annuler" },
          { texte: "Abandonner sans classement", action: confirmerAbandon },
          { texte: "Terminer", classe: "bouton-principal", action: function () {
            agir(function () { if (p.phase !== "fini") Regles.terminer(p); }, false, true);
          } }
        ]);
      }, [O.picto(O.ICO.drapeau, large ? 22 : 24)].concat(large ? [doc.createTextNode("Terminer")] : []));
      b.setAttribute("aria-label", "Terminer");
      return b;
    }

    function boutonQuitter() {
      var large = mode() === "large";
      var b = O.boutonNu(large ? "bouton bouton-discret" : "bouton bouton-discret bouton-icone", confirmerAbandon,
        [O.picto(O.ICO.retour, large ? 22 : 24)].concat(large ? [doc.createTextNode("Quitter")] : []));
      b.setAttribute("aria-label", "Quitter");
      return b;
    }

    function bandeau(gauche, droite) {
      return UI.el("header", { classe: "bandeau" }, [UI.el("div", { classe: "bandeau-gauche" }, gauche),
        UI.el("div", { classe: "bandeau-droite" }, droite)]);
    }

    // Fenêtre du col (maquette, vue 8) : une feuille qui monte du bas sur le téléphone, une boîte
    // au centre sur la tablette. Une seule à la fois, une seule réponse. Elle impose un choix : Échap
    // ne la ferme pas. UI.fenetre lui donne son rôle de dialogue, son titre et le focus.
    function demanderCol() {
      var a = p.attente, j = p.joueurs[a.joueur], c = p.plateau.cases[j.caseDuTour], repondu = false;
      function choisir(valeur) {
        if (repondu) return;
        repondu = agir(function () {
          if (p.attente !== a) return;
          Regles.choisir(p, valeur);
          lancer.apresCol(valeur);
        });
      }
      var titre = UI.el("h2", { classe: "modal-titre", texte: "Le col" });
      var boite = UI.el("div", { classe: "modal", "aria-label": "Le col" }, [
        UI.el("div", { classe: "modal-entete", style: O.styleJoueur(j) }, [
          O.picto(RP.ICONES.col, 44, "picto-clair"),
          UI.el("div", {}, [
            UI.el("p", { classe: "modal-sur", texte: PO.insecable("Case " + (j.caseDuTour + 1) + " · " +
              PO.altitude(p.plateau.altitudes[j.caseDuTour]) + " · " + PO.nomChaine(p, c.chaine)) }),
            titre
          ]),
          O.pastille(j, 30)
        ]),
        UI.el("div", { classe: "modal-corps" }, [
          UI.el("p", { classe: "modal-question", texte: F.typo(j.prenom + ", par où passes-tu le col ?") }),
          UI.el("div", { classe: "choix" }, [
            O.boutonNu("bouton choix-bouton", function () { choisir("facile"); }, [
              UI.el("span", { classe: "choix-titre", texte: F.typo("Facile : +1 case") }),
              UI.el("span", { classe: "choix-detail", texte: "Le dosage normal de ton exercice." })]),
            O.boutonNu("bouton choix-bouton choix-difficile", function () { choisir("difficile"); }, [
              UI.el("span", { classe: "choix-titre", texte: F.typo("Difficile : +3 cases") }),
              UI.el("span", { classe: "choix-detail", texte: "Même exercice avec moitié plus de volume." })])
          ])
        ])
      ]);
      if (fermerCol) fermerCol();
      fermerCol = UI.fenetre(boite, titre, null);
    }

    function ecranErreur(texte) {
      return UI.el("section", { classe: "ecran ecran-erreur" }, [UI.el("main", { classe: "etape-seule" }, [
        UI.el("h1", { classe: "etape-titre", texte: "Petit souci" }),
        UI.el("p", { classe: "etape-texte", texte: texte || "L'écran n'a pas pu s'afficher. La partie est conservée." }),
        UI.bouton("Réessayer", function () { dessiner(); }, "bouton-principal bouton-large"),
        UI.bouton("Revenir à l'accueil", pause, "bouton-large")
      ])]);
    }

    // cible : facultatif, une fonction qui rend l'élément de l'écran à qui donner le focus (l'onglet choisi) ;
    // sinon le bouton principal de la vue. discret : redessin demandé par l'appelant (rotation) : le focus n'est
    // touché que s'il était dans l'écran.
    function dessiner(cible, discret) {
      if (quitte) return;
      var rendre = !discret || focusDansLEcran();   // à savoir avant que le redessin ne détruise l'élément qui l'avait
      nettoyer();
      effort.oublierDisposition();
      UI.vider(racine);
      if (panne) {
        panne = false;
        racine.appendChild(ecranErreur("L'action n'a pas abouti. La partie est conservée."));
        if (rendre && !fermerConfirmation) placerFocus();
        return;
      }
      try {
        // La fin de partie est signalée une fois, dès que le moteur la constate, même si le lancer
        // qui l'a amenée reste encore à l'écran (le pion marche) : l'appelant garde l'historique.
        if (p.phase === "fini") {
          if (!p.chrono.fin) p.chrono.fin = Date.now();
          if (!finSignalee) {
            finSignalee = true;
            try { if (o.surFin) o.surFin(p); } catch (e3) { if (global.console) global.console.error(e3); }
          }
        }
        var vue = lancer.presentation();
        var podium = !vue && p.phase === "fini";
        var corps = p.phase === "echauffement" ? effort.ecranEchauffement()
          : vue === "annonce" ? lancer.annonce()
          : (p.phase === "lancer" || vue) ? lancer.ecran()
          : p.phase === "effort" ? effort.ecranEffort() : global.VuePodium.ecran(env);
        racine.appendChild(corps);
        if (corps.apresAjout) corps.apresAjout();
        if (podium) { veilleRelacher(); annoncerUnique("fin", global.VuePodium.annonce(env)); } else veillePrendre();
        // Le focus d'abord : si la feuille du col s'ouvre ensuite, c'est elle qui le prend.
        if (rendre && !fermerConfirmation) placerFocus(cible);
        if (!vue && p.phase === "lancer" && p.attente) demanderCol();
      } catch (e) {
        if (global.console) global.console.error(e);
        nettoyer();
        UI.vider(racine);
        racine.appendChild(ecranErreur());
        if (rendre && !fermerConfirmation) placerFocus();
      }
    }

    dessiner();
    // ajuster : la fenêtre a changé sans changer de mode (large <-> étroit). Les cartes d'effort se redessinent si
    // la place ne permet plus la même disposition ; sinon on remet à jour les indices « il y a une suite ».
    function ajuster() {
      if (quitte) return;
      if (effort.dispositionChangee()) dessiner(null, true);
      else effort.rafraichirSuites();
    }
    return { detruire: detruire, redessiner: function () { if (!quitte) dessiner(null, true); }, ajuster: ajuster };
  }

  global.EcranPartie = { afficher: afficher };
})(typeof globalThis !== "undefined" ? globalThis : this);
