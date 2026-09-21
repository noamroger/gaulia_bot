import type { AdventureStrings } from "../en/adventure";

const adventure: AdventureStrings = {
  commands: {
    adventure: {
      name: "aventure",
      description: "Ton aventure dans les Terres de Gaulia",
      help: {
        details:
          "`/aventure tuto` explique tout en quelques pages, et permet de créer son aventurier d'un bouton. Un jeu d'aventure au long cours : tu crées un aventurier, tu explores les Terres de Gaulia, tu combats, tu récoltes, tu forges, tu renforces ton équipement, tu échanges avec les autres joueurs et tu suis une histoire en sept actes. L'énergie limite le nombre d'explorations par jour et les fragments d'écho (gagnés avec les quêtes et le donjon hebdomadaire) font avancer le scénario : le terminer demande plus d'un an de jeu régulier. Jouable en message privé, et sur un serveur dans les salons autorisés par ses administrateurs.",
        examples: [
          "aventure tuto",
          "aventure tuto sujet:echanges",
          "aventure commencer classe:Guerrier",
          "aventure explorer",
          "aventure histoire",
          "aventure quetes",
          "aventure donjon lancer:true",
          "aventure renforcer objet:Épée de fer apercu:true",
          "aventure echange proposer joueur:@Léa objet:Écaille de drake quantite:5 or_demande:2000",
        ],
      },
      subcommands: {
        tutorial: {
          name: "tuto",
          description: "Comment jouer : les bases, l'histoire, les échanges",
          options: {
            topic: {
              name: "sujet",
              description: "Aller directement à un chapitre du tutoriel",
              choices: {
                basics: "🧭 Premiers pas - créer son aventurier et partir explorer",
                progression: "📈 Monter en puissance - niveaux, caractéristiques, équipement",
                economy: "🪙 Or, butin et forge - gagner des pièces et fabriquer son matériel",
                story: "📖 L'histoire - chapitres, fragments d'écho, donjon hebdomadaire",
                trading: "🤝 Échanger avec les autres - le commerce entre aventuriers",
                community: "🏅 Les autres aventuriers - classement, hauts faits, où jouer",
                pace: "⏳ Le rythme du jeu - une aventure d'un an, et comment la vivre",
              },
            },
          },
        },
        start: {
          name: "commencer",
          description: "Crée ton aventurier et choisis sa classe",
          options: {
            class: {
              name: "classe",
              description: "Guerrier, mage ou rôdeur",
              choices: {
                GUERRIER: "🛡️ Guerrier - encaisse et frappe fort",
                MAGE: "🔮 Mage - dégâts élevés, défense fragile",
                RODEUR: "🏹 Rôdeur - esquive, critiques et meilleures trouvailles",
              },
            },
          },
        },
        profile: {
          name: "profil",
          description: "Fiche de ton aventurier",
        },
        explore: {
          name: "explorer",
          description: "Explore ta région et affronte ce qui s'y trouve",
        },
        map: {
          name: "carte",
          description: "Les régions ouvertes par ton histoire",
        },
        travel: {
          name: "voyager",
          description: "Change de région",
          options: {
            region: {
              name: "region",
              description: "Région de destination",
              choices: {
                clairiere: "🌾 Clairière des Semailles (niveau 1+)",
                "bois-bas": "🌲 Bois-Bas (niveau 8+)",
                tombes: "⚰️ Nécropole des Sept Tombes (niveau 18+)",
                forges: "⚒️ Forges Noires (niveau 30+)",
                "haut-givre": "🏔️ Haut-Givre (niveau 42+)",
                "cote-tempetes": "🌊 Côte des Tempêtes (niveau 55+)",
                "voute-astrale": "🌌 Voûte Astrale (niveau 68+)",
                "coeur-echos": "✨ Cœur des Échos (niveau 82+)",
              },
            },
          },
        },
        inventory: {
          name: "inventaire",
          description: "Ton sac et ton équipement",
        },
        equip: {
          name: "equiper",
          description: "Porte (ou retire) une pièce d'équipement",
          options: {
            item: {
              name: "objet",
              description: "Pièce à porter",
            },
          },
        },
        use: {
          name: "utiliser",
          description: "Utilise un consommable",
          options: {
            item: {
              name: "objet",
              description: "Objet à utiliser",
            },
          },
        },
        shop: {
          name: "boutique",
          description: "Le comptoir du marchand",
        },
        buy: {
          name: "acheter",
          description: "Achète un objet au marchand",
          options: {
            item: {
              name: "objet",
              description: "Objet à acheter",
            },
            quantity: {
              name: "quantite",
              description: "Combien en acheter",
            },
          },
        },
        sell: {
          name: "vendre",
          description: "Revends un objet de ton sac",
          options: {
            item: {
              name: "objet",
              description: "Objet à vendre",
            },
            quantity: {
              name: "quantite",
              description: "Combien en vendre",
            },
          },
        },
        forge: {
          name: "forge",
          description: "Les recettes accessibles à ton niveau",
        },
        craft: {
          name: "forger",
          description: "Fabrique un objet",
          options: {
            recipe: {
              name: "recette",
              description: "Recette à forger",
            },
          },
        },
        upgrade: {
          name: "renforcer",
          description: "Améliore une pièce d'équipement avec des ressources",
          options: {
            item: {
              name: "objet",
              description: "Pièce à renforcer",
            },
            preview: {
              name: "apercu",
              description: "Afficher le coût sans rien dépenser",
            },
          },
        },
        quests: {
          name: "quetes",
          description: "Tes quêtes du jour et de la semaine",
        },
        story: {
          name: "histoire",
          description: "Le chapitre en cours et ses objectifs",
        },
        seal: {
          name: "sceller",
          description: "Scelle le chapitre terminé et ouvre la suite",
        },
        dungeon: {
          name: "donjon",
          description: "Le gardien de l'acte, une fois par semaine",
          options: {
            fight: {
              name: "lancer",
              description: "Affronter le gardien maintenant",
            },
          },
        },
        improve: {
          name: "ameliorer",
          description: "Répartis tes points de caractéristique",
          options: {
            stat: {
              name: "caracteristique",
              description: "Caractéristique à monter",
              choices: {
                might: "Force - dégâts physiques et points de vie",
                agility: "Agilité - critique, esquive, défense",
                spirit: "Esprit - dégâts magiques",
              },
            },
            points: {
              name: "points",
              description: "Nombre de points à placer",
            },
          },
        },
        leaderboard: {
          name: "classement",
          description: "Les dix plus grands aventuriers",
        },
        achievements: {
          name: "hauts-faits",
          description: "Tes hauts faits débloqués",
        },
        journal: {
          name: "journal",
          description: "Les moments marquants de ton aventure",
        },
      },
      groups: {
        trade: {
          name: "echange",
          description: "Échanges d'objets et de pièces entre aventuriers",
          subcommands: {
            offer: {
              name: "proposer",
              description: "Propose un échange à un autre aventurier",
              options: {
                player: {
                  name: "joueur",
                  description: "Avec qui échanger",
                },
                item: {
                  name: "objet",
                  description: "Objet que tu donnes",
                },
                quantity: {
                  name: "quantite",
                  description: "Quantité donnée",
                },
                gold: {
                  name: "or",
                  description: "Pièces que tu donnes",
                },
                requested_item: {
                  name: "objet_demande",
                  description: "Objet que tu demandes en retour",
                },
                requested_quantity: {
                  name: "quantite_demandee",
                  description: "Quantité demandée",
                },
                requested_gold: {
                  name: "or_demande",
                  description: "Pièces que tu demandes",
                },
              },
            },
            list: {
              name: "liste",
              description: "Tes propositions d'échange en cours",
            },
            answer: {
              name: "repondre",
              description: "Accepte, refuse ou annule une proposition par son numéro",
              options: {
                number: {
                  name: "numero",
                  description: "Numéro de la proposition",
                },
                action: {
                  name: "reponse",
                  description: "Que faire de cette proposition",
                  choices: {
                    accept: "Accepter",
                    decline: "Refuser (proposition reçue)",
                    cancel: "Annuler (proposition envoyée)",
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  error: {
    unknownSubcommand: "Cette sous-commande n'existe pas.",
    noCharacter:
      "Tu n'as pas encore d'aventurier. Lance `/aventure tuto` : le tutoriel explique les bases et te laisse créer ton personnage d'un bouton (ou `/aventure commencer` si tu sais déjà où tu vas).",
    alreadyStarted: "Tu as déjà un aventurier. Consulte-le avec `/aventure profil`.",
    notEnoughPoints: "Tu n'as que {available} point(s) à répartir, et tu en demandes {requested}.",
    botTrade: "Les bots ne commercent pas.",

    moduleDisabled:
      "Le module aventure est désactivé sur ce serveur. Tu peux toujours jouer en message privé avec Gaulia.",
    channelBlocked: "L'aventure n'est pas autorisée dans ce salon.",
    noAdventureChannel:
      "Aucun salon d'aventure n'est autorisé sur ce serveur. Demande à un administrateur d'en ouvrir un depuis le tableau de bord, ou joue en message privé avec Gaulia.",
    adventureChannels: "L'aventure se joue dans : {channels} - ou en message privé.",

    noEnergy:
      "Tu n'as plus d'énergie. Le prochain point revient dans {duration} (ou utilise une ration de voyage).",
    tooHurt:
      "Tu es trop amoché pour repartir. Soigne-toi avec `/aventure utiliser`, ou laisse passer un peu de temps.",

    dungeonCooldown:
      "Le gardien ne se montrera pas avant {duration}. Un donjon par semaine, pas davantage.",
    dungeonEnergy: "Un donjon demande {cost} points d'énergie, et tu en as {current}.",
    dungeonHurt: "Tu es trop amoché pour affronter un gardien. Soigne-toi d'abord.",

    unknownRecipe: "Cette recette n'existe pas.",
    recipeLevel: "Cette recette demande le niveau {required}, et tu es niveau {current}.",
    recipeGold: "Il te manque {missing} pièces pour payer la forge.",
    recipeMaterials: "Il te manque : {missing}.",

    notForSale: "{item} ne se vend nulle part.",
    itemLevel: "{item} est réservé au niveau {required}, et tu es niveau {current}.",
    notEnoughGold: "Il te manque {missing} pièces pour {quantity} × {item}.",
    notSellable: "{item} n'intéresse aucun marchand.",
    notOwned: "Tu ne possèdes pas {quantity} × {item}.",
    unequipFirst: "Déséquipe cette pièce avant de la vendre.",

    notEquippable: "{item} ne s'équipe pas.",
    notOwnedSimple: "Tu ne possèdes pas {item}.",
    itemLevelSimple: "{item} demande le niveau {required}.",
    notUsable: "{item} ne s'utilise pas.",

    notGear: "{item} n'est pas une pièce d'équipement : rien à renforcer.",
    maxUpgrade: "{item} est déjà au palier maximum (+{max}).",
    cannotUpgrade: "{item} ne se renforce pas.",
    missingForUpgrade: "Il te manque {missing} pour ce renforcement.",
    missingMaterial: "Il te manque {item} pour ce renforcement.",

    tradeSelf: "Tu ne peux pas commercer avec toi-même.",
    tradeEmpty: "Une proposition vide n'a pas grand intérêt : ajoute un objet ou de l'or.",
    tradeTooManyItems: "Un échange porte sur {max} objets au maximum par côté.",
    tradeLevel: "Les échanges s'ouvrent au niveau {required}, et tu es niveau {current}.",
    targetNoCharacter: "Ce membre n'a pas encore d'aventurier : il ne peut rien échanger.",
    targetLevel: "Cet aventurier doit atteindre le niveau {required} avant de pouvoir échanger.",
    tradeBound: "{item} ne s'échange pas : c'est une pièce liée à ton histoire.",
    tradeGold: "Il te manque {missing} pièces pour cet échange.",
    tradeOtherGold: "L'autre aventurier n'a plus assez de pièces pour cet échange.",
    tradeItems: "Tu ne possèdes pas {quantity} × {item}.",
    tradeOtherItems: "L'autre aventurier n'a plus {quantity} × {item}.",
    tradeEquipped: "{item} est équipée : retire-la avant de l'échanger.",
    tradeOtherEquipped: "L'autre aventurier porte l'une des pièces promises.",
    tradePending:
      "Tu as déjà {max} propositions en attente : annule-en une avec `/aventure echange liste`.",
    tradeGone: "Cette proposition d'échange n'existe plus.",
    tradeExpired: "Cette proposition a expiré.",
    tradeHandled: "Cette proposition a déjà été traitée.",
    tradeNotForYou: "Cette proposition ne t'est pas adressée.",
    tradeNotYours: "Cette proposition ne t'appartient pas.",
    tradeJustHandled: "Cette proposition vient d'être traitée.",
    tradeFailed: "L'échange a échoué, réessaie.",

    zoneLocked: "{zone} ne s'ouvrira que plus loin dans ton histoire.",
    alreadyThere: "Tu es déjà à {zone}.",

    storyOver: "Ton histoire est déjà terminée. Les Terres se reposent.",
    objectivesLeft: "Il te reste à accomplir : {objectives}.",
    chapterLevel: "Ce chapitre demande le niveau {required}, et tu es niveau {current}.",
    chapterEchoes:
      "Il te faut {required} fragments d'écho pour sceller ce chapitre, et tu en as {current}.",
  },

  classes: {
    GUERRIER: {
      name: "Guerrier",
      description: "Encaisse et frappe fort. Le plus simple à jouer, le plus dur à tuer.",
      passive: "Réduit de 15 % les dégâts subis.",
    },
    MAGE: {
      name: "Mage",
      description: "Frappe à l'esprit plutôt qu'à la force : dégâts élevés, défense fragile.",
      passive: "Inflige 20 % de dégâts supplémentaires, mais encaisse 10 % de plus.",
    },
    RODEUR: {
      name: "Rôdeur",
      description: "Vif et chanceux : esquive, coups critiques et meilleures trouvailles.",
      passive: "+10 % de butin et un coup critique plus fréquent.",
    },
  },

  slots: {
    arme: "Arme",
    armure: "Armure",
    talisman: "Talisman",
  },

  families: {
    bete: "bêtes",
    brigand: "brigands",
    "mort-vivant": "morts-vivants",
    elementaire: "élémentaires",
    drake: "drakes",
    echo: "échos",
  },

  zones: {
    clairiere: {
      name: "Clairière des Semailles",
      description: "Des champs, un puits, et des histoires qu'on raconte le soir.",
      ambiances: [
        "Le vent couche les blés et les relève, sans rien te dire.",
        "Un vieux te salue de loin, puis retourne à son puits.",
        "Tu suis un sentier jusqu'à une borne effacée par la pluie.",
      ],
    },
    "bois-bas": {
      name: "Bois-Bas",
      description: "La brume y reste accrochée aux troncs jusqu'à midi.",
      ambiances: [
        "Un craquement, puis plus rien. La brume avale les bruits.",
        "Tu trouves un campement éteint depuis longtemps.",
        "Des marques fraîches sur un tronc : quelque chose est passé avant toi.",
      ],
    },
    tombes: {
      name: "Nécropole des Sept Tombes",
      description: "Sept dalles, six noms. La septième n'a jamais été gravée.",
      ambiances: [
        "Tes pas résonnent deux fois : une fois pour toi, une fois pour autre chose.",
        "Une bougie brûle encore sur une tombe. Personne alentour.",
        "Le vent passe entre les dalles avec un bruit de voix.",
      ],
    },
    forges: {
      name: "Forges Noires",
      description: "On y bat le métal depuis si longtemps que le ciel est resté gris.",
      ambiances: [
        "Un marteau frappe au loin, toujours au même rythme.",
        "La suie se dépose sur tes épaules comme une neige tiède.",
        "Tu croises un convoi de minerai, personne pour le mener.",
      ],
    },
    "haut-givre": {
      name: "Haut-Givre",
      description: "Au-dessus des nuages, là où le froid tient lieu de loi.",
      ambiances: [
        "La pente monte encore. Tu arrêtes de compter les heures.",
        "Une empreinte large comme un bouclier, déjà à demi comblée.",
        "Le silence ici est si complet qu'il siffle.",
      ],
    },
    "cote-tempetes": {
      name: "Côte des Tempêtes",
      description: "Des falaises, des épaves, et une mer qui ne se calme jamais.",
      ambiances: [
        "Une cloche sonne au large, sans navire pour la porter.",
        "L'écume dessine des formes sur le sable, puis les efface.",
        "Tu fouilles une épave : quelqu'un est passé avant toi, récemment.",
      ],
    },
    "voute-astrale": {
      name: "Voûte Astrale",
      description: "Un plafond d'étoiles sous la terre. Personne ne sait qui les a posées.",
      ambiances: [
        "Une étoile se détache et tombe lentement, très loin.",
        "Ton ombre part dans une direction que la lumière n'explique pas.",
        "Tu entends ton propre nom, prononcé par ta propre voix.",
      ],
    },
    "coeur-echos": {
      name: "Cœur des Échos",
      description: "L'endroit d'où les Terres se souviennent. Et où elles répondent.",
      ambiances: [
        "Tout ce que tu dis revient, un instant plus tard, légèrement différent.",
        "Le sol porte tes traces avant que tu poses le pied.",
        "Une porte sans mur s'ouvre, puis se referme sur rien.",
      ],
    },
  },

  monsters: {
    "lapin-hargneux": "Lapin hargneux",
    "loup-gris": "Loup gris",
    "sanglier-furieux": "Sanglier furieux",
    detrousseur: "Détrousseur",
    "araignee-sylve": "Araignée de sylve",
    "ours-bois-bas": "Ours des Bois-Bas",
    "goule-affamee": "Goule affamée",
    "spectre-plaintif": "Spectre plaintif",
    "chevalier-tombe": "Chevalier tombé",
    "forgeron-cendre": "Forgeron de cendre",
    "golem-scories": "Golem de scories",
    "salamandre-forge": "Salamandre des forges",
    "veneur-givre": "Veneur de givre",
    "drake-blanc": "Drake blanc",
    "colosse-gel": "Colosse de gel",
    "corsaire-tempete": "Corsaire des tempêtes",
    "noye-rancunier": "Noyé rancunier",
    "drake-orage": "Drake d'orage",
    "veilleur-astral": "Veilleur astral",
    "marcheur-vide": "Marcheur du vide",
    "choeur-brise": "Chœur brisé",
    "reflet-soi": "Reflet de soi",
    "silence-ancien": "Silence ancien",
    "gardien-brume": "Gardien de la brume",
    "gardien-tombes": "Gardien des tombes",
    "gardien-forges": "Gardien des forges",
    "gardien-givre": "Gardien du givre",
    "gardien-tempetes": "Gardien des tempêtes",
    "gardien-voute": "Gardien de la voûte",
    "echo-premier": "Écho premier",
  },

  achievements: {
    "premier-pas": { name: "Premiers pas", description: "Explorer pour la première fois." },
    marcheur: { name: "Marcheur", description: "Explorer 100 fois." },
    arpenteur: { name: "Arpenteur", description: "Explorer 1 000 fois.", title: "l'Arpenteur" },
    infatigable: {
      name: "Infatigable",
      description: "Explorer 5 000 fois.",
      title: "l'Infatigable",
    },
    "premier-sang": { name: "Premier sang", description: "Remporter un premier combat." },
    chasseur: { name: "Chasseur", description: "Remporter 250 combats." },
    fleau: {
      name: "Fléau des Terres",
      description: "Remporter 2 500 combats.",
      title: "le Fléau",
    },
    "tombe-debout": {
      name: "Tombé, relevé",
      description: "Perdre un combat et repartir quand même.",
    },
    "niveau-10": { name: "Aguerri", description: "Atteindre le niveau 10." },
    "niveau-25": { name: "Vétéran", description: "Atteindre le niveau 25." },
    "niveau-50": {
      name: "Héros des Terres",
      description: "Atteindre le niveau 50.",
      title: "le Héros",
    },
    "niveau-75": { name: "Légende vivante", description: "Atteindre le niveau 75." },
    "niveau-100": {
      name: "Au sommet",
      description: "Atteindre le niveau 100.",
      title: "le Souverain",
    },
    "premier-donjon": { name: "Briseur de portes", description: "Terminer un premier donjon." },
    "donjons-10": { name: "Habitué des profondeurs", description: "Terminer 10 donjons." },
    "donjons-30": {
      name: "Gardien des gardiens",
      description: "Terminer 30 donjons.",
      title: "le Briseur",
    },
    "serie-7": { name: "Une semaine entière", description: "Tenir une série de 7 jours." },
    "serie-30": { name: "Un mois sans faillir", description: "Tenir une série de 30 jours." },
    "serie-180": {
      name: "Une demi-année",
      description: "Tenir une série de 180 jours.",
      title: "le Constant",
    },
    riche: { name: "Petite fortune", description: "Posséder 100 000 pièces." },
    "acte-3": { name: "Sous la nécropole", description: "Atteindre l'acte III." },
    "acte-5": { name: "Au bord du monde", description: "Atteindre l'acte V." },
    "acte-7": {
      name: "Le cœur des Terres",
      description: "Atteindre l'acte VII.",
      title: "l'Écouteur",
    },
    forgeron: { name: "Main de forgeron", description: "Renforcer une pièce d'équipement." },
    "maitre-forge": {
      name: "Maître de forge",
      description: "Mener 25 renforcements à terme.",
      title: "le Forgeron",
    },
    marchand: {
      name: "Premier marché",
      description: "Conclure un échange avec un autre aventurier.",
    },
    caravanier: {
      name: "Caravanier",
      description: "Conclure 50 échanges.",
      title: "le Caravanier",
    },
    fin: { name: "La dernière voix", description: "Terminer le scénario.", title: "l'Écho" },
  },

  story: {
    objectives: {
      explore: "Explorer {target} fois",
      exploreZone: "Explorer {target} fois - {zone}",
      defeatFamily: "Vaincre {target} {family}",
      defeatCreatures: "Vaincre {target} créatures",
      collect: "Rapporter {target} × {item}",
      craft: "Forger {target} objet(s)",
      dungeon: "Terminer {target} donjon(s)",
      dailySet: "Compléter {target} lot(s) de quêtes quotidiennes",
      spendGold: "Dépenser {target} pièces",
    },
    chapters: {
      a1c1: {
        objectives: { "EXPLORE:clairiere": "Battre la campagne autour du puits" },
      },
      a1c3: {
        objectives: { DAILY_SET: "Tenir trois journées d'aventure complètes" },
      },
      a1c4: {
        objectives: { CRAFT: "Sortir deux pièces de la forge" },
      },
      a1c5: {
        objectives: { DUNGEON: "Vaincre le gardien de la brume en donjon" },
      },
      a2c3: {
        objectives: { SPEND_GOLD: "Dépenser 4 000 pièces chez les marchands" },
      },
      a2c5: {
        objectives: { DUNGEON: "Vaincre le gardien des tombes en donjon" },
      },
      a3c5: {
        objectives: { DUNGEON: "Vaincre le gardien des forges en donjon" },
      },
      a4c5: {
        objectives: { DUNGEON: "Vaincre le gardien du givre en donjon" },
      },
      a5c5: {
        objectives: { DUNGEON: "Vaincre le gardien des tempêtes en donjon" },
      },
      a6c5: {
        objectives: { DUNGEON: "Vaincre le gardien de la voûte en donjon" },
      },
      a7c5: {
        objectives: { DUNGEON: "Vaincre l'Écho premier en donjon" },
      },
    },
  },

  tutorial: {
    jump: "Aller à un chapitre du tutoriel…",
    previous: "Précédent",
    next: "Suivant",
    footer: "-# Tutoriel de l'aventure · page {page} sur {total}",
    option: "{position}. {title}",
    classLine: "{emoji} **{name}** - {description}\n*{passive}*",
    pages: {
      basics: {
        title: "Premiers pas",
        summary: "Créer son aventurier et partir explorer",
        sections: {
          character: {
            heading: "Ton aventurier",
            body: "Tu as **un seul aventurier**, le même partout : sur tous les serveurs où Gaulia est présent, et en message privé avec lui. Ta progression te suit, elle n'appartient à aucun serveur.\n\nChoisis une classe pour commencer, elle fixe ton style de combat, pas ton destin :\n\n{classes}",
          },
          exploring: {
            heading: "Explorer, c'est le cœur du jeu",
            body: "`/aventure explorer` t'envoie battre la région où tu te trouves. Tu peux y croiser une créature (le combat se résout d'un bloc, tu lis le résumé), faire une trouvaille, ou ne rien rencontrer du tout. Dans tous les cas tu gagnes de l'expérience, souvent des pièces et du butin.\n\nEnsuite, tout se pilote **aux boutons** sous le message : explorer encore, ouvrir ton sac, te soigner. Les commandes restent là pour qui préfère taper.",
          },
          energy: {
            heading: "Énergie et points de vie",
            body: "Une exploration coûte **{energyPerExplore} énergie**. Tu en regagnes 1 toutes les {regenMinutes} minutes, jusqu'à **{energyMax}** en réserve, soit environ {energyPerDay} par jour si tu passes régulièrement.\n\nTes points de vie remontent seuls avec le temps, ou d'un coup avec une potion. Perdre un combat ne coûte jamais ta progression : tu rentres soigner tes plaies, c'est tout. **Il n'y a pas de mort définitive.**",
          },
        },
      },
      progression: {
        title: "Monter en puissance",
        summary: "Niveaux, caractéristiques, équipement, renforcement",
        sections: {
          levels: {
            heading: "Niveaux et caractéristiques",
            body: "L'expérience te fait monter jusqu'au niveau **{maxLevel}**. Chaque niveau rend toute ta vie et t'offre **{pointsPerLevel} points** à placer avec `/aventure ameliorer` :\n\n**Force** - dégâts physiques et points de vie\n**Agilité** - coups critiques, esquive et défense\n**Esprit** - dégâts magiques",
          },
          gear: {
            heading: "S'équiper",
            body: "Trois emplacements : **arme**, **armure**, **talisman**. Une pièce se porte depuis ton sac (`/aventure inventaire`, ou le menu sous le message). Les meilleures pièces se trouvent en explorant, s'achètent au comptoir, ou se forgent.",
          },
          upgrading: {
            heading: "Renforcer son équipement",
            body: "À la forge, une pièce que tu possèdes déjà se renforce jusqu'à **+{maxUpgrade}** contre de l'or et des matériaux. Chaque palier ajoute **{upgradePercent} %** à ses bonus, et rien ne peut casser : le coût est connu d'avance, tu réunis les ressources, la pièce s'améliore.\n\nAttention : le renforcement appartient à **ton exemplaire**. Si tu donnes ou revends la pièce, le renforcement part avec elle et l'autre la reçoit au palier zéro.",
          },
        },
      },
      economy: {
        title: "Or, butin et forge",
        summary: "Gagner des pièces et fabriquer son matériel",
        sections: {
          gold: {
            heading: "D'où vient l'or",
            body: "Des combats, des trouvailles, des quêtes, et de la revente. Les **trésors** ne servent à rien d'autre qu'à être vendus très cher : garde-les pour le marchand, pas pour ton sac.",
          },
          counter: {
            heading: "Le comptoir",
            body: "`/aventure boutique` liste ce que le marchand propose à ton niveau : potions, rations qui rendent de l'énergie, équipement d'entrée de gamme. Tu achètes d'un menu déroulant. `/aventure vendre` fait l'inverse, sauf pour les reliques, que personne ne rachète.",
          },
          forge: {
            heading: "La forge",
            body: "`/aventure forge` montre les recettes accessibles à ton niveau et ce qu'il te manque pour chacune. Les matériaux viennent du butin : peaux et bois au début, écailles de drake et cœurs élémentaires plus loin, éclats d'écho tout au bout. C'est là aussi que tu renforces tes pièces.",
          },
        },
      },
      story: {
        title: "L'histoire",
        summary: "Chapitres, fragments d'écho, donjon hebdomadaire",
        sections: {
          acts: {
            heading: "Sept actes, trente-cinq chapitres",
            body: "L'aventure raconte une histoire : {actCount} actes, {chapterCount} chapitres, une nouvelle région ouverte à chaque acte. `/aventure histoire` te montre le chapitre en cours et ses objectifs, qui se remplissent simplement en jouant.",
          },
          shards: {
            heading: "Les fragments d'écho",
            body: "Remplir les objectifs ne suffit pas : pour **sceller** un chapitre il faut atteindre un niveau et dépenser des **fragments d'écho**. Ils ne s'achètent pas et ne se farment pas. Ils viennent du temps qui passe :\n\n**+{perDaily}** par lot de quêtes quotidiennes terminé\n**+{perWeekly}** par lot hebdomadaire\n**+{perDungeon}** par donjon remporté\nEt rarement, un écho perdu trouvé en explorant.",
          },
          dungeon: {
            heading: "Le donjon de la semaine",
            body: "Chaque acte a son gardien, affrontable **une fois tous les {dungeonDays} jours** pour {dungeonEnergy} énergie. C'est le gros rendez-vous : beaucoup d'expérience, d'or, et les fragments qui font avancer l'histoire. Une défaite ne consomme pas la semaine, reviens mieux équipé le jour même.",
          },
          quests: {
            heading: "Les quêtes",
            body: "Un lot de quêtes quotidiennes et un lot hebdomadaire, tirés au hasard. Elles se valident **toutes seules** pendant que tu joues : rien à réclamer, rien à oublier. `/aventure quetes` pour voir où tu en es.",
          },
        },
      },
      trading: {
        title: "Échanger avec les autres",
        summary: "Le commerce entre aventuriers, et ses règles",
        sections: {
          offering: {
            heading: "Proposer un échange",
            body: "`/aventure echange proposer` met sur la table ce que tu donnes (objets, pièces, ou les deux) et ce que tu demandes en retour. L'autre reçoit la proposition et répond d'un bouton : **accepter**, **refuser**. Toi, tu peux l'annuler tant qu'elle est ouverte.\n\nÇa couvre le cadeau (tu ne demandes rien), la vente (des objets contre des pièces) et le troc (des objets contre des objets).",
          },
          rules: {
            heading: "Les règles du marché",
            body: "Les échanges s'ouvrent au **niveau {minLevel}** des deux côtés. Une proposition expire après **{expiryMinutes} minutes**, et tu peux en avoir **{maxPending}** ouvertes en même temps, avec au plus {maxItems} objets par côté.\n\nRien n'est bloqué pendant qu'une proposition attend : tu continues de jouer normalement. Les deux sacs sont revérifiés au moment de l'acceptation, et tout part en une seule fois, donc impossible qu'un des deux soit délesté sans recevoir sa part.",
          },
          bound: {
            heading: "Ce qui ne s'échange pas",
            body: "Les **reliques** gagnées sur les gardiens restent avec celui qui les a méritées : elles ne s'échangent ni ne se vendent. Une pièce que tu portes doit être retirée avant d'être donnée. Et le renforcement, lui, ne voyage jamais.",
          },
          tracking: {
            heading: "Suivre ses affaires",
            body: "`/aventure echange liste` récapitule tes propositions en cours, reçues comme envoyées. `/aventure echange repondre` permet de répondre par numéro quand le message d'origine est loin dans l'historique. Chaque échange conclu est inscrit dans le journal des deux joueurs.",
          },
        },
      },
      community: {
        title: "Les autres aventuriers",
        summary: "Classement, hauts faits, où l'on peut jouer",
        sections: {
          compare: {
            heading: "Se comparer",
            body: "`/aventure classement` affiche les dix plus grands aventuriers, tous serveurs confondus, et ton rang. `/aventure hauts-faits` liste ce que tu as débloqué : certains hauts faits accordent un **titre**, affiché sous ton nom sur ta fiche.",
          },
          where: {
            heading: "Où l'on joue",
            body: "En **message privé** avec Gaulia, toujours. Sur un serveur, ça dépend de ses administrateurs : ils choisissent les salons où l'aventure est autorisée depuis le tableau de bord. Si une commande te répond que le salon n'est pas ouvert, demande-leur, ou continue en privé, c'est le même personnage.",
          },
          together: {
            heading: "Jouer ensemble",
            body: "Il n'y a pas d'équipe ni de combat entre joueurs : ce que vous partagez, c'est l'économie. Un joueur avancé peut équiper un débutant, deux joueurs peuvent se répartir les matériaux qu'ils récoltent, et le classement met tout le monde sur la même échelle. Les boutons d'un message n'obéissent qu'à son propriétaire, donc personne ne peut jouer à ta place.",
          },
        },
      },
      pace: {
        title: "Le rythme du jeu",
        summary: "Une aventure d'un an, et comment bien la vivre",
        sections: {
          duration: {
            heading: "Ça dure longtemps, exprès",
            body: "Terminer l'histoire demande **plus d'un an**. Ce n'est pas un mur d'expérience à casser : c'est le temps réel qui compte, parce que les fragments d'écho n'arrivent qu'avec les jours et les semaines. Jouer douze heures d'affilée n'avance pas plus qu'une bonne session quotidienne.",
          },
          habit: {
            heading: "La bonne habitude",
            body: "Passe une ou deux fois par jour, vide ton énergie, termine ton lot de quêtes, prends ton donjon dans la semaine. C'est tout. Ta **série de jours consécutifs** augmente ton butin, jusqu'à +30 %, et un jour manqué la remet à 1, jamais à zéro.",
          },
          tips: {
            heading: "Trois conseils pour débuter",
            body: "**1.** Place tes points de caractéristique dès que tu montes de niveau, ils ne servent à rien en réserve.\n**2.** Garde tes matériaux : ils valent plus à la forge qu'au comptoir.\n**3.** Voyage dès qu'une région s'ouvre, les gains y sont meilleurs, et ton histoire t'y attend.",
          },
        },
      },
    },
  },

  buttons: {
    explore: "Explorer",
    exploreAgain: "Explorer encore",
    heal: "Se soigner",
    profile: "Profil",
    bag: "Sac",
    map: "Carte",
    story: "Histoire",
    quests: "Quêtes",
    shop: "Boutique",
    forge: "Forge",
    dungeon: "Donjon",
    leaderboard: "Classement",
    achievements: "Hauts faits",
    journal: "Journal",
    trades: "Échanges",
    fightGuardian: "Affronter le gardien",
    sealChapter: "Sceller le chapitre",
    accept: "Accepter",
    decline: "Refuser",
    cancel: "Annuler",
  },

  combat: {
    summary: "⚔️ {rounds} échanges · {dealt} dégâts infligés · {taken} subis",
    crits: {
      one: "💥 {count} coup critique placé.",
      other: "💥 {count} coups critiques placés.",
    },
    dodges: {
      one: "🌀 {count} attaque esquivée.",
      other: "🌀 {count} attaques esquivées.",
    },
    timeout: "🕰️ Le combat s'éternise : tu romps le contact avant l'épuisement.",
  },

  notices: {
    levelUp: "⬆️ Niveau **{level}** atteint !",
    levelUpPoints: "⬆️ Niveau **{level}** atteint ! Points à répartir : `/aventure ameliorer`.",
    combatBreak: "🤕 Tu romps le combat de justesse et rentres soigner tes plaies.",
    echoFound: "🔷 Un écho perdu résonne sous tes pas : **+1 fragment d'écho**.",
    dungeonWon: "🔷 Le gardien cède : **+{count} fragments d'écho**.",
    dungeonLost:
      "💀 Le gardien te repousse. Reviens mieux équipé : il t'attend encore aujourd'hui.",
    achievement: "{emoji} Haut fait débloqué - **{name}**",
    questDone: "✅ Quête terminée - {label} · +{xp} XP · +{gold} 🪙",
    dailySetDone: {
      one: "🔷 Lot quotidien complété - +{count} fragment d'écho.",
      other: "🔷 Lot quotidien complété - +{count} fragments d'écho.",
    },
    weeklySetDone: {
      one: "🔷 Lot hebdomadaire complété - +{count} fragment d'écho.",
      other: "🔷 Lot hebdomadaire complété - +{count} fragments d'écho.",
    },
    newAct: "{emoji} **{act}** commence. {intro}",
    newZone: "🗺️ Nouvelle région ouverte : {emoji} **{zone}**.",
    storyEnd:
      "🏆 **Les Terres se taisent.** Tu as entendu la dernière voix : ton histoire est complète.",
    upgradeLost: "⚠️ Le renforcement +{level} de {item} est parti avec la pièce.",
    upgradeAtRisk: "{item} +{level} : le renforcement sera perdu.",
  },

  views: {
    unnamed: "Aventurier",

    profile: {
      heading: "## {emoji} {name}",
      headingTitled: "## {emoji} {name} - *{title}*",
      subtitle: "{class} · niveau **{level}** · {zoneEmoji} {zone} · rang #{rank}",
      vitals: "❤️ **{hp} / {maxHp}** · ⚡ **{energy} / {maxEnergy}**",
      purse: "🪙 {gold} · 🔷 {echoes} fragments",
      experience: "**Expérience** {bar} {value}",
      maxLevel: "niveau maximum",
      offense: "⚔️ Attaque **{attack}** · 🔮 Puissance **{power}** · 🛡️ Défense **{defense}**",
      rates: "💥 Critique **{crit} %** · 🌀 Esquive **{dodge} %**",
      stats: "Force {might} · Agilité {agility} · Esprit {spirit}",
      pendingPoints: {
        one: " · **{count} point à répartir**",
        other: " · **{count} points à répartir**",
      },
      gear: "**Équipement**",
      gearLine: "{slot} · {item}",
      emptySlot: "-",
      story: "**Histoire** {emoji} {act}",
      chapter: "Chapitre {index}/{total} - *{title}*",
      storyDone: "**Histoire** 🏆 Scénario terminé.",
      streak: {
        one: "🔥 Série de **{count}** jour (record : {best})",
        other: "🔥 Série de **{count}** jours (record : {best})",
      },
      activity: "🗺️ {explorations} explorations · ⚔️ {victories} victoires · 🚪 {dungeons} donjons",
    },

    stats: {
      title: "### 🎯 Répartition des caractéristiques",
      available: {
        one: "Tu as **{count} point** à placer avec `/aventure ameliorer caracteristique:<...> points:<n>`.",
        other:
          "Tu as **{count} points** à placer avec `/aventure ameliorer caracteristique:<...> points:<n>`.",
      },
      none: "Aucun point disponible : monte d'un niveau pour en gagner.",
      might:
        "**Force** {value} - dégâts physiques et points de vie (attaque {attack}, PV max {maxHp})",
      agility: "**Agilité** {value} - critique, esquive et défense ({crit} % / {dodge} %)",
      spirit: "**Esprit** {value} - dégâts magiques (puissance {power})",
    },

    leaderboard: {
      title: "## 🏅 Les plus grands aventuriers",
      row: "{position} {name} - {emoji} niveau {level} · acte {act} · {xp} XP",
      empty: "Personne n'a encore pris la route.",
      yourRank: "Ton rang : **#{rank}**",
    },

    achievements: {
      title: "## 🏆 Hauts faits - {unlocked}/{total}",
      unlockedRow: "{check} {emoji} **{name}** - {description}",
      lockedRow: "{check} {emoji} {name} - {description}",
      empty: "Aucun haut fait pour l'instant.",
    },

    map: {
      title: "## 🗺️ Les Terres de Gaulia",
      here: "> 📍 **Tu es à {emoji} {zone}**\n> *{description}*",
      unknown: "> 📍 **Position inconnue**",
      row: "{marker}{emoji} **{zone}** - niveau conseillé {level}{suffix}",
      youAreHere: " · **tu es ici**",
      hint: "Choisis ta destination d'un bouton, ou `/aventure voyager region:<nom>`.",
    },

    bag: {
      title: "## 🎒 Sac de {name}",
      purse: "{gold} · 🔷 {echoes} fragments d'écho",
      groups: {
        gear: "Équipement",
        consumables: "Consommables",
        materials: "Matériaux",
        treasures: "Trésors & reliques",
      },
      row: "{rarity} {item}{upgrade}{quantity}{slot}{worn}",
      slot: " ({slot})",
      worn: " · **porté**",
      empty: "Ton sac est vide. Pars explorer !",
      hint: "Équipe ou utilise un objet avec le menu ci-dessous, ou `/aventure equiper` et `/aventure utiliser`.",
      select: "Équiper ou utiliser un objet…",
      takeOff: "Déjà porté - le retirer",
      equipOption: "Équiper - {bonus}",
    },

    shop: {
      title: "## 🏪 Comptoir des Semailles",
      purse: "Ta bourse : {gold}",
      row: "{rarity} {item} - {price}{locked}",
      locked: " · 🔒 niveau {level}",
      empty: "Le marchand n'a rien pour toi aujourd'hui.",
      hint: "Achète avec le menu, ou `/aventure acheter objet:<nom> quantite:<n>`. Revends avec `/aventure vendre`.",
      select: "Acheter un objet…",
      option: "{name} - {price} pièces",
    },

    forge: {
      title: "## ⚒️ Forge",
      purse: "Ta bourse : {gold}",
      recipe: "**{item}**{quantity} - {gold}",
      ingredient: "{check} {quantity} × {item} ({owned})",
      empty: "Aucune recette accessible à ton niveau pour l'instant.",
      select: "Forger un objet…",
      option: "{gold} pièces · niveau {level}",
      upgradeTitle: "**Renforcement**",
      upgradeRow: "{item} → +{next} : {gold} · {materials}",
      upgradeEmpty: "Aucune pièce d'équipement à renforcer dans ton sac.",
      upgradeHint:
        "`/aventure renforcer objet:<pièce>` - le renforcement reste attaché à ton exemplaire et ne suit pas un échange.",
      upgradeSelect: "Renforcer une pièce d'équipement…",
      upgradeOption: "{gold} pièces · {materials}",
      upgradeLabel: "{item} +{current} → +{next}",
      material: "{quantity} × {item}",
    },

    explore: {
      victory: "## {emoji} {monster} vaincu",
      defeat: "## {emoji} {monster} te repousse",
      zoneLevel: "{emoji} {zone} · niveau {level}",
      zone: "{emoji} {zone}",
      findTitle: "## 🔎 Trouvaille",
      calmTitle: "## 🧭 Exploration",
      ambiance: "*{ambiance}*",
      xp: "✨ +{xp} XP",
      gold: "🪙 +{gold}",
      loot: "🎒 {list}",
      lootEntry: "{quantity} × {item}",
      vitals: "❤️ {hp} · ⚡ {energy}/{maxEnergy} · 🪙 {gold}",
    },

    dungeon: {
      title: "## 🚪 Donjon - {act}",
      guardian: "Gardien : {emoji} **{name}** (niveau {level})",
      cooldown: "⏳ Prochaine tentative dans **{duration}**.",
      open: "Le passage est ouvert : affronte le gardien d'un bouton, ou `/aventure donjon lancer:true`.",
      reward:
        "Un donjon remporté rapporte l'essentiel de tes fragments d'écho, c'est le rendez-vous de la semaine.",
      won: "## {emoji} Gardien vaincu",
      held: "## {emoji} Le gardien tient bon",
      guardianLine: "**{name}** - niveau {level}",
    },

    travel: {
      title: "## {emoji} En route pour {zone}",
      description: "*{description}*",
      vitals: "{vitals} · {gold}",
    },

    quests: {
      title: "## 📜 Carnet de quêtes",
      daily: "Quotidiennes",
      weekly: "Hebdomadaires",
      dailyReset: "renouvelées chaque jour à minuit UTC",
      weeklyReset: "renouvelées chaque lundi",
      group: "**{title}** *({reset})*",
      row: "{check} {label} - {progress} · +{xp} XP · +{gold} 🪙",
      dailySet: "Lot du jour : {state}",
      weeklySet: "Lot de la semaine : {state}",
      setDone: "✅ complété (+{echoes} 🔷)",
      setPending: "en cours",
      echoes: "Tu possèdes **{count}** fragments d'écho.",
      hint: "Les quêtes se valident toutes seules : joue, elles se cochent.",
    },

    story: {
      doneTitle: "## 🏆 Ton histoire est écrite",
      doneBody:
        "Tu as entendu la dernière voix des Terres. Les gardiens restent affrontables, et les Terres se souviendront de ton nom.",
      act: "## {emoji} {act}",
      chapter: "**Chapitre {index}/{total} - {title}**\n*{narration}*",
      objectives: "**Objectifs**\n{list}",
      objectiveRow: "{check} {label} - {progress}",
      requirements: "**Pour sceller le chapitre**\n{list}",
      levelRequirement: "{check} Niveau {required} requis (tu es niveau {current})",
      echoRequirement: "{check} {required} fragments d'écho (tu en as {current})",
      progress: "Avancement du scénario {bar} {percent} %",
      ready: "Tout est prêt : scelle le chapitre pour ouvrir la suite.",
      keepGoing: "Continue d'explorer : les objectifs se remplissent en jouant.",
    },

    seal: {
      title: "## 🔷 {title} - chapitre scellé",
      narration: "*{narration}*",
      reward: "✨ +{xp} XP · 🪙 +{gold}",
      next: "**Suite : {title}**\n*{narration}*",
    },

    journal: {
      title: "## 📓 Journal de {name}",
      row: "<t:{timestamp}:d> {icon} {message}",
      empty: "Ton journal est encore vierge.",
    },

    trade: {
      nothing: "*rien*",
      gives: "**{name} donne**\n{items}",
      entry: "{quantity} × {item}",
      coins: "{gold} 🪙",
      offerTitle: "## 🤝 Proposition d'échange",
      offerIntro: "<@{initiator}> propose un échange à <@{target}>.",
      expires: "⏳ La proposition expire dans {duration}.",
      doneTitle: "## 🤝 Échange conclu",
      purses: "Bourses : {initiator} {initiatorGold} 🪙 · {target} {targetGold} 🪙",
      declinedTitle: "## ✖️ Proposition refusée",
      cancelledTitle: "## 🗑️ Proposition annulée",
      listTitle: "## 🤝 Échanges en cours",
      emptyTitle: "## 🤝 Échanges",
      empty: "Aucune proposition en cours.",
      emptyHint:
        "Propose un échange avec `/aventure echange proposer` (à partir du niveau {level}).",
      row: "**#{id}** {direction} **{name}** · expire dans {duration}",
      received: "reçue de",
      sent: "envoyée à",
      youGive: "Tu donnes : {items}",
      youGet: "Tu reçois : {items}",
      hint: "Réponds depuis le message de la proposition, ou avec `/aventure echange repondre`.",
      summary: "{offered} contre {requested}",
      summaryNothing: "rien",
      logEntry: "Échange avec {name} : {summary}",
    },

    upgrade: {
      appliedTitle: "## ⚒️ {emoji} {item} +{level}",
      applied: "Renforcement réussi : les bonus de la pièce passent à **+{percent} %**.",
      paid: "Coût payé : {gold} 🪙 · {materials}",
      purse: "Ta bourse : {gold} 🪙",
      planTitle: "## ⚒️ Renforcer {emoji} {item}",
      plan: "Palier actuel : **+{current}** → **+{next}** (bonus de la pièce +{percent} %)",
      cost: "Coût : {gold} 🪙 · {materials}",
      missing: "❌ Il te manque {missing}.",
      ready:
        "✅ Tu as tout ce qu'il faut : `/aventure renforcer objet:<pièce>` pour lancer la forge.",
      material: "{quantity} × {item}",
    },
  },

  replies: {
    welcomeTitle: "{emoji} Bienvenue dans les Terres de Gaulia",
    welcomeBody:
      "Tu commences {class} : *{passive}*\n\nTout se pilote aux boutons sous tes messages, ou à la commande si tu préfères : `/aventure explorer`, `/aventure histoire`, `/aventure quetes`.",
    startedTitle: "{emoji} Ton aventure commence",
    startedBody:
      "Ta fiche est prête. Clique sur **Explorer** pour faire tes premiers pas, et reviens au tutoriel quand tu veux avec `/aventure tuto`.",

    notYoursTitle: "Ce n'est pas ton aventure",
    notYoursBody:
      "Ce message appartient à un autre aventurier. Lance la tienne avec `/aventure commencer`.",

    boughtTitle: "Achat conclu",
    boughtLine: "{quantity} × {item} pour {total}.",
    boughtOne: "{item} pour {total}.",
    purseLeft: "Il te reste {gold}.",

    soldTitle: "Vente conclue",
    soldLine: "{quantity} × {item} vendu(s) pour {total}.",
    purse: "Ta bourse : {gold}.",

    craftedTitle: "Forge terminée",
    craftedLine: "{quantity} × {item} sort de l'enclume.",

    equippedTitle: "Pièce équipée",
    equippedBody: "{item} est maintenant portée.",
    unequippedTitle: "Pièce retirée",
    unequippedBody: "{item} retourne dans ton sac.",

    usedTitle: "{item} utilisé",
    usedHp: "❤️ +{amount} PV",
    usedEnergy: "⚡ +{amount} énergie",
    usedXp: "✨ +{amount} XP",
    usedNothing: "Aucun effet : tout était déjà au maximum.",

    noPotionTitle: "Aucune potion",
    noPotionBody: "Ton sac est vide de quoi te soigner. La boutique en vend, la forge en fabrique.",
    drankTitle: "{item} bue",
    healed: "❤️ +{amount} PV",

    upgradeNoticeTitle: "Au passage",

    autocompleteRecipe: "{item} - niveau {level}",
    autocompleteShop: "{item} - {price} pièces",
    autocompleteQuantity: "{item} ×{quantity}",
    autocompleteWorn: "{item} (porté)",
    autocompleteUpgrade: "{item} +{level}",
  },

  logs: {
    dungeon: "Gardien vaincu : {guardian} ({act})",
    achievement: "Haut fait : {name}",
    chapter: "Chapitre scellé : {title} ({index}/{total})",
  },
};

export default adventure;
