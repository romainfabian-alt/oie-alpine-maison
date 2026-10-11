(function (global) {
  // Accueil : reprise d'une partie en cours, nouvelle partie, mes parties,
  // règles ; en bas, l'avertissement, les liens du cabinet et la signature.
  var R = (typeof require !== "undefined") ? require("./referentiel.js") : global.Referentiel;
  var F = (typeof require !== "undefined") ? require("./format.js") : global.Format;

  var LIENS = [
    { texte: "Prendre rendez-vous", href: "https://maddie.doctor/cabinet/kine/tignes/cabinet-kine-sport" },
    { texte: "WhatsApp du cabinet", href: "https://wa.me/33786407243" },
    { texte: "Suivi à distance avec Andrew", href: "https://mammoth-rubidium-b20.notion.site/Suivi-distance-avec-Andrew-3750d78836f781be8cfcff1995103c47" }
  ];
  var AVERTISSEMENT = "En cas de doute ou de douleur inhabituelle, parles-en à ton kiné.";
  var PREFIXE = "Partie en cours";

  // La crête sous le titre : la Grande Motte, son drapeau, et la petite maison. Dessin de la
  // maquette, posé par UI.svg.
  var CRETE = '<svg class="crete" viewBox="0 0 350 36" aria-hidden="true">' +
    '<polyline points="0,34 70,21 106,27 172,4 212,19 244,11 300,34 350,34"/>' +
    '<line x1="172" y1="4" x2="172" y2="-7"/><polyline points="172,-7 182,-3.8 172,-0.6"/>' +
    '<path class="crete-maison" d="M311,34 V25 L321,17 L331,25 V34"/></svg>';

  function propre(o, cle) { return Object.prototype.hasOwnProperty.call(o, cle); }

  // « Partie en cours : Léa, Tom · Ski alpin · tour 6 ». La sauvegarde vient de l'appareil et
  // peut être incomplète : on écrit ce qui est connu (prénoms, thème, tour) et jamais « undefined ».
  // Sans plateau décodé, le thème est lu dans l'identifiant du parcours (« ski_alpin-12-45 »).
  function texteReprise(sauvegarde, plateau) {
    var s = sauvegarde && typeof sauvegarde === "object" ? sauvegarde : {};
    var etat = s.etat && typeof s.etat === "object" ? s.etat : {};
    var noms = (Array.isArray(etat.joueurs) ? etat.joueurs : []).map(function (j) { return j && typeof j.prenom === "string" ? j.prenom : ""; })
      .filter(function (n) { return n; }).join(", ");
    var cle = plateau && typeof plateau.theme === "string" ? plateau.theme : typeof s.plateau === "string" ? s.plateau.split("-")[0] : "";
    var theme = propre(R.THEMES, cle) ? R.THEMES[cle].libelle : "";
    var ou = etat.phase === "echauffement" || etat.tour === 0 ? "échauffement" : etat.tour > 0 ? "tour " + etat.tour : "";
    var morceaux = [noms, theme, ou].filter(function (m) { return m; });
    return PREFIXE + (morceaux.length ? " : " + morceaux.join(" · ") : "");
  }

  // « Partie en cours » en étiquette, puis le détail sur la ligne dessous (maquette).
  function enTexteReprise(texte) {
    var UI = global.UI;
    var t = String(texte == null ? "" : texte), debut = PREFIXE + " : ";
    if (t === PREFIXE) return [UI.el("span", { classe: "etiquette", texte: PREFIXE })];
    if (t.indexOf(debut) !== 0) return [t];
    return [UI.el("span", { classe: "etiquette", texte: PREFIXE }), F.typo(t.slice(debut.length))];
  }

  function afficher(racine, o) {
    var UI = global.UI, doc = global.document;
    UI.vider(racine);
    var reprise = o.reprise ? UI.el("section", { classe: "reprise" }, [
      UI.el("p", { classe: "reprise-texte" }, enTexteReprise(o.reprise.texte)),
      UI.el("div", { classe: "reprise-boutons" }, [
        UI.bouton("Reprendre", o.reprise.surReprendre, "bouton-principal"),
        UI.bouton("Abandonner", function () {
          UI.modal("Abandonner la partie ?", "Elle ne sera pas enregistrée dans Mes parties.", [
            { texte: "Annuler" }, { texte: "Abandonner", classe: "bouton-principal", action: o.reprise.surAbandonner }]);
        })
      ])
    ]) : null;
    racine.appendChild(UI.el("section", { classe: "ecran ecran-accueil" }, [
      UI.el("header", { classe: "accueil-tete" }, [
        UI.el("h1", { classe: "titre-jeu" }, ["L'Oie Alpine", doc.createElement("br"), "à la maison"]),
        UI.svg(CRETE),
        UI.el("p", { classe: "accroche", texte: F.typo("De 2 100 m à la Grande Motte, sans matériel. Un dé, un sentier, et chacun grimpe à son niveau.") })
      ]),
      reprise,
      UI.el("nav", { classe: "accueil-actions", "aria-label": "Menu" }, [
        UI.bouton("Nouvelle partie", o.surNouvelle, "bouton-principal bouton-large"),
        UI.bouton("Mes parties", o.surHistorique),
        UI.bouton("Règles du jeu", o.surRegles)
      ]),
      UI.el("footer", { classe: "accueil-pied" }, [
        UI.el("p", { classe: "avertissement", texte: AVERTISSEMENT }),
        // Les deux premiers liens côte à côte, le dernier, plus long, sur sa ligne (maquette).
        UI.el("ul", { classe: "liens-cabinet" }, LIENS.map(function (l, i) {
          return UI.el("li", { classe: i === LIENS.length - 1 ? "lien-long" : "" }, [UI.el("a", { href: l.href, target: "_blank", rel: "noopener", texte: l.texte })]);
        })),
        // Le logo accompagne le nom écrit à côté : décoratif pour les lecteurs d'écran.
        UI.el("p", { classe: "signature" }, [UI.el("img", { src: "./assets/logo-cabinet.png", alt: "", width: "273", height: "280" }), "Kiné Sport Tignes"])
      ])
    ]));
  }

  var EcranAccueil = { afficher: afficher, texteReprise: texteReprise, LIENS: LIENS, AVERTISSEMENT: AVERTISSEMENT };
  if (typeof module !== "undefined" && module.exports) module.exports = EcranAccueil;
  else global.EcranAccueil = EcranAccueil;
})(typeof globalThis !== "undefined" ? globalThis : this);
