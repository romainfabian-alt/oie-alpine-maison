(function (global) {
  // Présentation d'un lancer, avant toute carte d'effort : le dé cherche son
  // résultat, puis le pion avance case par case jusqu'à la case du dé et, si la
  // case l'emporte ailleurs, saute d'un coup (télécabine vers le haut, avalanche
  // vers le bas). L'échange du bivouac se présente de la même façon, en deux
  // images.
  //
  // Tout le calcul est pur (chemin, etapes, images, imagesEchange) et testé
  // sous Node. animer() ne fait que dérouler ces images avec une minuterie
  // fournie par l'appelant : l'écran garde la main sur le nettoyage, et un
  // appui peut sauter directement à l'état final.
  var PAS_MS = 150;                 // durée d'une case : un 6 dure environ 1 s
  var PAS_DE_MS = 100;              // durée d'une face pendant que le dé roule
  var FACES_DE = 6;                 // 5 faces cherchées, puis le vrai résultat

  // Cases traversées, de la case de départ à celle atteinte par le seul dé,
  // écrêtée au sommet (le moteur fait le même calcul dans Regles.lancer).
  function chemin(depart, de, derniere) {
    var fin = Math.min(depart + de, derniere), res = [];
    for (var i = depart; i <= fin; i++) res.push(i);
    return res;
  }

  // Étapes visibles d'un lancer, dans l'ordre : la marche, puis l'effet
  // immédiat de la case d'arrivée s'il y en a un. Le flocon ne déplace pas le
  // pion mais forme une étape à part entière : « relance le dé » doit se lire
  // avant le lancer suivant.
  // r vient de Regles.lancer : { joueur, de, depart, arrivee, effets, relance }.
  function etapes(r, derniere) {
    var res = [{ type: "marche", cases: chemin(r.depart, r.de, derniere) }];
    (r.effets || []).forEach(function (e) {
      if (e.type === "telecabine" || e.type === "avalanche") res.push({ type: e.type, depuis: e.de, vers: e.vers });
      else if (e.type === "flocon") res.push({ type: "flocon", vers: r.arrivee });
    });
    return res;
  }

  // Images successives du pion suivi : une par case traversée (la première est
  // la case de départ), puis la case cible d'un saut. « autre » sert à
  // l'échange du bivouac, où un second pion bouge en même temps.
  function image(position, saut, autre) {
    return { position: position, saut: saut || null, autre: autre || null };
  }

  function images(r, derniere) {
    var res = [];
    etapes(r, derniere).forEach(function (e) {
      if (e.type === "marche") e.cases.forEach(function (c) { res.push(image(c, null, null)); });
      else if (e.type === "telecabine" || e.type === "avalanche") res.push(image(e.vers, e.type, null));
    });
    return res;
  }

  // Bivouac : les deux pions échangent leur case en une image, après coup
  // (le moteur a déjà permuté les positions, l'écran rejoue l'avant puis
  // l'après pour que l'échange se voie).
  function imagesEchange(posAvant, autreId, autrePosAvant) {
    return [
      image(posAvant, null, { id: autreId, position: autrePosAvant }),
      image(autrePosAvant, "bivouac", { id: autreId, position: posAvant })
    ];
  }

  // Faces montrées pendant que le dé roule : il doit avoir l'air de chercher.
  // Aucune face intermédiaire n'est le vrai résultat (sinon le dé se poserait
  // avant la fin), jamais deux fois la même d'affilée, et la dernière est le
  // résultat. alea est un générateur Aleatoire : à graine égale, même suite.
  function facesDe(resultat, nombre, alea) {
    var res = [], precedent = resultat, i, v, choix;
    for (i = 0; i < nombre - 1; i++) {
      choix = [];
      for (v = 1; v <= 6; v++) if (v !== precedent && v !== resultat) choix.push(v);
      precedent = choix[alea.entier(choix.length)];
      res.push(precedent);
    }
    res.push(resultat);
    return res;
  }

  // Ce que la case d'arrivée déclenche (« Télécabine : montée à la case 19 »,
  // le nom de l'exercice atteint...) ne s'annonce qu'une fois le pion posé,
  // donc sur la dernière image : avant, l'écran annoncerait une arrivée qui
  // n'a pas encore eu lieu.
  function effetVisible(i, total) { return total <= 0 || i >= total - 1; }

  // Déroule les images avec la minuterie de l'appelant.
  // o : { images, depuis, pas, poser, annuler, rendre(i, image, derniere), fin }
  // poser/annuler encadrent un seul intervalle, annulé dès la dernière image
  // ou dès finir() : rien ne survit à un redessin, à un abandon ni au podium.
  // L'appelant n'appelle animer() que s'il reste au moins une image à jouer ;
  // fin() n'est donc jamais rappelé depuis animer() lui-même.
  function animer(o) {
    var suite = o.images, i = o.depuis || 0, fini = false, id = null;

    function rendre() { o.rendre(i, suite[i], i >= suite.length - 1); }
    function arreter() { if (id !== null) { o.annuler(id); id = null; } }

    function finir() {                       // appui pendant l'animation : état final tout de suite
      if (fini) return;
      fini = true;
      arreter();
      i = suite.length - 1;
      rendre();
      o.fin();
    }

    rendre();
    id = o.poser(function () {
      if (fini) return;
      i++;
      rendre();
      if (i >= suite.length - 1) { fini = true; arreter(); o.fin(); }
    }, o.pas || PAS_MS);

    return { finir: finir, arreter: arreter, fini: function () { return fini; } };
  }

  var Deplacement = { PAS_MS: PAS_MS, PAS_DE_MS: PAS_DE_MS, FACES_DE: FACES_DE,
    chemin: chemin, etapes: etapes, images: images, imagesEchange: imagesEchange,
    facesDe: facesDe, effetVisible: effetVisible, animer: animer };
  if (typeof module !== "undefined" && module.exports) module.exports = Deplacement;
  else global.Deplacement = Deplacement;
})(typeof globalThis !== "undefined" ? globalThis : this);
