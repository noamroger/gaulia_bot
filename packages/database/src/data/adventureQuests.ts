/**
 * Quest templates. Shared with the API so the admin panel spells out a player's quests instead of
 * listing ids. A set is drawn at random from this catalog on the first command of the day (or of
 * the week); completing a whole set grants echo shards, the resource that moves the story forward.
 * Adding a quest means adding an entry here.
 */

import type { AdventureMonsterFamily } from "./adventureStory";
import type { LocalizedText } from "./localized";

export type AdventureQuestEventType =
  | "EXPLORE"
  | "DEFEAT"
  | "COLLECT"
  | "CRAFT"
  | "DUNGEON"
  | "GOLD_EARNED"
  | "GOLD_SPENT"
  | "POTION"
  | "TRAVEL"
  | "UPGRADE";

export interface AdventureQuestTemplate {
  id: string;
  kind: "DAILY" | "WEEKLY";
  /** What moves the quest forward; the optional fields narrow the match. */
  match: { type: AdventureQuestEventType; family?: AdventureMonsterFamily };
  label: (target: number) => LocalizedText;
  /** Bounds of the objective draw, rounded to the step so it stays readable. */
  min: number;
  max: number;
  step: number;
  /** Rewards expressed in "equivalent explorations", hence scaled to the level. */
  xpFactor: number;
  goldFactor: number;
}

export const ADVENTURE_QUEST_TEMPLATES: readonly AdventureQuestTemplate[] = [
  {
    id: "d-explorer",
    kind: "DAILY",
    match: { type: "EXPLORE" },
    label: (target) => ({ en: `Explore ${target} times`, fr: `Explorer ${target} fois` }),
    min: 8,
    max: 14,
    step: 1,
    xpFactor: 4,
    goldFactor: 4,
  },
  {
    id: "d-chasser",
    kind: "DAILY",
    match: { type: "DEFEAT" },
    label: (target) => ({ en: `Defeat ${target} creatures`, fr: `Vaincre ${target} créatures` }),
    min: 6,
    max: 12,
    step: 1,
    xpFactor: 4,
    goldFactor: 4,
  },
  {
    id: "d-betes",
    kind: "DAILY",
    match: { type: "DEFEAT", family: "bete" },
    label: (target) => ({ en: `Defeat ${target} beasts`, fr: `Vaincre ${target} bêtes` }),
    min: 3,
    max: 7,
    step: 1,
    xpFactor: 3.5,
    goldFactor: 4,
  },
  {
    id: "d-recolter",
    kind: "DAILY",
    match: { type: "COLLECT" },
    label: (target) => ({ en: `Gather ${target} materials`, fr: `Récolter ${target} matériaux` }),
    min: 6,
    max: 14,
    step: 2,
    xpFactor: 4,
    goldFactor: 3.5,
  },
  {
    id: "d-fortune",
    kind: "DAILY",
    match: { type: "GOLD_EARNED" },
    label: (target) => ({
      en: `Earn ${target} coins in the field`,
      fr: `Gagner ${target} pièces sur le terrain`,
    }),
    min: 200,
    max: 600,
    step: 50,
    xpFactor: 4,
    goldFactor: 2,
  },
  {
    id: "d-depenser",
    kind: "DAILY",
    match: { type: "GOLD_SPENT" },
    label: (target) => ({
      en: `Spend ${target} coins at the merchants`,
      fr: `Dépenser ${target} pièces chez les marchands`,
    }),
    min: 150,
    max: 500,
    step: 50,
    xpFactor: 3,
    goldFactor: 2,
  },
  {
    id: "d-forger",
    kind: "DAILY",
    match: { type: "CRAFT" },
    label: (target) => ({ en: `Craft ${target} item(s)`, fr: `Forger ${target} objet(s)` }),
    min: 1,
    max: 2,
    step: 1,
    xpFactor: 5,
    goldFactor: 4,
  },
  {
    id: "d-soigner",
    kind: "DAILY",
    match: { type: "POTION" },
    label: (target) => ({
      en: `Use ${target} consumable(s)`,
      fr: `Utiliser ${target} consommable(s)`,
    }),
    min: 1,
    max: 3,
    step: 1,
    xpFactor: 3,
    goldFactor: 3,
  },
  {
    id: "d-renforcer",
    kind: "DAILY",
    match: { type: "UPGRADE" },
    label: (target) => ({
      en: `Upgrade ${target} piece(s) of gear`,
      fr: `Renforcer ${target} pièce(s) d'équipement`,
    }),
    min: 1,
    max: 2,
    step: 1,
    xpFactor: 5,
    goldFactor: 4,
  },
  {
    id: "d-voyager",
    kind: "DAILY",
    match: { type: "TRAVEL" },
    label: (target) => ({
      en: `Travel ${target} time(s) to another region`,
      fr: `Voyager ${target} fois vers une autre région`,
    }),
    min: 1,
    max: 2,
    step: 1,
    xpFactor: 3,
    goldFactor: 3,
  },

  {
    id: "w-explorer",
    kind: "WEEKLY",
    match: { type: "EXPLORE" },
    label: (target) => ({
      en: `Explore ${target} times this week`,
      fr: `Explorer ${target} fois dans la semaine`,
    }),
    min: 60,
    max: 100,
    step: 10,
    xpFactor: 25,
    goldFactor: 25,
  },
  {
    id: "w-chasser",
    kind: "WEEKLY",
    match: { type: "DEFEAT" },
    label: (target) => ({
      en: `Defeat ${target} creatures this week`,
      fr: `Vaincre ${target} créatures dans la semaine`,
    }),
    min: 50,
    max: 80,
    step: 10,
    xpFactor: 25,
    goldFactor: 25,
  },
  {
    id: "w-donjon",
    kind: "WEEKLY",
    match: { type: "DUNGEON" },
    label: () => ({ en: "Clear this week's dungeon", fr: "Terminer le donjon de la semaine" }),
    min: 1,
    max: 1,
    step: 1,
    xpFactor: 20,
    goldFactor: 20,
  },
  {
    id: "w-recolter",
    kind: "WEEKLY",
    match: { type: "COLLECT" },
    label: (target) => ({
      en: `Gather ${target} materials this week`,
      fr: `Récolter ${target} matériaux dans la semaine`,
    }),
    min: 40,
    max: 80,
    step: 10,
    xpFactor: 22,
    goldFactor: 20,
  },
  {
    id: "w-forger",
    kind: "WEEKLY",
    match: { type: "CRAFT" },
    label: (target) => ({
      en: `Craft ${target} items this week`,
      fr: `Forger ${target} objets dans la semaine`,
    }),
    min: 4,
    max: 8,
    step: 1,
    xpFactor: 22,
    goldFactor: 22,
  },
] as const;

/** Quests drawn per set. Completing the whole set grants the echo shards. */
export const ADVENTURE_DAILY_QUEST_COUNT = 3;
export const ADVENTURE_WEEKLY_QUEST_COUNT = 2;

export function findAdventureQuestTemplate(questId: string): AdventureQuestTemplate | undefined {
  return ADVENTURE_QUEST_TEMPLATES.find((template) => template.id === questId);
}

/** Label of a running quest, objective included ("Explore 12 times"). */
export function adventureQuestLabel(questId: string, target: number): LocalizedText {
  return findAdventureQuestTemplate(questId)?.label(target) ?? { en: questId, fr: questId };
}
