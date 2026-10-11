(function (global) {
  var doc = global.document;

  function el(tag, attributs, enfants) {
    var n = doc.createElement(tag);
    Object.keys(attributs || {}).forEach(function (k) {
      if (k === "texte") n.textContent = attributs[k];
      else if (k === "classe") n.className = attributs[k];
      else if (k.indexOf("on") === 0) n.addEventListener(k.slice(2), attributs[k]);
      else n.setAttribute(k, attributs[k]);
    });
    (enfants || []).forEach(function (e) { if (e) n.appendChild(typeof e === "string" ? doc.createTextNode(e) : e); });
    return n;
  }

  function bouton(texte, action, classe) {
    return el("button", { type: "button", classe: "bouton " + (classe || ""), texte: texte, onclick: action });
  }

  function vider(noeud) { while (noeud.firstChild) noeud.removeChild(noeud.firstChild); }

  // Fenêtres ouvertes, la plus récente en dernier : seule celle du dessus répond à Échap.
  var ouvertes = [], compteur = 0, ecouteTouches = false;

  function surTouche(e) {
    var k = e && (e.key || e.keyCode);
    if (k !== "Escape" && k !== "Esc" && k !== 27) return;
    // Une fenêtre retirée de la page sans passer par fermer() ne compte plus.
    while (ouvertes.length && !doc.body.contains(ouvertes[ouvertes.length - 1].fond)) ouvertes.pop();
    var haut = ouvertes[ouvertes.length - 1];
    if (!haut || !haut.annuler) return;
    if (e.preventDefault) e.preventDefault();
    haut.annuler();
  }

  function rendreLeFocus(noeud) {
    if (!noeud || noeud === doc.body || !noeud.focus || !doc.body.contains(noeud)) return;
    try { noeud.focus({ preventScroll: true }); } catch (e) { /* focus refusé : sans gravité */ }
  }

  // Pose une fenêtre dans la page, avec ce qu'un lecteur d'écran et un clavier attendent d'un dialogue :
  // rôle et titre nommé, focus sur le premier bouton à l'ouverture et rendu à la fermeture (si l'élément
  // d'avant existe encore), Échap qui annule. boite : l'élément .modal ; titre : l'élément qui la nomme ;
  // annuler : ce que fait Échap, ou null quand la fenêtre impose un choix. Rend fermer().
  function fenetre(boite, titre, annuler) {
    var fond = el("div", { classe: "modal-fond" }, [boite]);
    var avant = doc.activeElement || null, entree = { fond: fond, annuler: annuler };
    boite.setAttribute("role", "dialog");
    boite.setAttribute("aria-modal", "true");
    if (titre) {
      if (!titre.getAttribute("id")) titre.setAttribute("id", "fenetre-titre-" + (++compteur));
      boite.setAttribute("aria-labelledby", titre.getAttribute("id"));
    }
    function fermer() {
      if (!fond.parentNode) return;
      fond.parentNode.removeChild(fond);
      var i = ouvertes.indexOf(entree);
      if (i !== -1) ouvertes.splice(i, 1);
      rendreLeFocus(avant);
    }
    if (!ecouteTouches) { ecouteTouches = true; doc.addEventListener("keydown", surTouche); }
    ouvertes.push(entree);
    doc.body.appendChild(fond);
    var premier = boite.querySelector ? boite.querySelector("button") : null;
    if (premier && premier.focus) { try { premier.focus({ preventScroll: true }); } catch (e) { /* sans gravité */ } }
    return fermer;
  }

  // Le choix d'annulation d'une confirmation : celui que l'appelant marque (annuler: true), sinon le
  // premier qui n'a pas d'action (« Annuler »). Aucun : la fenêtre impose un choix.
  function choixAnnulation(choix) {
    var i;
    for (i = 0; i < choix.length; i++) if (choix[i].annuler) return choix[i];
    for (i = 0; i < choix.length; i++) if (!choix[i].action) return choix[i];
    return null;
  }

  function modal(titre, texte, choix) {
    var fermer, h2 = el("h2", { texte: titre }), annulation = choixAnnulation(choix);
    var boite = el("div", { classe: "modal" }, [
      h2,
      texte ? el("p", { texte: texte }) : null,
      el("div", { classe: "modal-choix" }, choix.map(function (c) {
        return bouton(c.texte, function () { fermer(); if (c.action) c.action(); }, c.classe);
      }))
    ]);
    fermer = fenetre(boite, h2, annulation ? function () { fermer(); if (annulation.action) annulation.action(); } : null);
    return fermer;
  }

  // Redessine sans faire remonter la page : un appui sur un choix en bas
  // d'un formulaire ne ramène pas le patient tout en haut.
  function surPlace(fn) {
    var y = global.pageYOffset || 0;
    try { fn(); }
    finally { if (global.scrollTo) global.scrollTo(0, y); }   // même si le redessin lève (l'erreur remonte)
  }

  // Convertit une chaîne de balisage SVG de confiance (dessins et pictogrammes de l'app, jamais
  // une saisie) en vrai nœud SVG : createElement créerait un élément HTML inconnu, sans espace
  // de noms SVG, qui ne s'afficherait pas.
  function svg(html) {
    var conteneur = doc.createElement("div");
    conteneur.innerHTML = html;
    return conteneur.firstElementChild;
  }

  // Bouton « Retour » du bandeau des écrans d'avant-partie : flèche et texte, 56 px de haut.
  function retour(action) {
    return el("button", { type: "button", classe: "bouton bouton-discret bouton-retour", onclick: action }, [
      svg('<svg class="picto" width="20" height="20" viewBox="0 0 12 12" aria-hidden="true">' +
        '<g fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">' +
        '<polyline points="6.5,2.5 3,6 6.5,9.5"/><line x1="3" y1="6" x2="10" y2="6"/></g></svg>'),
      "Retour"
    ]);
  }

  var UI = { el: el, bouton: bouton, vider: vider, modal: modal, fenetre: fenetre, surPlace: surPlace, svg: svg, retour: retour };
  if (typeof module !== "undefined" && module.exports) module.exports = UI;
  else global.UI = UI;
})(typeof globalThis !== "undefined" ? globalThis : this);
