(function (global) {
  "use strict";
  // Point d'entrée : navigation entre les écrans, données gardées sur l'appareil (réglages, partie en cours,
  // historique), mise en page selon l'écran, reprise, filet contre l'écran blanc, service worker. Structure reprise
  // de L'Oie Alpine (src/app.js), adaptée à la maison.
  //
  // Une seule page : l'app n'utilise pas l'historique du navigateur (pas de pushState). Le bouton « retour » d'un
  // téléphone sort donc de l'app, comme partout ; la partie en cours est enregistrée à chaque action et se reprend
  // depuis l'accueil. Les « Retour », « Terminer » et « Abandonner » de l'app passent par une confirmation.
  //
  // demarrer(options) est appelée une seule fois, en bas du fichier, quand la page a un vrai document ; les tests
  // l'appellent avec un faux DOM. Options (toutes facultatives) : fenetre (par défaut la globale : innerWidth,
  // innerHeight, localStorage, navigator, addEventListener, setTimeout, scrollTo, location), document, racine.

  var MESSAGE_SOUCI = "Un souci est survenu.";
  var MESSAGE_SOUCI_GARDEE = "Un souci est survenu. Ta partie est enregistrée, tu peux la reprendre.";
  var DELAI_MODE = 150;        // ms : on laisse la fenêtre finir de se redimensionner
  var DELAI_ORIENTATION = 500; // ms : iOS annonce parfois l'ancienne taille juste après un changement d'orientation
  var CLE_SON = "oieMaison.son";

  // Le stockage du navigateur peut lever dès qu'on le touche (navigation privée, cookies bloqués) : on rend alors null,
  // et l'app reste jouable sans rien garder.
  function stockageLocal(fen) {
    try {
      var s = fen.localStorage;
      if (!s) return null;
      s.getItem(CLE_SON);
      return s;
    } catch (e) { return null; }
  }

  // Le chrono d'une partie est fait d'horodatages absolus (debut : ouverture de l'échauffement, depart : premier lancer).
  // Le temps où l'app était fermée ne doit pas compter : à la reprise on les décale de la durée d'absence.
  // `fin` n'existe pas dans une partie en cours (la partie finie n'est plus enregistrée).
  function decalerChrono(chrono, absenceMs) {
    if (!chrono || typeof chrono !== "object" || typeof absenceMs !== "number" || !isFinite(absenceMs) || absenceMs <= 0) return chrono;
    ["debut", "depart"].forEach(function (k) { if (typeof chrono[k] === "number") chrono[k] += absenceMs; });
    return chrono;
  }

  // Durée écoulée depuis la dernière écriture de la partie ; 0 si l'heure manque, est abîmée ou si l'horloge a reculé.
  function absence(sauvegardee, maintenant) {
    var ecrit = sauvegardee && sauvegardee.ecrit;
    if (typeof ecrit !== "number" || !isFinite(ecrit)) return 0;
    return maintenant > ecrit ? maintenant - ecrit : 0;
  }

  // Durée entre deux heures ; 0 si l'horloge a reculé.
  function absenceDepuis(depuis, maintenant) { return maintenant > depuis ? maintenant - depuis : 0; }

  function graine() { return Date.now() % 4294967296; }

  function demarrer(o) {
    o = o || {};
    var fen = o.fenetre || global, doc = o.document || global.document;
    var racine = o.racine || doc.getElementById("racine");
    var UI = global.UI;

    var stockage = stockageLocal(fen);
    var sauvegarde = global.Sauvegarde.creer(stockage);
    var bib = global.Bibliotheque.defaut();
    var son = global.SonOie.creer(stockage);   // un seul son pour toute l'app
    var veille = null;
    try { veille = global.Veille.creer(); } catch (e) { veille = null; }   // l'écran de partie en crée une si besoin

    var partieActive = null, ecranPartieActif = null, enErreur = false;
    var modeBrut = null;       // « large », « etroit » ou « tourner »
    var modeJeu = "etroit";    // la mise en page de l'écran de partie : le dernier mode qui n'était pas « tourner »
    var minuterieMode = null, branchements = [];
    // Heure à laquelle la page a été masquée (appel, autre application) sans que l'application soit fermée : à son
    // retour, ce temps est retiré du chrono, comme celui d'une application fermée (voir surRetourAuPremierPlan).
    var masqueDepuis = null;
    // Joueurs saisis dans « Les grimpeurs », gardés si l'on revient à « Ta partie » puis qu'on repasse à « Suivant » :
    // même forme que les réglages enregistrés (niveau du parcours, joueurs). Oublié dès qu'une partie commence ou
    // qu'on repart de l'accueil.
    var brouillonJoueurs = null;

    // ------------------------------------------------------------------ mise en page
    function champEnSaisie() {
      var a = doc.activeElement, t = a && a.tagName ? String(a.tagName).toLowerCase() : "";
      return t === "input" || t === "textarea" || t === "select" || !!(a && a.isContentEditable);
    }

    // Pendant « tourner », le reste de la page est caché aux lecteurs d'écran (et au clavier là où inert existe).
    function cacherLeReste(oui) {
      try {
        if (oui) { racine.setAttribute("aria-hidden", "true"); racine.setAttribute("inert", ""); }
        else { racine.removeAttribute("aria-hidden"); racine.removeAttribute("inert"); }
      } catch (e) { /* sans gravité */ }
    }

    // Rend vrai quand la disposition de l'écran de partie change (large <-> étroit) : il doit alors se redessiner.
    function appliquerMode() {
      var m = global.MiseEnPage.mode(fen.innerWidth, fen.innerHeight);
      // Sur Android, le clavier réduit la fenêtre : un champ de prénom ouvert ferait passer un téléphone en portrait
      // pour un téléphone couché. Tant qu'un champ a le focus, on ne bascule pas vers « tourner ».
      if (modeBrut !== null && m === "tourner" && modeBrut !== "tourner" && champEnSaisie()) return false;
      if (m === modeBrut) return false;
      modeBrut = m;
      doc.body.className = "mode-" + m;
      cacherLeReste(m === "tourner");
      if (m === "tourner") return false;
      var change = modeJeu !== m;
      modeJeu = m;
      return change;
    }

    function mode() { return modeJeu; }

    // Changement de mode : l'écran de partie se redessine. Même mode (large reste large) : il s'ajuste, car des cartes
    // côte à côte peuvent n'avoir plus la place, ou la retrouver (fenêtre redimensionnée, écran partagé).
    function reevaluerMode() {
      try {
        var change = appliquerMode();
        if (!ecranPartieActif) return;
        if (change) ecranPartieActif.redessiner();
        else if (modeBrut !== "tourner") ecranPartieActif.ajuster();
      } catch (e) { erreur(e); }
    }

    function surRedimension() {
      fen.clearTimeout(minuterieMode);
      minuterieMode = fen.setTimeout(reevaluerMode, DELAI_MODE);
    }

    function surOrientation() {
      surRedimension();
      fen.setTimeout(reevaluerMode, DELAI_ORIENTATION);
    }

    // ------------------------------------------------------------------ outils
    function contexte() { return { bib: bib, ev: global.EVENEMENTS, alea: global.Aleatoire.creer(graine()) }; }
    function plateau(theme, niveau, duree) { return global.Parcours.trouver(global.PLATEAUX, theme, niveau, duree); }
    function enHaut() { try { if (fen.scrollTo) fen.scrollTo(0, 0); } catch (e) { /* sans gravité */ } }
    function relacherVeille() { try { if (veille) veille.relacher(); } catch (e) { /* sans gravité */ } }

    function detruirePartieActive() {
      var e = ecranPartieActif;
      ecranPartieActif = null;
      partieActive = null;
      if (e) e.detruire();
    }

    // Une erreur pendant l'affichage d'un écran renvoie à l'accueil (voir erreur) au lieu de laisser une page blanche.
    function nav(f) {
      return function () {
        try { return f.apply(null, arguments); } catch (e) { erreur(e); }
      };
    }

    function donnerLeFocus(selecteur) {
      var n = racine.querySelector ? racine.querySelector(selecteur) : null;
      if (n && n.focus) { try { n.focus({ preventScroll: true }); } catch (e) { /* sans gravité */ } }
    }

    // ------------------------------------------------------------------ la partie en cours : lire, écrire, finir
    // Une partie qu'on sait reprendre : plateau connu et état de la bonne forme (Regles.restaurer lève sinon). Sinon on
    // efface la sauvegarde, pour qu'elle ne bloque pas chaque ouverture, et on rend null.
    function reprisePossible() {
      var s = sauvegarde.lirePartie(), pl, p;
      if (!s) { sauvegarde.effacerPartie(); return null; }   // rien d'utilisable (absente ou abîmée) : on ne la garde pas
      try {
        pl = global.Parcours.trouverParId(global.PLATEAUX, s.plateau);
        if (!pl) throw new Error("Plateau inconnu : " + s.plateau);
        p = global.Regles.restaurer(s.etat, pl, contexte());
        if (p.phase === "fini") throw new Error("Partie déjà finie");
      } catch (e) {
        sauvegarde.effacerPartie();
        return null;
      }
      return { s: s, pl: pl };
    }

    // Enregistrée après chaque action (et au passage en arrière-plan), avec l'heure : un appel ou une fermeture de l'app
    // ne perd rien. Une partie finie n'est plus « en cours » : surFin l'efface et la verse à l'historique.
    function enregistrer(p) {
      if (p.phase === "fini") return;
      sauvegarde.ecrirePartie(p.plateau.id, global.Regles.exporter(p), Date.now());
    }

    // Appelé une seule fois, dès que la partie est finie (même si le podium n'est pas encore affiché).
    function finir(p) {
      sauvegarde.ajouterHistorique(global.Sauvegarde.entree(p, Date.now()));
      sauvegarde.effacerPartie();
    }

    function partieEnCours() { return partieActive && ecranPartieActif && partieActive.phase !== "fini" ? partieActive : null; }

    // La page passe en arrière-plan (autre application, appel, écran verrouillé) : la partie est enregistrée avec l'heure,
    // et on retient l'heure du départ (la première seule : « pagehide » suit souvent « visibilitychange »).
    function surMasquage() {
      var p = partieEnCours();
      if (!p) return;
      enregistrer(p);
      if (masqueDepuis === null) masqueDepuis = Date.now();
    }

    // Retour au premier plan sans fermeture (rien n'a été rechargé) : le temps passé en arrière-plan est retiré du chrono.
    // Si la page a été fermée entre-temps, c'est la reprise (reprendre) qui s'en charge, depuis l'heure d'écriture.
    function surRetourAuPremierPlan() {
      var depuis = masqueDepuis, p = partieEnCours();
      masqueDepuis = null;
      if (depuis === null || !p) return;
      decalerChrono(p.chrono, absenceDepuis(depuis, Date.now()));
      enregistrer(p);
    }

    var lancerPartie = nav(function (p) {
      enErreur = false;
      detruirePartieActive();
      partieActive = p;
      ecranPartieActif = global.EcranPartie.afficher(racine, {
        partie: p, son: son, mode: mode, veille: veille,
        taille: function () { return { largeur: fen.innerWidth, hauteur: fen.innerHeight }; },
        surChangement: enregistrer, surFin: finir,
        // « Nouvelle partie » du podium : l'écran s'est déjà détruit lui-même.
        surNouvelle: function () { ecranPartieActif = null; partieActive = null; choix(null); },
        // « Retour à l'accueil » du podium et « Abandonner » : la partie en cours est effacée, rien dans l'historique.
        surQuitter: function () { ecranPartieActif = null; partieActive = null; sauvegarde.effacerPartie(); accueil(false); },
        // « Revenir à l'accueil » de l'écran « Petit souci » : la partie est gardée.
        surPause: function () { ecranPartieActif = null; partieActive = null; accueil(false); }
      });
      enregistrer(p);
      enHaut();
    });

    var reprendre = nav(function () {
      var s = sauvegarde.lirePartie(), p;
      try {
        var pl = global.Parcours.trouverParId(global.PLATEAUX, s.plateau);
        p = global.Regles.restaurer(s.etat, pl, contexte());   // aléa neuf : il n'est pas sauvegardé
        if (p.phase === "fini") throw new Error("Partie déjà finie");
      } catch (e) {
        sauvegarde.effacerPartie();
        accueil(false);
        return;
      }
      decalerChrono(p.chrono, absence(s, Date.now()));
      lancerPartie(p);   // l'enregistre aussitôt : la prochaine absence se compte depuis maintenant
    });

    // ------------------------------------------------------------------ les écrans
    // souci : revenir à l'accueil après une erreur, avec un message court (rien de technique).
    function afficherAccueil(souci) {
      detruirePartieActive();
      relacherVeille();
      brouillonJoueurs = null;
      enErreur = !!souci;   // tant que le message est là, une autre erreur ne refait pas l'accueil
      var r = reprisePossible();
      global.EcranAccueil.afficher(racine, {
        reprise: r ? { texte: global.EcranAccueil.texteReprise(r.s, r.pl), surReprendre: function () { reprendre(); },
          surAbandonner: function () { sauvegarde.effacerPartie(); accueil(false); } } : null,
        // Une seule partie en cours : en commencer une autre la remplacera, après confirmation (au lancement de la
        // nouvelle seulement : revenir en arrière garde l'ancienne).
        surNouvelle: function () {
          if (!r) { choix(null); return; }
          UI.modal(global.Format.typo("Commencer une nouvelle partie ?"), "Ta partie en cours sera remplacée par la nouvelle.", [
            { texte: "Annuler" }, { texte: "Nouvelle partie", classe: "bouton-principal", action: function () { choix(null); } }]);
        },
        surHistorique: function () { historique(); },
        surRegles: function () { regles(); }
      });
      if (souci) poserAvis(r ? MESSAGE_SOUCI_GARDEE : MESSAGE_SOUCI);
      enHaut();
    }

    function poserAvis(texte) {
      var ecran = racine.querySelector ? racine.querySelector(".ecran-accueil") : null;
      if (!ecran) return;
      var avis = UI.el("p", { classe: "avis", role: "alert", texte: texte });
      if (ecran.insertBefore) ecran.insertBefore(avis, ecran.firstChild); else ecran.appendChild(avis);
    }

    var accueil = nav(function (souci) { afficherAccueil(souci === true); });

    var regles = nav(function () {
      enErreur = false;
      global.EcranRegles.afficher(racine, { surRetour: function () { accueil(false); } });
      enHaut();
    });

    var historique = nav(function () {
      enErreur = false;
      global.EcranHistorique.afficher(racine, { historique: sauvegarde.lireHistorique(), maintenant: Date.now(),
        // Le bouton « Tout effacer » disparaît avec la liste : le focus passe au bouton « Retour ».
        surEffacer: function () { sauvegarde.effacerHistorique(); historique(); donnerLeFocus(".bouton-retour"); },
        surRetour: function () { accueil(false); } });
      enHaut();
    });

    // c : le choix en cours (retour depuis « Les grimpeurs »), sinon les derniers réglages.
    var choix = nav(function (c) {
      enErreur = false;
      if (!c) brouillonJoueurs = null;
      global.EcranChoix.afficher(racine, { reglages: c || sauvegarde.lireReglages(), plateau: plateau,
        surRetour: function () { accueil(false); }, surSuite: function (x) { joueurs(x); } });
      enHaut();
    });

    var joueurs = nav(function (c) {
      enErreur = false;
      var pl = plateau(c.theme, c.niveau, c.duree);
      if (!pl) throw new Error("Plateau introuvable : " + c.theme + " " + c.niveau + " " + c.duree);
      global.EcranJoueurs.afficher(racine, { plateau: pl, reglages: brouillonJoueurs || sauvegarde.lireReglages(),
        // « Retour » rend les joueurs saisis : « Ta partie » les garde pour le « Suivant » qui suit.
        surRetour: function (saisie) { brouillonJoueurs = saisie || null; choix(c); },
        surCommencer: function (liste) { commencer(c, pl, liste); } });
      enHaut();
    });

    // Les réglages sont gardés au moment où la partie commence (les règles illustrées n'ont pas de retour) : ils
    // préremplissent « Ta partie » et « Les grimpeurs » la fois suivante.
    var commencer = nav(function (c, pl, liste) {
      brouillonJoueurs = null;
      sauvegarde.ecrireReglages({ theme: c.theme, niveau: c.niveau, duree: c.duree, espace: c.espace,
        joueurs: liste.map(function (j) { return { prenom: j.prenom, niveau: j.niveau, filtres: j.filtres }; }) });
      global.EcranRegles.afficher(racine, { surSuite: nav(function () {
        lancerPartie(global.Regles.creerPartie(pl, liste, contexte(), { espace: c.espace }));
      }) });
      enHaut();
    });

    // ------------------------------------------------------------------ erreurs : jamais d'écran blanc
    // Écran de dernier recours, en DOM brut (aucun module de l'app) : il ne doit dépendre de rien qui puisse lever.
    function ecranMinimal() {
      var gardee = false;
      try { gardee = !!sauvegarde.lirePartie(); } catch (e) { gardee = false; }
      var cible = racine && racine.appendChild ? racine : doc.body, i;
      try { while (cible.firstChild) cible.removeChild(cible.firstChild); } catch (e1) { /* on ajoute quand même la boîte */ }
      try {   // une fenêtre restée accrochée au body cacherait la boîte
        var fonds = doc.body.getElementsByClassName ? doc.body.getElementsByClassName("modal-fond") : [];
        for (i = fonds.length - 1; i >= 0; i--) doc.body.removeChild(fonds[i]);
      } catch (e2) { /* sans gravité */ }
      var section = doc.createElement("section"), main = doc.createElement("main"), titre = doc.createElement("h1"),
        texte = doc.createElement("p"), bouton = doc.createElement("button");
      section.className = "ecran ecran-erreur"; main.className = "etape-seule"; titre.className = "etape-titre"; texte.className = "etape-texte";
      bouton.className = "bouton bouton-principal bouton-large"; bouton.type = "button";
      titre.textContent = "Un souci est survenu";
      texte.textContent = gardee ? "Ta partie est enregistrée : tu pourras la reprendre depuis l'accueil." : "Tu peux revenir à l'accueil.";
      bouton.textContent = "Revenir à l'accueil";
      bouton.onclick = function () { try { fen.location.reload(); } catch (e3) { /* sans gravité */ } };
      main.appendChild(titre); main.appendChild(texte); main.appendChild(bouton); section.appendChild(main);
      cible.appendChild(section);
    }

    // Une erreur imprévue ne laisse jamais une page blanche : retour à l'accueil avec un message court, la partie en cours
    // (déjà enregistrée à chaque action) reste à reprendre. Rien de technique n'est affiché ; le détail va à la console.
    function erreur(cause) {
      try { if (global.console && global.console.error && cause) global.console.error(cause); } catch (e) { /* sans gravité */ }
      if (enErreur) return;   // une erreur pendant l'écran d'erreur ne reboucle jamais
      enErreur = true;
      try { detruirePartieActive(); relacherVeille(); } catch (e1) { /* on affiche quand même l'accueil */ }
      try { afficherAccueil(true); }
      catch (e2) {
        try { ecranMinimal(); } catch (e3) { enErreur = false; }   // même l'écran minimal a échoué : une prochaine erreur aura sa chance
      }
    }

    function surErreurGlobale(e) {
      // Une erreur sans exception derrière (« Script error. » d'un autre site, boucle de ResizeObserver) n'est pas la nôtre.
      if (e && !e.error && /Script error|ResizeObserver/i.test(String(e.message || ""))) return;
      erreur(e && e.error ? e.error : e && e.message);
    }

    // Une promesse rejetée sans suite (un Wake Lock refusé, un son bloqué) ne doit pas sortir un joueur de sa partie :
    // on ne réagit que si la page est vide.
    function surRejet(e) {
      var raison = e && e.reason;
      if (racine.firstChild) { try { if (global.console && global.console.warn) global.console.warn(raison); } catch (e1) { /* sans gravité */ } return; }
      erreur(raison);
    }

    // ------------------------------------------------------------------ hors ligne
    function enregistrerHorsLigne() {
      try {
        var n = fen.navigator;
        if (!n || !n.serviceWorker || !n.serviceWorker.register) return;
        var r = n.serviceWorker.register("service-worker.js");
        if (r && r.catch) {
          r.catch(function () { /* file:// ou navigateur sans support : l'app marche quand même, sans cache hors ligne */ });
        }
      } catch (e) { /* certains navigateurs lèvent tout de suite sur file:// : sans gravité */ }
    }

    // ------------------------------------------------------------------ démarrage
    function brancher(cible, type, f) {
      if (!cible || !cible.addEventListener) return;
      cible.addEventListener(type, f);
      branchements.push([cible, type, f]);
    }

    function surVisibilite() {
      if (doc.visibilityState === "hidden") surMasquage();
      else if (doc.visibilityState === "visible") surRetourAuPremierPlan();
    }

    function arreter() {
      fen.clearTimeout(minuterieMode);
      detruirePartieActive();
      branchements.forEach(function (b) { if (b[0].removeEventListener) b[0].removeEventListener(b[1], b[2]); });
      branchements = [];
      try { if (veille) veille.detacher(); } catch (e) { /* sans gravité */ }
    }

    appliquerMode();
    brancher(fen, "resize", surRedimension);
    brancher(fen, "orientationchange", surOrientation);
    brancher(doc, "focusout", surRedimension);   // le clavier se referme : on recompte la mise en page
    brancher(fen, "pagehide", surMasquage);
    brancher(fen, "pageshow", surRetourAuPremierPlan);
    brancher(doc, "visibilitychange", surVisibilite);
    brancher(fen, "error", surErreurGlobale);
    brancher(fen, "unhandledrejection", surRejet);
    accueil(false);
    enregistrerHorsLigne();
    return { arreter: arreter, mode: mode };
  }

  var App = { demarrer: demarrer, decalerChrono: decalerChrono, absence: absence, absenceDepuis: absenceDepuis, stockageLocal: stockageLocal };
  if (typeof module !== "undefined" && module.exports) module.exports = App;
  else {
    global.App = App;
    if (global.document && global.document.getElementById && global.document.getElementById("racine")) demarrer();
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
