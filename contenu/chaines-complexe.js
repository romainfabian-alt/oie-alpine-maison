(function (global) {
  // Chaîne « complexe » : enchaînements de plusieurs gestes, sans matériel
  // (sol, mur, tapis). Elle n'apparaît que sur le plateau Full body.
  // Contenu soumis à la relecture du kiné : ne jamais modifier une variante sans son accord.
  // Niveaux : 1-5 reprise (squat puis montée de bras, fente puis rotation,
  // amplitude contrôlée, aucun impact), 6-11 renforcement (descente en planche
  // pieds marchés, pompe ajoutée, tempo), 12-16 réathlétisation (burpee,
  // fente sautée, rotations vives), 17-20 retour au sport (squat sauté et
  // pompe enchaînés, unipodal). L'ordre des gestes est écrit dans chaque
  // consigne ; chaque niveau garde une variante sans saut et une variante
  // sans bras au-dessus de la tête. Le mot « burpee » n'est employé que pour
  // les versions sautées : la version marchée s'appelle « squat-planche ».
  function reps(n) { return { type: "reps", valeur: n }; }
  function sec(n) { return { type: "duree", valeur: n }; }
  function v(nom, description, materiel, dosage, o) {
    o = o || {};
    return { nom: nom, description: description, materiel: materiel, dosage: dosage,
      unilateral: !!o.unilateral, incompatible: o.incompatible || [], deplacement: !!o.deplacement };
  }
  var U = { unilateral: true };
  var SS = { incompatible: ["sans_saut"] };
  // Pieds sautés vers les mains : réception en flexion profonde du genou.
  var SS_SFP = { incompatible: ["sans_saut", "sans_flexion_profonde"] };
  var SO = { incompatible: ["sans_overhead"] };
  var SO_U = { unilateral: true, incompatible: ["sans_overhead"] };
  var SS_U = { unilateral: true, incompatible: ["sans_saut"] };
  var U_D = { unilateral: true, deplacement: true };

  var CHAINES = [
    {
      // Trois fils : squat puis bras (montée au-dessus de la tête déclarée
      // « sans_overhead », bras devant à hauteur d'épaules sinon), fente puis
      // rotation du buste, descente en planche (pieds marchés, puis sautés
      // dès 12, puis squat sauté et pompe dès 17).
      id: "complexe", nom: "Complexe", famille: "complexe",
      niveaux: {
        "1": [v("Squat au mur, montée des bras", "Dos au mur, pieds à 40 cm devant, glisser jusqu'à mi-hauteur, remonter, puis monter les bras tendus au-dessus de la tête, sans cambrer, effort modéré.", ["mur"], reps(8), SO),
              v("Demi-squat, bras devant", "Descendre à mi-hauteur en 3 s, remonter debout, puis lever les bras tendus devant jusqu'à hauteur d'épaules et les baisser, genoux dans l'axe des pieds.", ["aucun"], reps(10)),
              v("Fente à mi-hauteur, rotation lente", "Pieds écartés d'un grand pas, plier les genoux à mi-hauteur et tenir, tourner lentement le buste vers la jambe avant, revenir face, puis remonter, bassin face à l'avant.", ["aucun"], reps(6), U)],
        "2": [v("Demi-squat, montée des bras", "Descendre à mi-hauteur en 3 s, remonter debout, puis monter les bras tendus au-dessus de la tête et les baisser, ventre gainé, sans cambrer le bas du dos.", ["aucun"], reps(10), SO),
              v("Squat au mur, bras devant", "Dos au mur, glisser jusqu'à mi-hauteur, tenir 3 s, remonter, puis lever les bras tendus devant à hauteur d'épaules, poids sur les talons, effort modéré.", ["mur"], reps(10)),
              v("Fente à mi-hauteur, puis rotation", "Pieds écartés d'un grand pas, descendre à mi-hauteur en 3 s, remonter, puis tourner le buste vers la jambe avant, mains jointes contre la poitrine, bassin face à l'avant.", ["aucun"], reps(6), U)],
        "3": [v("Squat, montée des bras", "Descendre jusqu'aux cuisses parallèles en 3 s, remonter debout, puis monter les bras tendus au-dessus de la tête, sans cambrer, garder 2 répétitions en réserve.", ["aucun"], reps(8), SO),
              v("Squat, bras devant", "Descendre jusqu'aux cuisses parallèles en 3 s, remonter debout, puis lever les bras tendus devant à hauteur d'épaules, genoux dans l'axe des pieds.", ["aucun"], reps(10)),
              v("Fente statique, rotation tenue", "En fente, descendre à mi-hauteur, tourner le buste vers la jambe avant et tenir 3 s, revenir face, puis remonter, buste droit, genou avant au-dessus de la cheville.", ["aucun"], reps(6), U)],
        "4": [v("Squat tempo, montée des bras", "Descendre en 3 s aux cuisses parallèles, marquer 1 s, remonter, puis monter les bras tendus au-dessus de la tête, ventre gainé, sans cambrer.", ["aucun"], reps(8), SO),
              v("Fente arrière, rotation", "Reculer une jambe d'un grand pas, descendre le genou arrière près du sol, tourner le buste vers la jambe avant, revenir face, puis revenir pieds joints.", ["aucun"], reps(6), U),
              v("Squat puis montée sur pointes", "Descendre aux cuisses parallèles en 3 s, remonter debout, puis monter sur la pointe des pieds bras devant à hauteur d'épaules, redescendre lentement.", ["aucun"], reps(10))],
        "5": [v("Squat, montée des bras sur pointes", "Descendre aux cuisses parallèles en 3 s, remonter debout, puis monter sur la pointe des pieds en montant les bras tendus au-dessus de la tête, redescendre lentement.", ["aucun"], reps(8), SO),
              v("Fente arrière, rotation tempo", "Reculer d'un grand pas, descendre en 3 s le genou arrière près du sol, tourner le buste vers la jambe avant, revenir face, puis remonter pieds joints.", ["aucun"], reps(8), U),
              v("Squat-planche, pieds marchés, pause", "Poser les mains au sol, fesses plus hautes que les genoux, reculer un pied puis l'autre en planche, tenir 2 s, revenir pied après pied, puis se redresser, effort modéré.", ["tapis"], reps(5))],
        "6": [v("Squat lent, montée des bras", "Descendre en 4 s aux cuisses parallèles, remonter dynamique, puis monter les bras tendus au-dessus de la tête et tenir 2 s, sans cambrer.", ["aucun"], reps(10), SO),
              v("Fente avant, rotation", "Avancer d'un grand pas, freiner en fente, genou avant dans l'axe, tourner le buste vers la jambe avant, revenir face, puis repousser pour revenir pieds joints.", ["aucun"], reps(8), U),
              v("Squat-planche, pieds marchés", "Poser les mains au sol, fesses plus hautes que les genoux, reculer un pied puis l'autre en planche, revenir pied après pied, puis se redresser, dos plat en planche.", ["tapis"], reps(6))],
        "7": [v("Squat un et demi, montée des bras", "Descendre jusqu'aux cuisses parallèles, remonter à mi-hauteur, redescendre, remonter debout, puis monter les bras tendus au-dessus de la tête : 1 répétition, sans cambrer.", ["aucun"], reps(6), SO),
              v("Fente arrière, rotation bras tendus", "Reculer d'un grand pas, genou arrière près du sol, tourner le buste vers la jambe avant bras tendus devant à hauteur d'épaules, revenir face, puis revenir pieds joints.", ["aucun"], reps(8), U),
              v("Squat-planche marché, tempo", "Poser les mains au sol en 2 s, fesses plus hautes que les genoux, reculer un pied puis l'autre, tenir la planche 2 s, revenir pied après pied, puis se redresser en 2 s.", ["tapis"], reps(6))],
        "8": [v("Squat pieds décalés, montée des bras", "Un pied un demi-pas devant l'autre, descendre jusqu'aux cuisses parallèles en chargeant la jambe arrière, remonter, puis monter les bras tendus au-dessus de la tête, buste droit.", ["aucun"], reps(8), SO_U),
              v("Fentes alternées, rotation", "Alterner fente arrière droite et gauche : à chaque fente, tourner le buste vers la jambe avant, revenir face, puis revenir pieds joints, buste droit.", ["aucun"], reps(8), U),
              v("Squat-planche marché, toucher d'épaule", "Mains au sol, fesses plus hautes que les genoux, reculer un pied puis l'autre en planche pieds écartés, toucher une épaule puis l'autre de la main opposée, revenir pied après pied, puis se redresser.", ["tapis"], reps(6))],
        "9": [v("Squat pause, montée des bras", "Descendre aux cuisses parallèles, tenir 2 s, remonter dynamique, puis monter les bras tendus au-dessus de la tête et tenir 2 s, ventre gainé.", ["aucun"], reps(10), SO),
              v("Fente latérale, rotation", "Grand pas de côté, descendre à mi-hauteur en reculant les fesses, tourner le buste vers la jambe pliée, revenir face, puis revenir en poussant dans le talon.", ["aucun"], reps(8), U),
              v("Squat-planche marché, pompe", "Mains au sol, fesses plus hautes que les genoux, reculer un pied puis l'autre en planche, faire 1 pompe, revenir pied après pied, puis se redresser, corps aligné pendant la pompe.", ["tapis"], reps(6))],
        "10": [v("Squat lent, bras devant tenus", "Descendre en 4 s aux cuisses parallèles bras tendus devant à hauteur d'épaules, tenir 2 s, remonter debout, puis baisser les bras, dos droit.", ["aucun"], reps(10)),
               v("Fente avant, rotation tempo", "Avancer d'un grand pas, descendre en 3 s, tourner lentement le buste vers la jambe avant, revenir face, puis repousser pour revenir pieds joints.", ["aucun"], reps(8), U),
               v("Squat-planche marché, pompe tempo", "Mains au sol, fesses plus hautes que les genoux, reculer un pied puis l'autre, faire 1 pompe en descendant en 3 s, revenir pied après pied, puis se redresser, dos plat en planche.", ["tapis"], reps(6))],
        "11": [v("Squat puis fentes arrière", "Faire 1 squat aux cuisses parallèles, remonter, puis 1 fente arrière de chaque côté en revenant pieds joints : 1 répétition, buste droit, genoux dans l'axe.", ["aucun"], reps(6)),
               v("Fentes marchées, rotation", "Enchaîner les fentes avant en avançant, tourner le buste vers la jambe avant à chaque pas, demi-tour au bout de la pièce, genou avant dans l'axe.", ["aucun"], reps(8), U_D),
               v("Squat-planche marché, série", "Enchaîner sans pause : mains au sol, fesses plus hautes que les genoux, pieds reculés un par un en planche, ramenés un par un, puis se redresser, rythme régulier, dos plat en planche.", ["tapis"], sec(30))],
        "12": [v("Demi-burpee", "Mains au sol, fesses plus hautes que les genoux, sauter les deux pieds en arrière en planche, les ramener d'un saut près des mains, puis se redresser, sans saut vertical.", ["tapis"], reps(6), SS_SFP),
               v("Squat explosif, montée des bras", "Descendre aux cuisses parallèles en 2 s, remonter le plus vite possible jusque sur la pointe des pieds, puis monter les bras tendus au-dessus de la tête, sans sauter.", ["aucun"], reps(8), SO),
               v("Fente arrière, rotation rapide", "Reculer d'un grand pas, genou arrière près du sol, tourner vivement le buste vers la jambe avant et freiner net, revenir face, puis remonter pieds joints.", ["aucun"], reps(8), U)],
        "13": [v("Burpee", "Mains au sol, fesses plus hautes que les genoux, sauter les pieds en arrière en planche, les ramener près des mains, se redresser, puis sauter, élan des bras jusqu'à hauteur d'épaules, réception souple.", ["tapis"], reps(6), SS_SFP),
               v("Squat-planche marché, pompe, rythmé", "Enchaîner vite : mains au sol, fesses plus hautes que les genoux, pieds reculés un par un, 1 pompe, pieds ramenés un par un, puis se redresser, sans sauter, dos plat en planche.", ["tapis"], reps(8)),
               v("Fente, rotation, genou montant", "Reculer en fente, tourner le buste vers la jambe avant, revenir face, puis remonter en amenant le genou arrière devant à hauteur de hanche, tenir 1 s.", ["aucun"], reps(8), U)],
        "14": [v("Burpee enchaîné", "Enchaîner sans pause : pieds sautés en arrière en planche, ramenés près des mains, se redresser, puis sauter, élan des bras jusqu'à hauteur d'épaules, réception souple.", ["tapis"], reps(8), SS_SFP),
               v("Fente sautée, rotation", "En fente basse, sauter en changeant de jambe, élan des bras jusqu'à hauteur d'épaules, réception silencieuse en fente, tourner le buste vers la jambe avant, revenir face, puis sauter de nouveau.", ["aucun"], reps(6), SS_U),
               v("Squat puis fentes arrière, rythmés", "Enchaîner à rythme vif 1 squat aux cuisses parallèles puis 1 fente arrière de chaque côté, revenir pieds joints à chaque fois, genoux dans l'axe.", ["aucun"], sec(30))],
        "15": [v("Burpee avec pompe", "Mains au sol, sauter les pieds en arrière, faire 1 pompe, ramener les pieds d'un saut, se redresser, puis sauter, élan des bras jusqu'à hauteur d'épaules, réception souple.", ["tapis"], reps(6), SS_SFP),
               v("Fente latérale, rotation rapide", "Grand pas de côté rapide, freiner à mi-hauteur en reculant les fesses, tourner vivement le buste vers la jambe pliée, revenir face, puis repousser vers le centre.", ["aucun"], reps(8), U),
               v("Squat explosif, montée des bras, série", "Enchaîner à rythme vif : squat aux cuisses parallèles, remontée sur la pointe des pieds, puis bras tendus au-dessus de la tête, sans sauter, dos droit.", ["aucun"], sec(30), SO)],
        "16": [v("Burpee avec pompe, enchaîné", "Enchaîner sans pause : pieds sautés en arrière, 1 pompe, pieds ramenés, se redresser, puis sauter, élan des bras jusqu'à hauteur d'épaules, réception souple, ralentir si la réception devient bruyante.", ["tapis"], sec(20), SS_SFP),
               v("Fentes marchées, rotation rapide", "Enchaîner les fentes avant en avançant, tourner vivement le buste vers la jambe avant et freiner net à chaque pas, demi-tour au bout de la pièce, genou dans l'axe.", ["aucun"], reps(8), U_D),
               v("Squat, fente et rotation enchaînés", "Enchaîner 1 squat jusqu'aux cuisses parallèles, puis 1 fente arrière avec rotation du buste vers la jambe avant, puis la même fente de l'autre côté, à rythme vif, sur place, genoux dans l'axe.", ["aucun"], sec(30))],
        "17": [v("Squat sauté puis pompe", "Faire 1 squat sauté, élan des bras jusqu'à hauteur d'épaules, réception silencieuse, poser les mains au sol, reculer les pieds d'un saut, faire 1 pompe, ramener les pieds d'un saut, puis se redresser.", ["tapis"], reps(6), SS_SFP),
               v("Squat unipodal, montée des bras", "Sur une jambe, descendre au quart de la hauteur, remonter, puis monter les bras tendus au-dessus de la tête, genou d'appui dans l'axe, bassin horizontal.", ["aucun"], reps(6), SO_U),
               v("Fente, rotation, remontée explosive", "Descendre en fente arrière, tourner le buste vers la jambe avant, revenir face, puis remonter le plus vite possible sur la pointe du pied avant, genou arrière à hauteur de hanche, tenir 2 s.", ["aucun"], reps(8), U)],
        "18": [v("Squat sauté et pompe enchaînés", "Enchaîner sans pause : 1 squat sauté, élan des bras jusqu'à hauteur d'épaules, réception silencieuse, mains au sol, pieds reculés d'un saut, 1 pompe, pieds ramenés d'un saut, puis se redresser.", ["tapis"], reps(8), SS_SFP),
               v("Fentes sautées, rotation enchaînées", "Fentes sautées alternées : à chaque réception silencieuse en fente, tourner le buste vers la jambe avant, revenir face, puis sauter, élan des bras jusqu'à hauteur d'épaules, genou avant dans l'axe.", ["aucun"], reps(8), SS_U),
               v("Squat unipodal, rotation", "Sur une jambe, descendre au quart de la hauteur, tourner le buste vers la jambe d'appui, revenir face, puis remonter, genou dans l'axe, bassin horizontal.", ["aucun"], reps(6), U)],
        "19": [v("Deux squats sautés, deux pompes", "Faire 2 squats sautés, élan des bras jusqu'à hauteur d'épaules, réceptions silencieuses, poser les mains au sol, reculer les pieds d'un saut, faire 2 pompes, ramener les pieds d'un saut, puis se redresser.", ["tapis"], reps(5), SS_SFP),
               v("Burpee avec pompe, série", "Enchaîner les burpees avec pompe : pieds sautés en arrière, 1 pompe, pieds ramenés, se redresser, puis sauter, élan des bras jusqu'à hauteur d'épaules, ralentir si la réception devient bruyante.", ["tapis"], sec(30), SS_SFP),
               v("Enchaînement complet, sans impact", "Enchaîner 1 squat jusqu'aux cuisses parallèles bras devant, fentes arrière, rotation alternée, puis mains au sol, fesses plus hautes que les genoux, pieds marchés en planche, 1 pompe, retour debout, sur place.", ["tapis"], sec(45))],
        "20": [v("Squat sauté et pompe, série", "Enchaîner : 1 squat sauté, élan des bras jusqu'à hauteur d'épaules, réception silencieuse, mains au sol, pieds reculés d'un saut, 1 pompe, pieds ramenés, se redresser, ralentir si la réception devient bruyante.", ["tapis"], sec(30), SS_SFP),
               v("Squat unipodal vif, montée des bras", "Sur une jambe, descendre au quart de la hauteur, remonter le plus vite possible sur la pointe, puis monter les bras tendus au-dessus de la tête, sans sauter.", ["aucun"], reps(6), SO_U),
               v("Enchaînement complet, long", "Enchaîner 1 squat aux cuisses parallèles, puis monter sur la pointe des pieds, fentes arrière avec rotation, mains au sol, fesses plus hautes que les genoux, pieds marchés en planche, 1 pompe, retour debout, sur place.", ["tapis"], sec(50))]
      }
    }
  ];

  if (typeof module !== "undefined" && module.exports) module.exports = CHAINES;
  else global.CHAINES_COMPLEXE = CHAINES;
})(typeof globalThis !== "undefined" ? globalThis : this);
