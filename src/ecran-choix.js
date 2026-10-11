(function (global) {
  // Ta partie : thème, niveau du parcours (1 à 20), durée, espace. Écran
  // rempli par le patient : une phrase d'aide sous chaque bloc.
  var R = (typeof require !== "undefined") ? require("./referentiel.js") : global.Referentiel;
  var F = (typeof require !== "undefined") ? require("./format.js") : global.Format;

  var GROUPES = [
    { titre: "Zones", themes: ["membre_inferieur", "membre_superieur", "tronc", "full_body"] },
    { titre: "Sports", themes: ["ski_alpin", "trail", "raquette", "sports_collectifs", "escalade", "velo"] },
    { titre: "Récupération", themes: ["mobilite"] }
  ];

  function propre(o, cle) { return Object.prototype.hasOwnProperty.call(o, cle); }

  // Valeurs de départ : celles de la dernière partie quand elles sont encore
  // valides, sinon membre inférieur, niveau 5, 45 min, petit espace. Les réglages
  // viennent de l'appareil (absents, abîmés, d'une ancienne version) : chaque
  // valeur inconnue retombe seule sur son défaut, rien ne lève.
  function depart(reglages) {
    var r = reglages && typeof reglages === "object" ? reglages : {};
    return {
      theme: typeof r.theme === "string" && propre(R.THEMES, r.theme) ? r.theme : "membre_inferieur",
      niveau: r.niveau >= 1 && r.niveau <= R.NIVEAU_MAX && Math.round(r.niveau) === r.niveau ? r.niveau : 5,
      duree: R.DUREES.indexOf(r.duree) !== -1 ? r.duree : R.DUREE_DEFAUT,
      espace: typeof r.espace === "string" && propre(R.ESPACES, r.espace) ? r.espace : "petit"
    };
  }

  function afficher(racine, o) {
    var UI = global.UI, E = global.Estimation, choix = depart(o.reglages);
    // Redessine l'écran sans le faire remonter, puis rend le focus au contrôle touché
    // (repéré par son data-cle) : un lecteur d'écran ou un clavier ne repart pas du haut.
    function maj(cle) {
      UI.surPlace(function () {
        dessiner();
        var c = cle && racine.querySelector ? racine.querySelector('[data-cle="' + cle + '"]') : null;
        if (c && c.focus) c.focus();
      });
    }

    // Une rangée de choix exclusifs : des boutons à état « enfoncé », dans un groupe nommé.
    function segments(p) {
      return UI.el("div", { classe: "segments " + p.classe, role: "group", "aria-label": p.nom }, p.valeurs.map(function (v) {
        var actif = v === p.actuelle;
        return UI.el("button", { type: "button", classe: "segment" + (actif ? " choisi" : ""), "aria-pressed": String(actif),
          "data-cle": p.cle(v), onclick: function () { p.surChoix(v); maj(p.cle(v)); } }, p.libelle(v));
      }));
    }

    function bloc(titre, aide, enfants) {
      return UI.el("section", { classe: "bloc" }, [UI.el("h3", { classe: "bloc-titre", texte: titre }),
        UI.el("p", { classe: "aide", texte: F.typo(aide) })].concat(enfants));
    }

    function niveauVal(niveau) {
      return UI.el("span", { classe: "niveau-val" }, [String(niveau), UI.el("small", { texte: F.typo("sur " + R.NIVEAU_MAX) })]);
    }

    function blocTheme() {
      return bloc("Le thème", "Ce que tu veux travailler aujourd'hui.", GROUPES.map(function (g) {
        return UI.el("div", { classe: "groupe-themes", role: "group", "aria-label": g.titre }, [
          UI.el("p", { classe: "groupe-titre", texte: g.titre }),
          UI.el("div", { classe: "tuiles-themes" }, g.themes.map(function (t) {
            return UI.el("button", { type: "button", classe: "tuile-theme" + (g.themes.length === 1 ? " tuile-seule" : "") + (t === choix.theme ? " choisie" : ""),
              "aria-pressed": String(t === choix.theme), "data-cle": "theme:" + t, texte: R.THEMES[t].libelle,
              onclick: function () { choix.theme = t; maj("theme:" + t); } });
          }))
        ]);
      }));
    }

    function blocNiveau() {
      var phase = R.phaseDe(choix.niveau);
      return bloc("Le niveau du parcours", "Plus il est haut, plus il y a d'avalanches et de crevasses. La première fois, c'est aussi ton niveau d'exercice. Tu peux régler le niveau de chacun à l'écran suivant.", [
        segments({ classe: "segments-phases", nom: "Phase du niveau", valeurs: R.PHASES, actuelle: phase,
          libelle: function (ph) { return [ph.libelle, UI.el("small", { texte: ph.min + " à " + ph.max })]; },
          cle: function (ph) { return "phase:" + ph.min; }, surChoix: function (ph) { choix.niveau = ph.min; } }),
        UI.el("div", { classe: "niveau" }, [
          UI.el("button", { type: "button", classe: "bouton bouton-carre", "aria-label": "Baisser le niveau", "data-cle": "moins", texte: "−",
            onclick: function () { choix.niveau = Math.max(1, choix.niveau - 1); maj("moins"); } }),
          niveauVal(choix.niveau),
          UI.el("button", { type: "button", classe: "bouton bouton-carre", "aria-label": "Monter le niveau", "data-cle": "plus", texte: "+",
            onclick: function () { choix.niveau = Math.min(R.NIVEAU_MAX, choix.niveau + 1); maj("plus"); } })
        ]),
        UI.el("p", { classe: "bloc-detail", texte: phase.detail })
      ]);
    }

    function blocDuree() {
      var pl = o.plateau(choix.theme, choix.niveau, choix.duree);
      var resume = pl && E ? E.resume(pl, global.DUREES) : "";   // vide sans durée calculée : rien à afficher
      return bloc("La durée", "Temps de jeu, sans compter l'échauffement.", [
        segments({ classe: "segments-3", nom: "Durée de la partie", valeurs: R.DUREES, actuelle: choix.duree,
          libelle: function (d) { return [F.typo(d + " min")]; }, cle: function (d) { return "duree:" + d; }, surChoix: function (d) { choix.duree = d; } }),
        resume ? UI.el("p", { classe: "bloc-detail", texte: F.typo(resume) }) : null
      ]);
    }

    function blocEspace() {
      return bloc("L'espace", "La place dont tu disposes, pour toute la partie.", [
        segments({ classe: "segments-2", nom: "Espace disponible", valeurs: Object.keys(R.ESPACES), actuelle: choix.espace,
          libelle: function (k) { return [R.ESPACES[k].libelle]; }, cle: function (k) { return "espace:" + k; }, surChoix: function (k) { choix.espace = k; } }),
        UI.el("p", { classe: "bloc-detail", texte: F.typo(R.ESPACES[choix.espace].detail) })
      ]);
    }

    function dessiner() {
      UI.vider(racine);
      racine.appendChild(UI.el("section", { classe: "ecran ecran-choix" }, [
        UI.el("header", { classe: "bandeau" }, [
          UI.el("div", { classe: "bandeau-gauche" }, [
            UI.retour(o.surRetour),
            UI.el("h2", { classe: "titre-ecran", texte: "Ta partie" })
          ])
        ]),
        UI.el("main", { classe: "choix-blocs" }, [blocTheme(), blocNiveau(), blocDuree(), blocEspace()]),
        UI.el("footer", { classe: "pied" }, [UI.bouton("Suivant", function () {
          o.surSuite({ theme: choix.theme, niveau: choix.niveau, duree: choix.duree, espace: choix.espace });
        }, "bouton-principal bouton-large bouton-bloc")])
      ]));
    }
    dessiner();
  }

  var EcranChoix = { afficher: afficher, depart: depart, GROUPES: GROUPES };
  if (typeof module !== "undefined" && module.exports) module.exports = EcranChoix;
  else global.EcranChoix = EcranChoix;
})(typeof globalThis !== "undefined" ? globalThis : this);
