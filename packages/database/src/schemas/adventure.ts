import { z } from "zod";

/** Bornes partagées par l'API (validation des interventions admin) et le bot (garde-fous de jeu). */
export const ADVENTURE_MAX_GOLD = 100_000_000;
export const ADVENTURE_MAX_ECHOES = 100_000;
export const ADVENTURE_MAX_ITEM_QUANTITY = 9_999;
/** Nombre de salons autorisés (ou interdits) enregistrables pour un serveur. */
export const ADVENTURE_MAX_CHANNELS = 100;

/**
 * Compteurs des objectifs du chapitre en cours, indexés par identifiant d'objectif
 * (`<type>:<cible>`, voir data/story.ts côté bot). Volontairement libre : ajouter un type
 * d'objectif ne demande aucune migration.
 */
export const chapterProgressSchema = z.record(
  z.string().max(80),
  z.number().int().min(0).max(1_000_000),
);

export type ChapterProgress = z.infer<typeof chapterProgressSchema>;

/** Échanges entre joueurs : bornes de sécurité, partagées par le bot (jeu) et l'API (validation). */
export const ADVENTURE_TRADE_MAX_ITEMS = 5;
export const ADVENTURE_TRADE_EXPIRY_MS = 15 * 60_000;
/** Niveau minimum pour échanger : décourage les comptes jetables créés pour vider un inventaire. */
export const ADVENTURE_TRADE_MIN_LEVEL = 5;
/** Propositions en attente qu'un même joueur peut avoir ouvertes en même temps. */
export const ADVENTURE_MAX_PENDING_TRADES = 5;

export const adventureTradeItemsSchema = z
  .array(
    z.object({
      itemId: z.string().min(1).max(60),
      quantity: z.number().int().min(1).max(ADVENTURE_MAX_ITEM_QUANTITY),
    }),
  )
  .max(ADVENTURE_TRADE_MAX_ITEMS);

export type AdventureTradeItems = z.infer<typeof adventureTradeItemsSchema>;

export function parseAdventureTradeItems(value: unknown): AdventureTradeItems {
  const parsed = adventureTradeItemsSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function parseChapterProgress(value: unknown): ChapterProgress {
  const parsed = chapterProgressSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
}
