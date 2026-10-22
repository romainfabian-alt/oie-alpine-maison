// Numéro de version du cache : à incrémenter (oie-maison-v2, v3...) à CHAQUE
// modification d'un fichier listé dans FICHIERS, dès que l'app est publiée.
// Sans ça, les téléphones déjà installés gardent l'ancienne version.
var CACHE = "oie-maison-v2";
// Tous les caches de cette application commencent ainsi. L'origine (romainfabian-alt.github.io) est partagée avec d'autres
// applications du cabinet (L'Oie Alpine, Réactivité), dont le stockage de cache est commun : on ne supprime jamais que
// les anciens caches de celle-ci.
var PREFIXE = "oie-maison-";

var FICHIERS = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.webmanifest",
  "./assets/fonts/Italiana-Regular.ttf",
  "./assets/fonts/Jura-Medium.ttf",
  "./assets/fonts/Jura-SemiBold.ttf",
  "./assets/logo-cabinet.png",
  "./assets/favicon.svg",
  "./assets/icone-180.png",
  "./assets/icone-192.png",
  "./assets/icone-512.png",
  "./assets/icone-maskable-512.png",
  "./src/aleatoire.js",
  "./src/referentiel.js",
  "./src/format.js",
  "./contenu/chaines-membre-inferieur.js",
  "./contenu/chaines-tronc.js",
  "./contenu/chaines-membre-superieur.js",
  "./contenu/chaines-complexe.js",
  "./contenu/chaines-sports.js",
  "./contenu/chaines-mobilite.js",
  "./contenu/evenements.js",
  "./contenu/plateaux.js",
  "./contenu/durees.js",
  "./src/bibliotheque.js",
  "./src/validation.js",
  "./src/resolution.js",
  "./src/regles.js",
  "./src/sauvegarde.js",
  "./src/parcours.js",
  "./src/estimation.js",
  "./src/minuteur.js",
  "./src/veille.js",
  "./src/mise-en-page.js",
  "./src/ui.js",
  "./src/prenoms.js",
  "./src/rendu-plateau.js",
  "./src/rendu-sentier.js",
  "./src/deplacement.js",
  "./src/partie-outils.js",
  "./src/ecran-accueil.js",
  "./src/ecran-choix.js",
  "./src/ecran-joueurs.js",
  "./src/ecran-regles.js",
  "./src/ecran-historique.js",
  "./src/vue-lancer.js",
  "./src/vue-effort.js",
  "./src/vue-podium.js",
  "./src/ecran-partie.js",
  "./src/app.js"
];

self.addEventListener("install", function (e) {
  // { cache: "reload" } : on repasse par le réseau et non par le cache HTTP du
  // navigateur (GitHub Pages sert avec max-age=600), sinon une mise à jour
  // pourrait ranger des fichiers périmés sous un nouveau numéro de CACHE.
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(FICHIERS.map(function (u) { return new Request(u, { cache: "reload" }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (noms) {
    return Promise.all(noms.map(function (n) { return n !== CACHE && n.indexOf(PREFIXE) === 0 ? caches.delete(n) : null; }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  // Cache d'abord : à la maison, le réseau n'est pas garanti. Pour la navigation, ignoreSearch : un lien ouvert avec un
  // paramètre (« ?fbclid=... » d'un réseau social) retrouve quand même la page, hors ligne.
  var options = e.request.mode === "navigate" ? { ignoreSearch: true } : undefined;
  e.respondWith(caches.match(e.request, options).then(function (r) { return r || fetch(e.request); }));
});
