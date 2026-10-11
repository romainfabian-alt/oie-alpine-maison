(function (global) {
  // Les grimpeurs : 1 à 4 joueurs, prénom, niveau (phase puis cran) et ce
  // qu'il faut éviter (filtres de blessure). Écran rempli par le patient.
  var R = (typeof require !== "undefined") ? require("./referentiel.js") : global.Referentiel;
  var RP = (typeof require !== "undefined") ? require("./rendu-plateau.js") : global.RenduPlateau;
  var Prenoms = (typeof require !== "undefined") ? require("./prenoms.js") : global.Prenoms;
  var F = (typeof require !== "undefined") ? require("./format.js") : global.Format;

  var PRENOM_MAX = 14;
  var JOUEURS_MAX = 4;

  function propre(o, cle) { return Object.prototype.hasOwnProperty.call(o, cle); }
  function niveauValide(n) { return typeof n === "number" && n % 1 === 0 && n >= 1 && n <= R.NIVEAU_MAX; }

  // Chaque joueur retrouve le niveau enregistré dans les réglages de la dernière partie. Une exception, le
  // joueur 1 : sans niveau enregistré (première partie), ou si son niveau était alors celui du parcours (il
  // « suivait » le parcours, comme un joueur seul), il prend le niveau du parcours choisi cette fois. Un joueur
  // sans niveau enregistré, et un joueur ajouté à l'écran, prennent aussi le niveau du parcours. Prénoms et
  // filtres connus sont repris tels quels. Les réglages viennent de l'appareil : absents, abîmés ou d'une
  // ancienne version, ils donnent un joueur sans prénom au niveau du parcours, et rien ne lève.
  function joueursDepart(reglages, plateau) {
    var enregistre = reglages && typeof reglages === "object" ? reglages : {};
    var parcoursEnregistre = niveauValide(enregistre.niveau) ? enregistre.niveau : null;
    var liste = Array.isArray(enregistre.joueurs) && enregistre.joueurs.length ? enregistre.joueurs.slice(0, JOUEURS_MAX) : [{}];
    return liste.map(function (j, i) {
      j = j && typeof j === "object" ? j : {};
      var filtres = [];
      (Array.isArray(j.filtres) ? j.filtres : []).forEach(function (f) {
        if (typeof f === "string" && propre(R.FILTRES, f) && filtres.indexOf(f) === -1) filtres.push(f);
      });
      var niveau = niveauValide(j.niveau) ? j.niveau : plateau.niveau;
      if (i === 0 && j.niveau === parcoursEnregistre) niveau = plateau.niveau;
      return { prenom: typeof j.prenom === "string" ? j.prenom.slice(0, PRENOM_MAX) : "", couleur: RP.COULEURS[i], niveau: niveau, filtres: filtres };
    });
  }

  // o : { plateau, reglages (ceux de la dernière partie, ou le brouillon rendu par surRetour), surRetour(brouillon),
  // surCommencer(liste) }. Le brouillon a la forme des réglages (niveau du parcours, joueurs) : « Retour » le rend à
  // l'appelant, qui le repasse comme réglages à l'affichage suivant, et rien de ce qui a été saisi ne se perd.
  function afficher(racine, o) {
    var UI = global.UI, joueurs = joueursDepart(o.reglages, o.plateau);
    function brouillon() {
      return { niveau: o.plateau.niveau, joueurs: joueurs.map(function (j) { return { prenom: j.prenom, niveau: j.niveau, filtres: j.filtres.slice() }; }) };
    }
    // Redessine l'écran sans le faire remonter, puis rend le focus au contrôle touché
    // (repéré par son data-cle) : un lecteur d'écran ou un clavier ne repart pas du haut.
    function maj(cle) {
      UI.surPlace(function () {
        dessiner();
        var c = cle && racine.querySelector ? racine.querySelector('[data-cle="' + cle + '"]') : null;
        if (c && c.focus) c.focus();
      });
    }
    function recolorer() { joueurs.forEach(function (j, i) { j.couleur = RP.COULEURS[i]; }); }

    function blocJoueur(j, i) {
      var phase = R.phaseDe(j.niveau), n = i + 1, cle = function (k) { return k + ":" + i; };
      return UI.el("section", { classe: "joueur", style: "--joueur:" + j.couleur + ";--joueur-texte:" + RP.couleurTexte(j.couleur) }, [
        UI.el("div", { classe: "joueur-tete" }, [
          UI.el("span", { classe: "pastille-joueur", "aria-hidden": "true" }),
          // Saisie sur téléphone : pas de correction ni de suggestion sur un prénom, majuscule à chaque mot,
          // touche « OK » du clavier, longueur bornée ; la police fait au moins 16 px (sinon iOS zoome).
          UI.el("input", { type: "text", maxlength: String(PRENOM_MAX), value: j.prenom, classe: "saisie", placeholder: "Prénom (facultatif)",
            autocomplete: "off", autocapitalize: "words", autocorrect: "off", spellcheck: "false", enterkeyhint: "done",
            "aria-label": "Prénom du joueur " + n,
            oninput: function (e) { j.prenom = e.target.value; },
            onkeydown: function (e) { if (e.key === "Enter" && e.target.blur) e.target.blur(); } }),
          joueurs.length > 1 ? UI.el("button", { type: "button", classe: "lien-retirer", texte: "Retirer", "aria-label": "Retirer le joueur " + n,
            "data-cle": cle("retirer"), onclick: function () { joueurs.splice(i, 1); recolorer(); maj(cle("retirer")); } }) : null
        ]),
        UI.el("p", { classe: "champ-lib", texte: "Niveau" }),
        UI.el("div", { classe: "segments segments-phases", role: "group", "aria-label": "Phase du niveau du joueur " + n }, R.PHASES.map(function (ph) {
          return UI.el("button", { type: "button", classe: "segment" + (ph === phase ? " choisi" : ""),
            "aria-pressed": String(ph === phase), "data-cle": cle("phase" + ph.min), onclick: function () { j.niveau = ph.min; maj(cle("phase" + ph.min)); } },
            [ph.libelle, UI.el("small", { texte: ph.min + " à " + ph.max })]);
        })),
        UI.el("div", { classe: "niveau" }, [
          UI.el("button", { type: "button", classe: "bouton bouton-carre", "aria-label": "Baisser le niveau du joueur " + n, "data-cle": cle("moins"), texte: "−",
            onclick: function () { j.niveau = Math.max(1, j.niveau - 1); maj(cle("moins")); } }),
          UI.el("span", { classe: "niveau-val" }, [String(j.niveau), UI.el("small", { texte: F.typo("sur " + R.NIVEAU_MAX) })]),
          UI.el("button", { type: "button", classe: "bouton bouton-carre", "aria-label": "Monter le niveau du joueur " + n, "data-cle": cle("plus"), texte: "+",
            onclick: function () { j.niveau = Math.min(R.NIVEAU_MAX, j.niveau + 1); maj(cle("plus")); } })
        ]),
        UI.el("p", { classe: "aide", texte: F.typo(phase.detail) }),
        UI.el("p", { classe: "champ-lib", id: "eviter-" + n, texte: "Ce que tu dois éviter" }),
        // Chaque filtre est un interrupteur : un vrai bouton, avec son libellé et son état.
        UI.el("ul", { classe: "filtres", "aria-labelledby": "eviter-" + n }, Object.keys(R.FILTRES).map(function (f) {
          var actif = j.filtres.indexOf(f) !== -1;
          return UI.el("li", {}, [UI.el("button", { type: "button", role: "switch", "aria-checked": String(actif), classe: "filtre" + (actif ? " actif" : ""),
            "data-cle": cle("filtre-" + f),
            onclick: function () {
              var k = j.filtres.indexOf(f);
              if (k === -1) j.filtres.push(f); else j.filtres.splice(k, 1);
              maj(cle("filtre-" + f));
            } }, [UI.el("span", { texte: R.FILTRES[f] }), UI.el("i", { classe: "interrupteur", "aria-hidden": "true" })])]);
        })),
        UI.el("p", { classe: "aide", texte: "Les exercices qui ne te conviennent pas sont remplacés par d'autres." })
      ]);
    }

    function dessiner() {
      UI.vider(racine);
      var blocs = joueurs.map(blocJoueur);
      if (joueurs.length < JOUEURS_MAX) {
        blocs.push(UI.el("button", { type: "button", classe: "bouton bouton-ajout", "data-cle": "ajout", onclick: function () {
          joueurs.push({ prenom: "", couleur: RP.COULEURS[joueurs.length], niveau: o.plateau.niveau, filtres: [] });
          maj("ajout");
        } }, [UI.el("span", { classe: "plus", texte: "+", "aria-hidden": "true" }), "Ajouter un joueur"]));
      }
      racine.appendChild(UI.el("section", { classe: "ecran ecran-joueurs" }, [
        UI.el("header", { classe: "bandeau" }, [
          UI.el("div", { classe: "bandeau-gauche" }, [
            UI.retour(function () { if (o.surRetour) o.surRetour(brouillon()); }),
            UI.el("div", { classe: "bandeau-titre" }, [
              UI.el("h2", { classe: "titre-ecran", texte: "Les grimpeurs" }),
              UI.el("p", { classe: "bandeau-sous", texte: F.typo(R.THEMES[o.plateau.theme].libelle + " · niveau " + o.plateau.niveau + " · " + o.plateau.duree + " min") })
            ])
          ])
        ]),
        UI.el("p", { classe: "intro", texte: F.typo("Jusqu'à 4 joueurs sur cet appareil. Chacun choisit son niveau : les exercices s'adaptent à chacun.") }),
        UI.el("main", { classe: "joueurs" }, blocs),
        UI.el("footer", { classe: "pied" }, [UI.bouton("Commencer", function () {
          o.surCommencer(joueurs.map(function (j) {
            return { prenom: Prenoms.nettoyer(j.prenom), couleur: j.couleur, niveau: j.niveau, filtres: j.filtres.slice() };
          }));
        }, "bouton-principal bouton-large bouton-bloc")])
      ]));
    }
    dessiner();
  }

  var EcranJoueurs = { afficher: afficher, joueursDepart: joueursDepart };
  if (typeof module !== "undefined" && module.exports) module.exports = EcranJoueurs;
  else global.EcranJoueurs = EcranJoueurs;
})(typeof globalThis !== "undefined" ? globalThis : this);
