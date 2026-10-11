(function (global) {
  // Écran des règles : la version illustrée avant l'échauffement, pour les patients, et la version
  // texte depuis l'accueil. Le contenu (SECTIONS, CASES) est une donnée pure, testée : il doit rester
  // le reflet fidèle du moteur (src/regles.js).
  var RP = (typeof require !== "undefined") ? require("./rendu-plateau.js") : global.RenduPlateau;
  var F = (typeof require !== "undefined") ? require("./format.js") : global.Format;

  // Règle de sécurité validée par Romain le 10/10/2026, reprise mot pour mot (l'échauffement la rappelle).
  var SECURITE = "Avant de commencer : un sol qui ne glisse pas, de la place autour de toi, en chaussures ou pieds nus. " +
    "Garde les chaussettes pour les exercices qui le demandent.";

  // Le piolet n'est pas une case : un coup de pouce, une fois par joueur et par partie.
  var PIOLET = { nom: "Le piolet", effet: "Un par joueur et par partie : il passe l'exercice du tour, sans le bonus de la case." };

  var TROP_DUR = "Trop dur ou douloureux ? Touche « Trop dur / douleur » sur ta carte : tu reçois le même mouvement " +
    "un niveau plus bas, pour ce tour seulement. Sous le niveau 1, c'est une récupération active.";

  // Sections de texte, colonne de gauche. Un point = une phrase courte.
  var SECTIONS = [
    { titre: "Un tour de jeu", points: [
      "Chacun son tour, un joueur lance le dé et avance d'autant de cases.",
      "Ensuite, chacun a sa carte d'exercice, et tout le monde le fait en même temps.",
      "Chacun touche « Fait » quand il a fini. Le tour suivant démarre quand tous ont validé."
    ] },
    { titre: "Chacun à son niveau", points: [
      "Jamais d'exercice au-dessus de ton niveau, ni contraire à ce que tu dois éviter.",
      "En petit espace, aucun exercice ne demande de se déplacer sur plus de 2 m."
    ] },
    { titre: "Trop dur ou douloureux ?", points: [
      "Touche « Trop dur / douleur » sur ta carte : tu reçois le même mouvement un niveau plus bas, pour ce tour seulement.",
      "Sous le niveau 1, c'est une récupération active. Ton niveau ne change pas."
    ] },
    { titre: "Le piolet", points: [PIOLET.effet] },
    { titre: "Précisions sur les cases", points: [
      "Crevasse : le gainage est tiré au hasard parmi le gainage antérieur, latéral ou postérieur.",
      "Météo : une seule carte pour tout le monde, qui remplace l'effort individuel de ce tour."
    ] },
    { titre: "Fin de partie", points: [
      "Atteindre ou dépasser le sommet suffit pour arriver. Arrivés le même tour, les joueurs sont ex aequo.",
      "La partie continue jusqu'à l'arrivée de tous, ou jusqu'à « Terminer ».",
      "« Terminer » classe les joueurs restants sur leur position, cases déjà gagnées comprises.",
      "Si l'app se ferme en pleine partie, elle propose de la reprendre à la réouverture."
    ] }
  ];

  // Cases spéciales, dans l'ordre de la maquette validée. « solo » n'est renseigné que si une case se
  // comporte autrement en solo : aucune de ces six cases n'a de variante.
  var CASES = [
    { type: "avalanche", nom: "Avalanche", effet: "Tu redescends à la case indiquée.", solo: "" },
    { type: "crevasse", nom: "Crevasse", effet: "Un gainage à ton niveau. Au tour suivant, pas de lancer : un gainage de plus.", solo: "" },
    { type: "refuge", nom: "Refuge", effet: "Pause, aucun effort ce tour.", solo: "" },
    { type: "meteo", nom: "Météo", effet: "Une carte tirée pour tout le monde.", solo: "" },
    { type: "col", nom: "Col", effet: "Facile : +1 case. Difficile : +3 cases, même exercice avec moitié plus de volume.", solo: "" },
    { type: "sommet", nom: "Sommet", effet: "L'arrivée, à 3 656 m.", solo: "" }
  ];

  // Résumé en quelques mots de chaque case (donnée testée, pas affichée par la maquette actuelle).
  var EN_BREF = {
    avalanche: "Redescend", crevasse: "Gainage, sans lancer au tour suivant", refuge: "Pause, aucun effort",
    meteo: "Carte surprise pour tous", col: "Facile +1, difficile +3", sommet: "L'arrivée, 3 656 m"
  };

  // Version illustrée, pour les patients (retour de Romain du 01/10) : elle
  // remplace le texte avant l'échauffement. La règle de sécurité, quatre étapes
  // dessinées, puis les cases spéciales en pictogrammes. Le texte complet reste
  // consultable depuis l'accueil, pour le kiné.
  var ETAPES = [
    { titre: "Lance le dé", phrase: "Chacun son tour.", dessin: "de" },
    { titre: "Avance", phrase: "Ton pion monte d'autant de cases.", dessin: "pion" },
    { titre: "Fais ta carte", phrase: "Tous en même temps, chacun à son niveau.", dessin: "carte" },
    { titre: "Touche « Fait »", phrase: "Quand tout le monde a fini, on relance.", dessin: "fait" }
  ];

  // Dessins au trait, dans la palette du jeu : cacao pour le trait, cuivre
  // pour le mouvement, couleurs des joueurs pour les pions et les cartes.
  var DESSINS = {
    de: '<svg viewBox="0 0 220 150" aria-hidden="true">' +
      '<path class="ill-mouv" d="M28 104 C40 70 64 52 92 46"/><path class="ill-mouv" d="M22 76 C34 50 52 38 74 34"/>' +
      '<g transform="translate(132 78) rotate(-14)"><rect class="ill-de" x="-44" y="-44" width="88" height="88" rx="18"/>' +
      '<circle class="ill-point" cx="-22" cy="-22" r="8"/><circle class="ill-point" cx="22" cy="-22" r="8"/>' +
      '<circle class="ill-point" cx="0" cy="0" r="8"/><circle class="ill-point" cx="-22" cy="22" r="8"/>' +
      '<circle class="ill-point" cx="22" cy="22" r="8"/></g></svg>',
    pion: '<svg viewBox="0 0 220 150" aria-hidden="true">' +
      '<rect class="ill-case" x="10" y="70" width="60" height="60" rx="8" style="fill:#D7E5CF"/>' +
      '<rect class="ill-case" x="80" y="70" width="60" height="60" rx="8" style="fill:#DED9C9"/>' +
      '<rect class="ill-case" x="150" y="70" width="60" height="60" rx="8" style="fill:#E8E1D3"/>' +
      '<text class="ill-num" x="18" y="90">4</text><text class="ill-num" x="88" y="90">5</text><text class="ill-num" x="158" y="90">6</text>' +
      '<circle class="ill-fantome" cx="40" cy="104" r="15"/>' +
      '<path class="ill-mouv ill-pointille" d="M44 70 C70 18 150 18 176 64"/><polyline class="ill-mouv" points="166,56 177,66 181,51"/>' +
      '<circle class="ill-pion" cx="180" cy="104" r="17" style="fill:#D9483B"/><text class="ill-lettre" x="180" y="111">L</text></svg>',
    carte: '<svg viewBox="0 0 220 150" aria-hidden="true">' +
      '<g transform="translate(64 8) rotate(-6 46 66)"><rect class="ill-carte" x="0" y="0" width="92" height="132" rx="12"/>' +
      '<rect x="0" y="0" width="92" height="28" rx="12" style="fill:#2E6FB0"/><rect x="0" y="16" width="92" height="12" style="fill:#2E6FB0"/></g>' +
      '<g transform="translate(72 12) rotate(4 46 66)"><rect class="ill-carte" x="0" y="0" width="92" height="132" rx="12"/>' +
      '<rect x="0" y="0" width="92" height="28" rx="12" style="fill:#D9483B"/><rect x="0" y="16" width="92" height="12" style="fill:#D9483B"/>' +
      '<rect class="ill-ligne" x="12" y="42" width="62" height="7" rx="3.5"/><rect class="ill-ligne ill-ligne-douce" x="12" y="56" width="50" height="5" rx="2.5"/>' +
      '<rect class="ill-ligne ill-ligne-douce" x="12" y="66" width="56" height="5" rx="2.5"/>' +
      '<text class="ill-dosage" x="12" y="114">× 10</text></g></svg>',
    fait: '<svg viewBox="0 0 220 150" aria-hidden="true">' +
      '<g class="ill-coches"><circle cx="58" cy="34" r="13" style="fill:#D9483B"/><circle cx="94" cy="34" r="13" style="fill:#2E6FB0"/>' +
      '<circle cx="130" cy="34" r="13" style="fill:#E0A526"/><circle cx="166" cy="34" r="13" style="fill:#3F9A5B"/>' +
      '<polyline points="52,34 57,39 65,29"/><polyline points="88,34 93,39 101,29"/><polyline points="124,34 129,39 137,29"/>' +
      '<polyline points="160,34 165,39 173,29"/></g>' +
      '<rect class="ill-bouton" x="34" y="72" width="152" height="56" rx="14"/><rect class="ill-bouton-ombre" x="34" y="124" width="152" height="6" rx="3"/>' +
      '<text class="ill-bouton-texte" x="110" y="109">Fait</text></svg>'
  };

  // Pictogrammes au trait (viewBox 12 × 12) : ceux des cases viennent du rendu du plateau, le piolet est
  // propre à cet écran (dessin de la maquette).
  var ICONE_PIOLET = '<line x1="3" y1="11" x2="7.6" y2="2.2"/><path d="M4.4,3 C6.6,1.2 9,1.4 11,3.4"/><line x1="7.6" y1="2.2" x2="8.6" y2="1.2"/>';

  function picto(type, taille) {
    return global.UI.svg('<svg class="picto" width="' + taille + '" height="' + taille + '" viewBox="0 0 12 12" aria-hidden="true">' +
      '<g fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">' +
      (type === "piolet" ? ICONE_PIOLET : RP.ICONES[type]) + "</g></svg>");
  }

  // Un encadré dont le début (jusqu'à `fin`, exclu) est en gras : « Avant de commencer : », « Trop dur ou douloureux ? ».
  function encadre(classe, texte, fin) {
    return global.UI.el("p", { classe: classe }, [global.UI.el("b", { texte: F.typo(texte.slice(0, fin)) }), F.typo(texte.slice(fin))]);
  }
  function encadreSecurite() { return encadre("securite", SECURITE, SECURITE.indexOf(":") + 1); }
  function encadreTropDur() { return encadre("trop-dur", TROP_DUR, TROP_DUR.indexOf("?") + 1); }

  // Une case (ou le piolet) : pictogramme dans sa pastille, nom, effet.
  function ligneCase(c, classe) {
    var UI = global.UI, corps = [UI.el("b", { classe: "case-nom", texte: c.nom }), UI.el("span", { classe: "case-effet", texte: F.typo(c.effet) })];
    if (c.solo) corps.push(UI.el("span", { classe: "case-solo", texte: F.typo("En solo : " + c.solo) }));
    return UI.el("li", { classe: "case-ligne" + (classe ? " " + classe : "") }, [
      UI.el("span", { classe: "case-picto" }, [picto(c.type, 28)]),
      UI.el("span", { classe: "case-corps" }, corps)
    ]);
  }
  function ligneCaseSpeciale(c) { return ligneCase(c, c.type === "sommet" ? "case-sommet" : ""); }
  function lignePiolet() { return ligneCase({ type: "piolet", nom: PIOLET.nom, effet: PIOLET.effet, solo: "" }, "case-piolet"); }

  // Avant l'échauffement : la version illustrée, pour les patients. Un seul bouton : on ne saute pas les règles.
  function afficherIllustre(racine, o) {
    var UI = global.UI;
    function etape(e, i) {
      var dessin = UI.el("div", { classe: "illu-dessin" });
      dessin.appendChild(UI.svg(DESSINS[e.dessin]));
      return UI.el("li", { classe: "illu-etape" }, [
        UI.el("span", { classe: "illu-num", texte: String(i + 1) }), dessin,
        UI.el("h3", { classe: "illu-titre", texte: F.typo(e.titre) }),
        UI.el("p", { classe: "illu-phrase", texte: F.typo(e.phrase) })
      ]);
    }
    UI.vider(racine);
    racine.appendChild(UI.el("section", { classe: "ecran ecran-regles ecran-regles-illustre" }, [
      UI.el("header", { classe: "bandeau" }, [
        UI.el("div", { classe: "bandeau-gauche" }, [UI.el("h2", { classe: "titre-ecran", texte: "Comment on joue" })])
      ]),
      UI.el("main", { classe: "illu" }, [
        encadreSecurite(),
        UI.el("ol", { classe: "illu-etapes" }, ETAPES.map(etape)),
        UI.el("h3", { classe: "regles-titre", texte: "Les cases à connaître" }),
        UI.el("ul", { classe: "cases-liste" }, CASES.map(ligneCaseSpeciale)),
        UI.el("h3", { classe: "regles-titre", texte: "Deux coups de pouce" }),
        UI.el("ul", { classe: "cases-liste" }, [lignePiolet()]),
        encadreTropDur(),
        UI.el("p", { classe: "pied-note", texte: "Ces règles restent consultables depuis l'accueil." })
      ]),
      UI.el("footer", { classe: "pied" }, [
        UI.bouton("Commencer l'échauffement", o.surSuite, "bouton-principal bouton-large bouton-bloc")
      ])
    ]));
  }

  // Depuis l'accueil : le texte complet, avec retour.
  function afficher(racine, o) {
    var UI = global.UI;
    o = o || {};
    if (o.surSuite) { afficherIllustre(racine, o); return; }
    var retour = o.surRetour || function () {};

    function bloc(s) {
      return UI.el("section", { classe: "regles-bloc" }, [
        UI.el("h3", { classe: "regles-titre", texte: s.titre }),
        UI.el("ul", { classe: "regles-points" }, s.points.map(function (t) {
          return UI.el("li", { texte: F.typo(t) });
        }))
      ]);
    }

    UI.vider(racine);
    racine.appendChild(UI.el("section", { classe: "ecran ecran-regles" }, [
      UI.el("header", { classe: "bandeau" }, [
        UI.el("div", { classe: "bandeau-gauche" }, [UI.retour(retour), UI.el("h2", { classe: "titre-ecran", texte: "Règles du jeu" })])
      ]),
      UI.el("main", { classe: "regles" }, [
        encadreSecurite(),
        UI.el("div", { classe: "regles-texte" }, SECTIONS.map(bloc)),
        UI.el("section", { classe: "regles-cases" }, [
          UI.el("h3", { classe: "regles-titre", texte: "Les cases spéciales" }),
          // Deux listes côte à côte (sur tablette) plutôt qu'une seule en multi-colonnes : chaque colonne garde
          // ses hauteurs de ligne, et un débordement éventuel reste vertical, donc visible.
          UI.el("div", { classe: "cases-liste" }, [
            UI.el("ul", { classe: "cases-colonne" }, CASES.slice(0, 3).map(ligneCaseSpeciale)),
            UI.el("ul", { classe: "cases-colonne" }, CASES.slice(3).map(ligneCaseSpeciale))
          ])
        ])
      ]),
      UI.el("footer", { classe: "pied" }, [UI.bouton("Retour à l'accueil", retour, "bouton-principal bouton-large bouton-bloc")])
    ]));
  }

  var EcranRegles = { afficher: afficher, SECTIONS: SECTIONS, CASES: CASES, ETAPES: ETAPES, EN_BREF: EN_BREF,
    DESSINS: DESSINS, TROP_DUR: TROP_DUR, SECURITE: SECURITE, PIOLET: PIOLET };
  if (typeof module !== "undefined" && module.exports) module.exports = EcranRegles;
  else global.EcranRegles = EcranRegles;
})(typeof globalThis !== "undefined" ? globalThis : this);
