(function (global) {
  function creer() {
    var verrou = null;
    var demandeEnCours = false;
    // L'appelant veut l'écran allumé : prendre() l'affirme, relacher() le retire. Le retour au premier
    // plan ne reprend le verrou que dans le premier cas, sinon un relâchement volontaire (podium,
    // sortie de l'écran) serait défait dès qu'on revient d'une autre application.
    var voulue = false;

    function liberer(v) {
      try {
        var r = v.release();
        if (r && r.catch) r.catch(function () {});
      } catch (e) { /* déjà rendu par le système : sans gravité */ }
    }

    function demander() {
      if (!global.navigator || !global.navigator.wakeLock) return;
      // Pas de nouvelle demande si un verrou est déjà détenu ou si une demande
      // est déjà en attente : sinon la réponse la plus récente écrase la
      // référence de la précédente, qui n'est alors jamais relâchée. Un verrou
      // que le système a rendu (arrière-plan) ne compte plus comme détenu.
      if ((verrou && !verrou.released) || demandeEnCours) return;
      demandeEnCours = true;
      global.navigator.wakeLock.request("screen").then(function (v) {
        demandeEnCours = false;
        if (!voulue) { liberer(v); return; }   // relâché pendant que la demande était en route
        verrou = v;
      }).catch(function () {
        demandeEnCours = false;
        // Refus possible si l'onglet n'est pas au premier plan. Sans gravité :
        // l'exercice se déroule, seul le verrou manque.
      });
    }

    function prendre() {
      voulue = true;
      demander();
    }

    function relacher() {
      voulue = false;
      if (verrou) { var v = verrou; verrou = null; liberer(v); }
    }

    // iOS relâche le verrou dès que l'app passe en arrière-plan. Au retour,
    // on retente si l'écran est toujours voulu : demander() ignore l'appel si
    // un verrou est déjà détenu ou une demande déjà en cours, ce qui couvre
    // aussi bien le cas où la demande initiale avait échoué faute de premier plan.
    function surChangementVisibilite() {
      if (voulue && global.document.visibilityState === "visible") demander();
    }

    if (global.document) {
      global.document.addEventListener("visibilitychange", surChangementVisibilite);
    }

    // Détache l'instance : retire l'écouteur et relâche le verrou. relacher()
    // garde son rôle actuel (rendre le verrou sans démonter l'instance ; une
    // nouvelle demande la réarme) ; detacher() sert quand une instance ne doit
    // plus jamais être réutilisée.
    function detacher() {
      if (global.document) {
        global.document.removeEventListener("visibilitychange", surChangementVisibilite);
      }
      relacher();
    }

    return { prendre: prendre, relacher: relacher, detacher: detacher };
  }

  var Veille = { creer: creer };
  if (typeof module !== "undefined" && module.exports) module.exports = Veille;
  else global.Veille = Veille;
})(typeof globalThis !== "undefined" ? globalThis : this);
