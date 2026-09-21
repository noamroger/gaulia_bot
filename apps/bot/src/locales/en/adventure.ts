import type { TranslationModule } from "../../i18n/catalog";

const adventure = {
  commands: {
    adventure: {
      name: "adventure",
      description: "Your adventure across the Lands of Gaulia",
      help: {
        details:
          "`/adventure tutorial` explains everything in a few pages, and creates your adventurer with one button. A long haul adventure game: you create an adventurer, explore the Lands of Gaulia, fight, gather, craft, upgrade your gear, trade with other players and follow a story in seven acts. Energy caps how much you can explore each day, and echo shards (earned from quests and the weekly dungeon) move the plot forward: finishing it takes more than a year of regular play. Playable in DM, and on a server in the channels its admins allow.",
        examples: [
          "adventure tutorial",
          "adventure tutorial topic:trading",
          "adventure start class:Warrior",
          "adventure explore",
          "adventure story",
          "adventure quests",
          "adventure dungeon fight:true",
          "adventure upgrade item:Iron sword preview:true",
          "adventure trade offer player:@Lea item:Drake scale quantity:5 requested_gold:2000",
        ],
      },
      subcommands: {
        tutorial: {
          name: "tutorial",
          description: "How to play: the basics, the story, trading",
          options: {
            topic: {
              name: "topic",
              description: "Jump straight to a tutorial chapter",
              choices: {
                basics: "🧭 First steps - create your adventurer and go explore",
                progression: "📈 Growing stronger - levels, stats, gear, upgrades",
                economy: "🪙 Gold, loot and forge - earn coins and make your kit",
                story: "📖 The story - chapters, echo shards, weekly dungeon",
                trading: "🤝 Trading with others - player trade and its rules",
                community: "🏅 Other adventurers - leaderboard, achievements, where to play",
                pace: "⏳ The pace of the game - a year long adventure, lived well",
              },
            },
          },
        },
        start: {
          name: "start",
          description: "Create your adventurer and pick a class",
          options: {
            class: {
              name: "class",
              description: "Warrior, mage or ranger",
              choices: {
                GUERRIER: "🛡️ Warrior - takes the hits and hits back hard",
                MAGE: "🔮 Mage - heavy damage, fragile defence",
                RODEUR: "🏹 Ranger - dodge, critical hits and better finds",
              },
            },
          },
        },
        profile: {
          name: "profile",
          description: "Your adventurer's sheet",
        },
        explore: {
          name: "explore",
          description: "Explore your region and face whatever lives there",
        },
        map: {
          name: "map",
          description: "The regions your story has opened",
        },
        travel: {
          name: "travel",
          description: "Move to another region",
          options: {
            region: {
              name: "region",
              description: "Where you are heading",
              choices: {
                clairiere: "🌾 Sowing Glade (level 1+)",
                "bois-bas": "🌲 Lowwood (level 8+)",
                tombes: "⚰️ Necropolis of the Seven Tombs (level 18+)",
                forges: "⚒️ Black Forges (level 30+)",
                "haut-givre": "🏔️ Highfrost (level 42+)",
                "cote-tempetes": "🌊 Storm Coast (level 55+)",
                "voute-astrale": "🌌 Astral Vault (level 68+)",
                "coeur-echos": "✨ Heart of Echoes (level 82+)",
              },
            },
          },
        },
        inventory: {
          name: "inventory",
          description: "Your bag and your gear",
        },
        equip: {
          name: "equip",
          description: "Wear (or take off) a piece of gear",
          options: {
            item: {
              name: "item",
              description: "Piece to wear",
            },
          },
        },
        use: {
          name: "use",
          description: "Use a consumable",
          options: {
            item: {
              name: "item",
              description: "Item to use",
            },
          },
        },
        shop: {
          name: "shop",
          description: "The merchant's counter",
        },
        buy: {
          name: "buy",
          description: "Buy an item from the merchant",
          options: {
            item: {
              name: "item",
              description: "Item to buy",
            },
            quantity: {
              name: "quantity",
              description: "How many to buy",
            },
          },
        },
        sell: {
          name: "sell",
          description: "Sell an item from your bag",
          options: {
            item: {
              name: "item",
              description: "Item to sell",
            },
            quantity: {
              name: "quantity",
              description: "How many to sell",
            },
          },
        },
        forge: {
          name: "forge",
          description: "The recipes open at your level",
        },
        craft: {
          name: "craft",
          description: "Craft an item",
          options: {
            recipe: {
              name: "recipe",
              description: "Recipe to craft",
            },
          },
        },
        upgrade: {
          name: "upgrade",
          description: "Upgrade a piece of gear with resources",
          options: {
            item: {
              name: "item",
              description: "Piece to upgrade",
            },
            preview: {
              name: "preview",
              description: "Show the cost without spending anything",
            },
          },
        },
        quests: {
          name: "quests",
          description: "Your daily and weekly quests",
        },
        story: {
          name: "story",
          description: "The current chapter and its objectives",
        },
        seal: {
          name: "seal",
          description: "Seal the finished chapter and open what comes next",
        },
        dungeon: {
          name: "dungeon",
          description: "The act's guardian, once a week",
          options: {
            fight: {
              name: "fight",
              description: "Face the guardian right now",
            },
          },
        },
        improve: {
          name: "improve",
          description: "Spend your stat points",
          options: {
            stat: {
              name: "stat",
              description: "Stat to raise",
              choices: {
                might: "Might - physical damage and health",
                agility: "Agility - crit, dodge, defence",
                spirit: "Spirit - magic damage",
              },
            },
            points: {
              name: "points",
              description: "How many points to spend",
            },
          },
        },
        leaderboard: {
          name: "leaderboard",
          description: "The ten greatest adventurers",
        },
        achievements: {
          name: "achievements",
          description: "The achievements you have unlocked",
        },
        journal: {
          name: "journal",
          description: "The milestones of your adventure",
        },
      },
      groups: {
        trade: {
          name: "trade",
          description: "Item and coin trades between adventurers",
          subcommands: {
            offer: {
              name: "offer",
              description: "Offer a trade to another adventurer",
              options: {
                player: {
                  name: "player",
                  description: "Who you want to trade with",
                },
                item: {
                  name: "item",
                  description: "Item you give",
                },
                quantity: {
                  name: "quantity",
                  description: "How many you give",
                },
                gold: {
                  name: "gold",
                  description: "Coins you give",
                },
                requested_item: {
                  name: "requested_item",
                  description: "Item you ask for in return",
                },
                requested_quantity: {
                  name: "requested_quantity",
                  description: "How many you ask for",
                },
                requested_gold: {
                  name: "requested_gold",
                  description: "Coins you ask for",
                },
              },
            },
            list: {
              name: "list",
              description: "Your open trade offers",
            },
            answer: {
              name: "answer",
              description: "Accept, decline or cancel an offer by its number",
              options: {
                number: {
                  name: "number",
                  description: "Number of the offer",
                },
                action: {
                  name: "action",
                  description: "What to do with this offer",
                  choices: {
                    accept: "Accept",
                    decline: "Decline (offer received)",
                    cancel: "Cancel (offer sent)",
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
    unknownSubcommand: "This subcommand does not exist.",
    noCharacter:
      "You do not have an adventurer yet. Run `/adventure tutorial`: it covers the basics and lets you create your character with one button (or `/adventure start` if you already know where you are going).",
    alreadyStarted: "You already have an adventurer. Check it with `/adventure profile`.",
    notEnoughPoints: "You only have {available} point(s) to spend, and you asked for {requested}.",
    botTrade: "Bots do not trade.",

    moduleDisabled:
      "The adventure module is off on this server. You can still play in DM with Gaulia.",
    channelBlocked: "The adventure is not allowed in this channel.",
    noAdventureChannel:
      "No adventure channel is open on this server. Ask an admin to open one from the dashboard, or play in DM with Gaulia.",
    adventureChannels: "The adventure is played in: {channels} - or in DM.",

    noEnergy:
      "You are out of energy. The next point comes back in {duration} (or use a travel ration).",
    tooHurt: "You are too battered to head out. Heal with `/adventure use`, or let some time pass.",

    dungeonCooldown:
      "The guardian will not show up before {duration}. One dungeon a week, no more.",
    dungeonEnergy: "A dungeon costs {cost} energy, and you have {current}.",
    dungeonHurt: "You are too battered to face a guardian. Heal up first.",

    unknownRecipe: "This recipe does not exist.",
    recipeLevel: "This recipe needs level {required}, and you are level {current}.",
    recipeGold: "You are {missing} coins short of paying the forge.",
    recipeMaterials: "You are missing: {missing}.",

    notForSale: "{item} is not sold anywhere.",
    itemLevel: "{item} is locked until level {required}, and you are level {current}.",
    notEnoughGold: "You are {missing} coins short of {quantity} × {item}.",
    notSellable: "No merchant is interested in {item}.",
    notOwned: "You do not own {quantity} × {item}.",
    unequipFirst: "Take this piece off before selling it.",

    notEquippable: "{item} cannot be equipped.",
    notOwnedSimple: "You do not own {item}.",
    itemLevelSimple: "{item} needs level {required}.",
    notUsable: "{item} cannot be used.",

    notGear: "{item} is not a piece of gear, so there is nothing to upgrade.",
    maxUpgrade: "{item} is already at the highest tier (+{max}).",
    cannotUpgrade: "{item} cannot be upgraded.",
    missingForUpgrade: "You are missing {missing} for this upgrade.",
    missingMaterial: "You are missing {item} for this upgrade.",

    tradeSelf: "You cannot trade with yourself.",
    tradeEmpty: "An empty offer is not worth much: add an item or some gold.",
    tradeTooManyItems: "A trade carries at most {max} items per side.",
    tradeLevel: "Trading opens at level {required}, and you are level {current}.",
    targetNoCharacter: "This member has no adventurer yet, so there is nothing to trade.",
    targetLevel: "This adventurer must reach level {required} before trading.",
    tradeBound: "{item} cannot be traded: it is bound to your own story.",
    tradeGold: "You are {missing} coins short for this trade.",
    tradeOtherGold: "The other adventurer no longer has enough coins for this trade.",
    tradeItems: "You do not own {quantity} × {item}.",
    tradeOtherItems: "The other adventurer no longer has {quantity} × {item}.",
    tradeEquipped: "{item} is equipped: take it off before trading it.",
    tradeOtherEquipped: "The other adventurer is wearing one of the promised pieces.",
    tradePending: "You already have {max} offers waiting: cancel one with `/adventure trade list`.",
    tradeGone: "This trade offer no longer exists.",
    tradeExpired: "This offer has expired.",
    tradeHandled: "This offer has already been handled.",
    tradeNotForYou: "This offer is not addressed to you.",
    tradeNotYours: "This offer is not yours.",
    tradeJustHandled: "This offer has just been handled.",
    tradeFailed: "The trade failed, try again.",

    zoneLocked: "{zone} only opens further along your story.",
    alreadyThere: "You are already at {zone}.",

    storyOver: "Your story is already over. The Lands are resting.",
    objectivesLeft: "You still have to: {objectives}.",
    chapterLevel: "This chapter needs level {required}, and you are level {current}.",
    chapterEchoes: "You need {required} echo shards to seal this chapter, and you have {current}.",
  },

  classes: {
    GUERRIER: {
      name: "Warrior",
      description: "Takes the hits and hits back hard. Easiest to play, hardest to kill.",
      passive: "Takes 15 % less damage.",
    },
    MAGE: {
      name: "Mage",
      description: "Strikes with the mind rather than the arm: high damage, fragile defence.",
      passive: "Deals 20 % more damage, but takes 10 % more.",
    },
    RODEUR: {
      name: "Ranger",
      description: "Quick and lucky: dodges, critical hits and better finds.",
      passive: "+10 % loot and more frequent critical hits.",
    },
  },

  slots: {
    arme: "Weapon",
    armure: "Armour",
    talisman: "Talisman",
  },

  families: {
    bete: "beasts",
    brigand: "brigands",
    "mort-vivant": "undead",
    elementaire: "elementals",
    drake: "drakes",
    echo: "echoes",
  },

  zones: {
    clairiere: {
      name: "Sowing Glade",
      description: "Fields, a well, and stories told after dark.",
      ambiances: [
        "The wind lays the wheat down and lifts it again, telling you nothing.",
        "An old man waves from afar, then goes back to his well.",
        "You follow a path to a milestone the rain has worn blank.",
      ],
    },
    "bois-bas": {
      name: "Lowwood",
      description: "The mist clings to the trunks here until noon.",
      ambiances: [
        "A crack, then nothing. The mist swallows every sound.",
        "You find a camp whose fire went out long ago.",
        "Fresh marks on a trunk: something came through before you.",
      ],
    },
    tombes: {
      name: "Necropolis of the Seven Tombs",
      description: "Seven slabs, six names. The seventh was never carved.",
      ambiances: [
        "Your steps echo twice: once for you, once for something else.",
        "A candle still burns on a grave. Nobody around.",
        "The wind passes between the slabs with the sound of a voice.",
      ],
    },
    forges: {
      name: "Black Forges",
      description: "Metal has been beaten here so long that the sky stayed grey.",
      ambiances: [
        "A hammer strikes far away, always on the same beat.",
        "Soot settles on your shoulders like warm snow.",
        "You pass an ore convoy with nobody leading it.",
      ],
    },
    "haut-givre": {
      name: "Highfrost",
      description: "Above the clouds, where the cold stands in for the law.",
      ambiances: [
        "The slope climbs on. You stop counting the hours.",
        "A footprint as wide as a shield, already half filled in.",
        "The silence up here is so complete that it whistles.",
      ],
    },
    "cote-tempetes": {
      name: "Storm Coast",
      description: "Cliffs, wrecks, and a sea that never settles.",
      ambiances: [
        "A bell rings out at sea, with no ship to carry it.",
        "The foam draws shapes on the sand, then wipes them away.",
        "You search a wreck: someone came through before you, recently.",
      ],
    },
    "voute-astrale": {
      name: "Astral Vault",
      description: "A ceiling of stars under the earth. Nobody knows who hung them.",
      ambiances: [
        "A star comes loose and falls slowly, very far away.",
        "Your shadow leans a way the light does not explain.",
        "You hear your own name, spoken in your own voice.",
      ],
    },
    "coeur-echos": {
      name: "Heart of Echoes",
      description: "Where the Lands remember. And where they answer.",
      ambiances: [
        "Everything you say comes back a moment later, slightly different.",
        "The ground carries your prints before your foot lands.",
        "A door with no wall opens, then closes on nothing.",
      ],
    },
  },

  monsters: {
    "lapin-hargneux": "Snappy hare",
    "loup-gris": "Grey wolf",
    "sanglier-furieux": "Furious boar",
    detrousseur: "Cutpurse",
    "araignee-sylve": "Woodland spider",
    "ours-bois-bas": "Lowwood bear",
    "goule-affamee": "Starving ghoul",
    "spectre-plaintif": "Wailing spectre",
    "chevalier-tombe": "Fallen knight",
    "forgeron-cendre": "Ash smith",
    "golem-scories": "Slag golem",
    "salamandre-forge": "Forge salamander",
    "veneur-givre": "Frost houndmaster",
    "drake-blanc": "White drake",
    "colosse-gel": "Frost colossus",
    "corsaire-tempete": "Storm corsair",
    "noye-rancunier": "Spiteful drowned",
    "drake-orage": "Storm drake",
    "veilleur-astral": "Astral watcher",
    "marcheur-vide": "Void walker",
    "choeur-brise": "Broken choir",
    "reflet-soi": "Reflection of yourself",
    "silence-ancien": "Ancient silence",
    "gardien-brume": "Guardian of the mist",
    "gardien-tombes": "Guardian of the tombs",
    "gardien-forges": "Guardian of the forges",
    "gardien-givre": "Guardian of the frost",
    "gardien-tempetes": "Guardian of the storms",
    "gardien-voute": "Guardian of the vault",
    "echo-premier": "First Echo",
  },

  achievements: {
    "premier-pas": { name: "First steps", description: "Explore for the first time." },
    marcheur: { name: "Walker", description: "Explore 100 times." },
    arpenteur: { name: "Surveyor", description: "Explore 1,000 times.", title: "the Surveyor" },
    infatigable: { name: "Tireless", description: "Explore 5,000 times.", title: "the Tireless" },
    "premier-sang": { name: "First blood", description: "Win your first fight." },
    chasseur: { name: "Hunter", description: "Win 250 fights." },
    fleau: { name: "Scourge of the Lands", description: "Win 2,500 fights.", title: "the Scourge" },
    "tombe-debout": {
      name: "Down and up again",
      description: "Lose a fight and set out anyway.",
    },
    "niveau-10": { name: "Seasoned", description: "Reach level 10." },
    "niveau-25": { name: "Veteran", description: "Reach level 25." },
    "niveau-50": { name: "Hero of the Lands", description: "Reach level 50.", title: "the Hero" },
    "niveau-75": { name: "Living legend", description: "Reach level 75." },
    "niveau-100": {
      name: "At the summit",
      description: "Reach level 100.",
      title: "the Sovereign",
    },
    "premier-donjon": { name: "Doorbreaker", description: "Clear your first dungeon." },
    "donjons-10": { name: "Regular of the depths", description: "Clear 10 dungeons." },
    "donjons-30": {
      name: "Guardian of guardians",
      description: "Clear 30 dungeons.",
      title: "the Breaker",
    },
    "serie-7": { name: "A whole week", description: "Hold a 7 day streak." },
    "serie-30": { name: "A month without fail", description: "Hold a 30 day streak." },
    "serie-180": {
      name: "Half a year",
      description: "Hold a 180 day streak.",
      title: "the Constant",
    },
    riche: { name: "Small fortune", description: "Hold 100,000 coins." },
    "acte-3": { name: "Under the necropolis", description: "Reach act III." },
    "acte-5": { name: "At the edge of the world", description: "Reach act V." },
    "acte-7": {
      name: "The heart of the Lands",
      description: "Reach act VII.",
      title: "the Listener",
    },
    forgeron: { name: "Smith's hand", description: "Upgrade a piece of gear." },
    "maitre-forge": {
      name: "Forge master",
      description: "Complete 25 upgrades.",
      title: "the Smith",
    },
    marchand: { name: "First market", description: "Close a trade with another adventurer." },
    caravanier: { name: "Caravaneer", description: "Close 50 trades.", title: "the Caravaneer" },
    fin: { name: "The last voice", description: "Finish the story.", title: "the Echo" },
  },

  story: {
    objectives: {
      explore: "Explore {target} times",
      exploreZone: "Explore {target} times - {zone}",
      defeatFamily: "Defeat {target} {family}",
      defeatCreatures: "Defeat {target} creatures",
      collect: "Bring back {target} × {item}",
      craft: "Craft {target} item(s)",
      dungeon: "Clear {target} dungeon(s)",
      dailySet: "Complete {target} daily quest set(s)",
      spendGold: "Spend {target} coins",
    },
    chapters: {
      a1c1: {
        objectives: { "EXPLORE:clairiere": "Comb the fields around the well" },
      },
      a1c3: {
        objectives: { DAILY_SET: "Hold three full days of adventure" },
      },
      a1c4: {
        objectives: { CRAFT: "Pull two pieces out of the forge" },
      },
      a1c5: {
        objectives: { DUNGEON: "Defeat the guardian of the mist in the dungeon" },
      },
      a2c3: {
        objectives: { SPEND_GOLD: "Spend 4,000 coins at the merchants" },
      },
      a2c5: {
        objectives: { DUNGEON: "Defeat the guardian of the tombs in the dungeon" },
      },
      a3c5: {
        objectives: { DUNGEON: "Defeat the guardian of the forges in the dungeon" },
      },
      a4c5: {
        objectives: { DUNGEON: "Defeat the guardian of the frost in the dungeon" },
      },
      a5c5: {
        objectives: { DUNGEON: "Defeat the guardian of the storms in the dungeon" },
      },
      a6c5: {
        objectives: { DUNGEON: "Defeat the guardian of the vault in the dungeon" },
      },
      a7c5: {
        objectives: { DUNGEON: "Defeat the First Echo in the dungeon" },
      },
    },
  },

  tutorial: {
    jump: "Jump to a tutorial chapter…",
    previous: "Previous",
    next: "Next",
    footer: "-# Adventure tutorial · page {page} of {total}",
    option: "{position}. {title}",
    classLine: "{emoji} **{name}** - {description}\n*{passive}*",
    pages: {
      basics: {
        title: "First steps",
        summary: "Create your adventurer and go explore",
        sections: {
          character: {
            heading: "Your adventurer",
            body: "You have **one adventurer**, the same everywhere: on every server where Gaulia lives, and in DM with it. Your progress follows you, it belongs to no server.\n\nPick a class to start, it sets your fighting style, not your fate:\n\n{classes}",
          },
          exploring: {
            heading: "Exploring is the heart of the game",
            body: "`/adventure explore` sends you across the region you stand in. You may run into a creature (the fight resolves in one go, you read the summary), make a find, or meet nothing at all. Either way you gain experience, often coins and loot.\n\nFrom there everything runs **on the buttons** under the message: explore again, open your bag, heal up. The commands stay there for anyone who prefers typing.",
          },
          energy: {
            heading: "Energy and health",
            body: "One exploration costs **{energyPerExplore} energy**. You get one back every {regenMinutes} minutes, up to **{energyMax}** in reserve, which is about {energyPerDay} a day if you drop by regularly.\n\nYour health climbs back on its own over time, or all at once with a potion. Losing a fight never costs you progress: you go home and patch yourself up, that is all. **There is no permanent death.**",
          },
        },
      },
      progression: {
        title: "Growing stronger",
        summary: "Levels, stats, gear, upgrades",
        sections: {
          levels: {
            heading: "Levels and stats",
            body: "Experience takes you up to level **{maxLevel}**. Every level restores your health in full and gives you **{pointsPerLevel} points** to spend with `/adventure improve`:\n\n**Might** - physical damage and health\n**Agility** - critical hits, dodge and defence\n**Spirit** - magic damage",
          },
          gear: {
            heading: "Gearing up",
            body: "Three slots: **weapon**, **armour**, **talisman**. A piece is worn from your bag (`/adventure inventory`, or the menu under the message). The best pieces are found while exploring, bought at the counter, or crafted.",
          },
          upgrading: {
            heading: "Upgrading your gear",
            body: "At the forge, a piece you already own can be upgraded up to **+{maxUpgrade}** with gold and materials. Every tier adds **{upgradePercent} %** to its bonuses, and nothing can break: the cost is known in advance, you gather the resources, the piece improves.\n\nCareful: the upgrade belongs to **your copy**. If you give away or sell the piece, the upgrade goes with it and the other player receives it at tier zero.",
          },
        },
      },
      economy: {
        title: "Gold, loot and forge",
        summary: "Earn coins and make your own kit",
        sections: {
          gold: {
            heading: "Where gold comes from",
            body: "From fights, finds, quests and resale. **Treasures** are good for nothing except being sold very dear: keep them for the merchant, not for your bag.",
          },
          counter: {
            heading: "The counter",
            body: "`/adventure shop` lists what the merchant offers at your level: potions, rations that restore energy, entry level gear. You buy from a dropdown. `/adventure sell` does the opposite, except for relics, which nobody buys back.",
          },
          forge: {
            heading: "The forge",
            body: "`/adventure forge` shows the recipes open at your level and what you are missing for each. Materials come from loot: pelts and wood at first, drake scales and elemental hearts later, echo shards at the very end. That is also where you upgrade your gear.",
          },
        },
      },
      story: {
        title: "The story",
        summary: "Chapters, echo shards, weekly dungeon",
        sections: {
          acts: {
            heading: "Seven acts, thirty five chapters",
            body: "The adventure tells a story: {actCount} acts, {chapterCount} chapters, a new region opened by each act. `/adventure story` shows you the current chapter and its objectives, which fill up simply by playing.",
          },
          shards: {
            heading: "Echo shards",
            body: "Meeting the objectives is not enough: to **seal** a chapter you need a level and some **echo shards**. They cannot be bought or farmed. They come from time passing:\n\n**+{perDaily}** per daily quest set completed\n**+{perWeekly}** per weekly set\n**+{perDungeon}** per dungeon cleared\nAnd rarely, a lost echo found while exploring.",
          },
          dungeon: {
            heading: "The dungeon of the week",
            body: "Every act has its guardian, which you can face **once every {dungeonDays} days** for {dungeonEnergy} energy. It is the big appointment: a lot of experience, gold, and the shards that move the story forward. A defeat does not burn the week, come back better equipped the same day.",
          },
          quests: {
            heading: "Quests",
            body: "A daily set and a weekly set, drawn at random. They tick **on their own** while you play: nothing to claim, nothing to forget. `/adventure quests` to see where you stand.",
          },
        },
      },
      trading: {
        title: "Trading with others",
        summary: "Trade between adventurers, and its rules",
        sections: {
          offering: {
            heading: "Offering a trade",
            body: "`/adventure trade offer` puts on the table what you give (items, coins, or both) and what you ask for in return. The other player receives the offer and answers with a button: **accept**, **decline**. You can cancel it while it is still open.\n\nThat covers gifts (you ask for nothing), sales (items for coins) and barter (items for items).",
          },
          rules: {
            heading: "The rules of the market",
            body: "Trading opens at **level {minLevel}** on both sides. An offer expires after **{expiryMinutes} minutes**, and you can have **{maxPending}** open at the same time, with at most {maxItems} items per side.\n\nNothing is locked while an offer waits: you keep playing normally. Both bags are checked again at the moment of acceptance, and everything moves at once, so neither side can be emptied without getting their share.",
          },
          bound: {
            heading: "What cannot be traded",
            body: "The **relics** won from the guardians stay with whoever earned them: they cannot be traded or sold. A piece you are wearing has to come off before it is given away. And the upgrade never travels.",
          },
          tracking: {
            heading: "Keeping track",
            body: "`/adventure trade list` sums up your open offers, received and sent. `/adventure trade answer` lets you answer by number when the original message is far back in the history. Every closed trade is written in both players' journals.",
          },
        },
      },
      community: {
        title: "Other adventurers",
        summary: "Leaderboard, achievements, where you can play",
        sections: {
          compare: {
            heading: "Measuring up",
            body: "`/adventure leaderboard` shows the ten greatest adventurers across every server, and your own rank. `/adventure achievements` lists what you have unlocked: some achievements grant a **title**, shown under your name on your sheet.",
          },
          where: {
            heading: "Where you can play",
            body: "In **DM** with Gaulia, always. On a server it depends on the admins: they pick the channels where the adventure is allowed, from the dashboard. If a command tells you the channel is not open, ask them, or carry on in DM, it is the same character.",
          },
          together: {
            heading: "Playing together",
            body: "There is no party and no player versus player: what you share is the economy. An advanced player can kit out a beginner, two players can split the materials they gather, and the leaderboard puts everyone on the same scale. The buttons on a message obey only its owner, so nobody can play in your place.",
          },
        },
      },
      pace: {
        title: "The pace of the game",
        summary: "A year long adventure, and how to live it well",
        sections: {
          duration: {
            heading: "It lasts a long time, on purpose",
            body: "Finishing the story takes **more than a year**. It is not a wall of experience to break through: real time is what counts, because echo shards only arrive with the days and the weeks. Playing twelve hours straight gets you no further than one good daily session.",
          },
          habit: {
            heading: "The right habit",
            body: "Drop by once or twice a day, burn your energy, finish your quest set, take your dungeon during the week. That is all. Your **streak of consecutive days** raises your loot, up to +30 %, and a missed day sends it back to 1, never to zero.",
          },
          tips: {
            heading: "Three tips to get started",
            body: "**1.** Spend your stat points as soon as you level up, they do nothing in reserve.\n**2.** Keep your materials: they are worth more at the forge than at the counter.\n**3.** Travel as soon as a region opens, the rewards are better there, and your story is waiting.",
          },
        },
      },
    },
  },

  buttons: {
    explore: "Explore",
    exploreAgain: "Explore again",
    heal: "Heal up",
    profile: "Profile",
    bag: "Bag",
    map: "Map",
    story: "Story",
    quests: "Quests",
    shop: "Shop",
    forge: "Forge",
    dungeon: "Dungeon",
    leaderboard: "Leaderboard",
    achievements: "Achievements",
    journal: "Journal",
    trades: "Trades",
    fightGuardian: "Face the guardian",
    sealChapter: "Seal the chapter",
    accept: "Accept",
    decline: "Decline",
    cancel: "Cancel",
  },

  combat: {
    summary: "⚔️ {rounds} exchanges · {dealt} damage dealt · {taken} taken",
    crits: {
      one: "💥 {count} critical hit landed.",
      other: "💥 {count} critical hits landed.",
    },
    dodges: {
      one: "🌀 {count} attack dodged.",
      other: "🌀 {count} attacks dodged.",
    },
    timeout: "🕰️ The fight drags on: you break off before you drop.",
  },

  notices: {
    levelUp: "⬆️ Level **{level}** reached!",
    levelUpPoints: "⬆️ Level **{level}** reached! Points to spend: `/adventure improve`.",
    combatBreak: "🤕 You break off just in time and head home to patch yourself up.",
    echoFound: "🔷 A lost echo rings under your feet: **+1 echo shard**.",
    dungeonWon: "🔷 The guardian gives way: **+{count} echo shards**.",
    dungeonLost:
      "💀 The guardian drives you back. Come back better equipped: it still waits for you today.",
    achievement: "{emoji} Achievement unlocked - **{name}**",
    questDone: "✅ Quest complete - {label} · +{xp} XP · +{gold} 🪙",
    dailySetDone: {
      one: "🔷 Daily set complete - +{count} echo shard.",
      other: "🔷 Daily set complete - +{count} echo shards.",
    },
    weeklySetDone: {
      one: "🔷 Weekly set complete - +{count} echo shard.",
      other: "🔷 Weekly set complete - +{count} echo shards.",
    },
    newAct: "{emoji} **{act}** begins. {intro}",
    newZone: "🗺️ New region open: {emoji} **{zone}**.",
    storyEnd:
      "🏆 **The Lands fall silent.** You have heard the last voice: your story is complete.",
    upgradeLost: "⚠️ The +{level} upgrade on {item} went away with the piece.",
    upgradeAtRisk: "{item} +{level}: the upgrade will be lost.",
  },

  views: {
    unnamed: "Adventurer",

    profile: {
      heading: "## {emoji} {name}",
      headingTitled: "## {emoji} {name} - *{title}*",
      subtitle: "{class} · level **{level}** · {zoneEmoji} {zone} · rank #{rank}",
      vitals: "❤️ **{hp} / {maxHp}** · ⚡ **{energy} / {maxEnergy}**",
      purse: "🪙 {gold} · 🔷 {echoes} shards",
      experience: "**Experience** {bar} {value}",
      maxLevel: "max level",
      offense: "⚔️ Attack **{attack}** · 🔮 Power **{power}** · 🛡️ Defence **{defense}**",
      rates: "💥 Crit **{crit} %** · 🌀 Dodge **{dodge} %**",
      stats: "Might {might} · Agility {agility} · Spirit {spirit}",
      pendingPoints: {
        one: " · **{count} point to spend**",
        other: " · **{count} points to spend**",
      },
      gear: "**Gear**",
      gearLine: "{slot} · {item}",
      emptySlot: "-",
      story: "**Story** {emoji} {act}",
      chapter: "Chapter {index}/{total} - *{title}*",
      storyDone: "**Story** 🏆 Story complete.",
      streak: {
        one: "🔥 Streak of **{count}** day (best: {best})",
        other: "🔥 Streak of **{count}** days (best: {best})",
      },
      activity: "🗺️ {explorations} explorations · ⚔️ {victories} wins · 🚪 {dungeons} dungeons",
    },

    stats: {
      title: "### 🎯 Spending your stat points",
      available: {
        one: "You have **{count} point** to place with `/adventure improve stat:<...> points:<n>`.",
        other:
          "You have **{count} points** to place with `/adventure improve stat:<...> points:<n>`.",
      },
      none: "No point available: level up to earn more.",
      might: "**Might** {value} - physical damage and health (attack {attack}, max HP {maxHp})",
      agility: "**Agility** {value} - crit, dodge and defence ({crit} % / {dodge} %)",
      spirit: "**Spirit** {value} - magic damage (power {power})",
    },

    leaderboard: {
      title: "## 🏅 The greatest adventurers",
      row: "{position} {name} - {emoji} level {level} · act {act} · {xp} XP",
      empty: "Nobody has taken the road yet.",
      yourRank: "Your rank: **#{rank}**",
    },

    achievements: {
      title: "## 🏆 Achievements - {unlocked}/{total}",
      unlockedRow: "{check} {emoji} **{name}** - {description}",
      lockedRow: "{check} {emoji} {name} - {description}",
      empty: "No achievement yet.",
    },

    map: {
      title: "## 🗺️ The Lands of Gaulia",
      here: "> 📍 **You are at {emoji} {zone}**\n> *{description}*",
      unknown: "> 📍 **Unknown position**",
      row: "{marker}{emoji} **{zone}** - suggested level {level}{suffix}",
      youAreHere: " · **you are here**",
      hint: "Pick a destination with a button, or `/adventure travel region:<name>`.",
    },

    bag: {
      title: "## 🎒 {name}'s bag",
      purse: "{gold} · 🔷 {echoes} echo shards",
      groups: {
        gear: "Gear",
        consumables: "Consumables",
        materials: "Materials",
        treasures: "Treasures & relics",
      },
      row: "{rarity} {item}{upgrade}{quantity}{slot}{worn}",
      slot: " ({slot})",
      worn: " · **worn**",
      empty: "Your bag is empty. Go explore!",
      hint: "Equip or use an item with the menu below, or `/adventure equip` and `/adventure use`.",
      select: "Equip or use an item…",
      takeOff: "Already worn - take it off",
      equipOption: "Equip - {bonus}",
    },

    shop: {
      title: "## 🏪 Sowing Counter",
      purse: "Your purse: {gold}",
      row: "{rarity} {item} - {price}{locked}",
      locked: " · 🔒 level {level}",
      empty: "The merchant has nothing for you today.",
      hint: "Buy with the menu, or `/adventure buy item:<name> quantity:<n>`. Sell back with `/adventure sell`.",
      select: "Buy an item…",
      option: "{name} - {price} coins",
    },

    forge: {
      title: "## ⚒️ Forge",
      purse: "Your purse: {gold}",
      recipe: "**{item}**{quantity} - {gold}",
      ingredient: "{check} {quantity} × {item} ({owned})",
      empty: "No recipe is open at your level yet.",
      select: "Craft an item…",
      option: "{gold} coins · level {level}",
      upgradeTitle: "**Upgrading**",
      upgradeRow: "{item} → +{next}: {gold} · {materials}",
      upgradeEmpty: "No piece of gear to upgrade in your bag.",
      upgradeHint:
        "`/adventure upgrade item:<piece>` - the upgrade stays on your own copy and does not follow a trade.",
      upgradeSelect: "Upgrade a piece of gear…",
      upgradeOption: "{gold} coins · {materials}",
      upgradeLabel: "{item} +{current} → +{next}",
      material: "{quantity} × {item}",
    },

    explore: {
      victory: "## {emoji} {monster} defeated",
      defeat: "## {emoji} {monster} drives you back",
      zoneLevel: "{emoji} {zone} · level {level}",
      zone: "{emoji} {zone}",
      findTitle: "## 🔎 A find",
      calmTitle: "## 🧭 Exploration",
      ambiance: "*{ambiance}*",
      xp: "✨ +{xp} XP",
      gold: "🪙 +{gold}",
      loot: "🎒 {list}",
      lootEntry: "{quantity} × {item}",
      vitals: "❤️ {hp} · ⚡ {energy}/{maxEnergy} · 🪙 {gold}",
    },

    dungeon: {
      title: "## 🚪 Dungeon - {act}",
      guardian: "Guardian: {emoji} **{name}** (level {level})",
      cooldown: "⏳ Next attempt in **{duration}**.",
      open: "The way is open: face the guardian with a button, or `/adventure dungeon fight:true`.",
      reward:
        "A cleared dungeon brings in most of your echo shards, it is the appointment of the week.",
      won: "## {emoji} Guardian defeated",
      held: "## {emoji} The guardian holds",
      guardianLine: "**{name}** - level {level}",
    },

    travel: {
      title: "## {emoji} On the road to {zone}",
      description: "*{description}*",
      vitals: "{vitals} · {gold}",
    },

    quests: {
      title: "## 📜 Quest log",
      daily: "Daily",
      weekly: "Weekly",
      dailyReset: "renewed every day at midnight UTC",
      weeklyReset: "renewed every Monday",
      group: "**{title}** *({reset})*",
      row: "{check} {label} - {progress} · +{xp} XP · +{gold} 🪙",
      dailySet: "Today's set: {state}",
      weeklySet: "This week's set: {state}",
      setDone: "✅ complete (+{echoes} 🔷)",
      setPending: "in progress",
      echoes: "You hold **{count}** echo shards.",
      hint: "Quests tick themselves: play, and they get checked off.",
    },

    story: {
      doneTitle: "## 🏆 Your story is written",
      doneBody:
        "You have heard the last voice of the Lands. The guardians can still be fought, and the Lands will remember your name.",
      act: "## {emoji} {act}",
      chapter: "**Chapter {index}/{total} - {title}**\n*{narration}*",
      objectives: "**Objectives**\n{list}",
      objectiveRow: "{check} {label} - {progress}",
      requirements: "**To seal the chapter**\n{list}",
      levelRequirement: "{check} Level {required} needed (you are level {current})",
      echoRequirement: "{check} {required} echo shards (you have {current})",
      progress: "Story progress {bar} {percent} %",
      ready: "Everything is ready: seal the chapter to open what comes next.",
      keepGoing: "Keep exploring: the objectives fill up as you play.",
    },

    seal: {
      title: "## 🔷 {title} - chapter sealed",
      narration: "*{narration}*",
      reward: "✨ +{xp} XP · 🪙 +{gold}",
      next: "**Next: {title}**\n*{narration}*",
    },

    journal: {
      title: "## 📓 {name}'s journal",
      row: "<t:{timestamp}:d> {icon} {message}",
      empty: "Your journal is still blank.",
    },

    trade: {
      nothing: "*nothing*",
      gives: "**{name} gives**\n{items}",
      entry: "{quantity} × {item}",
      coins: "{gold} 🪙",
      offerTitle: "## 🤝 Trade offer",
      offerIntro: "<@{initiator}> offers a trade to <@{target}>.",
      expires: "⏳ The offer expires in {duration}.",
      doneTitle: "## 🤝 Trade closed",
      purses: "Purses: {initiator} {initiatorGold} 🪙 · {target} {targetGold} 🪙",
      declinedTitle: "## ✖️ Offer declined",
      cancelledTitle: "## 🗑️ Offer cancelled",
      listTitle: "## 🤝 Open trades",
      emptyTitle: "## 🤝 Trades",
      empty: "No offer in progress.",
      emptyHint: "Offer a trade with `/adventure trade offer` (from level {level}).",
      row: "**#{id}** {direction} **{name}** · expires in {duration}",
      received: "received from",
      sent: "sent to",
      youGive: "You give: {items}",
      youGet: "You get: {items}",
      hint: "Answer from the offer message, or with `/adventure trade answer`.",
      summary: "{offered} for {requested}",
      summaryNothing: "nothing",
      logEntry: "Trade with {name}: {summary}",
    },

    upgrade: {
      appliedTitle: "## ⚒️ {emoji} {item} +{level}",
      applied: "Upgrade done: the bonuses of the piece go up to **+{percent} %**.",
      paid: "Cost paid: {gold} 🪙 · {materials}",
      purse: "Your purse: {gold} 🪙",
      planTitle: "## ⚒️ Upgrading {emoji} {item}",
      plan: "Current tier: **+{current}** → **+{next}** (piece bonuses +{percent} %)",
      cost: "Cost: {gold} 🪙 · {materials}",
      missing: "❌ You are missing {missing}.",
      ready:
        "✅ You have everything you need: `/adventure upgrade item:<piece>` to fire up the forge.",
      material: "{quantity} × {item}",
    },
  },

  replies: {
    welcomeTitle: "{emoji} Welcome to the Lands of Gaulia",
    welcomeBody:
      "You start out as a {class}: *{passive}*\n\nEverything runs on the buttons under your messages, or by command if you prefer: `/adventure explore`, `/adventure story`, `/adventure quests`.",
    startedTitle: "{emoji} Your adventure begins",
    startedBody:
      "Your sheet is ready. Hit **Explore** to take your first steps, and come back to the tutorial whenever you like with `/adventure tutorial`.",

    notYoursTitle: "This is not your adventure",
    notYoursBody:
      "This message belongs to another adventurer. Start yours with `/adventure start`.",

    boughtTitle: "Purchase done",
    boughtLine: "{quantity} × {item} for {total}.",
    boughtOne: "{item} for {total}.",
    purseLeft: "You have {gold} left.",

    soldTitle: "Sale done",
    soldLine: "{quantity} × {item} sold for {total}.",
    purse: "Your purse: {gold}.",

    craftedTitle: "Forging done",
    craftedLine: "{quantity} × {item} comes off the anvil.",

    equippedTitle: "Gear equipped",
    equippedBody: "{item} is now worn.",
    unequippedTitle: "Gear removed",
    unequippedBody: "{item} goes back in your bag.",

    usedTitle: "{item} used",
    usedHp: "❤️ +{amount} HP",
    usedEnergy: "⚡ +{amount} energy",
    usedXp: "✨ +{amount} XP",
    usedNothing: "No effect: everything was already full.",

    noPotionTitle: "No potion",
    noPotionBody: "Your bag has nothing to heal with. The shop sells some, the forge makes some.",
    drankTitle: "{item} drunk",
    healed: "❤️ +{amount} HP",

    upgradeNoticeTitle: "Along the way",

    autocompleteRecipe: "{item} - level {level}",
    autocompleteShop: "{item} - {price} coins",
    autocompleteQuantity: "{item} ×{quantity}",
    autocompleteWorn: "{item} (worn)",
    autocompleteUpgrade: "{item} +{level}",
  },

  logs: {
    dungeon: "Guardian defeated: {guardian} ({act})",
    achievement: "Achievement: {name}",
    chapter: "Chapter sealed: {title} ({index}/{total})",
  },
} satisfies TranslationModule;

export type AdventureStrings = typeof adventure;

export default adventure;
