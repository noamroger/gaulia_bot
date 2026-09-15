/**
 * Modèles de quêtes. Partagés avec l'API pour que le panel admin affiche les quêtes d'un joueur
 * en toutes lettres plutôt que par identifiant.
 * Un lot est tiré au hasard dans ce catalogue à la première commande de la
 * journée (ou de la semaine) ; terminer un lot entier rapporte des fragments d'écho, la ressource
 * qui fait avancer le scénario. Ajouter une quête revient à ajouter une entrée ici.
 */

import type { AdventureMonsterFamily } from "./adventureStory";

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
  /** Ce qui fait avancer la quête ; les champs optionnels restreignent la correspondance. */
  match: { type: AdventureQuestEventType; family?: AdventureMonsterFamily };
  label: (target: number) => string;
  /** Bornes du tirage de l'objectif, arrondi au pas près pour rester lisible. */
  min: number;
  max: number;
  step: number;
  /** Récompenses exprimées en « explorations équivalentes », donc mises à l'échelle du niveau. */
  xpFactor: number;
  goldFactor: number;
}

export const ADVENTURE_QUEST_TEMPLATES: readonly AdventureQuestTemplate[] = [
  {
    id: "d-explorer",
    kind: "DAILY",
    match: { type: "EXPLORE" },
    label: (target) => `Explorer ${target} fois`,
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
    label: (target) => `Vaincre ${target} créatures`,
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
    label: (target) => `Vaincre ${target} bêtes`,
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
    label: (target) => `Récolter ${target} matériaux`,
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
    label: (target) => `Gagner ${target} pièces sur le terrain`,
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
    label: (target) => `Dépenser ${target} pièces chez les marchands`,
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
    label: (target) => `Forger ${target} objet(s)`,
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
    label: (target) => `Utiliser ${target} consommable(s)`,
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
    label: (target) => `Renforcer ${target} pièce(s) d'équipement`,
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
    label: (target) => `Voyager ${target} fois vers une autre région`,
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
    label: (target) => `Explorer ${target} fois dans la semaine`,
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
    label: (target) => `Vaincre ${target} créatures dans la semaine`,
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
    label: () => "Terminer le donjon de la semaine",
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
    label: (target) => `Récolter ${target} matériaux dans la semaine`,
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
    label: (target) => `Forger ${target} objets dans la semaine`,
    min: 4,
    max: 8,
    step: 1,
    xpFactor: 22,
    goldFactor: 22,
  },
] as const;

/** Nombre de quêtes tirées par lot. Terminer le lot entier accorde les fragments d'écho. */
export const ADVENTURE_DAILY_QUEST_COUNT = 3;
export const ADVENTURE_WEEKLY_QUEST_COUNT = 2;

export function findAdventureQuestTemplate(questId: string): AdventureQuestTemplate | undefined {
  return ADVENTURE_QUEST_TEMPLATES.find((template) => template.id === questId);
}

/** Libellé d'une quête en cours, objectif compris (« Explorer 12 fois »). */
export function adventureQuestLabel(questId: string, target: number): string {
  return findAdventureQuestTemplate(questId)?.label(target) ?? questId;
}
