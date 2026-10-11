(function (global) {
  var CLE = "oieMaison.son";

  function creer(stockage) {
    var contexte = null;
    function lire() { try { return stockage.getItem(CLE) !== "0"; } catch (e) { return true; } }
    function ecrire(v) { try { stockage.setItem(CLE, v ? "1" : "0"); } catch (e) { /* stockage bloqué : sans gravité */ } }
    var actif = lire();

    // Rien ne doit remonter d'un échec du son : ni le constructeur, ni la
    // reprise (resume() renvoie une promesse dont le rejet ne regarde personne).
    // "interrupted" est l'état d'iOS Safari après un appel ou un retour
    // d'arrière-plan.
    function reprendre() {
      if (!contexte || (contexte.state !== "suspended" && contexte.state !== "interrupted")) return;
      try {
        var p = contexte.resume();
        if (p && p.catch) p.catch(function () {});
      } catch (e) { /* reprise refusée : sans gravité */ }
    }

    // iOS n'autorise le son qu'après un geste de l'utilisateur.
    function debloquer() {
      if (!contexte) {
        try {
          var C = global.AudioContext || global.webkitAudioContext;
          if (C) contexte = new C();
        } catch (e) { contexte = null; }
      }
      reprendre();
    }

    // Web Audio peut lever (contexte fermé, iOS capricieux...) : un bip qui
    // échoue ne doit jamais faire planter l'écran qui l'appelle.
    function tonalite(frequence, decalages, duree) {
      if (!actif || !contexte) return;
      reprendre();   // les bips du minuteur ne viennent pas d'un geste : après une interruption, on retente
      try {
        decalages.forEach(function (decalage) {
          var o = contexte.createOscillator(), g = contexte.createGain(), t0 = contexte.currentTime + decalage;
          o.type = "sine"; o.frequency.value = frequence;
          g.gain.setValueAtTime(0.3, t0);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + duree);
          o.connect(g); g.connect(contexte.destination);
          o.start(t0); o.stop(t0 + duree + 0.02);
        });
      } catch (e) { if (global.console) global.console.error(e); }
    }
    function bip() { tonalite(880, [0, 0.25, 0.5], 0.18); }        // fin du minuteur
    function bipCourt() { tonalite(660, [0], 0.12); }             // départ et 3 dernières secondes

    return {
      debloquer: debloquer, bip: bip, bipCourt: bipCourt,
      actif: function () { return actif; },
      basculer: function () { actif = !actif; ecrire(actif); return actif; }
    };
  }

  var SonOie = { creer: creer };
  if (typeof module !== "undefined" && module.exports) module.exports = SonOie;
  else global.SonOie = SonOie;
})(typeof globalThis !== "undefined" ? globalThis : this);
