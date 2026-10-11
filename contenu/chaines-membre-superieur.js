(function (global) {
  // Chaînes de progression du membre supérieur, sans matériel (sol, mur, tapis).
  // Contenu soumis à la relecture du kiné : ne jamais modifier une variante sans son accord.
  // Niveaux : 1-5 reprise (mur, amplitude partielle, isométrie, aucun impact),
  // 6-11 renforcement (amplitude complète, tempo, leviers longs), 12-16
  // réathlétisation (appui asymétrique, montée vive, endurance), 17-20 retour
  // au sport (appui sur une main, positions renversées au mur, rythme vif).
  // Charge de l'épaule et du poignet progressive ; jamais d'effort tenu
  // jusqu'à l'échec.
  function reps(n) { return { type: "reps", valeur: n }; }
  function sec(n) { return { type: "duree", valeur: n }; }
  function v(nom, description, materiel, dosage, o) {
    o = o || {};
    return { nom: nom, description: description, materiel: materiel, dosage: dosage,
      unilateral: !!o.unilateral, incompatible: o.incompatible || [], deplacement: !!o.deplacement };
  }
  var U = { unilateral: true };
  var SS = { incompatible: ["sans_saut"] };
  var SGS = { incompatible: ["sans_genoux_sol"] };
  var SO = { incompatible: ["sans_overhead"] };
  var SO_U = { unilateral: true, incompatible: ["sans_overhead"] };
  // Poirier : rachis en charge tête en bas, déclaré aussi « sans charge sur le dos ».
  var SO_SCD = { incompatible: ["sans_overhead", "sans_charge_dos"] };
  var SGS_U = { unilateral: true, incompatible: ["sans_genoux_sol"] };
  var SS_U = { unilateral: true, incompatible: ["sans_saut"] };
  var SS_SGS = { incompatible: ["sans_saut", "sans_genoux_sol"] };
  var D = { deplacement: true };

  var CHAINES = [
    {
      // Du mur au sol, puis pieds au mur (pompes déclinées), appui
      // asymétrique (archer) et une main assistée. Pas d'impact : les mains
      // qui quittent le sol relèvent de « poussee_explosive ».
      id: "poussee_horizontale", nom: "Poussée horizontale", famille: "membre_superieur",
      niveaux: {
        "1": [v("Pompes au mur", "Face au mur, mains à plat à hauteur d'épaules, un grand pas en arrière, plier les coudes à 45° du buste, puis pousser, corps aligné des talons à la tête.", ["mur"], reps(10)),
              v("Pompe au mur tenue à mi-course", "Face au mur, mains à hauteur d'épaules, plier les coudes à mi-course et tenir, corps aligné, épaules loin des oreilles, effort modéré, environ 6 sur 10.", ["mur"], sec(15))],
        "2": [v("Pompes au mur lentes", "Mains au mur à hauteur d'épaules, descendre la poitrine vers le mur en 3 s, pousser en 1 s, coudes à 45° du buste, sans cambrer le bas du dos.", ["mur"], reps(10)),
              v("Pompes sur les genoux, mi-hauteur", "Genoux sur le tapis, mains sous les épaules, descendre la poitrine à mi-hauteur seulement, pousser, corps aligné des genoux à la tête, effort modéré.", ["tapis"], reps(8), SGS)],
        "3": [v("Pompes au mur, pieds éloignés", "Mains au mur à hauteur d'épaules, pieds nus reculés de deux grands pas, sur un sol non glissant, plier les coudes jusqu'à approcher le front du mur, pousser, corps aligné.", ["mur"], reps(10)),
              v("Pompes sur les genoux", "Genoux sur le tapis, mains sous les épaules, doigts écartés, descendre la poitrine à 5 cm du tapis en 2 s, pousser, corps aligné des genoux à la tête.", ["tapis"], reps(8), SGS),
              v("Pompe au mur tenue, pieds éloignés", "Pieds nus à deux grands pas du mur, sur un sol non glissant, coudes pliés à mi-course, tenir, corps aligné des talons à la tête, ventre gainé, effort modéré, environ 6 sur 10.", ["mur"], sec(20))],
        "4": [v("Pompes au mur, pieds éloignés, tempo", "Pieds nus à deux grands pas du mur, sur un sol non glissant, descendre la poitrine en 3 s, marquer 1 s, pousser, coudes à 45° du buste, corps gainé sans cambrer.", ["mur"], reps(10)),
              v("Pompes sur les genoux tempo", "Genoux sur le tapis, descendre la poitrine en 3 s jusqu'à 5 cm du tapis, pousser en 1 s, corps aligné, garder 2 répétitions en réserve.", ["tapis"], reps(8), SGS),
              v("Pompes, descente de 10 cm", "En planche bras tendus, mains sous les épaules, plier les coudes pour descendre de 10 cm seulement, pousser, corps aligné des talons à la tête.", ["tapis"], reps(6))],
        "5": [v("Pompes à mi-hauteur", "En planche bras tendus, descendre la poitrine à mi-chemin du sol en 2 s, pousser, coudes à 45° du buste, corps aligné, garder 2 répétitions en réserve.", ["tapis"], reps(6)),
              v("Pompes sur les genoux complètes", "Genoux sur le tapis, descendre en 2 s jusqu'à effleurer le tapis de la poitrine, pousser jusqu'aux bras tendus, corps aligné des genoux à la tête.", ["tapis"], reps(10), SGS),
              v("Pompe tenue à mi-hauteur", "En planche bras tendus, descendre à mi-hauteur et tenir, coudes à 45° du buste, corps aligné, effort modéré, environ 6 sur 10, remonter avant de trembler.", ["tapis"], sec(10))],
        "6": [v("Pompes", "Mains sous les épaules, doigts écartés, descendre la poitrine à 5 cm du tapis, pousser, coudes à 45° du buste, corps aligné, garder 2 répétitions en réserve.", ["tapis"], reps(6)),
              v("Pompes négatives", "En planche bras tendus, descendre la poitrine en 4 s jusqu'au tapis, poser les genoux pour remonter, reprendre la planche, corps aligné pendant la descente.", ["tapis"], reps(5), SGS),
              v("Pompe tenue à mi-hauteur, longue", "En planche bras tendus, descendre à mi-hauteur et tenir, coudes à 45° du buste, corps aligné des talons à la tête, remonter avant de trembler.", ["tapis"], sec(15))],
        "7": [v("Pompes tempo 3 s", "Descendre la poitrine en 3 s jusqu'à 5 cm du tapis, pousser en 1 s, coudes à 45° du buste, corps aligné, garder 2 répétitions en réserve.", ["tapis"], reps(6)),
              v("Pompes complètes", "Mains sous les épaules, descendre jusqu'à effleurer le tapis de la poitrine, pousser jusqu'aux bras tendus, corps aligné, garder 2 répétitions en réserve.", ["tapis"], reps(8))],
        "8": [v("Pompes pause en bas", "Descendre la poitrine à 3 cm du tapis, tenir 2 s sans laisser le bassin s'affaisser, pousser, coudes à 45° du buste, corps aligné.", ["tapis"], reps(6)),
              v("Pompes mains rapprochées", "Mains sous la poitrine, écartées de la largeur du bassin, coudes qui frôlent le buste, descendre en 2 s, pousser, corps aligné des talons à la tête.", ["tapis"], reps(8)),
              v("Pompes en série", "Enchaîner les pompes à rythme régulier, poitrine à 5 cm du tapis, coudes à 45° du buste, corps aligné, garder 2 répétitions en réserve.", ["tapis"], reps(10))],
        "9": [v("Pompes déclinées, pieds au mur bas", "Mains au sol sous les épaules, pieds nus posés au mur à 30 cm du sol, corps aligné, descendre la poitrine en 2 s, pousser, sans creuser le bas du dos, arrêter si les pieds glissent.", ["mur", "tapis"], reps(6)),
              v("Pompes tempo 4 s", "Descendre la poitrine en 4 s jusqu'à 3 cm du tapis, marquer 1 s, pousser en 1 s, corps aligné, garder 2 répétitions en réserve.", ["tapis"], reps(6)),
              v("Pompes mains rapprochées tempo", "Mains sous la poitrine, coudes qui frôlent le buste, descendre en 3 s, pousser en 1 s, corps aligné, épaules loin des oreilles.", ["tapis"], reps(8))],
        "10": [v("Pompes déclinées, pieds au mur", "Mains au sol sous les épaules, pieds nus posés au mur à hauteur de genoux, corps aligné, descendre la poitrine en 2 s, pousser, sans creuser le dos, arrêter si les pieds glissent.", ["mur", "tapis"], reps(6)),
               v("Pompes un et demi", "Descendre jusqu'à 3 cm du tapis, remonter à mi-hauteur, redescendre jusqu'à 3 cm du tapis, puis pousser jusqu'aux bras tendus : 1 répétition, corps aligné, coudes à 45° du buste.", ["tapis"], reps(5)),
               v("Pompes mains décalées", "Une main 20 cm plus en avant que l'autre, descendre la poitrine en 2 s, pousser, corps aligné, bassin à plat, puis inverser les mains.", ["tapis"], reps(6), U)],
        "11": [v("Pompes déclinées tempo", "Pieds nus posés au mur à hauteur de genoux, mains sous les épaules, descendre en 3 s, pousser en 1 s, bassin dans l'alignement, sans creuser le dos, arrêter si les pieds glissent.", ["mur", "tapis"], reps(6)),
               v("Pompes en série longue", "Enchaîner les pompes à rythme régulier, poitrine à 5 cm du tapis, corps aligné, s'arrêter 2 répétitions avant de ne plus pouvoir.", ["tapis"], reps(12)),
               v("Pompes mains décalées tempo", "Une main 20 cm plus en avant que l'autre, descendre en 3 s, pousser en 1 s, bassin à plat sans tourner, puis inverser les mains.", ["tapis"], reps(6), U)],
        "12": [v("Pompes archer partielles", "Mains écartées de deux largeurs d'épaules, descendre vers une main en pliant ce coude, l'autre bras presque tendu, à mi-hauteur seulement, alterner.", ["tapis"], reps(4), U),
               v("Pompes déclinées, montée vive", "Pieds nus posés au mur à hauteur de genoux, descendre la poitrine en 2 s, pousser le plus vite possible sans décoller les mains, corps aligné, arrêter si les pieds glissent.", ["mur", "tapis"], reps(6)),
               v("Pompes un et demi tempo", "Descendre en 3 s, remonter à mi-hauteur, redescendre, puis pousser jusqu'aux bras tendus : 1 répétition, corps aligné, bassin sans s'affaisser.", ["tapis"], reps(5))],
        "13": [v("Pompes archer", "Mains écartées de deux largeurs d'épaules, descendre vers une main jusqu'à 5 cm du tapis, l'autre bras tendu sur le côté, pousser, alterner, bassin à plat.", ["tapis"], reps(4), U),
               v("Pompes déclinées hautes", "Pieds nus posés au mur à hauteur de hanches, mains sous les épaules, descendre en 2 s, pousser, corps aligné, sans creuser le bas du dos, arrêter si les pieds glissent.", ["mur", "tapis"], reps(6)),
               v("Pompes mains décalées, montée vive", "Une main 20 cm plus en avant que l'autre, descendre en 2 s, pousser le plus vite possible sans décoller les mains, puis inverser les mains.", ["tapis"], reps(6), U)],
        "14": [v("Pompes archer tempo", "Mains écartées de deux largeurs d'épaules, descendre vers une main en 3 s, l'autre bras tendu, pousser, alterner, bassin à plat sans tourner.", ["tapis"], reps(4), U),
               v("Pompes déclinées un et demi", "Pieds nus au mur à hauteur de genoux, descendre jusqu'à 3 cm du tapis, remonter à mi-hauteur, redescendre, puis pousser jusqu'aux bras tendus : 1 répétition, arrêter si les pieds glissent.", ["mur", "tapis"], reps(5)),
               v("Pompes, montée vive", "Descendre la poitrine en 2 s jusqu'à 5 cm du tapis, pousser le plus vite possible sans décoller les mains, corps aligné, bassin sans s'affaisser.", ["tapis"], reps(8))],
        "15": [v("Pompe une main assistée, mi-hauteur", "Pieds très écartés, une main sous l'épaule, l'autre posée loin sur le côté sur le bout des doigts, descendre à mi-hauteur, pousser, bassin à plat.", ["tapis"], reps(4), U),
               v("Pompes archer, montée vive", "Mains écartées de deux largeurs d'épaules, descendre vers une main en 2 s, pousser le plus vite possible sans décoller les mains, alterner.", ["tapis"], reps(4), U),
               v("Pompes déclinées hautes tempo", "Pieds nus posés au mur à hauteur de hanches, descendre en 3 s, pousser en 1 s, corps aligné, sans creuser le bas du dos, arrêter si les pieds glissent.", ["mur", "tapis"], reps(6))],
        "16": [v("Pompe une main assistée", "Pieds très écartés, une main sous l'épaule, l'autre loin sur le côté sur le bout des doigts, descendre jusqu'à 5 cm du tapis, pousser, bassin à plat.", ["tapis"], reps(4), U),
               v("Pompes archer, pause en bas", "Mains écartées de deux largeurs d'épaules, descendre vers une main, tenir 2 s à 5 cm du tapis, pousser, alterner, bassin à plat sans tourner.", ["tapis"], reps(4), U),
               v("Pompes déclinées hautes, montée vive", "Pieds nus posés au mur à hauteur de hanches, descendre en 2 s, pousser le plus vite possible sans décoller les mains, corps aligné, arrêter si les pieds glissent.", ["mur", "tapis"], reps(6))],
        "17": [v("Pompe une main assistée tempo", "Pieds très écartés, une main sous l'épaule, l'autre loin sur le côté sur le bout des doigts, descendre en 3 s, pousser, bassin à plat sans tourner.", ["tapis"], reps(4), U),
               v("Pompes archer, pieds au mur", "Pieds nus posés au mur à hauteur de genoux, mains très écartées, descendre vers une main, l'autre bras tendu, pousser, alterner, bassin à plat, arrêter si les pieds glissent.", ["mur", "tapis"], reps(4), U),
               v("Pompes vives en série", "Enchaîner les pompes à rythme vif sans décoller les mains, poitrine à 5 cm du tapis, corps aligné, s'arrêter dès que le bassin s'affaisse.", ["tapis"], sec(20))],
        "18": [v("Pompe une main assistée, pause", "Pieds très écartés, une main sous l'épaule, l'autre sur le bout des doigts loin sur le côté, tenir 2 s à 3 cm du tapis, pousser, bassin à plat.", ["tapis"], reps(4), U),
               v("Pompes archer enchaînées", "Mains écartées de deux largeurs d'épaules, alterner les côtés à rythme régulier, poitrine à 5 cm du tapis, bassin à plat, ralentir si le bassin tourne.", ["tapis"], sec(30)),
               v("Pompes déclinées, série longue", "Pieds nus au mur à hauteur de genoux, enchaîner les pompes à rythme régulier, corps aligné, s'arrêter dès que le bassin s'affaisse ou que les pieds glissent.", ["mur", "tapis"], sec(30))],
        "19": [v("Pompe une main, descente lente", "Pieds très écartés, une main sous l'épaule, l'autre sur la hanche, descendre en 4 s jusqu'à mi-hauteur, poser l'autre main pour remonter, bassin à plat.", ["tapis"], reps(3), U),
               v("Pompe une main assistée, montée vive", "Pieds très écartés, une main sous l'épaule, l'autre sur le bout des doigts loin sur le côté, descendre en 2 s, pousser le plus vite possible sans décoller la main.", ["tapis"], reps(4), U),
               v("Pompes archer, pieds au mur, tempo", "Pieds nus posés au mur à hauteur de genoux, mains très écartées, descendre vers une main en 3 s, pousser, alterner, bassin à plat sans tourner, arrêter si les pieds glissent.", ["mur", "tapis"], reps(4), U)],
        "20": [v("Pompe une main, descente complète", "Pieds très écartés, une main sous l'épaule, l'autre sur la hanche, descendre en 4 s jusqu'à 5 cm du tapis, poser l'autre main pour remonter, bassin à plat.", ["tapis"], reps(3), U),
               v("Pompe une main assistée, série", "Pieds très écartés, une main sous l'épaule, l'autre sur le bout des doigts, enchaîner à rythme régulier, s'arrêter dès que le bassin tourne.", ["tapis"], sec(20), U),
               v("Enchaînement de pompes", "Enchaîner sans pause 4 pompes mains rapprochées, 4 pompes mains décalées et 2 pompes archer par côté, corps aligné, ralentir si le bassin s'affaisse.", ["tapis"], sec(45))]
      }
    },
    {
      // Bras dans le prolongement du buste : toute la chaîne est déclarée
      // sans_overhead et remplacée par la poussée horizontale pour ce filtre.
      // Du mur (buste penché) au V inversé, puis pieds au mur et corps en L ;
      // poirier ventre face au mur à partir de 17 seulement, avec la sortie
      // décrite (redescendre en marchant).
      id: "poussee_verticale", nom: "Poussée verticale", famille: "membre_superieur",
      exclueParFiltre: { sans_overhead: "poussee_horizontale" },
      niveaux: {
        "1": [v("Poussée au mur, bras levés", "Face au mur, bras tendus, mains au mur au-dessus de la tête, pousser le mur et tenir 5 s, nuque relâchée, sans cambrer, effort modéré, environ 6 sur 10.", ["mur"], reps(8), SO),
              v("Pompes piquées au mur, courtes", "Mains au mur à hauteur de poitrine, reculer les pieds en pliant les hanches, dos plat, bras dans le prolongement du buste, plier un peu les coudes, pousser.", ["mur"], reps(8), SO)],
        "2": [v("Pompes piquées au mur", "Mains au mur à hauteur de poitrine, reculer en pliant les hanches, dos plat, bras dans le prolongement du buste, amener le front vers le mur en 2 s, pousser.", ["mur"], reps(10), SO),
              v("Poussée au mur, bras levés, tenue", "Face au mur, bras tendus, mains au mur au-dessus de la tête, pousser le mur et tenir, nuque relâchée, sans cambrer, effort modéré, environ 6 sur 10.", ["mur"], sec(15), SO)],
        "3": [v("Pompes piquées au mur lentes", "Mains au mur à hauteur de poitrine, hanches pliées, dos plat, amener le front vers le mur en 3 s, pousser en 1 s, sans écarter les coudes ni cambrer.", ["mur"], reps(10), SO),
              v("Pompes piquées au mur, pieds éloignés", "Mains au mur à hauteur de poitrine, reculer les pieds d'un pas de plus, dos plat, amener le front vers le mur en 2 s, pousser, sans écarter les coudes.", ["mur"], reps(8), SO)],
        "4": [v("Pompes piquées au mur, tempo", "Pieds éloignés, dos plat, bras dans le prolongement du buste, amener le front vers le mur en 3 s, marquer 1 s, pousser, sans écarter les coudes.", ["mur"], reps(10), SO),
              v("V inversé tenu", "Mains au sol largeur d'épaules, doigts écartés, monter les fesses vers le plafond en V inversé, genoux souples, pousser le sol, effort modéré, environ 6 sur 10.", ["tapis"], sec(15), SO)],
        "5": [v("V inversé, épaules au-dessus des mains", "En V inversé, avancer les épaules au-dessus des mains en 2 s, revenir, genoux souples, dos plat, nuque relâchée, sans laisser le dos s'arrondir.", ["tapis"], reps(8), SO),
              v("Pompes piquées au sol, courtes", "En V inversé, mains largeur d'épaules, plier les coudes pour descendre la tête de 5 cm vers le tapis, pousser, fesses hautes, nuque relâchée.", ["tapis"], reps(6), SO),
              v("V inversé tenu, long", "Mains au sol largeur d'épaules, fesses vers le plafond, genoux souples, pousser le sol pour éloigner les épaules des oreilles, respirer calmement.", ["tapis"], sec(25), SO)],
        "6": [v("Pompes piquées au sol, mi-hauteur", "En V inversé, fesses hautes, descendre la tête à mi-chemin du tapis en 2 s, pousser, coudes vers l'arrière, garder 2 répétitions en réserve.", ["tapis"], reps(6), SO),
              v("Pompe piquée tenue à mi-hauteur", "En V inversé, plier les coudes pour descendre la tête à mi-chemin du tapis et tenir, fesses hautes, effort modéré, environ 6 sur 10.", ["tapis"], sec(10), SO)],
        "7": [v("Pompes piquées au sol", "En V inversé, fesses hautes, plier les coudes pour amener le haut du crâne près du tapis, devant les mains, en 2 s, pousser, sans jamais poser la tête.", ["tapis"], reps(6), SO),
              v("Pompes piquées à mi-hauteur, série", "En V inversé, descendre la tête à mi-chemin du tapis, pousser, enchaîner à rythme régulier, fesses hautes, garder 2 répétitions en réserve.", ["tapis"], reps(10), SO)],
        "8": [v("Pompes piquées tempo", "En V inversé, fesses hautes, descendre en 3 s jusqu'à ce que le crâne effleure presque le tapis, devant les mains, pousser en 1 s, coudes vers l'arrière.", ["tapis"], reps(6), SO),
              v("Pompes piquées, pieds rapprochés", "Marcher les pieds vers les mains pour monter les fesses, descendre le haut du crâne près du tapis en 2 s, pousser, genoux souples, sans poser la tête.", ["tapis"], reps(6), SO)],
        "9": [v("Pompes piquées, pause en bas", "En V inversé, descendre le crâne à 3 cm du tapis, devant les mains, tenir 2 s, pousser, fesses hautes, sans poser la tête.", ["tapis"], reps(6), SO),
              v("Pompes piquées pieds rapprochés tempo", "Pieds près des mains, fesses hautes, descendre en 3 s jusqu'à ce que le crâne effleure presque le tapis, pousser en 1 s, genoux souples.", ["tapis"], reps(6), SO)],
        "10": [v("Pompes piquées un et demi", "En V inversé, descendre le crâne jusqu'à 3 cm du tapis, remonter à mi-hauteur, redescendre, puis pousser jusqu'aux bras tendus : 1 répétition, fesses hautes, sans poser la tête.", ["tapis"], reps(5), SO),
               v("Pompes piquées, une jambe levée", "En V inversé, lever une jambe tendue dans le prolongement du buste, descendre le crâne près du tapis en 2 s, pousser, puis changer de jambe.", ["tapis"], reps(4), SO_U)],
        "11": [v("Pompes piquées pieds au mur, mi-hauteur", "Dos au mur, mains au sol, pieds nus posés au mur derrière soi à hauteur de genoux, fesses hautes, descendre la tête à mi-chemin du tapis, pousser, arrêter si les pieds glissent.", ["mur", "tapis"], reps(5), SO),
               v("Pompes piquées tempo 4 s", "En V inversé, fesses hautes, descendre en 4 s jusqu'à ce que le crâne effleure presque le tapis, pousser en 1 s, sans poser la tête.", ["tapis"], reps(6), SO)],
        "12": [v("Pompes piquées pieds au mur", "Mains au sol, pieds nus posés au mur derrière soi à hauteur de genoux, fesses hautes, descendre le crâne près du tapis en 2 s, pousser, sans poser la tête, arrêter si les pieds glissent.", ["mur", "tapis"], reps(6), SO),
               v("Pompes piquées, montée vive", "En V inversé, fesses hautes, descendre en 2 s, pousser le plus vite possible sans décoller les mains, nuque relâchée, sans poser la tête.", ["tapis"], reps(6), SO)],
        "13": [v("Pompes piquées pieds au mur, tempo", "Pieds nus posés au mur à hauteur de genoux, fesses hautes, descendre en 3 s le crâne près du tapis, devant les mains, pousser en 1 s, sans poser la tête, arrêter si les pieds glissent.", ["mur", "tapis"], reps(5), SO),
               v("Corps en L au mur, tenu", "Départ en planche, pieds contre le mur : marcher les pieds au mur et les mains vers le mur jusqu'aux pieds à hauteur de hanches, buste vertical, tenir, redescendre de même.", ["mur", "tapis"], sec(15), SO)],
        "14": [v("Pompes piquées en L au mur", "Mains au sol, monter les pieds nus sur le mur jusqu'à former un L, buste vertical, descendre le crâne près du tapis en 2 s, pousser, sans poser la tête, s'arrêter avant que les bras tremblent, redescendre en marchant.", ["mur", "tapis"], reps(5), SO),
               v("Corps en L, épaules qui poussent", "Mains au sol, monter les pieds sur le mur jusqu'à former un L, bras tendus, pousser le sol pour grandir le corps, puis relâcher de 2 cm sans plier les coudes.", ["mur", "tapis"], reps(8), SO)],
        "15": [v("Pompes piquées en L, tempo", "Mains au sol, monter les pieds nus sur le mur jusqu'à former un L, buste vertical, descendre en 3 s le crâne près du tapis, pousser en 1 s, sans poser la tête, s'arrêter avant que les bras tremblent.", ["mur", "tapis"], reps(5), SO),
               v("Pompes piquées pieds au mur, vives", "Pieds nus au mur à hauteur de genoux, fesses hautes, descendre en 2 s, pousser le plus vite possible sans décoller les mains, sans poser la tête, arrêter si les pieds glissent.", ["mur", "tapis"], reps(6), SO)],
        "16": [v("Pompes piquées en L, pause", "Mains au sol, monter les pieds nus sur le mur jusqu'à former un L, descendre le crâne à 3 cm du tapis, tenir 2 s, pousser, sans poser la tête, s'arrêter avant que les bras tremblent, redescendre en marchant.", ["mur", "tapis"], reps(5), SO),
               v("Corps en L, une jambe levée", "Mains au sol, monter les pieds sur le mur jusqu'à former un L, lever une jambe vers le plafond et tenir, bras tendus, pousser le sol, puis changer de jambe.", ["mur", "tapis"], sec(10), SO_U)],
        "17": [v("Poirier au mur, montée partielle", "Départ en planche, pieds contre le mur : marcher les pieds au mur et les mains jusqu'à 60 cm du mur, ventre face au mur, tenir, redescendre en marchant les mains vers l'avant.", ["mur", "tapis"], sec(10), SO_SCD),
               v("Pompes piquées en L, vives", "Mains au sol, monter les pieds nus sur le mur jusqu'à former un L, descendre en 2 s, pousser le plus vite possible sans décoller les mains, sans poser la tête, s'arrêter avant que les bras tremblent.", ["mur", "tapis"], reps(5), SO),
               v("Corps en L au mur, tenu long", "Mains au sol, monter les pieds nus sur le mur jusqu'à former un L, buste vertical, bras tendus, pousser le sol, respirer calmement, redescendre en marchant avant que les bras tremblent.", ["mur", "tapis"], sec(30), SO)],
        "18": [v("Poirier au mur", "Départ en planche, pieds contre le mur : marcher les pieds en haut du mur et les mains jusqu'à 30 cm du mur, ventre face au mur, tenir, redescendre de même, sans sauter.", ["mur", "tapis"], sec(15), SO_SCD),
               v("Pompes piquées en L, tempo 4 s", "Mains au sol, monter les pieds nus sur le mur jusqu'à former un L, descendre en 4 s le crâne près du tapis, pousser en 1 s, sans poser la tête, nuque relâchée, s'arrêter avant que les bras tremblent.", ["mur", "tapis"], reps(5), SO)],
        "19": [v("Poirier au mur, épaules qui poussent", "Monter en marchant les pieds sur le mur, sans élan, ventre face au mur, mains à 30 cm : pousser le sol pour grandir, relâcher de 2 cm sans plier les coudes, redescendre en marchant les mains avant que les bras tremblent.", ["mur", "tapis"], reps(6), SO_SCD),
               v("Poirier au mur, tenue longue", "Monter en marchant les pieds sur le mur, sans élan, ventre face au mur, mains à 30 cm, corps gainé, respirer calmement, redescendre en marchant les mains vers l'avant dès que les bras tremblent.", ["mur", "tapis"], sec(20), SO_SCD),
               v("Pompes piquées en L, une jambe levée", "Mains au sol, monter les pieds sur le mur jusqu'à former un L, lever une jambe vers le plafond, descendre le crâne près du tapis en 2 s, pousser, puis changer de jambe, s'arrêter avant que les bras tremblent.", ["mur", "tapis"], reps(4), SO_U)],
        "20": [v("Poirier au mur, demi-pompe", "Monter en marchant les pieds sur le mur, sans élan, ventre face au mur, mains à 30 cm : plier les coudes de 5 cm seulement, pousser, sans poser la tête, redescendre en marchant les mains avant que les bras tremblent.", ["mur", "tapis"], reps(4), SO_SCD),
               v("Poirier au mur, endurance", "Monter en marchant les pieds sur le mur, sans élan, ventre face au mur, mains à 30 cm, corps gainé, respirer calmement, redescendre en marchant les mains vers l'avant avant que les bras tremblent.", ["mur", "tapis"], sec(30), SO_SCD),
               v("Pompes piquées en L, série", "Mains au sol, monter les pieds nus sur le mur jusqu'à former un L, enchaîner à rythme régulier, crâne près du tapis, sans poser la tête, s'arrêter dès que les épaules fatiguent.", ["mur", "tapis"], sec(30), SO)]
      }
    },
    {
      // Sans barre ni anneaux, le tirage devient un travail des omoplates :
      // dos au mur, coudes qui poussent le tapis, T, W, Y et superman à plat
      // ventre, glissements au mur, puis buste penché. Bras tendus devant ou
      // au-dessus de la tête (Y, nage, glissements) : sans_overhead.
      id: "dos_omoplates", nom: "Dos et omoplates", famille: "membre_superieur",
      niveaux: {
        "1": [v("Omoplates serrées dos au mur", "Debout dos au mur, coudes pliés à 90° le long du corps, pousser les coudes vers le mur en serrant les omoplates, tenir 5 s, épaules basses, effort modéré.", ["mur"], reps(10)),
              v("Coudes qui poussent le tapis", "Allongé sur le dos, genoux pliés, coudes pliés le long du corps, pousser les coudes dans le tapis en serrant les omoplates, tenir 5 s, nuque relâchée.", ["tapis"], reps(10))],
        "2": [v("W dos au mur, tenu", "Dos au mur, bras en W, coudes pliés sous la hauteur d'épaules, pousser les coudes contre le mur, omoplates serrées, épaules basses, effort modéré, environ 6 sur 10.", ["mur"], sec(20)),
              v("Poitrine levée sur les coudes", "Allongé sur le dos, genoux pliés, pousser les coudes dans le tapis pour soulever la poitrine de 2 cm, fesses au sol, tenir 3 s, redescendre doucement.", ["tapis"], reps(8))],
        "3": [v("Rowing à plat ventre", "Allongé sur le ventre, front sur le tapis, coudes pliés, mains près des côtes, lever les coudes vers le plafond en serrant les omoplates, tenir 2 s.", ["tapis"], reps(10)),
              v("Poitrine levée sur les coudes, tenue", "Allongé sur le dos, genoux pliés, pousser les coudes dans le tapis pour soulever la poitrine de 2 cm, fesses au sol, tenir, nuque relâchée, effort modéré.", ["tapis"], sec(15)),
              v("Omoplates serrées dos au mur, tenue", "Debout dos au mur, coudes pliés à 90° le long du corps, pousser les coudes vers le mur et tenir, omoplates serrées, épaules basses, respirer calmement.", ["mur"], sec(20))],
        "4": [v("T à plat ventre", "Allongé sur le ventre, front sur le tapis, bras tendus sur les côtés, pouces vers le plafond, lever les bras de quelques centimètres, tenir 2 s, épaules basses.", ["tapis"], reps(8)),
              v("W à plat ventre", "Allongé sur le ventre, front sur le tapis, bras en W, coudes pliés sous la hauteur d'épaules, lever coudes et mains de quelques centimètres, tenir 2 s.", ["tapis"], reps(8))],
        "5": [v("T et W à plat ventre", "Front sur le tapis, enchaîner un T bras tendus sur les côtés puis un W coudes pliés, lever les bras de quelques centimètres, tenir 2 s, nuque relâchée.", ["tapis"], reps(6)),
              v("Rowing à plat ventre, tenu", "Allongé sur le ventre, front sur le tapis, coudes pliés près des côtes, lever les coudes vers le plafond et tenir, omoplates serrées, effort modéré.", ["tapis"], sec(20)),
              v("Anges inversés jusqu'aux épaules", "Allongé sur le ventre, front sur le tapis, bras levés de quelques centimètres, glisser les mains des hanches jusqu'à hauteur d'épaules, revenir lentement.", ["tapis"], reps(8))],
        "6": [v("T à plat ventre, tenu", "Front sur le tapis, bras tendus en T, pouces vers le plafond, lever les bras de quelques centimètres et tenir 5 s, omoplates serrées, épaules basses.", ["tapis"], reps(8)),
              v("Y à plat ventre", "Allongé sur le ventre, front sur le tapis, bras tendus devant en Y, pouces vers le plafond, lever les bras de quelques centimètres, tenir 2 s, épaules basses.", ["tapis"], reps(8), SO),
              v("Poitrine levée sur les coudes, tempo", "Allongé sur le dos, genoux pliés, pousser les coudes pour soulever la poitrine en 1 s, tenir 3 s, redescendre en 3 s, fesses au sol, nuque relâchée.", ["tapis"], reps(8))],
        "7": [v("Superman bras en W", "Allongé sur le ventre, bras en W, lever la poitrine et les bras de quelques centimètres, omoplates serrées, regard vers le tapis, tenir 3 s, sans forcer.", ["tapis"], reps(8)),
              v("Glissements au mur", "Dos au mur, bras en W, coudes et mains au contact du mur, glisser les bras vers le haut en 3 s sans cambrer, redescendre jusqu'aux coudes sous les épaules.", ["mur"], reps(8), SO),
              v("W à plat ventre, tenu", "Front sur le tapis, bras en W, lever coudes et mains de quelques centimètres et tenir, omoplates serrées, épaules basses, respirer calmement.", ["tapis"], sec(20))],
        "8": [v("Y et T à plat ventre", "Front sur le tapis, enchaîner un Y bras tendus devant puis un T bras sur les côtés, lever les bras de quelques centimètres, tenir 2 s, épaules basses.", ["tapis"], reps(6), SO),
              v("Rowing à plat ventre tempo", "Allongé sur le ventre, coudes pliés près des côtes, lever les coudes en 1 s, tenir 2 s omoplates serrées, redescendre en 3 s, front sur le tapis.", ["tapis"], reps(10)),
              v("Pont sur les coudes", "Allongé sur le dos, genoux pliés, coudes au sol le long du corps, pousser les coudes pour soulever le haut du dos puis le bassin, tenir 3 s, redescendre.", ["tapis"], reps(8))],
        "9": [v("Superman bras en T", "Allongé sur le ventre, bras tendus en T, pouces vers le plafond, lever la poitrine et les bras de quelques centimètres, tenir 3 s, regard vers le tapis.", ["tapis"], reps(8)),
              v("Glissements au mur tempo", "Dos au mur, bras en W, coudes et mains au contact du mur, glisser vers le haut en 3 s, tenir 2 s, redescendre en 3 s, bas du dos contre le mur.", ["mur"], reps(8), SO),
              v("Nage à plat ventre, lente", "Front sur le tapis, bras tendus devant levés de quelques centimètres, les ramener en arc vers les hanches en pliant les coudes, puis revenir, en 4 s.", ["tapis"], reps(6), SO)],
        "10": [v("Superman bras en W, tenu", "Allongé sur le ventre, bras en W, lever la poitrine et les bras de quelques centimètres, omoplates serrées, regard vers le tapis, respirer calmement.", ["tapis"], sec(20)),
               v("Nage à plat ventre", "Front sur le tapis, bras levés de quelques centimètres, les faire passer de devant la tête jusqu'aux hanches en arc, puis revenir, sans toucher le tapis.", ["tapis"], reps(8), SO),
               v("Pont sur les coudes, tenu", "Allongé sur le dos, genoux pliés, pousser les coudes dans le tapis pour soulever le haut du dos et le bassin, tenir, omoplates serrées, nuque relâchée.", ["tapis"], sec(20))],
        "11": [v("Superman, rowing des coudes", "À plat ventre, poitrine levée, bras en T, tirer les coudes vers les côtes en serrant les omoplates, tendre à nouveau les bras en T, sans poser la poitrine.", ["tapis"], reps(8)),
               v("Superman, tirage vers le bas", "À plat ventre, poitrine et bras levés, bras tendus devant en Y, tirer les coudes vers les côtes comme pour une traction, revenir en Y sans poser les bras.", ["tapis"], reps(8), SO),
               v("T à plat ventre, tempo", "Front sur le tapis, bras tendus en T, pouces vers le plafond, lever les bras en 1 s, tenir 3 s, redescendre en 3 s, épaules basses.", ["tapis"], reps(10))],
        "12": [v("T à plat ventre, montée vive", "Front sur le tapis, bras tendus en T, pouces vers le plafond, lever les bras vivement, redescendre en 2 s, épaules basses, sans élan du buste.", ["tapis"], reps(12)),
               v("Glissements au mur, mains en avant", "Dos au mur, glisser les bras vers le haut, en haut écarter les mains du mur de 2 cm et tenir 2 s, redescendre, bas du dos contre le mur.", ["mur"], reps(8), SO),
               v("Pont sur les coudes, un pied levé", "Allongé sur le dos, genoux pliés, monter en pont sur les coudes, lever un pied de 10 cm et tenir, bassin horizontal, omoplates serrées, puis changer.", ["tapis"], sec(15), U)],
        "13": [v("Y-T-W à plat ventre", "Front sur le tapis, enchaîner un Y, un T puis un W, bras levés de quelques centimètres, tenir 2 s dans chaque position, épaules basses.", ["tapis"], reps(5), SO),
               v("Superman, rowing des coudes tempo", "À plat ventre, poitrine levée, bras en T, tirer les coudes vers les côtes en 1 s, tenir 2 s omoplates serrées, tendre les bras en 2 s, regard vers le tapis.", ["tapis"], reps(8)),
               v("Nage à plat ventre, rythmée", "Front sur le tapis, bras levés, enchaîner les passages de devant la tête jusqu'aux hanches à rythme régulier, sans toucher le tapis, nuque relâchée.", ["tapis"], sec(30), SO)],
        "14": [v("Superman bras en T, tenu long", "Allongé sur le ventre, bras tendus en T, poitrine et bras levés de quelques centimètres, regard vers le tapis, respirer, arrêter si le bas du dos tire.", ["tapis"], sec(30)),
               v("W à plat ventre, montée vive", "Front sur le tapis, bras en W, lever coudes et mains vivement, tenir 1 s, redescendre en 2 s, omoplates serrées, sans élan du buste.", ["tapis"], reps(12)),
               v("Buste penché, T", "Debout, genoux souples, buste penché à 45°, dos plat, ouvrir les bras tendus en T jusqu'à hauteur d'épaules, tenir 2 s, redescendre en 2 s.", ["aucun"], reps(10))],
        "15": [v("Y à plat ventre, tenu", "Front sur le tapis, bras tendus devant en Y, pouces vers le plafond, lever les bras de quelques centimètres et tenir, épaules basses, respirer calmement.", ["tapis"], sec(25), SO),
               v("Buste penché, T et W", "Debout, genoux souples, buste penché à 45°, dos plat, enchaîner un T bras tendus et un W coudes pliés, omoplates serrées, tenir 2 s chacun.", ["aucun"], reps(8)),
               v("Superman, rowing des coudes rythmé", "À plat ventre, poitrine levée, bras en T, tirer les coudes vers les côtes et tendre les bras à rythme régulier, sans poser la poitrine, regard vers le tapis.", ["tapis"], sec(20))],
        "16": [v("Buste penché, T rapides", "Debout, genoux souples, buste penché à 45°, dos plat, ouvrir les bras en T jusqu'à hauteur d'épaules à rythme vif, freiner le retour, sans élan du buste.", ["aucun"], sec(20)),
               v("Pont sur les coudes, pied levé long", "Allongé sur le dos, genoux pliés, en pont sur les coudes, un pied levé de 10 cm, bassin horizontal, omoplates serrées, tenir, puis changer de pied.", ["tapis"], sec(20), U),
               v("Y-T-W à plat ventre, tenus", "Front sur le tapis, bras levés de quelques centimètres, tenir 5 s en Y, puis en T, puis en W, sans poser les bras, épaules basses.", ["tapis"], reps(4), SO)],
        "17": [v("Enchaînement des omoplates", "À plat ventre, front sur le tapis, enchaîner 4 T, 4 W et 4 rowings des coudes sans poser les bras, épaules basses, recommencer jusqu'à la fin du temps.", ["tapis"], sec(30)),
               v("Buste penché, Y rapides", "Debout, genoux souples, buste penché à 45°, dos plat, monter les bras tendus en Y dans le prolongement du buste à rythme vif, freiner le retour.", ["aucun"], sec(20), SO),
               v("Superman bras en T, battements", "Allongé sur le ventre, poitrine et bras levés en T, faire de petits battements des bras de haut en bas à rythme vif, regard vers le tapis.", ["tapis"], sec(20))],
        "18": [v("Superman, tirage vers le bas rythmé", "À plat ventre, poitrine et bras levés, bras tendus devant en Y, tirer les coudes vers les côtes puis revenir en Y à rythme régulier, sans poser les bras.", ["tapis"], sec(30), SO),
               v("Buste penché, T et W rapides", "Debout, genoux souples, buste penché à 45°, dos plat, enchaîner T et W à rythme vif, omoplates serrées, freiner chaque retour, sans élan du buste.", ["aucun"], sec(30)),
               v("Pont sur les coudes, pied levé, tempo", "Allongé sur le dos, un pied levé, descendre le bassin près du tapis en 3 s puis remonter en poussant les coudes, omoplates serrées, puis changer.", ["tapis"], reps(6), U)],
        "19": [v("Y-T-W enchaînés, série longue", "Front sur le tapis, bras levés de quelques centimètres, enchaîner Y, T et W à rythme régulier sans poser les bras, épaules basses, nuque relâchée.", ["tapis"], sec(40), SO),
               v("Superman bras en W, endurance", "Allongé sur le ventre, bras en W, poitrine et bras levés de quelques centimètres, omoplates serrées, respirer, arrêter si le bas du dos tire.", ["tapis"], sec(40)),
               v("Enchaînement des omoplates, long", "À plat ventre, front sur le tapis, enchaîner 4 T, 4 W et 4 rowings des coudes sans poser les bras, épaules basses, recommencer jusqu'à la fin du temps.", ["tapis"], sec(45))],
        "20": [v("Superman bras en T, endurance", "Allongé sur le ventre, bras tendus en T, poitrine et bras levés de quelques centimètres, regard vers le tapis, respirer, arrêter si le bas du dos tire.", ["tapis"], sec(45)),
               v("Buste penché, enchaînement vif", "Debout, genoux souples, buste penché à 45°, dos plat, enchaîner T, W et rowings des coudes à rythme vif, freiner chaque retour, sans élan du buste.", ["aucun"], sec(40)),
               v("Nage à plat ventre, endurance", "Front sur le tapis, bras levés, enchaîner les passages de devant la tête jusqu'aux hanches à rythme régulier, sans toucher le tapis, nuque relâchée.", ["tapis"], sec(45), SO)]
      }
    },
    {
      // Coiffe des rotateurs et omoplate, sans charge : rotation externe
      // isométrique au mur, allongé sur le côté (poids de l'avant-bras) ou
      // résistée par l'autre main, puis pompes scapulaires du mur au sol,
      // planche et ours avec protraction, pompe plus. Coude collé au corps
      // dans les rotations, sauf la rotation à 90° dos au mur (coude à hauteur
      // d'épaule, main vers le plafond), déclarée sans_overhead : c'est la
      // position d'appréhension de l'épaule instable. Aucun impact.
      id: "coiffe_scapula", nom: "Coiffe et scapula", famille: "membre_superieur",
      niveaux: {
        "1": [v("Rotation externe isométrique au mur", "De profil au mur, bras qui travaille côté mur, coude collé au corps plié à 90°, dos du poignet contre le mur, pousser vers l'extérieur 5 s sans bouger, effort modéré, environ 5 sur 10.", ["mur"], reps(8), U),
              v("Rotation interne contre sa main", "Coude collé au corps plié à 90°, paume vers le ventre, l'autre main contre la paume : pousser vers le ventre 5 s, l'autre main résiste, sans bouger, effort modéré, environ 5 sur 10.", ["aucun"], reps(8), U)],
        "2": [v("Pompes scapulaires au mur", "Face au mur, bras tendus, mains à hauteur d'épaules, laisser la poitrine avancer en rapprochant les omoplates, puis repousser le mur en les écartant, coudes tendus.", ["mur"], reps(10)),
              v("Rotation externe allongé sur le côté", "Allongé sur le côté, coude du dessus collé au corps plié à 90°, main sur le ventre, tourner l'épaule pour lever la main vers le plafond en 2 s, redescendre en 3 s.", ["tapis"], reps(10), U),
              v("Rotation externe au mur, tenue", "De profil au mur, coude collé au corps plié à 90°, dos du poignet contre le mur, pousser vers l'extérieur et tenir, épaule basse, effort modéré, environ 5 sur 10.", ["mur"], sec(15), U)],
        "3": [v("Pompes scapulaires au mur, tempo", "Bras tendus, mains au mur à hauteur d'épaules, rapprocher les omoplates en 2 s, puis repousser le mur pour les écarter en 2 s et tenir 2 s, coudes tendus.", ["mur"], reps(10)),
              v("Rotation externe sur le côté, pause", "Allongé sur le côté, coude du dessus collé au corps plié à 90°, lever la main vers le plafond, tenir 2 s en haut, redescendre en 3 s, sans rouler le buste en arrière.", ["tapis"], reps(10), U),
              v("Rotations isométriques contre sa main", "Coude collé au corps plié à 90°, l'autre main résiste : pousser 5 s vers l'extérieur, puis 5 s vers le ventre, sans bouger, effort modéré, environ 6 sur 10.", ["aucun"], reps(6), U)],
        "4": [v("Pompes scapulaires sur les genoux", "Genoux sur le tapis, mains sous les épaules, bras tendus, laisser la poitrine descendre entre les omoplates, puis pousser le sol pour les écarter, coudes tendus.", ["tapis"], reps(10), SGS),
              v("Pompes scapulaires au mur, pieds reculés", "Pieds nus reculés de deux grands pas, mains au mur à hauteur d'épaules, bras tendus, rapprocher puis écarter les omoplates, corps aligné des talons à la tête, arrêter si les pieds glissent.", ["mur"], reps(12)),
              v("Rotation externe sur le côté, tempo", "Allongé sur le côté, coude du dessus collé au corps plié à 90°, lever la main en 2 s, tenir 1 s, redescendre en 4 s, épaule loin de l'oreille.", ["tapis"], reps(12), U)],
        "5": [v("Pompes scapulaires au sol", "En planche bras tendus, mains sous les épaules, laisser la poitrine descendre entre les omoplates, puis pousser le sol pour les écarter, corps aligné, coudes tendus.", ["tapis"], reps(8)),
              v("Rotation externe contre sa main", "Coude collé au corps plié à 90°, l'autre main sur le dos du poignet freine l'avant-bras qui s'ouvre vers l'extérieur en 3 s, revenir, effort modéré, environ 6 sur 10.", ["aucun"], reps(8), U),
              v("Rotation externe au mur, tenue longue", "De profil au mur, coude collé au corps plié à 90°, dos du poignet contre le mur, pousser vers l'extérieur et tenir, épaule basse, effort modéré, environ 6 sur 10.", ["mur"], sec(30), U)],
        "6": [v("Planche sur les avant-bras, protraction", "Sur les avant-bras, coudes sous les épaules, corps aligné, pousser le tapis pour écarter les omoplates et arrondir le haut du dos, tenir 3 s, relâcher, sans creuser.", ["tapis"], reps(8)),
              v("Pompes scapulaires au sol, tempo", "En planche bras tendus, laisser la poitrine descendre entre les omoplates en 2 s, puis pousser le sol pour les écarter en 2 s et tenir 2 s, corps aligné.", ["tapis"], reps(8)),
              v("Rotation externe sur le côté, tenue", "Allongé sur le côté, coude du dessus collé au corps plié à 90°, lever la main à mi-course et tenir, épaule basse, respirer calmement, sans rouler le buste.", ["tapis"], sec(30), U)],
        "7": [v("Rotation externe excentrique", "Coude collé au corps plié à 90°, avant-bras ouvert vers l'extérieur, l'autre main le pousse vers le ventre en 4 s pendant que le bras résiste, effort modéré.", ["aucun"], reps(8), U),
              v("Planche avant-bras, protraction tenue", "Sur les avant-bras, coudes sous les épaules, pousser le tapis pour écarter les omoplates et tenir, corps aligné, respirer calmement, sans creuser le bas du dos.", ["tapis"], sec(20)),
              v("Pompes scapulaires au sol, pause", "En planche bras tendus, omoplates rapprochées, tenir 2 s, puis pousser le sol pour les écarter et tenir 2 s, corps aligné, coudes tendus.", ["tapis"], reps(8))],
        "8": [v("Planche avec protraction", "En planche bras tendus, mains sous les épaules, pousser le sol pour écarter les omoplates et arrondir le haut du dos, tenir 3 s, relâcher, corps aligné.", ["tapis"], reps(8)),
              v("Rotations résistées par sa main", "Coude collé au corps plié à 90°, l'autre main résiste dans les deux sens : ouvrir l'avant-bras vers l'extérieur en 3 s, le ramener vers le ventre en 3 s, effort modéré.", ["aucun"], reps(8), U),
              v("Rotation externe sur le côté, série", "Allongé sur le côté, coude du dessus collé au corps plié à 90°, lever et redescendre la main à rythme régulier, 2 s dans chaque sens, sans rouler le buste.", ["tapis"], reps(15), U)],
        "9": [v("Pompe plus", "Faire une pompe, coudes à 45° du buste, puis en haut, bras tendus, pousser encore le sol pour écarter les omoplates, tenir 2 s, corps aligné.", ["tapis"], reps(6)),
              v("Planche latérale, rotation externe", "Planche latérale sur l'avant-bras, coude du dessus collé au corps plié à 90°, main sur le ventre, lever la main vers le plafond en 2 s, redescendre, bassin haut.", ["tapis"], reps(8), U),
              v("Planche avec protraction, tempo", "En planche bras tendus, pousser le sol pour écarter les omoplates en 2 s, tenir 2 s, revenir en 2 s sans laisser la poitrine tomber, corps aligné.", ["tapis"], reps(8))],
        "10": [v("Pompe plus, tempo", "Descendre en 3 s, pousser jusqu'aux bras tendus, puis pousser encore le sol pour écarter les omoplates, tenir 2 s, corps aligné, coudes à 45° du buste.", ["tapis"], reps(6)),
               v("Planche avec protraction, tenue", "En planche bras tendus, pousser le sol pour écarter les omoplates et tenir, corps aligné, épaules loin des oreilles, respirer calmement, sans creuser.", ["tapis"], sec(30)),
               v("Rotation externe excentrique, lente", "Coude collé au corps plié à 90°, avant-bras ouvert vers l'extérieur, l'autre main le pousse vers le ventre en 6 s, le bras résiste tout du long, effort modéré.", ["aucun"], reps(8), U)],
        "11": [v("Ours avec protraction", "En position de l'ours, genoux à 3 cm du tapis, pousser le sol pour écarter les omoplates, tenir 3 s, relâcher, dos plat, bassin immobile, regard vers le sol.", ["tapis"], reps(8)),
               v("Planche latérale, rotation externe lente", "Planche latérale sur l'avant-bras, coude du dessus collé au corps plié à 90°, lever la main en 2 s, tenir 2 s, redescendre en 3 s, bassin haut.", ["tapis"], reps(8), U),
               v("Rotation externe à 90° dos au mur", "Dos au mur, coudes écartés à hauteur d'épaules et pliés à 90°, mains vers le plafond, pousser les avant-bras vers le mur 5 s, effort modéré, sans cambrer, arrêter si l'épaule pince ou semble se déboîter.", ["mur"], reps(8), SO)],
        "12": [v("Rotation externe sur le côté, vive", "Allongé sur le côté, coude du dessus collé au corps plié à 90°, lever la main vivement, freiner la descente en 3 s, sans rouler le buste en arrière.", ["tapis"], reps(12), U),
               v("Stabilisations avec sa main", "Coude collé au corps plié à 90°, avant-bras devant soi, l'autre main donne de petites poussées dans tous les sens, l'avant-bras ne bouge pas, effort modéré.", ["aucun"], sec(20), U),
               v("Pompe plus, pause en haut", "Faire une pompe, puis bras tendus, pousser encore le sol pour écarter les omoplates, tenir 3 s, revenir sans laisser la poitrine tomber, corps aligné.", ["tapis"], reps(8))],
        "13": [v("Pompes scapulaires pieds au mur", "Pieds nus posés au mur à hauteur de genoux, mains sous les épaules, bras tendus, laisser la poitrine descendre entre les omoplates, puis pousser le sol pour les écarter, arrêter si les pieds glissent.", ["mur", "tapis"], reps(8)),
               v("Rotation externe à 90°, dynamique", "Dos au mur, coude à hauteur d'épaule plié à 90°, main vers le plafond, basculer la main vers l'avant jusqu'à l'horizontale en 2 s, revenir vers le mur, coude immobile, arrêter si l'épaule pince ou semble se déboîter.", ["mur"], reps(10), SO_U),
               v("Planche latérale, protraction", "Planche latérale sur la main, bras tendu sous l'épaule, pousser le sol pour éloigner le buste de la main, tenir 2 s, relâcher de 2 cm, bassin haut.", ["tapis"], reps(8), U)],
        "14": [v("Planche avec protraction, main levée", "En planche bras tendus, pieds écartés, lever une main de 2 cm, pousser le sol avec l'autre pour écarter les omoplates, tenir 3 s, alterner, bassin immobile.", ["tapis"], reps(6), U),
               v("Rotation externe à 90°, tempo", "Dos au mur, coude à hauteur d'épaule plié à 90°, basculer la main vers l'avant en 3 s, tenir 1 s à l'horizontale, revenir vers le mur en 2 s, coude immobile, arrêter si l'épaule pince ou semble se déboîter.", ["mur"], reps(10), SO_U),
               v("Planche latérale, rotation externe vive", "Planche latérale sur l'avant-bras, coude du dessus collé au corps plié à 90°, lever la main vivement, freiner la descente en 3 s, bassin haut et immobile.", ["tapis"], reps(10), U)],
        "15": [v("Pompe plus, pieds au mur", "Pieds nus posés au mur à hauteur de genoux, faire une pompe, puis bras tendus, pousser encore le sol pour écarter les omoplates, tenir 2 s, corps aligné, arrêter si les pieds glissent.", ["mur", "tapis"], reps(6)),
               v("Planche latérale, protraction tenue", "Planche latérale sur la main, bras tendu sous l'épaule, pousser le sol pour éloigner le buste de la main et tenir, bassin haut, respirer calmement.", ["tapis"], sec(20), U),
               v("Stabilisations avec sa main, vives", "Coude collé au corps plié à 90°, l'autre main donne de petites poussées vives et irrégulières dans tous les sens, l'avant-bras reste immobile, effort modéré.", ["aucun"], sec(30), U)],
        "16": [v("Ours avec protraction, main levée", "En position de l'ours, genoux à 3 cm du tapis, lever une main, pousser le sol avec l'autre pour écarter les omoplates, tenir 3 s, alterner, bassin immobile.", ["tapis"], reps(6), U),
               v("Rotation externe à 90°, freinage", "Dos au mur, coude à hauteur d'épaule plié à 90°, main vers le plafond, ramener la main vers l'avant en la freinant, en 2 s, avant l'horizontale, remonter, coude immobile, arrêter si l'épaule pince ou semble se déboîter.", ["mur"], reps(10), SO_U),
               v("Rotations sur le côté, série vive", "Allongé sur le côté, coude du dessus collé au corps plié à 90°, lever la main vivement et freiner la descente à rythme régulier, sans rouler le buste.", ["tapis"], sec(30), U)],
        "17": [v("Pompe plus, montée vive", "Descendre en 2 s, pousser le plus vite possible sans décoller les mains, puis bras tendus, pousser encore le sol pour écarter les omoplates, corps aligné.", ["tapis"], reps(8)),
               v("Rotation externe à 90°, rapide", "Dos au mur, coude à hauteur d'épaule plié à 90°, basculer la main vers l'avant puis la ramener près du mur à rythme vif, sans taper le mur, coude immobile, arrêter si l'épaule pince ou semble se déboîter.", ["mur"], sec(20), SO_U),
               v("Stabilisations avec sa main, yeux fermés", "Debout à portée du mur, pieds écartés, yeux fermés, coude collé au corps plié à 90°, l'autre main donne de petites poussées irrégulières, l'avant-bras reste immobile.", ["aucun"], sec(30), U)],
        "18": [v("Ours avec protraction, main levée tenue", "En position de l'ours, genoux à 3 cm du tapis, lever une main et tenir 5 s en poussant le sol avec l'autre, omoplates écartées, alterner, bassin immobile.", ["tapis"], reps(5), U),
               v("Pompes scapulaires pieds au mur, tempo", "Pieds nus au mur à hauteur de genoux, bras tendus, laisser la poitrine descendre entre les omoplates en 2 s, pousser le sol pour les écarter en 2 s, tenir 2 s, arrêter si les pieds glissent.", ["mur", "tapis"], reps(8)),
               v("Rotations sur le côté, endurance", "Allongé sur le côté, coude du dessus collé au corps plié à 90°, lever et redescendre la main à rythme régulier, sans rouler le buste, arrêter dès que le geste raccourcit.", ["tapis"], sec(45), U)],
        "19": [v("Planche latérale, rotation externe tenue", "Planche latérale sur la main, bras d'appui tendu, coude du dessus collé au corps, main du dessus levée vers le plafond et tenue, bassin haut, respirer calmement.", ["tapis"], sec(20), U),
               v("Rotation externe à 90°, endurance", "Dos au mur, coude à hauteur d'épaule plié à 90°, basculer la main vers l'avant puis la ramener près du mur à rythme régulier, coude immobile, épaule basse, arrêter si l'épaule pince ou semble se déboîter.", ["mur"], sec(40), SO_U),
               v("Enchaînement coiffe et omoplates", "Enchaîner sans pause 6 pompes scapulaires, 4 pompes plus et 10 s de planche avec protraction, corps aligné, ralentir dès que les omoplates ressortent.", ["tapis"], sec(40))],
        "20": [v("Pompes plus vives, série", "Enchaîner les pompes plus à rythme vif sans décoller les mains, omoplates écartées en haut de chaque pompe, corps aligné, arrêter dès que le bassin s'affaisse.", ["tapis"], sec(30)),
               v("Ours avec protraction, rythme vif", "En position de l'ours, genoux bas, lever une main puis l'autre à rythme vif en poussant le sol avec la main d'appui, omoplates écartées, bassin immobile.", ["tapis"], sec(30)),
               v("Enchaînement coiffe et omoplates, long", "Enchaîner sans pause 6 pompes scapulaires, 4 pompes plus et 15 s de planche avec protraction, recommencer, ralentir dès que les omoplates ressortent.", ["tapis"], sec(50))]
      }
    },
    {
      // Remplace les passes au médecine-ball. 1-11 : pompes vives, mains
      // toujours au contact (mur, genoux, sol), descente lente en reprise.
      // 12+ : mains qui quittent le mur puis le sol (sans_saut), réception
      // souple coudes fléchis ; pompes claquées dès 17. Une variante sans
      // impact, mains au contact du sol, reste à chaque niveau.
      id: "poussee_explosive", nom: "Poussée explosive", famille: "membre_superieur",
      niveaux: {
        "1": [v("Pompes au mur, poussée vive", "Mains au mur à hauteur d'épaules, un grand pas en arrière, descendre la poitrine vers le mur en 3 s, pousser vivement sans décoller les mains, corps aligné.", ["mur"], reps(8)),
              v("Pompe au mur, départ arrêté", "Mains au mur à hauteur d'épaules, coudes pliés à mi-course, tenir 2 s, pousser vivement jusqu'aux bras tendus sans décoller les mains, revenir en 3 s.", ["mur"], reps(6))],
        "2": [v("Pompes au mur vives, pieds reculés", "Pieds nus à deux grands pas du mur, sur un sol non glissant, descendre la poitrine en 3 s, pousser vivement jusqu'aux bras tendus sans décoller les mains, corps aligné, effort modéré.", ["mur"], reps(8)),
              v("Pompes au mur, pause et poussée vive", "Mains au mur, descendre en 3 s, tenir 2 s poitrine près du mur, pousser vivement jusqu'aux bras tendus sans décoller les mains, corps aligné, épaules basses.", ["mur"], reps(8))],
        "3": [v("Pompes sur les genoux, poussée vive", "Genoux sur le tapis, descendre la poitrine à mi-hauteur en 3 s, pousser vivement sans décoller les mains, corps aligné des genoux à la tête, effort modéré.", ["tapis"], reps(8), SGS),
              v("Pompe au mur, départ arrêté, loin", "Pieds nus à deux grands pas du mur, sur un sol non glissant, coudes pliés à mi-course, tenir 2 s, pousser vivement sans décoller les mains, revenir en 3 s, corps aligné.", ["mur"], reps(8))],
        "4": [v("Pompes sur les genoux vives", "Genoux sur le tapis, descendre la poitrine à 5 cm du tapis en 3 s, pousser vivement jusqu'aux bras tendus sans décoller les mains, corps aligné.", ["tapis"], reps(8), SGS),
              v("Pompes vives, descente de 10 cm", "En planche bras tendus, descendre de 10 cm en 3 s, pousser vivement sans décoller les mains, corps aligné des talons à la tête, effort modéré.", ["tapis"], reps(6)),
              v("Pompes au mur vives, en série", "Pieds nus à deux grands pas du mur, sur un sol non glissant, enchaîner descente en 3 s et poussée vive sans décoller les mains, corps aligné, effort modéré, environ 6 sur 10.", ["mur"], sec(20))],
        "5": [v("Pompes vives à mi-hauteur", "En planche bras tendus, descendre la poitrine à mi-hauteur en 3 s, pousser vivement sans décoller les mains, corps aligné, garder 2 répétitions en réserve.", ["tapis"], reps(6)),
              v("Pompes genoux, départ arrêté", "Genoux sur le tapis, descendre près du tapis en 3 s, tenir 2 s, pousser vivement sans décoller les mains, corps aligné des genoux à la tête.", ["tapis"], reps(8), SGS),
              v("Pompe vive à mi-hauteur, départ arrêté", "En planche bras tendus, descendre à mi-hauteur en 3 s, tenir 2 s, pousser vivement jusqu'aux bras tendus sans décoller les mains, corps aligné.", ["tapis"], reps(5))],
        "6": [v("Pompes départ arrêté", "Descendre la poitrine à 5 cm du tapis en 3 s, tenir 2 s sans relâcher, pousser vivement sans décoller les mains, corps aligné, garder 2 répétitions en réserve.", ["tapis"], reps(5)),
              v("Pompes vives sur les genoux, série", "Genoux sur le tapis, enchaîner à rythme vif, poitrine à 5 cm du tapis, sans décoller les mains, corps aligné des genoux à la tête, ralentir si le bassin tombe.", ["tapis"], sec(15), SGS),
              v("Pompes vives à mi-hauteur, série", "En planche bras tendus, enchaîner à rythme vif jusqu'à mi-hauteur, sans décoller les mains, corps aligné, s'arrêter dès que le bassin s'affaisse.", ["tapis"], sec(15))],
        "7": [v("Pompes vives", "Mains sous les épaules, descendre la poitrine à 5 cm du tapis en 2 s, pousser le plus vite possible sans décoller les mains, corps aligné, 2 répétitions en réserve.", ["tapis"], reps(6)),
              v("Pompes contrastées", "Faire 2 pompes lentes, descente en 3 s, puis 2 pompes vives sans décoller les mains : 1 répétition, corps aligné, bassin sans s'affaisser.", ["tapis"], reps(3))],
        "8": [v("Pompes rapides", "Enchaîner les pompes à rythme vif, poitrine à 10 cm du tapis, sans décoller les mains, corps aligné, s'arrêter dès que le bassin s'affaisse ou que le rythme baisse.", ["tapis"], sec(15)),
              v("Pompes départ arrêté, pause longue", "Descendre la poitrine à 3 cm du tapis, tenir 3 s sans relâcher, pousser le plus vite possible sans décoller les mains, corps aligné, coudes à 45° du buste.", ["tapis"], reps(5)),
              v("Pompes genoux rapides", "Genoux sur le tapis, enchaîner les pompes à rythme vif, poitrine à 5 cm du tapis, sans décoller les mains, corps aligné, s'arrêter dès que le rythme baisse.", ["tapis"], sec(25), SGS)],
        "9": [v("Pompes vives mains rapprochées", "Mains sous la poitrine, coudes qui frôlent le buste, descendre en 2 s, pousser le plus vite possible sans décoller les mains, corps aligné.", ["tapis"], reps(6)),
              v("Pompes rapides, série", "Enchaîner les pompes à rythme vif sur toute l'amplitude, sans décoller les mains, corps aligné, s'arrêter dès que le bassin s'affaisse ou que le rythme baisse.", ["tapis"], sec(20))],
        "10": [v("Pompes vives déclinées basses", "Pieds nus posés au mur à 30 cm du sol, descendre la poitrine en 2 s, pousser le plus vite possible sans décoller les mains, corps aligné, sans creuser, arrêter si les pieds glissent.", ["mur", "tapis"], reps(6)),
               v("Pompes vives, pause à mi-hauteur", "Descendre en 2 s jusqu'à mi-hauteur, tenir 2 s, finir la descente, puis pousser le plus vite possible sans décoller les mains, corps aligné.", ["tapis"], reps(5)),
               v("Pompes contrastées, série", "Faire 4 pompes lentes, descente en 3 s, puis 4 pompes vives sans décoller les mains, sans pause : 1 répétition, corps aligné, bassin sans s'affaisser.", ["tapis"], reps(2))],
        "11": [v("Pompes départ arrêté, déclinées", "Pieds nus posés au mur à hauteur de genoux, descendre la poitrine à 3 cm du tapis, tenir 2 s, pousser le plus vite possible sans décoller les mains, sans creuser, arrêter si les pieds glissent.", ["mur", "tapis"], reps(5)),
               v("Pompes rapides, série longue", "Enchaîner les pompes à rythme vif sur toute l'amplitude, sans décoller les mains, corps aligné, s'arrêter dès que le bassin s'affaisse ou que le rythme baisse.", ["tapis"], sec(25))],
        "12": [v("Pompes décollées au mur", "Pieds à un grand pas du mur, sur un sol non glissant, descendre en 2 s, pousser vivement pour que les mains quittent le mur, les reposer coudes souples, réception silencieuse, corps aligné.", ["mur"], reps(8), SS),
               v("Pompes rapides mains rapprochées", "Mains sous la poitrine, coudes qui frôlent le buste, enchaîner à rythme vif sans décoller les mains, corps aligné, s'arrêter dès que le rythme baisse.", ["tapis"], sec(15)),
               v("Pompes vives déclinées", "Pieds nus posés au mur à hauteur de genoux, descendre en 2 s, pousser le plus vite possible sans décoller les mains, corps aligné, sans creuser le dos, arrêter si les pieds glissent.", ["mur", "tapis"], reps(6))],
        "13": [v("Pompes décollées sur les genoux", "Genoux sur le tapis, descendre en 2 s, pousser vivement pour que les mains quittent le sol de 2 cm, réception souple coudes fléchis, mains sous les épaules.", ["tapis"], reps(6), SS_SGS),
               v("Pompes décollées au mur, pieds reculés", "Pieds nus à deux grands pas du mur, sur un sol non glissant, pousser vivement pour que les mains quittent le mur, les reposer coudes souples, sans à-coup, corps aligné.", ["mur"], reps(8), SS),
               v("Pompes départ arrêté, mains rapprochées", "Mains sous la poitrine, descendre à 3 cm du tapis, tenir 2 s, pousser le plus vite possible sans décoller les mains, coudes qui frôlent le buste.", ["tapis"], reps(5))],
        "14": [v("Pompes décollées", "Descendre la poitrine en 2 s, pousser vivement pour que les mains quittent le sol de 2 cm, réception souple coudes fléchis, corps aligné, sans à-coup dans les poignets.", ["tapis"], reps(5), SS),
               v("Pompes décollées au mur, enchaînées", "Pieds à deux grands pas du mur, sur un sol non glissant, enchaîner les poussées vives, mains qui quittent le mur puis reviennent coudes souples, réception silencieuse, corps aligné.", ["mur"], sec(20), SS),
               v("Pompes rapides déclinées", "Pieds nus posés au mur à hauteur de genoux, enchaîner à rythme vif sans décoller les mains, corps aligné, s'arrêter dès que le bassin s'affaisse ou que les pieds glissent.", ["mur", "tapis"], sec(20))],
        "15": [v("Pompes décollées, réception tenue", "Depuis la planche, descendre en 2 s, pousser vivement pour que les mains quittent le sol, réception souple coudes fléchis, tenir 2 s en bas à 3 cm du tapis sans le toucher, puis recommencer, corps aligné.", ["tapis"], reps(5), SS),
               v("Pompes décollées genoux, enchaînées", "Genoux sur le tapis, enchaîner les pompes décollées, réception souple coudes fléchis et repartir aussitôt, mains sous les épaules, corps aligné.", ["tapis"], reps(8), SS_SGS),
               v("Pompes contrastées déclinées", "Pieds nus au mur à hauteur de genoux, faire 2 pompes lentes, descente en 3 s, puis 2 pompes vives sans décoller les mains : 1 répétition, corps aligné, arrêter si les pieds glissent.", ["mur", "tapis"], reps(3))],
        "16": [v("Pompes décollées enchaînées", "Enchaîner les pompes décollées, réception souple coudes fléchis et repartir aussitôt, corps aligné, s'arrêter dès que la réception devient bruyante.", ["tapis"], reps(6), SS),
               v("Pompes décollées, écart des mains", "Pousser pour que les mains quittent le sol, les reposer d'une largeur de main plus écartées, puis à la suivante sous les épaules, réception souple coudes fléchis, corps aligné.", ["tapis"], reps(6), SS),
               v("Pompes vives déclinées hautes", "Pieds nus posés au mur à hauteur de hanches, descendre en 2 s, pousser le plus vite possible sans décoller les mains, corps aligné, sans creuser, arrêter si les pieds glissent.", ["mur", "tapis"], reps(5))],
        "17": [v("Pompes claquées", "Pousser vivement pour que les mains quittent le sol, frapper une fois dans les mains près de la poitrine, les reposer sous les épaules, réception souple coudes fléchis.", ["tapis"], reps(4), SS),
               v("Pompes décollées latérales", "Pousser pour que les mains quittent le sol et les reposer 20 cm plus à droite, réception souple, puis à la suivante revenir vers la gauche, corps aligné.", ["tapis"], reps(3), SS_U),
               v("Pompes rapides en endurance", "Enchaîner les pompes à rythme vif sans décoller les mains, corps aligné, ralentir sans s'arrêter si le rythme baisse, arrêter dès que le bassin s'affaisse.", ["tapis"], sec(30))],
        "18": [v("Pompes claquées, réception tenue", "Pousser vivement, frapper une fois dans les mains, les reposer sous les épaules, réception souple coudes fléchis, tenir 2 s à 3 cm du tapis, puis recommencer.", ["tapis"], reps(4), SS),
               v("Pompes décollées hautes", "Pousser vivement pour que les mains quittent le sol de 5 cm, réception souple coudes fléchis, mains sous les épaules, corps aligné.", ["tapis"], reps(5), SS),
               v("Pompes départ arrêté, déclinées hautes", "Pieds nus posés au mur à hauteur de hanches, poitrine à 3 cm du tapis, tenir 2 s, pousser le plus vite possible sans décoller les mains, sans creuser, arrêter si les pieds glissent.", ["mur", "tapis"], reps(5))],
        "19": [v("Pompes claquées enchaînées", "Enchaîner les pompes claquées, réception souple coudes fléchis et repartir aussitôt, corps aligné, s'arrêter dès que la réception devient bruyante.", ["tapis"], reps(5), SS),
               v("Pompes décollées latérales enchaînées", "Enchaîner les pompes décollées en reposant les mains 20 cm à droite, puis 20 cm à gauche, réception souple coudes fléchis, corps aligné, sans à-coup.", ["tapis"], reps(4), SS_U),
               v("Pompes contrastées, série longue", "Faire 3 pompes lentes, descente en 3 s, puis 5 pompes vives sans décoller les mains, sans pause : 1 répétition, corps aligné, bassin sans s'affaisser.", ["tapis"], reps(3))],
        "20": [v("Enchaînement explosif", "Enchaîner sans pause 4 pompes décollées, 2 pompes claquées et 4 pompes décollées latérales, réception souple coudes fléchis, arrêter si elle devient bruyante.", ["tapis"], reps(2), SS),
               v("Pompes claquées, série", "Enchaîner les pompes claquées à rythme régulier, réception souple coudes fléchis, mains sous les épaules, arrêter dès que la réception devient bruyante.", ["tapis"], reps(6), SS),
               v("Enchaînement de pompes vives", "Enchaîner sans pause 5 pompes vives, 5 pompes rapides mains rapprochées et 5 pompes départ arrêté, sans décoller les mains, corps aligné.", ["tapis"], sec(45))]
      }
    },
    {
      // Appuis sur les mains et transferts de poids : transferts au mur et
      // quadrupédie sur place (genoux au tapis, sans_genoux_sol) en reprise,
      // puis ours (genoux à 3 cm du tapis), crabe, transferts latéraux,
      // passage de l'ours au crabe, déplacements sur 4 m (deplacement) dès
      // 12 et petits sauts des pieds en ours (sans_saut) dès 16. Chaque
      // niveau garde une variante sur place, sans impact.
      id: "appuis_transferts", nom: "Appuis et transferts", famille: "membre_superieur",
      niveaux: {
        "1": [v("Transferts d'appui au mur", "Face au mur, mains à plat à hauteur d'épaules, un pas en arrière, porter le poids sur une main puis sur l'autre en 2 s, corps aligné, épaules basses.", ["mur"], reps(8), U),
              v("Quadrupédie, transferts de poids", "À quatre pattes sur le tapis, mains sous les épaules, porter lentement le poids vers l'avant au-dessus des mains, puis vers l'arrière, dos plat, doigts écartés.", ["tapis"], reps(10), SGS)],
        "2": [v("Quadrupédie, cercles du buste", "À quatre pattes sur le tapis, dessiner lentement un cercle avec le buste pour porter le poids sur chaque main tour à tour, dos plat, coudes tendus sans les verrouiller.", ["tapis"], reps(6), SGS),
              v("Transferts au mur, pieds reculés", "Pieds nus à deux grands pas du mur, mains à hauteur d'épaules, porter le poids sur une main puis sur l'autre en 2 s, corps aligné, bassin immobile, arrêter si les pieds glissent.", ["mur"], reps(8), U)],
        "3": [v("Quadrupédie sur place", "À quatre pattes sur le tapis, avancer une main et le genou opposé de 10 cm, puis les ramener, alterner, lentement, dos plat, sans bouger les autres appuis.", ["tapis"], reps(6), SGS_U),
              v("Crabe, bassin levé", "Assis, genoux pliés, mains derrière les hanches doigts vers les pieds, soulever les fesses de 5 cm, tenir 3 s, redescendre, épaules loin des oreilles.", ["tapis"], reps(8)),
              v("Transferts au mur, pause", "Pieds nus à deux grands pas du mur, porter le poids sur une main et tenir 3 s, l'autre main posée légèrement, puis changer, corps aligné, bassin immobile, arrêter si les pieds glissent.", ["mur"], reps(6), U)],
        "4": [v("Ours, transferts de poids", "Mains sous les épaules, genoux pliés sous les hanches à 3 cm du tapis, porter le poids vers les mains puis vers les pieds en 2 s, dos plat, effort modéré.", ["tapis"], reps(8)),
              v("Quadrupédie sur place, tempo", "À quatre pattes, avancer une main et le genou opposé de 10 cm en 2 s, tenir 1 s, les ramener en 2 s, alterner, dos plat, bassin immobile.", ["tapis"], reps(6), SGS_U),
              v("Crabe, bassin levé, tenu", "Assis, genoux pliés, mains derrière les hanches doigts vers les pieds, soulever les fesses de 5 cm et tenir, épaules basses, respirer, effort modéré.", ["tapis"], sec(15))],
        "5": [v("Ours, pas des mains sur place", "En position de l'ours, genoux à 3 cm du tapis, avancer une main de 10 cm puis l'autre, les ramener, dos plat, bassin immobile, regard vers le sol.", ["tapis"], reps(6)),
              v("Crabe, transferts de poids", "Assis, mains derrière les hanches doigts vers les pieds, fesses levées de 5 cm, porter le poids sur une main puis sur l'autre, lentement, épaules basses.", ["tapis"], reps(6), U),
              v("Quadrupédie, pas avant et arrière", "À quatre pattes, avancer main et genou opposés d'un petit pas, puis l'autre paire, reculer de même, sur place, dos plat, bassin immobile.", ["tapis"], reps(6), SGS)],
        "6": [v("Ours, pas avant et arrière", "En position de l'ours, genoux à 3 cm du tapis, avancer main et pied opposés d'un petit pas, puis l'autre paire, reculer de même, sur place, dos plat.", ["tapis"], reps(6)),
              v("Crabe haut, tenu", "Assis, mains derrière les hanches doigts vers les pieds, pieds à plat, monter le bassin à l'horizontale et tenir, épaules loin des oreilles, nuque relâchée.", ["tapis"], sec(15)),
              v("Ours, transferts de poids tenus", "En position de l'ours, genoux à 3 cm du tapis, porter le poids vers les mains et tenir 3 s, puis vers les pieds, dos plat, respirer calmement.", ["tapis"], reps(6))],
        "7": [v("Ours, transfert latéral", "En position de l'ours, genoux à 3 cm du tapis, décaler main et pied droits de 20 cm vers la droite, puis main et pied gauches, revenir de même, sur place.", ["tapis"], reps(4), U),
              v("Crabe, main et pied opposés", "En crabe, mains derrière les hanches, bassin levé, lever une main et le pied opposé de 3 cm, tenir 2 s, reposer, alterner, bassin haut, épaules basses.", ["tapis"], reps(6), U),
              v("Ours, pas avant et arrière, tempo", "En position de l'ours, avancer main et pied opposés d'un petit pas en 2 s, puis l'autre paire, reculer de même, genoux bas, bassin immobile, sur place.", ["tapis"], reps(6))],
        "8": [v("Ours, deux pas sur le côté", "En position de l'ours, genoux à 3 cm du tapis, faire deux petits pas sur le côté avec mains et pieds, puis revenir, sur place, dos plat, bassin bas.", ["tapis"], reps(4), U),
              v("Crabe, pas avant et arrière", "En crabe, mains derrière les hanches, bassin levé, avancer d'un petit pas main et pied opposés, puis reculer, sur place, bassin haut, épaules basses.", ["tapis"], reps(6)),
              v("Crabe haut, montées du bassin", "Assis, mains derrière les hanches doigts vers les pieds, pieds à plat, monter le bassin à l'horizontale en 1 s, tenir 2 s, redescendre sans poser les fesses.", ["tapis"], reps(10))],
        "9": [v("Ours, transfert latéral, pause", "En position de l'ours, décaler main et pied d'un côté de 20 cm, tenir 2 s, puis l'autre paire, revenir de même, genoux bas, dos plat, sur place.", ["tapis"], reps(4), U),
              v("Crabe, main vers le plafond", "En crabe, mains derrière les hanches, bassin levé, lever une main vers le plafond en tournant le buste, la reposer, alterner, bassin haut, lentement.", ["tapis"], reps(6), U),
              v("Ours, pas avant et arrière, série", "En position de l'ours, genoux à 3 cm du tapis, enchaîner les petits pas en avant puis en arrière à rythme régulier, dos plat, bassin immobile, sur place.", ["tapis"], sec(20))],
        "10": [v("Ours, carré sur place", "En position de l'ours, genoux bas, deux petits pas en avant, deux sur le côté, deux en arrière, deux de l'autre côté, puis dans l'autre sens, dos plat, sur place.", ["tapis"], reps(2), U),
               v("Crabe, deux pas sur le côté", "En crabe, mains derrière les hanches, bassin levé, faire deux petits pas sur le côté avec mains et pieds, puis revenir, sur place, bassin haut.", ["tapis"], reps(4), U),
               v("Crabe haut, tenu long", "Assis, mains derrière les hanches doigts vers les pieds, bassin monté à l'horizontale, tenir, épaules loin des oreilles, respirer, redescendre si les épaules tirent.", ["tapis"], sec(30))],
        "11": [v("Ours vers crabe", "En position de l'ours, lever une main, pivoter sur l'autre main et les pieds pour arriver en crabe, bassin haut, puis revenir en ours, alterner, lentement.", ["tapis"], reps(4), U),
               v("Ours, transfert latéral rythmé", "En position de l'ours, genoux à 3 cm du tapis, enchaîner les pas sur le côté à rythme régulier, deux vers la droite, deux vers la gauche, sur place, dos plat.", ["tapis"], sec(20)),
               v("Crabe, pas avant et arrière rythmés", "En crabe, mains derrière les hanches, bassin levé, enchaîner les petits pas en avant puis en arrière à rythme régulier, sur place, bassin haut.", ["tapis"], sec(20))],
        "12": [v("Ours en avant sur 4 m", "En position de l'ours, genoux à 3 cm du sol, avancer à petits pas main et pied opposés sur 4 m, puis revenir à reculons, dos plat, bassin bas.", ["aucun"], sec(30), D),
               v("Ours, pas rapides sur place", "En position de l'ours, genoux bas, alterner à rythme vif un petit pas en avant et un en arrière avec main et pied opposés, bassin immobile, sur place.", ["tapis"], sec(20)),
               v("Ours vers crabe, pause", "Passer de l'ours au crabe en pivotant sur une main, tenir 2 s bassin haut, revenir en ours, alterner les côtés, genoux bas, sans précipiter.", ["tapis"], reps(4), U)],
        "13": [v("Ours sur le côté sur 4 m", "En position de l'ours, genoux à 3 cm du sol, se déplacer à petits pas sur le côté sur 4 m, puis revenir dans l'autre sens, dos plat, bassin bas.", ["aucun"], sec(30), D),
               v("Ours, transfert latéral vif", "En position de l'ours, genoux bas, enchaîner à rythme vif deux pas vers la droite et deux vers la gauche avec mains et pieds, bassin bas, sur place.", ["tapis"], sec(20)),
               v("Crabe, pas rapides sur place", "En crabe, mains derrière les hanches, bassin levé, alterner à rythme vif un petit pas en avant et un en arrière, bassin haut, épaules basses, sur place.", ["tapis"], sec(20))],
        "14": [v("Crabe en avant sur 4 m", "En crabe, mains derrière les hanches, bassin levé, avancer à petits pas sur 4 m, pieds devant, puis revenir à reculons, bassin haut, épaules basses.", ["aucun"], sec(30), D),
               v("Ours vers crabe, rythmé", "Passer de l'ours au crabe en pivotant sur une main, puis revenir en ours, alterner les côtés à rythme régulier, bassin haut en crabe, genoux bas en ours.", ["tapis"], sec(20)),
               v("Ours, carré rapide sur place", "En position de l'ours, genoux bas, enchaîner à rythme vif deux pas en avant, deux sur le côté, deux en arrière, deux de l'autre côté, bassin bas, sur place.", ["tapis"], sec(20))],
        "15": [v("Ours, changements de direction", "En position de l'ours, genoux bas, enchaîner à rythme vif deux pas en avant, sur le côté ou en arrière, en changeant l'ordre, bassin bas, sur place.", ["tapis"], sec(30)),
               v("Ours vif sur 4 m", "En position de l'ours, genoux à 3 cm du sol, avancer à rythme vif sur 4 m, puis revenir à reculons, dos plat, bassin bas, appuis légers.", ["aucun"], sec(30), D),
               v("Crabe, pas rapides sur le côté", "En crabe, mains derrière les hanches, bassin levé, enchaîner à rythme vif deux pas vers la droite et deux vers la gauche, bassin haut, sur place.", ["tapis"], sec(20))],
        "16": [v("Ours, petits sauts des pieds", "En position de l'ours, mains fixes, sauter les deux pieds de 10 cm vers les mains puis en arrière, réception souple sur l'avant des pieds, dos plat.", ["tapis"], sec(15), SS),
               v("Parcours en ours sur 4 m", "En position de l'ours, genoux bas, avancer sur 4 m, revenir à reculons, puis faire 4 m sur le côté et revenir, dos plat, bassin bas, rythme régulier.", ["aucun"], sec(40), D),
               v("Ours vers crabe, enchaîné", "Passer de l'ours au crabe et revenir en pivotant sur une main, d'un côté puis de l'autre, sans pause, bassin haut en crabe, genoux bas en ours, sur place.", ["tapis"], sec(30))],
        "17": [v("Ours, sauts latéraux des pieds", "En position de l'ours, mains fixes sous les épaules, sauter les deux pieds de 30 cm sur le côté puis revenir, réception souple sur l'avant des pieds, dos plat.", ["tapis"], sec(15), SS),
               v("Ours et crabe sur 4 m", "Avancer en ours sur 4 m, passer en crabe en pivotant sur une main, revenir en crabe, bassin haut en crabe, genoux bas en ours, rythme régulier.", ["aucun"], sec(40), D),
               v("Enchaînement d'appuis sur place", "Enchaîner sans pause 4 pas d'ours en avant et en arrière, 4 pas sur le côté, puis 2 passages de l'ours au crabe, sur place, genoux bas, bassin haut en crabe.", ["tapis"], sec(40))],
        "18": [v("Ours, petits sauts des pieds enchaînés", "En position de l'ours, mains fixes, enchaîner les petits sauts des deux pieds vers les mains et en arrière, réception souple et silencieuse, dos plat.", ["tapis"], sec(20), SS),
               v("Crabe vif sur 4 m", "En crabe, mains derrière les hanches, bassin levé, avancer à rythme vif sur 4 m, pieds devant, puis revenir à reculons, bassin haut, épaules basses.", ["aucun"], sec(30), D),
               v("Ours vers crabe, vif", "Passer de l'ours au crabe et revenir à rythme vif, en alternant les côtés, bassin haut en crabe, genoux bas en ours, sur place, ralentir si le bassin tombe.", ["tapis"], sec(30))],
        "19": [v("Ours, sauts latéraux enchaînés", "En position de l'ours, mains fixes, enchaîner les sauts des deux pieds de 30 cm à droite puis à gauche, réception souple sur l'avant des pieds, dos plat.", ["tapis"], sec(20), SS),
               v("Parcours ours et crabe sur 4 m", "Avancer en ours sur 4 m, revenir sur le côté, passer en crabe et avancer de 4 m, revenir à reculons, rythme vif, bassin haut en crabe, genoux bas en ours.", ["aucun"], sec(45), D),
               v("Enchaînement d'appuis, long", "Enchaîner sans pause pas d'ours en avant et en arrière, pas sur le côté et passages de l'ours au crabe, sur place, genoux bas, ralentir si le bassin tombe.", ["tapis"], sec(45))],
        "20": [v("Ours, sauts des pieds en croix", "En position de l'ours, mains fixes, sauter les deux pieds vers l'avant, l'arrière, la droite et la gauche, réception souple sur l'avant des pieds, dos plat.", ["tapis"], sec(20), SS),
               v("Ours et crabe sur 4 m, vifs", "Avancer en ours sur 4 m à rythme vif, passer en crabe en pivotant sur une main, revenir en crabe, recommencer, appuis légers, bassin haut en crabe.", ["aucun"], sec(45), D),
               v("Enchaînement d'appuis vif", "Enchaîner à rythme vif pas d'ours en avant et en arrière, pas sur le côté et passages de l'ours au crabe, sur place, genoux bas, ralentir si le bassin tombe.", ["tapis"], sec(45))]
      }
    }
  ];

  if (typeof module !== "undefined" && module.exports) module.exports = CHAINES;
  else global.CHAINES_MEMBRE_SUPERIEUR = CHAINES;
})(typeof globalThis !== "undefined" ? globalThis : this);
