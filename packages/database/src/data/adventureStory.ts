/**
 * Story: seven acts of five chapters. Like the item catalog it is shared with the API, so the
 * admin panel can show the act and chapter each player reached, and its text is bilingual so every
 * reader gets their own language.
 *
 * A chapter ends when its objectives are met, the required level is reached, and it is then sealed
 * with echo shards - the resource that only real time grants (see adventurePacing.ts). That triple
 * lock is what spreads the story over more than a year without ever forcing a grind.
 *
 * Adding an act means adding an entry here (plus, possibly, its zone and its guardian).
 */

import type { LocalizedText } from "./localized";

/** Creature families; the bestiary itself lives in the bot module. */
export type AdventureMonsterFamily =
  "bete" | "brigand" | "mort-vivant" | "elementaire" | "drake" | "echo";

export type AdventureObjectiveType =
  "EXPLORE" | "DEFEAT_FAMILY" | "COLLECT" | "CRAFT" | "DUNGEON" | "DAILY_SET" | "SPEND_GOLD";

export interface AdventureChapterObjective {
  type: AdventureObjectiveType;
  target: number;
  zoneId?: string;
  family?: AdventureMonsterFamily;
  itemId?: string;
}

export interface AdventureChapterReward {
  xp: number;
  gold: number;
  items?: { itemId: string; quantity: number }[];
}

export interface AdventureChapterDefinition {
  id: string;
  title: LocalizedText;
  /** Text read when the chapter opens. */
  narration: LocalizedText;
  levelRequirement: number;
  echoCost: number;
  objectives: AdventureChapterObjective[];
  reward: AdventureChapterReward;
}

export interface AdventureActDefinition {
  id: string;
  title: LocalizedText;
  emoji: string;
  intro: LocalizedText;
  /** Zone the act opens, and guardian fought in its weekly dungeon. */
  zoneId: string;
  guardianId: string;
  chapters: AdventureChapterDefinition[];
}

export const ADVENTURE_ACTS: readonly AdventureActDefinition[] = [
  {
    id: "acte-1",
    title: { en: "Act I - The Sowing", fr: "Acte I - Les Semailles" },
    emoji: "🌾",
    intro: {
      en: "One morning the bells of the Glade rang on their own. Since then the elders speak of an echo back from the depths of the Lands.",
      fr: "Un matin, les cloches de la Clairière ont sonné toutes seules. Depuis, les anciens parlent d'un écho revenu du fond des Terres.",
    },
    zoneId: "bois-bas",
    guardianId: "gardien-brume",
    chapters: [
      {
        id: "a1c1",
        title: { en: "The well that answers", fr: "Le puits qui répond" },
        narration: {
          en: "You drop a coin into the old well. It never hits the bottom, but a voice thanks you.",
          fr: "Tu jettes une pièce dans le vieux puits. Elle ne touche jamais le fond, mais une voix te remercie.",
        },
        levelRequirement: 3,
        echoCost: 7,
        objectives: [
          {
            type: "EXPLORE",
            zoneId: "clairiere",
            target: 15,
          },
          { type: "DEFEAT_FAMILY", family: "bete", target: 10 },
        ],
        reward: { xp: 200, gold: 150, items: [{ itemId: "potion-mineure", quantity: 3 }] },
      },
      {
        id: "a1c2",
        title: { en: "What the mist keeps", fr: "Ce que la brume garde" },
        narration: {
          en: "Lowwood moved closer to the village during the night. The woodcutters refuse to go back.",
          fr: "Les Bois-Bas se sont rapprochés du village pendant la nuit. Les bûcherons refusent d'y retourner.",
        },
        levelRequirement: 6,
        echoCost: 7,
        objectives: [
          { type: "EXPLORE", zoneId: "bois-bas", target: 20 },
          { type: "COLLECT", itemId: "bois-noueux", target: 12 },
        ],
        reward: { xp: 450, gold: 320 },
      },
      {
        id: "a1c3",
        title: { en: "The cutpurses of the path", fr: "Les détrousseurs du sentier" },
        narration: {
          en: "Someone strips travellers and leaves a coin on their eyelids. Nobody knows why.",
          fr: "Quelqu'un dépouille les voyageurs et laisse une pièce sur leurs paupières. Personne ne sait pourquoi.",
        },
        levelRequirement: 9,
        echoCost: 7,
        objectives: [
          { type: "DEFEAT_FAMILY", family: "brigand", target: 12 },
          { type: "DAILY_SET", target: 3 },
        ],
        reward: { xp: 800, gold: 600, items: [{ itemId: "amulette-simple", quantity: 1 }] },
      },
      {
        id: "a1c4",
        title: { en: "The village forge", fr: "La forge du village" },
        narration: {
          en: "The smith agrees to teach you, as long as you bring back something to work with.",
          fr: "Le forgeron accepte de t'apprendre, à condition que tu lui rapportes de quoi travailler.",
        },
        levelRequirement: 12,
        echoCost: 7,
        objectives: [
          { type: "COLLECT", itemId: "fer-brut", target: 15 },
          { type: "CRAFT", target: 2 },
        ],
        reward: { xp: 1_300, gold: 900 },
      },
      {
        id: "a1c5",
        title: { en: "The guardian of the mist", fr: "Le gardien de la brume" },
        narration: {
          en: "The mist has taken shape. It wears armour nobody forged, and it is waiting for you.",
          fr: "La brume a pris forme. Elle porte une armure que personne n'a forgée, et elle t'attend.",
        },
        levelRequirement: 15,
        echoCost: 7,
        objectives: [
          { type: "DUNGEON", target: 1 },
          { type: "COLLECT", itemId: "relique-cor-brume", target: 1 },
        ],
        reward: { xp: 2_200, gold: 1_500, items: [{ itemId: "potion-majeure", quantity: 3 }] },
      },
    ],
  },
  {
    id: "acte-2",
    title: { en: "Act II - The Seven Tombs", fr: "Acte II - Les Sept Tombes" },
    emoji: "⚰️",
    intro: {
      en: "The horn of the mist opens a road to the necropolis. Six names are carved there. The seventh is waiting for you.",
      fr: "Le cor de la brume ouvre une route vers la nécropole. Six noms y sont gravés. Le septième t'attend.",
    },
    zoneId: "tombes",
    guardianId: "gardien-tombes",
    chapters: [
      {
        id: "a2c1",
        title: { en: "The road of slabs", fr: "La route des dalles" },
        narration: {
          en: "Every slab on the path carries a date. The last one is today's.",
          fr: "Chaque dalle du chemin porte une date. La dernière est celle d'aujourd'hui.",
        },
        levelRequirement: 19,
        echoCost: 11,
        objectives: [
          { type: "EXPLORE", zoneId: "tombes", target: 25 },
          { type: "DEFEAT_FAMILY", family: "mort-vivant", target: 20 },
        ],
        reward: { xp: 3_000, gold: 1_800 },
      },
      {
        id: "a2c2",
        title: { en: "What is left of the watchers", fr: "Ce qui reste des veilleurs" },
        narration: {
          en: "The watchers of the necropolis died at their posts. They are still there.",
          fr: "Les veilleurs de la nécropole sont morts à leur poste. Ils y sont toujours.",
        },
        levelRequirement: 22,
        echoCost: 11,
        objectives: [
          { type: "COLLECT", itemId: "os-blanchi", target: 20 },
          { type: "COLLECT", itemId: "essence-spectrale", target: 8 },
        ],
        reward: { xp: 4_200, gold: 2_400 },
      },
      {
        id: "a2c3",
        title: { en: "The merchant of silence", fr: "Le marchand de silence" },
        narration: {
          en: "A pedlar sells candles that light nothing. He says they are good for something else.",
          fr: "Un colporteur vend des bougies qui n'éclairent rien. Il dit qu'elles servent à autre chose.",
        },
        levelRequirement: 25,
        echoCost: 11,
        objectives: [
          { type: "SPEND_GOLD", target: 4_000 },
          { type: "DAILY_SET", target: 5 },
        ],
        reward: { xp: 5_500, gold: 3_000, items: [{ itemId: "oeil-loup", quantity: 1 }] },
      },
      {
        id: "a2c4",
        title: { en: "The knight who refuses", fr: "Le chevalier qui refuse" },
        narration: {
          en: "An empty suit of armour bars the seventh tomb. It means you no harm, and it will not move either.",
          fr: "Une armure vide barre la septième tombe. Elle ne te veut aucun mal ; elle ne bougera pas non plus.",
        },
        levelRequirement: 28,
        echoCost: 11,
        objectives: [
          { type: "DEFEAT_FAMILY", family: "mort-vivant", target: 40 },
          { type: "CRAFT", target: 3 },
        ],
        reward: { xp: 7_000, gold: 4_000 },
      },
      {
        id: "a2c5",
        title: { en: "The seventh name", fr: "Le septième nom" },
        narration: {
          en: "The last slab lifts. The name carved beneath is yours, written in a hand you recognise.",
          fr: "La dernière dalle se soulève. Le nom gravé dessous est le tien, écrit d'une main que tu reconnais.",
        },
        levelRequirement: 31,
        echoCost: 11,
        objectives: [
          { type: "DUNGEON", target: 1 },
          { type: "COLLECT", itemId: "relique-clef-tombes", target: 1 },
        ],
        reward: { xp: 9_000, gold: 5_500, items: [{ itemId: "potion-majeure", quantity: 5 }] },
      },
    ],
  },
  {
    id: "acte-3",
    title: { en: "Act III - The Black Forges", fr: "Acte III - Les Forges Noires" },
    emoji: "⚒️",
    intro: {
      en: "The key of the tombs opens a hatch under the necropolis. Below, metal has been beaten for centuries without a pause.",
      fr: "La clef des tombes ouvre une trappe sous la nécropole. En dessous, on bat le métal depuis des siècles sans jamais s'arrêter.",
    },
    zoneId: "forges",
    guardianId: "gardien-forges",
    chapters: [
      {
        id: "a3c1",
        title: { en: "The noise that never stops", fr: "Le bruit qui ne cesse pas" },
        narration: {
          en: "The hammer strikes every three seconds. It has never missed a beat.",
          fr: "Le marteau frappe toutes les trois secondes. Il n'a jamais manqué un coup.",
        },
        levelRequirement: 34,
        echoCost: 16,
        objectives: [
          { type: "EXPLORE", zoneId: "forges", target: 30 },
          { type: "DEFEAT_FAMILY", family: "elementaire", target: 20 },
        ],
        reward: { xp: 12_000, gold: 7_000 },
      },
      {
        id: "a3c2",
        title: { en: "The impossible order", fr: "La commande impossible" },
        narration: {
          en: "The ash foreman hands you a list. It is written in a dead language, but the numbers are clear.",
          fr: "Le contremaître de cendre te tend une liste. Elle est écrite dans une langue morte, mais les chiffres sont clairs.",
        },
        levelRequirement: 37,
        echoCost: 16,
        objectives: [
          { type: "COLLECT", itemId: "lingot-fer", target: 20 },
          { type: "CRAFT", target: 5 },
        ],
        reward: { xp: 15_000, gold: 9_000 },
      },
      {
        id: "a3c3",
        title: { en: "The deep veins", fr: "Les veines profondes" },
        narration: {
          en: "Lower still, the ore is warm and beats faintly.",
          fr: "Plus bas encore, le minerai est tiède et bat faiblement.",
        },
        levelRequirement: 40,
        echoCost: 16,
        objectives: [
          { type: "COLLECT", itemId: "coeur-elementaire", target: 4 },
          { type: "EXPLORE", zoneId: "forges", target: 40 },
        ],
        reward: { xp: 19_000, gold: 11_000, items: [{ itemId: "coeur-braise", quantity: 1 }] },
      },
      {
        id: "a3c4",
        title: { en: "What was cast here", fr: "Ce qu'on a fondu ici" },
        narration: {
          en: "Human shapes on the moulds. These vats did not always pour blades.",
          fr: "Sur les moules, des formes humaines. On n'a pas toujours coulé des lames dans ces cuves.",
        },
        levelRequirement: 43,
        echoCost: 16,
        objectives: [
          { type: "DEFEAT_FAMILY", family: "elementaire", target: 45 },
          { type: "DAILY_SET", target: 8 },
        ],
        reward: { xp: 23_000, gold: 14_000 },
      },
      {
        id: "a3c5",
        title: { en: "The ember that will not die", fr: "La braise qui ne meurt pas" },
        narration: {
          en: "At the bottom of the last forge, a single ember. It watches you come closer.",
          fr: "Au fond de la dernière forge, une braise seule. Elle te regarde approcher.",
        },
        levelRequirement: 46,
        echoCost: 16,
        objectives: [
          { type: "DUNGEON", target: 1 },
          { type: "COLLECT", itemId: "relique-braise-eternelle", target: 1 },
        ],
        reward: { xp: 28_000, gold: 18_000, items: [{ itemId: "elixir-supreme", quantity: 2 }] },
      },
    ],
  },
  {
    id: "acte-4",
    title: { en: "Act IV - Highfrost", fr: "Acte IV - Le Haut-Givre" },
    emoji: "🏔️",
    intro: {
      en: "The eternal ember makes the cold bearable. Just enough to climb above the clouds.",
      fr: "La braise éternelle rend le froid supportable. Juste assez pour monter au-dessus des nuages.",
    },
    zoneId: "haut-givre",
    guardianId: "gardien-givre",
    chapters: [
      {
        id: "a4c1",
        title: { en: "Above the clouds", fr: "Au-dessus des nuages" },
        narration: {
          en: "From here the Lands look like a map folded one time too many.",
          fr: "D'ici, les Terres ressemblent à une carte qu'on aurait pliée trop souvent.",
        },
        levelRequirement: 50,
        echoCost: 21,
        objectives: [
          { type: "EXPLORE", zoneId: "haut-givre", target: 35 },
          { type: "DEFEAT_FAMILY", family: "drake", target: 10 },
        ],
        reward: { xp: 34_000, gold: 21_000 },
      },
      {
        id: "a4c2",
        title: { en: "The houndmasters", fr: "Les veneurs" },
        narration: {
          en: "They hunt drakes for their scales, and travellers for the rest.",
          fr: "Ils chassent les drakes pour leurs écailles et les voyageurs pour le reste.",
        },
        levelRequirement: 53,
        echoCost: 21,
        objectives: [
          { type: "DEFEAT_FAMILY", family: "brigand", target: 30 },
          { type: "COLLECT", itemId: "ecaille-drake", target: 15 },
        ],
        reward: { xp: 40_000, gold: 25_000 },
      },
      {
        id: "a4c3",
        title: { en: "The pass of statues", fr: "Le col des statues" },
        narration: {
          en: "Dozens of ice figures, all turned towards the summit. Some of them wear your gear.",
          fr: "Des dizaines de silhouettes de glace, toutes tournées vers le sommet. Certaines portent ton équipement.",
        },
        levelRequirement: 56,
        echoCost: 21,
        objectives: [
          { type: "EXPLORE", zoneId: "haut-givre", target: 50 },
          { type: "CRAFT", target: 8 },
        ],
        reward: { xp: 47_000, gold: 29_000, items: [{ itemId: "larme-lune", quantity: 1 }] },
      },
      {
        id: "a4c4",
        title: { en: "The long breath", fr: "Le souffle long" },
        narration: {
          en: "A breathing under the ice, slow and vast. Every six minutes.",
          fr: "Une respiration sous la glace, lente, immense. Toutes les six minutes.",
        },
        levelRequirement: 59,
        echoCost: 21,
        objectives: [
          { type: "DEFEAT_FAMILY", family: "elementaire", target: 60 },
          { type: "DAILY_SET", target: 12 },
        ],
        reward: { xp: 55_000, gold: 34_000 },
      },
      {
        id: "a4c5",
        title: { en: "The frozen heart", fr: "Le cœur figé" },
        narration: {
          en: "The guardian of the frost does not attack. It waits until you are too cold to hold your blade.",
          fr: "Le gardien du givre n'attaque pas. Il attend que tu aies trop froid pour tenir ta lame.",
        },
        levelRequirement: 62,
        echoCost: 21,
        objectives: [
          { type: "DUNGEON", target: 1 },
          { type: "COLLECT", itemId: "relique-coeur-gel", target: 1 },
        ],
        reward: { xp: 65_000, gold: 40_000, items: [{ itemId: "elixir-supreme", quantity: 3 }] },
      },
    ],
  },
  {
    id: "acte-5",
    title: { en: "Act V - The Storm Coast", fr: "Acte V - La Côte des Tempêtes" },
    emoji: "🌊",
    intro: {
      en: "The heart of frost calms the sea ten metres around you. That is little, but it is a start.",
      fr: "Le cœur de gel calme la mer sur dix mètres autour de toi. C'est peu, mais c'est un début.",
    },
    zoneId: "cote-tempetes",
    guardianId: "gardien-tempetes",
    chapters: [
      {
        id: "a5c1",
        title: { en: "The standing wrecks", fr: "Les épaves debout" },
        narration: {
          en: "The ships stranded here stayed upright, as if they were waiting for the tide.",
          fr: "Les navires échoués ici sont restés droits, comme s'ils attendaient la marée.",
        },
        levelRequirement: 65,
        echoCost: 26,
        objectives: [
          { type: "EXPLORE", zoneId: "cote-tempetes", target: 40 },
          { type: "DEFEAT_FAMILY", family: "mort-vivant", target: 30 },
        ],
        reward: { xp: 78_000, gold: 48_000 },
      },
      {
        id: "a5c2",
        title: { en: "The black flag", fr: "Le pavillon noir" },
        narration: {
          en: "The corsairs plunder nothing any more. They are looking for something, and they are afraid.",
          fr: "Les corsaires ne pillent plus rien. Ils cherchent quelque chose, et ils ont peur.",
        },
        levelRequirement: 68,
        echoCost: 26,
        objectives: [
          { type: "DEFEAT_FAMILY", family: "brigand", target: 40 },
          { type: "SPEND_GOLD", target: 60_000 },
        ],
        reward: { xp: 90_000, gold: 55_000 },
      },
      {
        id: "a5c3",
        title: { en: "The bell offshore", fr: "La cloche du large" },
        narration: {
          en: "It rings every time an echo rises. It rang three times last night.",
          fr: "Elle sonne à chaque fois qu'un écho remonte. Elle a sonné trois fois cette nuit.",
        },
        levelRequirement: 71,
        echoCost: 26,
        objectives: [
          { type: "COLLECT", itemId: "essence-spectrale", target: 30 },
          { type: "DAILY_SET", target: 16 },
        ],
        reward: { xp: 104_000, gold: 62_000 },
      },
      {
        id: "a5c4",
        title: { en: "Below the waterline", fr: "Sous la ligne d'eau" },
        narration: {
          en: "There is a city down there. The windows are lit.",
          fr: "Il y a une ville en dessous. Les fenêtres sont éclairées.",
        },
        levelRequirement: 74,
        echoCost: 26,
        objectives: [
          { type: "EXPLORE", zoneId: "cote-tempetes", target: 65 },
          { type: "DEFEAT_FAMILY", family: "drake", target: 25 },
        ],
        reward: { xp: 120_000, gold: 70_000, items: [{ itemId: "sceau-titan", quantity: 1 }] },
      },
      {
        id: "a5c5",
        title: { en: "The still eye", fr: "L'œil immobile" },
        narration: {
          en: "At the exact centre of the storm there is not a breath. And someone is standing in it.",
          fr: "Au centre exact de la tempête, il n'y a pas un souffle. Et quelqu'un s'y tient debout.",
        },
        levelRequirement: 77,
        echoCost: 26,
        objectives: [
          { type: "DUNGEON", target: 1 },
          { type: "COLLECT", itemId: "relique-oeil-tempete", target: 1 },
        ],
        reward: { xp: 140_000, gold: 82_000, items: [{ itemId: "elixir-supreme", quantity: 4 }] },
      },
    ],
  },
  {
    id: "acte-6",
    title: { en: "Act VI - The Astral Vault", fr: "Acte VI - La Voûte Astrale" },
    emoji: "🌌",
    intro: {
      en: "The eye of the storm is a door. Behind it, a sky under the earth, and stars that follow you with their gaze.",
      fr: "L'œil de la tempête est une porte. Derrière, un ciel sous la terre, et des étoiles qui te suivent du regard.",
    },
    zoneId: "voute-astrale",
    guardianId: "gardien-voute",
    chapters: [
      {
        id: "a6c1",
        title: { en: "The upside down sky", fr: "Le ciel à l'envers" },
        narration: {
          en: "You walk on the vault. The stars are under your feet and do not seem to mind.",
          fr: "Tu marches sur la voûte. Les étoiles sont sous tes pieds et ne s'en offusquent pas.",
        },
        levelRequirement: 80,
        echoCost: 32,
        objectives: [
          { type: "EXPLORE", zoneId: "voute-astrale", target: 45 },
          { type: "DEFEAT_FAMILY", family: "echo", target: 30 },
        ],
        reward: { xp: 170_000, gold: 95_000 },
      },
      {
        id: "a6c2",
        title: { en: "The watchers are counting", fr: "Les veilleurs comptent" },
        narration: {
          en: "Every watcher recites a list of names. Yours comes up often.",
          fr: "Chaque veilleur récite une liste de noms. Le tien revient souvent.",
        },
        levelRequirement: 83,
        echoCost: 32,
        objectives: [
          { type: "COLLECT", itemId: "poudre-astrale", target: 40 },
          { type: "DAILY_SET", target: 20 },
        ],
        reward: { xp: 195_000, gold: 108_000 },
      },
      {
        id: "a6c3",
        title: { en: "The library without books", fr: "La bibliothèque sans livres" },
        narration: {
          en: "Empty shelves for kilometres. They store memories here, not pages.",
          fr: "Des rayonnages vides sur des kilomètres. On y range des souvenirs, pas des pages.",
        },
        levelRequirement: 86,
        echoCost: 32,
        objectives: [
          { type: "COLLECT", itemId: "eclat-echo", target: 6 },
          { type: "CRAFT", target: 12 },
        ],
        reward: { xp: 225_000, gold: 122_000 },
      },
      {
        id: "a6c4",
        title: { en: "What you left behind", fr: "Ce que tu as laissé" },
        narration: {
          en: "A void walker carries your first weapon, the one you sold a long time ago.",
          fr: "Un marcheur du vide porte ta première arme, celle que tu as vendue il y a longtemps.",
        },
        levelRequirement: 89,
        echoCost: 32,
        objectives: [
          { type: "DEFEAT_FAMILY", family: "echo", target: 70 },
          { type: "EXPLORE", zoneId: "voute-astrale", target: 70 },
        ],
        reward: { xp: 260_000, gold: 140_000, items: [{ itemId: "couronne-echos", quantity: 1 }] },
      },
      {
        id: "a6c5",
        title: { en: "The veil", fr: "Le voile" },
        narration: {
          en: "The guardian of the vault does not bar your way. It asks whether you are sure.",
          fr: "Le gardien de la voûte ne te barre pas la route. Il te demande si tu es sûr.",
        },
        levelRequirement: 92,
        echoCost: 32,
        objectives: [
          { type: "DUNGEON", target: 1 },
          { type: "COLLECT", itemId: "relique-voile-astral", target: 1 },
        ],
        reward: { xp: 300_000, gold: 160_000 },
      },
    ],
  },
  {
    id: "acte-7",
    title: { en: "Act VII - The Heart of Echoes", fr: "Acte VII - Le Cœur des Échos" },
    emoji: "✨",
    intro: {
      en: "The astral veil settles on your shoulders. You step into the place where the Lands keep everything that has been said.",
      fr: "Le voile astral se pose sur tes épaules. Tu entres là où les Terres gardent tout ce qui a été dit.",
    },
    zoneId: "coeur-echos",
    guardianId: "echo-premier",
    chapters: [
      {
        id: "a7c1",
        title: { en: "The hall of answers", fr: "La salle des réponses" },
        narration: {
          en: "You ask a question out loud. Three different voices give you the same answer.",
          fr: "Tu poses une question à voix haute. Trois voix différentes te répondent la même chose.",
        },
        levelRequirement: 94,
        echoCost: 38,
        objectives: [
          { type: "EXPLORE", zoneId: "coeur-echos", target: 50 },
          { type: "DEFEAT_FAMILY", family: "echo", target: 40 },
        ],
        reward: { xp: 350_000, gold: 190_000 },
      },
      {
        id: "a7c2",
        title: { en: "Your own reflection", fr: "Ton propre reflet" },
        narration: {
          en: "It fights exactly like you. It simply has a little more practice.",
          fr: "Il se bat exactement comme toi. Il a juste un peu plus d'expérience.",
        },
        levelRequirement: 96,
        echoCost: 38,
        objectives: [
          { type: "DEFEAT_FAMILY", family: "echo", target: 90 },
          { type: "COLLECT", itemId: "eclat-echo", target: 12 },
        ],
        reward: { xp: 410_000, gold: 220_000 },
      },
      {
        id: "a7c3",
        title: { en: "The ancient silence", fr: "Le silence ancien" },
        narration: {
          en: "Before the Lands, before the echoes, there was this: nothing at all, and it did not like being disturbed.",
          fr: "Avant les Terres, avant les échos, il y avait ça : rien du tout, et ça n'aimait pas être dérangé.",
        },
        levelRequirement: 98,
        echoCost: 38,
        objectives: [
          { type: "EXPLORE", zoneId: "coeur-echos", target: 80 },
          { type: "DAILY_SET", target: 25 },
        ],
        reward: { xp: 480_000, gold: 250_000, items: [{ itemId: "elixir-supreme", quantity: 5 }] },
      },
      {
        id: "a7c4",
        title: { en: "Everything that has been said", fr: "Tout ce qui a été dit" },
        narration: {
          en: "Every word spoken in the Lands since the beginning hits you at once. You stay on your feet.",
          fr: "Chaque mot prononcé dans les Terres depuis le début t'arrive d'un coup. Tu tiens debout.",
        },
        levelRequirement: 99,
        echoCost: 38,
        objectives: [
          { type: "COLLECT", itemId: "eclat-echo", target: 20 },
          { type: "CRAFT", target: 18 },
        ],
        reward: { xp: 560_000, gold: 290_000 },
      },
      {
        id: "a7c5",
        title: { en: "The last voice", fr: "La dernière voix" },
        narration: {
          en: "The First Echo takes your face, then the face of everyone you have met. Then nothing. Then it speaks.",
          fr: "L'Écho premier prend ton visage, puis celui de tous ceux que tu as croisés. Puis plus rien. Puis il parle.",
        },
        levelRequirement: 100,
        echoCost: 38,
        objectives: [
          { type: "DUNGEON", target: 1 },
          { type: "COLLECT", itemId: "relique-derniere-voix", target: 1 },
        ],
        reward: {
          xp: 700_000,
          gold: 400_000,
          items: [{ itemId: "gemme-crepuscule", quantity: 1 }],
        },
      },
    ],
  },
] as const;

export const ADVENTURE_TOTAL_CHAPTERS = ADVENTURE_ACTS.reduce(
  (total, act) => total + act.chapters.length,
  0,
);

export function requireAdventureAct(actIndex: number): AdventureActDefinition {
  const act = ADVENTURE_ACTS[actIndex];
  if (!act) throw new Error(`Unknown adventure act: ${actIndex}`);
  return act;
}

/** Current chapter, or null once the story is over. */
export function findAdventureChapter(
  actIndex: number,
  chapterIndex: number,
): AdventureChapterDefinition | null {
  return ADVENTURE_ACTS[actIndex]?.chapters[chapterIndex] ?? null;
}

/** Stable id of an objective, used as the key in `chapterProgress`. */
export function adventureObjectiveKey(objective: AdventureChapterObjective): string {
  return [objective.type, objective.zoneId, objective.family, objective.itemId]
    .filter(Boolean)
    .join(":");
}
