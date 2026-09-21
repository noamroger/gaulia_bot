/**
 * Explorable regions. A zone opens when the story reaches the matching act, so the map follows the
 * story and a player cannot skip a tier by grinding. Names, descriptions and ambience lines live in
 * the catalog, keyed by `id`.
 */

import type { Translator } from "../../../i18n";

export interface ZoneLoot {
  itemId: string;
  /** Relative weight in the find draw (higher = more frequent). */
  weight: number;
  min: number;
  max: number;
}

export interface ZoneDefinition {
  id: string;
  emoji: string;
  /** Act index from which the zone is reachable (0 = from the start). */
  minAct: number;
  /** Suggested level, shown on the map and checked when travelling. */
  minLevel: number;
  monsters: string[];
  loot: ZoneLoot[];
  /** Multipliers on the base rewards (see data/pacing.ts). */
  xpMultiplier: number;
  goldMultiplier: number;
}

export const ZONES: readonly ZoneDefinition[] = [
  {
    id: "clairiere",
    emoji: "🌾",
    minAct: 0,
    minLevel: 1,
    monsters: ["lapin-hargneux", "loup-gris", "sanglier-furieux"],
    loot: [
      { itemId: "bois-noueux", weight: 5, min: 1, max: 3 },
      { itemId: "peau-loup", weight: 3, min: 1, max: 2 },
      { itemId: "fer-brut", weight: 2, min: 1, max: 2 },
      { itemId: "perle-riviere", weight: 1, min: 1, max: 1 },
    ],
    xpMultiplier: 1,
    goldMultiplier: 1,
  },
  {
    id: "bois-bas",
    emoji: "🌲",
    minAct: 0,
    minLevel: 8,
    monsters: ["loup-gris", "detrousseur", "araignee-sylve", "ours-bois-bas"],
    loot: [
      { itemId: "bois-noueux", weight: 5, min: 2, max: 4 },
      { itemId: "fil-argent", weight: 2, min: 1, max: 2 },
      { itemId: "croc-sanglier", weight: 3, min: 1, max: 2 },
      { itemId: "perle-riviere", weight: 1, min: 1, max: 1 },
    ],
    xpMultiplier: 1.15,
    goldMultiplier: 1.1,
  },
  {
    id: "tombes",
    emoji: "⚰️",
    minAct: 1,
    minLevel: 18,
    monsters: ["goule-affamee", "spectre-plaintif", "chevalier-tombe"],
    loot: [
      { itemId: "os-blanchi", weight: 5, min: 2, max: 4 },
      { itemId: "essence-spectrale", weight: 3, min: 1, max: 2 },
      { itemId: "lingot-fer", weight: 2, min: 1, max: 2 },
      { itemId: "calice-terni", weight: 1, min: 1, max: 1 },
    ],
    xpMultiplier: 1.3,
    goldMultiplier: 1.2,
  },
  {
    id: "forges",
    emoji: "⚒️",
    minAct: 2,
    minLevel: 30,
    monsters: ["forgeron-cendre", "golem-scories", "salamandre-forge"],
    loot: [
      { itemId: "fer-brut", weight: 5, min: 3, max: 6 },
      { itemId: "lingot-fer", weight: 3, min: 1, max: 3 },
      { itemId: "coeur-elementaire", weight: 1, min: 1, max: 1 },
      { itemId: "ecaille-drake", weight: 2, min: 1, max: 2 },
    ],
    xpMultiplier: 1.45,
    goldMultiplier: 1.35,
  },
  {
    id: "haut-givre",
    emoji: "🏔️",
    minAct: 3,
    minLevel: 42,
    monsters: ["veneur-givre", "drake-blanc", "colosse-gel"],
    loot: [
      { itemId: "ecaille-drake", weight: 4, min: 1, max: 3 },
      { itemId: "coeur-elementaire", weight: 2, min: 1, max: 2 },
      { itemId: "poudre-astrale", weight: 1, min: 1, max: 1 },
      { itemId: "statuette-jade", weight: 1, min: 1, max: 1 },
    ],
    xpMultiplier: 1.6,
    goldMultiplier: 1.45,
  },
  {
    id: "cote-tempetes",
    emoji: "🌊",
    minAct: 4,
    minLevel: 55,
    monsters: ["corsaire-tempete", "noye-rancunier", "drake-orage"],
    loot: [
      { itemId: "essence-spectrale", weight: 4, min: 2, max: 4 },
      { itemId: "ecaille-drake", weight: 3, min: 2, max: 4 },
      { itemId: "poudre-astrale", weight: 2, min: 1, max: 2 },
      { itemId: "calice-terni", weight: 1, min: 1, max: 1 },
    ],
    xpMultiplier: 1.75,
    goldMultiplier: 1.6,
  },
  {
    id: "voute-astrale",
    emoji: "🌌",
    minAct: 5,
    minLevel: 68,
    monsters: ["veilleur-astral", "marcheur-vide", "choeur-brise"],
    loot: [
      { itemId: "poudre-astrale", weight: 5, min: 2, max: 4 },
      { itemId: "eclat-echo", weight: 1, min: 1, max: 1 },
      { itemId: "coeur-elementaire", weight: 3, min: 1, max: 3 },
      { itemId: "statuette-jade", weight: 1, min: 1, max: 1 },
    ],
    xpMultiplier: 1.9,
    goldMultiplier: 1.75,
  },
  {
    id: "coeur-echos",
    emoji: "✨",
    minAct: 6,
    minLevel: 82,
    monsters: ["reflet-soi", "silence-ancien", "choeur-brise"],
    loot: [
      { itemId: "eclat-echo", weight: 4, min: 1, max: 2 },
      { itemId: "poudre-astrale", weight: 4, min: 3, max: 6 },
      { itemId: "gemme-crepuscule", weight: 1, min: 1, max: 1 },
    ],
    xpMultiplier: 2.1,
    goldMultiplier: 1.9,
  },
] as const;

const BY_ID = new Map(ZONES.map((zone) => [zone.id, zone]));

export function findZone(zoneId: string): ZoneDefinition | undefined {
  return BY_ID.get(zoneId);
}

export function requireZone(zoneId: string): ZoneDefinition {
  const zone = BY_ID.get(zoneId);
  if (!zone) throw new Error(`Unknown adventure zone: ${zoneId}`);
  return zone;
}

/** Zones open to a character, from the act reached (the level is only displayed advice). */
export function zonesForAct(actIndex: number): ZoneDefinition[] {
  return ZONES.filter((zone) => zone.minAct <= actIndex);
}

export function zoneName(t: Translator, zone: ZoneDefinition): string {
  return t(`adventure.zones.${zone.id}.name`);
}

export function zoneDescription(t: Translator, zone: ZoneDefinition): string {
  return t(`adventure.zones.${zone.id}.description`);
}

/** One ambience line at random, shown when an exploration turns up nothing notable. */
export function zoneAmbiance(t: Translator, zone: ZoneDefinition): string {
  const lines = t.list(`adventure.zones.${zone.id}.ambiances`);
  return lines[Math.floor(Math.random() * lines.length)] ?? "";
}
