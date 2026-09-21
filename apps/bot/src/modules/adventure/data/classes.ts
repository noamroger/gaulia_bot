import type { AdventureClass } from "@gaulia/database";

import type { Translator } from "../../../i18n";

/** Names, descriptions and passive wording live in the catalog, keyed by `id`. */
export interface ClassDefinition {
  id: AdventureClass;
  emoji: string;
  /** Starting stat points. */
  might: number;
  agility: number;
  spirit: number;
  /** Gear handed out at creation. */
  startingItems: { itemId: string; quantity: number }[];
}

export const CLASSES: readonly ClassDefinition[] = [
  {
    id: "GUERRIER",
    emoji: "🛡️",
    might: 6,
    agility: 2,
    spirit: 1,
    startingItems: [
      { itemId: "epee-rouillee", quantity: 1 },
      { itemId: "tunique-cuir", quantity: 1 },
      { itemId: "potion-mineure", quantity: 3 },
    ],
  },
  {
    id: "MAGE",
    emoji: "🔮",
    might: 1,
    agility: 2,
    spirit: 6,
    startingItems: [
      { itemId: "baton-noueux", quantity: 1 },
      { itemId: "robe-apprenti", quantity: 1 },
      { itemId: "potion-mineure", quantity: 3 },
    ],
  },
  {
    id: "RODEUR",
    emoji: "🏹",
    might: 3,
    agility: 5,
    spirit: 1,
    startingItems: [
      { itemId: "arc-chasse", quantity: 1 },
      { itemId: "tunique-cuir", quantity: 1 },
      { itemId: "potion-mineure", quantity: 3 },
    ],
  },
] as const;

export const CLASS_IDS = CLASSES.map((entry) => entry.id);

export function classDefinition(id: AdventureClass): ClassDefinition {
  const found = CLASSES.find((entry) => entry.id === id);
  if (!found) throw new Error(`Unknown adventure class: ${id}`);
  return found;
}

export function className(t: Translator, id: AdventureClass): string {
  return t(`adventure.classes.${id}.name`);
}

export function classDescription(t: Translator, id: AdventureClass): string {
  return t(`adventure.classes.${id}.description`);
}

/** Wording of the passive the combat engine applies, for display only. */
export function classPassive(t: Translator, id: AdventureClass): string {
  return t(`adventure.classes.${id}.passive`);
}
