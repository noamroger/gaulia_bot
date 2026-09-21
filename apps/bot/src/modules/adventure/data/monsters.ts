/** Bestiary. Guardians (`boss: true`) are only met in a dungeon, one per act. */

import type { AdventureMonsterFamily } from "@gaulia/database";

import type { Translator } from "../../../i18n";

/** Families are defined with the story, which uses them for its objectives. */
export type MonsterFamily = AdventureMonsterFamily;

export interface MonsterLoot {
  itemId: string;
  /** Drop chance, between 0 and 1. */
  chance: number;
  min: number;
  max: number;
}

/** Names live in the catalog, keyed by `id`. */
export interface MonsterDefinition {
  id: string;
  emoji: string;
  family: MonsterFamily;
  level: number;
  hp: number;
  attack: number;
  defense: number;
  /** Multipliers applied to the base exploration rewards. */
  xpFactor: number;
  goldFactor: number;
  loot: MonsterLoot[];
  boss?: boolean;
}

export const MONSTERS: readonly MonsterDefinition[] = [
  {
    id: "lapin-hargneux",
    emoji: "🐇",
    family: "bete",
    level: 1,
    hp: 30,
    attack: 5,
    defense: 1,
    xpFactor: 0.8,
    goldFactor: 0.8,
    loot: [{ itemId: "peau-loup", chance: 0.15, min: 1, max: 1 }],
  },
  {
    id: "loup-gris",
    emoji: "🐺",
    family: "bete",
    level: 4,
    hp: 60,
    attack: 10,
    defense: 3,
    xpFactor: 1,
    goldFactor: 1,
    loot: [{ itemId: "peau-loup", chance: 0.5, min: 1, max: 2 }],
  },
  {
    id: "sanglier-furieux",
    emoji: "🐗",
    family: "bete",
    level: 7,
    hp: 110,
    attack: 16,
    defense: 6,
    xpFactor: 1.15,
    goldFactor: 1.1,
    loot: [{ itemId: "croc-sanglier", chance: 0.45, min: 1, max: 2 }],
  },
  {
    id: "detrousseur",
    emoji: "🥷",
    family: "brigand",
    level: 10,
    hp: 150,
    attack: 22,
    defense: 8,
    xpFactor: 1.1,
    goldFactor: 1.6,
    loot: [{ itemId: "perle-riviere", chance: 0.08, min: 1, max: 1 }],
  },
  {
    id: "araignee-sylve",
    emoji: "🕷️",
    family: "bete",
    level: 13,
    hp: 200,
    attack: 30,
    defense: 10,
    xpFactor: 1.2,
    goldFactor: 1,
    loot: [{ itemId: "fil-argent", chance: 0.3, min: 1, max: 2 }],
  },
  {
    id: "ours-bois-bas",
    emoji: "🐻",
    family: "bete",
    level: 16,
    hp: 300,
    attack: 40,
    defense: 16,
    xpFactor: 1.35,
    goldFactor: 1.1,
    loot: [{ itemId: "peau-loup", chance: 0.6, min: 2, max: 4 }],
  },
  {
    id: "goule-affamee",
    emoji: "🧟",
    family: "mort-vivant",
    level: 20,
    hp: 380,
    attack: 52,
    defense: 18,
    xpFactor: 1.25,
    goldFactor: 1,
    loot: [{ itemId: "os-blanchi", chance: 0.5, min: 1, max: 3 }],
  },
  {
    id: "spectre-plaintif",
    emoji: "👻",
    family: "mort-vivant",
    level: 24,
    hp: 430,
    attack: 66,
    defense: 14,
    xpFactor: 1.4,
    goldFactor: 1.1,
    loot: [{ itemId: "essence-spectrale", chance: 0.35, min: 1, max: 2 }],
  },
  {
    id: "chevalier-tombe",
    emoji: "⚰️",
    family: "mort-vivant",
    level: 28,
    hp: 620,
    attack: 82,
    defense: 34,
    xpFactor: 1.5,
    goldFactor: 1.3,
    loot: [
      { itemId: "calice-terni", chance: 0.1, min: 1, max: 1 },
      { itemId: "lingot-fer", chance: 0.3, min: 1, max: 2 },
    ],
  },
  {
    id: "forgeron-cendre",
    emoji: "🔨",
    family: "elementaire",
    level: 32,
    hp: 740,
    attack: 98,
    defense: 40,
    xpFactor: 1.5,
    goldFactor: 1.4,
    loot: [{ itemId: "fer-brut", chance: 0.55, min: 2, max: 4 }],
  },
  {
    id: "golem-scories",
    emoji: "🗿",
    family: "elementaire",
    level: 36,
    hp: 1_050,
    attack: 112,
    defense: 56,
    xpFactor: 1.65,
    goldFactor: 1.3,
    loot: [{ itemId: "coeur-elementaire", chance: 0.18, min: 1, max: 1 }],
  },
  {
    id: "salamandre-forge",
    emoji: "🦎",
    family: "elementaire",
    level: 40,
    hp: 1_150,
    attack: 136,
    defense: 48,
    xpFactor: 1.7,
    goldFactor: 1.4,
    loot: [{ itemId: "ecaille-drake", chance: 0.25, min: 1, max: 2 }],
  },
  {
    id: "veneur-givre",
    emoji: "🧊",
    family: "brigand",
    level: 45,
    hp: 1_400,
    attack: 158,
    defense: 62,
    xpFactor: 1.7,
    goldFactor: 1.8,
    loot: [{ itemId: "statuette-jade", chance: 0.07, min: 1, max: 1 }],
  },
  {
    id: "drake-blanc",
    emoji: "🐉",
    family: "drake",
    level: 50,
    hp: 1_900,
    attack: 190,
    defense: 78,
    xpFactor: 1.9,
    goldFactor: 1.6,
    loot: [{ itemId: "ecaille-drake", chance: 0.45, min: 2, max: 4 }],
  },
  {
    id: "colosse-gel",
    emoji: "☃️",
    family: "elementaire",
    level: 54,
    hp: 2_400,
    attack: 210,
    defense: 96,
    xpFactor: 2,
    goldFactor: 1.5,
    loot: [{ itemId: "coeur-elementaire", chance: 0.3, min: 1, max: 2 }],
  },
  {
    id: "corsaire-tempete",
    emoji: "🏴‍☠️",
    family: "brigand",
    level: 58,
    hp: 2_600,
    attack: 240,
    defense: 100,
    xpFactor: 1.9,
    goldFactor: 2.2,
    loot: [{ itemId: "calice-terni", chance: 0.2, min: 1, max: 2 }],
  },
  {
    id: "noye-rancunier",
    emoji: "🌊",
    family: "mort-vivant",
    level: 62,
    hp: 2_900,
    attack: 268,
    defense: 110,
    xpFactor: 2,
    goldFactor: 1.6,
    loot: [{ itemId: "essence-spectrale", chance: 0.5, min: 2, max: 4 }],
  },
  {
    id: "drake-orage",
    emoji: "🐲",
    family: "drake",
    level: 66,
    hp: 3_600,
    attack: 300,
    defense: 128,
    xpFactor: 2.2,
    goldFactor: 1.8,
    loot: [{ itemId: "ecaille-drake", chance: 0.6, min: 3, max: 5 }],
  },
  {
    id: "veilleur-astral",
    emoji: "👁️",
    family: "echo",
    level: 70,
    hp: 4_200,
    attack: 340,
    defense: 150,
    xpFactor: 2.3,
    goldFactor: 1.8,
    loot: [{ itemId: "poudre-astrale", chance: 0.35, min: 1, max: 2 }],
  },
  {
    id: "marcheur-vide",
    emoji: "🕳️",
    family: "echo",
    level: 75,
    hp: 5_000,
    attack: 390,
    defense: 170,
    xpFactor: 2.4,
    goldFactor: 1.9,
    loot: [{ itemId: "poudre-astrale", chance: 0.45, min: 2, max: 3 }],
  },
  {
    id: "choeur-brise",
    emoji: "🎭",
    family: "echo",
    level: 80,
    hp: 5_800,
    attack: 440,
    defense: 190,
    xpFactor: 2.5,
    goldFactor: 2,
    loot: [{ itemId: "eclat-echo", chance: 0.12, min: 1, max: 1 }],
  },
  {
    id: "reflet-soi",
    emoji: "🪞",
    family: "echo",
    level: 88,
    hp: 7_200,
    attack: 520,
    defense: 220,
    xpFactor: 2.7,
    goldFactor: 2.1,
    loot: [{ itemId: "eclat-echo", chance: 0.2, min: 1, max: 2 }],
  },
  {
    id: "silence-ancien",
    emoji: "🌑",
    family: "echo",
    level: 95,
    hp: 8_800,
    attack: 600,
    defense: 250,
    xpFactor: 2.9,
    goldFactor: 2.2,
    loot: [
      { itemId: "gemme-crepuscule", chance: 0.06, min: 1, max: 1 },
      { itemId: "eclat-echo", chance: 0.25, min: 1, max: 2 },
    ],
  },

  // Act guardians: dungeon only, once a week.
  {
    id: "gardien-brume",
    emoji: "🌫️",
    family: "echo",
    level: 12,
    hp: 900,
    attack: 34,
    defense: 18,
    xpFactor: 4,
    goldFactor: 4,
    boss: true,
    loot: [{ itemId: "relique-cor-brume", chance: 1, min: 1, max: 1 }],
  },
  {
    id: "gardien-tombes",
    emoji: "💀",
    family: "mort-vivant",
    level: 26,
    hp: 2_200,
    attack: 90,
    defense: 42,
    xpFactor: 4,
    goldFactor: 4,
    boss: true,
    loot: [{ itemId: "relique-clef-tombes", chance: 1, min: 1, max: 1 }],
  },
  {
    id: "gardien-forges",
    emoji: "⚒️",
    family: "elementaire",
    level: 40,
    hp: 4_200,
    attack: 160,
    defense: 70,
    xpFactor: 4,
    goldFactor: 4,
    boss: true,
    loot: [{ itemId: "relique-braise-eternelle", chance: 1, min: 1, max: 1 }],
  },
  {
    id: "gardien-givre",
    emoji: "❄️",
    family: "elementaire",
    level: 54,
    hp: 7_000,
    attack: 250,
    defense: 110,
    xpFactor: 4,
    goldFactor: 4,
    boss: true,
    loot: [{ itemId: "relique-coeur-gel", chance: 1, min: 1, max: 1 }],
  },
  {
    id: "gardien-tempetes",
    emoji: "⛈️",
    family: "drake",
    level: 68,
    hp: 11_000,
    attack: 360,
    defense: 155,
    xpFactor: 4,
    goldFactor: 4,
    boss: true,
    loot: [{ itemId: "relique-oeil-tempete", chance: 1, min: 1, max: 1 }],
  },
  {
    id: "gardien-voute",
    emoji: "🌌",
    family: "echo",
    level: 82,
    hp: 16_000,
    attack: 500,
    defense: 210,
    xpFactor: 4,
    goldFactor: 4,
    boss: true,
    loot: [{ itemId: "relique-voile-astral", chance: 1, min: 1, max: 1 }],
  },
  {
    id: "echo-premier",
    emoji: "✨",
    family: "echo",
    level: 98,
    hp: 26_000,
    attack: 700,
    defense: 290,
    xpFactor: 5,
    goldFactor: 5,
    boss: true,
    loot: [{ itemId: "relique-derniere-voix", chance: 1, min: 1, max: 1 }],
  },
] as const;

const BY_ID = new Map(MONSTERS.map((monster) => [monster.id, monster]));

export function requireMonster(monsterId: string): MonsterDefinition {
  const monster = BY_ID.get(monsterId);
  if (!monster) throw new Error(`Unknown adventure monster: ${monsterId}`);
  return monster;
}

export function monsterName(t: Translator, monster: MonsterDefinition): string {
  return t(`adventure.monsters.${monster.id}`);
}

/** Plural family name ("beasts"), used by the story objectives. */
export function familyLabel(t: Translator, family: MonsterFamily): string {
  return t(`adventure.families.${family}`);
}
