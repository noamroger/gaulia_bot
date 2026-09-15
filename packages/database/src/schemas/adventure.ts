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

export function parseChapterProgress(value: unknown): ChapterProgress {
  const parsed = chapterProgressSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
}
