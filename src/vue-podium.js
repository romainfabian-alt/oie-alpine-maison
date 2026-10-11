(function (global) {
  // Podium (maquette du 10/10/2026, vue 12) : marches (ex aequo regroupés), chrono de la
  // partie, « Nouvelle partie » et un lien discret « Retour à l'accueil ». Repris de L'Oie Alpine.
  function ecran(env) {
    var Regles = global.Regles, PO = global.PartieOutils, E = global.Estimation, R = global.Referentiel, F = global.Format;
    var p = env.p, UI = env.UI, doc = env.doc, O = env.O;
    var groupes = PO.groupesPodium(Regles.classement(p)), derniere = Regles.derniere(p);
    var tousAuSommet = p.joueurs.every(function (j) { return j.position === derniere; });
    var meilleur = groupes.reduce(function (min, g) { return Math.min(min, g.rang); }, Infinity);
    var marches = groupes.map(function (g) {
      var r = PO.rang(g.rang), taille = g.joueurs.length > 1 ? 60 : (g.rang === 1 ? 80 : 66);
      return UI.el("div", { classe: "marche marche-" + Math.min(g.rang, 4) }, [
        UI.el("div", { classe: "marche-grimpeurs" }, [g.rang === meilleur ? O.picto(O.ICO.drapeau, 34, "podium-drapeau") : null].concat(
          g.joueurs.map(function (j) {
            return UI.el("span", { classe: "grimpeur", style: O.styleJoueur(j) + ";--taille:" + taille + "px" }, [
              UI.el("i", { texte: global.RenduPlateau.initiale(j.prenom) }), UI.el("b", { texte: j.prenom })]);
          }))),
        UI.el("div", { classe: "marche-bloc" }, [
          UI.el("span", { classe: "marche-rang" }, [doc.createTextNode(r.nombre), UI.el("sup", { texte: r.suffixe })]),
          g.joueurs.length > 1 ? UI.el("span", { classe: "marche-note", texte: "ex aequo" }) : null
        ])
      ]);
    });
    if (!p.chrono.fin) p.chrono.fin = Date.now();
    var chrono = E.chronoPartie(p.chrono, p.tour, p.joueurs.length), tours = p.tour + (p.tour > 1 ? " tours" : " tour");
    return UI.el("section", { classe: "ecran ecran-podium" }, [
      O.montagne(true),
      UI.el("header", { classe: "podium-tete" }, [
        UI.el("p", { classe: "surtitre", texte: F.typo("Grande Motte · " + PO.altitude(p.plateau.altitudes[derniere])) }),
        UI.el("h1", { classe: "titre-podium", texte: "Au sommet" }),
        O.depuisHTML('<svg class="crete" viewBox="0 0 350 36" aria-hidden="true"><polyline points="40,34 96,22 126,28 175,5 208,19 236,12 310,34"/></svg>'),
        UI.el("p", { classe: "sous-titre", texte: F.typo((tousAuSommet ? "Partie terminée en " + tours : "Partie arrêtée au tour " + p.tour) +
          " · " + R.THEMES[p.plateau.theme].libelle + ", niveau " + p.plateau.niveau + ".") }),
        chrono ? UI.el("p", { classe: "podium-chrono", texte: F.typo(chrono) }) : null
      ]),
      UI.el("main", { classe: "podium podium-" + marches.length }, marches),   // le nombre de marches règle la taille des grimpeurs (style.css)
      UI.el("footer", { classe: "pied pied-podium" }, [
        UI.bouton("Nouvelle partie", env.nouvelle, "bouton-principal bouton-large bouton-bloc"),
        UI.bouton("Retour à l'accueil", env.quitter, "bouton-discret lien-accueil bouton-bloc")
      ])
    ]);
  }

  // Ce que dit la zone d'annonce quand le podium s'affiche : « Partie terminée. 1er Léa, 2e Tom ».
  function annonce(env) {
    var p = env.p, derniere = global.Regles.derniere(p);
    var tousAuSommet = p.joueurs.every(function (j) { return j.position === derniere; });
    return (tousAuSommet ? "Partie terminée" : "Partie arrêtée") + ". " + global.PartieOutils.texteClassement(global.Regles.classement(p));
  }

  global.VuePodium = { ecran: ecran, annonce: annonce };
})(typeof globalThis !== "undefined" ? globalThis : this);
