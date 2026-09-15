/**
 * Scénario : sept actes de cinq chapitres. Comme le catalogue d'objets, il est partagé avec
 * l'API : le panel admin affiche l'acte et le chapitre atteints par chaque joueur.
 * Un chapitre se termine quand ses objectifs sont
 * remplis, que le niveau requis est atteint, puis qu'il est scellé avec des fragments d'écho —
 * la ressource qui ne s'obtient qu'avec le temps (voir data/pacing.ts). C'est ce triple verrou qui
 * étale l'histoire sur plus d'un an sans jamais imposer de grind.
 *
 * Ajouter un acte revient à ajouter une entrée ici (plus, éventuellement, sa zone et son gardien).
 */

/** Familles de créatures ; le bestiaire lui-même vit dans le module du bot. */
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
  /** Formulation scénarisée ; à défaut, un libellé est généré depuis le type (storyService). */
  label?: string;
}

export interface AdventureChapterReward {
  xp: number;
  gold: number;
  items?: { itemId: string; quantity: number }[];
}

export interface AdventureChapterDefinition {
  id: string;
  title: string;
  /** Texte lu à l'ouverture du chapitre. */
  narration: string;
  levelRequirement: number;
  echoCost: number;
  objectives: AdventureChapterObjective[];
  reward: AdventureChapterReward;
}

export interface AdventureActDefinition {
  id: string;
  title: string;
  emoji: string;
  intro: string;
  /** Zone ouverte par l'acte, et gardien affronté dans son donjon hebdomadaire. */
  zoneId: string;
  guardianId: string;
  chapters: AdventureChapterDefinition[];
}

export const ADVENTURE_ACTS: readonly AdventureActDefinition[] = [
  {
    id: "acte-1",
    title: "Acte I — Les Semailles",
    emoji: "🌾",
    intro:
      "Un matin, les cloches de la Clairière ont sonné toutes seules. Depuis, les anciens parlent d'un écho revenu du fond des Terres.",
    zoneId: "bois-bas",
    guardianId: "gardien-brume",
    chapters: [
      {
        id: "a1c1",
        title: "Le puits qui répond",
        narration:
          "Tu jettes une pièce dans le vieux puits. Elle ne touche jamais le fond, mais une voix te remercie.",
        levelRequirement: 3,
        echoCost: 7,
        objectives: [
          {
            type: "EXPLORE",
            zoneId: "clairiere",
            target: 15,
            label: "Battre la campagne autour du puits",
          },
          { type: "DEFEAT_FAMILY", family: "bete", target: 10 },
        ],
        reward: { xp: 200, gold: 150, items: [{ itemId: "potion-mineure", quantity: 3 }] },
      },
      {
        id: "a1c2",
        title: "Ce que la brume garde",
        narration:
          "Les Bois-Bas se sont rapprochés du village pendant la nuit. Les bûcherons refusent d'y retourner.",
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
        title: "Les détrousseurs du sentier",
        narration:
          "Quelqu'un dépouille les voyageurs et laisse une pièce sur leurs paupières. Personne ne sait pourquoi.",
        levelRequirement: 9,
        echoCost: 7,
        objectives: [
          { type: "DEFEAT_FAMILY", family: "brigand", target: 12 },
          { type: "DAILY_SET", target: 3, label: "Tenir trois journées d'aventure complètes" },
        ],
        reward: { xp: 800, gold: 600, items: [{ itemId: "amulette-simple", quantity: 1 }] },
      },
      {
        id: "a1c4",
        title: "La forge du village",
        narration:
          "Le forgeron accepte de t'apprendre, à condition que tu lui rapportes de quoi travailler.",
        levelRequirement: 12,
        echoCost: 7,
        objectives: [
          { type: "COLLECT", itemId: "fer-brut", target: 15 },
          { type: "CRAFT", target: 2, label: "Sortir deux pièces de la forge" },
        ],
        reward: { xp: 1_300, gold: 900 },
      },
      {
        id: "a1c5",
        title: "Le gardien de la brume",
        narration:
          "La brume a pris forme. Elle porte une armure que personne n'a forgée, et elle t'attend.",
        levelRequirement: 15,
        echoCost: 7,
        objectives: [
          { type: "DUNGEON", target: 1, label: "Vaincre le gardien de la brume en donjon" },
          { type: "COLLECT", itemId: "relique-cor-brume", target: 1 },
        ],
        reward: { xp: 2_200, gold: 1_500, items: [{ itemId: "potion-majeure", quantity: 3 }] },
      },
    ],
  },
  {
    id: "acte-2",
    title: "Acte II — Les Sept Tombes",
    emoji: "⚰️",
    intro:
      "Le cor de la brume ouvre une route vers la nécropole. Six noms y sont gravés. Le septième t'attend.",
    zoneId: "tombes",
    guardianId: "gardien-tombes",
    chapters: [
      {
        id: "a2c1",
        title: "La route des dalles",
        narration: "Chaque dalle du chemin porte une date. La dernière est celle d'aujourd'hui.",
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
        title: "Ce qui reste des veilleurs",
        narration: "Les veilleurs de la nécropole sont morts à leur poste. Ils y sont toujours.",
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
        title: "Le marchand de silence",
        narration:
          "Un colporteur vend des bougies qui n'éclairent rien. Il dit qu'elles servent à autre chose.",
        levelRequirement: 25,
        echoCost: 11,
        objectives: [
          { type: "SPEND_GOLD", target: 4_000, label: "Dépenser 4 000 pièces chez les marchands" },
          { type: "DAILY_SET", target: 5 },
        ],
        reward: { xp: 5_500, gold: 3_000, items: [{ itemId: "oeil-loup", quantity: 1 }] },
      },
      {
        id: "a2c4",
        title: "Le chevalier qui refuse",
        narration:
          "Une armure vide barre la septième tombe. Elle ne te veut aucun mal ; elle ne bougera pas non plus.",
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
        title: "Le septième nom",
        narration:
          "La dernière dalle se soulève. Le nom gravé dessous est le tien, écrit d'une main que tu reconnais.",
        levelRequirement: 31,
        echoCost: 11,
        objectives: [
          { type: "DUNGEON", target: 1, label: "Vaincre le gardien des tombes en donjon" },
          { type: "COLLECT", itemId: "relique-clef-tombes", target: 1 },
        ],
        reward: { xp: 9_000, gold: 5_500, items: [{ itemId: "potion-majeure", quantity: 5 }] },
      },
    ],
  },
  {
    id: "acte-3",
    title: "Acte III — Les Forges Noires",
    emoji: "⚒️",
    intro:
      "La clef des tombes ouvre une trappe sous la nécropole. En dessous, on bat le métal depuis des siècles sans jamais s'arrêter.",
    zoneId: "forges",
    guardianId: "gardien-forges",
    chapters: [
      {
        id: "a3c1",
        title: "Le bruit qui ne cesse pas",
        narration: "Le marteau frappe toutes les trois secondes. Il n'a jamais manqué un coup.",
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
        title: "La commande impossible",
        narration:
          "Le contremaître de cendre te tend une liste. Elle est écrite dans une langue morte, mais les chiffres sont clairs.",
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
        title: "Les veines profondes",
        narration: "Plus bas encore, le minerai est tiède et bat faiblement.",
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
        title: "Ce qu'on a fondu ici",
        narration:
          "Sur les moules, des formes humaines. On n'a pas toujours coulé des lames dans ces cuves.",
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
        title: "La braise qui ne meurt pas",
        narration: "Au fond de la dernière forge, une braise seule. Elle te regarde approcher.",
        levelRequirement: 46,
        echoCost: 16,
        objectives: [
          { type: "DUNGEON", target: 1, label: "Vaincre le gardien des forges en donjon" },
          { type: "COLLECT", itemId: "relique-braise-eternelle", target: 1 },
        ],
        reward: { xp: 28_000, gold: 18_000, items: [{ itemId: "elixir-supreme", quantity: 2 }] },
      },
    ],
  },
  {
    id: "acte-4",
    title: "Acte IV — Le Haut-Givre",
    emoji: "🏔️",
    intro:
      "La braise éternelle rend le froid supportable. Juste assez pour monter au-dessus des nuages.",
    zoneId: "haut-givre",
    guardianId: "gardien-givre",
    chapters: [
      {
        id: "a4c1",
        title: "Au-dessus des nuages",
        narration: "D'ici, les Terres ressemblent à une carte qu'on aurait pliée trop souvent.",
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
        title: "Les veneurs",
        narration: "Ils chassent les drakes pour leurs écailles et les voyageurs pour le reste.",
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
        title: "Le col des statues",
        narration:
          "Des dizaines de silhouettes de glace, toutes tournées vers le sommet. Certaines portent ton équipement.",
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
        title: "Le souffle long",
        narration: "Une respiration sous la glace, lente, immense. Toutes les six minutes.",
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
        title: "Le cœur figé",
        narration:
          "Le gardien du givre n'attaque pas. Il attend que tu aies trop froid pour tenir ta lame.",
        levelRequirement: 62,
        echoCost: 21,
        objectives: [
          { type: "DUNGEON", target: 1, label: "Vaincre le gardien du givre en donjon" },
          { type: "COLLECT", itemId: "relique-coeur-gel", target: 1 },
        ],
        reward: { xp: 65_000, gold: 40_000, items: [{ itemId: "elixir-supreme", quantity: 3 }] },
      },
    ],
  },
  {
    id: "acte-5",
    title: "Acte V — La Côte des Tempêtes",
    emoji: "🌊",
    intro:
      "Le cœur de gel calme la mer sur dix mètres autour de toi. C'est peu, mais c'est un début.",
    zoneId: "cote-tempetes",
    guardianId: "gardien-tempetes",
    chapters: [
      {
        id: "a5c1",
        title: "Les épaves debout",
        narration: "Les navires échoués ici sont restés droits, comme s'ils attendaient la marée.",
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
        title: "Le pavillon noir",
        narration:
          "Les corsaires ne pillent plus rien. Ils cherchent quelque chose, et ils ont peur.",
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
        title: "La cloche du large",
        narration:
          "Elle sonne à chaque fois qu'un écho remonte. Elle a sonné trois fois cette nuit.",
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
        title: "Sous la ligne d'eau",
        narration: "Il y a une ville en dessous. Les fenêtres sont éclairées.",
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
        title: "L'œil immobile",
        narration:
          "Au centre exact de la tempête, il n'y a pas un souffle. Et quelqu'un s'y tient debout.",
        levelRequirement: 77,
        echoCost: 26,
        objectives: [
          { type: "DUNGEON", target: 1, label: "Vaincre le gardien des tempêtes en donjon" },
          { type: "COLLECT", itemId: "relique-oeil-tempete", target: 1 },
        ],
        reward: { xp: 140_000, gold: 82_000, items: [{ itemId: "elixir-supreme", quantity: 4 }] },
      },
    ],
  },
  {
    id: "acte-6",
    title: "Acte VI — La Voûte Astrale",
    emoji: "🌌",
    intro:
      "L'œil de la tempête est une porte. Derrière, un ciel sous la terre, et des étoiles qui te suivent du regard.",
    zoneId: "voute-astrale",
    guardianId: "gardien-voute",
    chapters: [
      {
        id: "a6c1",
        title: "Le ciel à l'envers",
        narration:
          "Tu marches sur la voûte. Les étoiles sont sous tes pieds et ne s'en offusquent pas.",
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
        title: "Les veilleurs comptent",
        narration: "Chaque veilleur récite une liste de noms. Le tien revient souvent.",
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
        title: "La bibliothèque sans livres",
        narration:
          "Des rayonnages vides sur des kilomètres. On y range des souvenirs, pas des pages.",
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
        title: "Ce que tu as laissé",
        narration:
          "Un marcheur du vide porte ta première arme, celle que tu as vendue il y a longtemps.",
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
        title: "Le voile",
        narration: "Le gardien de la voûte ne te barre pas la route. Il te demande si tu es sûr.",
        levelRequirement: 92,
        echoCost: 32,
        objectives: [
          { type: "DUNGEON", target: 1, label: "Vaincre le gardien de la voûte en donjon" },
          { type: "COLLECT", itemId: "relique-voile-astral", target: 1 },
        ],
        reward: { xp: 300_000, gold: 160_000 },
      },
    ],
  },
  {
    id: "acte-7",
    title: "Acte VII — Le Cœur des Échos",
    emoji: "✨",
    intro:
      "Le voile astral se pose sur tes épaules. Tu entres là où les Terres gardent tout ce qui a été dit.",
    zoneId: "coeur-echos",
    guardianId: "echo-premier",
    chapters: [
      {
        id: "a7c1",
        title: "La salle des réponses",
        narration:
          "Tu poses une question à voix haute. Trois voix différentes te répondent la même chose.",
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
        title: "Ton propre reflet",
        narration: "Il se bat exactement comme toi. Il a juste un peu plus d'expérience.",
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
        title: "Le silence ancien",
        narration:
          "Avant les Terres, avant les échos, il y avait ça : rien du tout, et ça n'aimait pas être dérangé.",
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
        title: "Tout ce qui a été dit",
        narration:
          "Chaque mot prononcé dans les Terres depuis le début t'arrive d'un coup. Tu tiens debout.",
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
        title: "La dernière voix",
        narration:
          "L'Écho premier prend ton visage, puis celui de tous ceux que tu as croisés. Puis plus rien. Puis il parle.",
        levelRequirement: 100,
        echoCost: 38,
        objectives: [
          { type: "DUNGEON", target: 1, label: "Vaincre l'Écho premier en donjon" },
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
  if (!act) throw new Error(`Acte d'aventure inconnu : ${actIndex}`);
  return act;
}

/** Chapitre courant, ou null si le scénario est terminé. */
export function findAdventureChapter(
  actIndex: number,
  chapterIndex: number,
): AdventureChapterDefinition | null {
  return ADVENTURE_ACTS[actIndex]?.chapters[chapterIndex] ?? null;
}

/** Identifiant stable d'un objectif, utilisé comme clé dans `chapterProgress`. */
export function adventureObjectiveKey(objective: AdventureChapterObjective): string {
  return [objective.type, objective.zoneId, objective.family, objective.itemId]
    .filter(Boolean)
    .join(":");
}
