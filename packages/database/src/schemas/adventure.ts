import { z } from "zod";

/** Bounds shared by the API (admin edit validation) and the bot (gameplay guards). */
export const ADVENTURE_MAX_GOLD = 100_000_000;
export const ADVENTURE_MAX_ECHOES = 100_000;
export const ADVENTURE_MAX_ITEM_QUANTITY = 9_999;
/** Allowed (or blocked) channels a guild can register. */
export const ADVENTURE_MAX_CHANNELS = 100;

/**
 * Objective counters of the current chapter, keyed by objective id (`<type>:<target>`, see
 * data/story.ts on the bot side). Deliberately free-form: a new objective type needs no migration.
 */
export const chapterProgressSchema = z.record(
  z.string().max(80),
  z.number().int().min(0).max(1_000_000),
);

export type ChapterProgress = z.infer<typeof chapterProgressSchema>;

/** Player trades: safety bounds, shared by the bot (gameplay) and the API (validation). */
export const ADVENTURE_TRADE_MAX_ITEMS = 5;
export const ADVENTURE_TRADE_EXPIRY_MS = 15 * 60_000;
/** Minimum level to trade: discourages throwaway accounts made to drain an inventory. */
export const ADVENTURE_TRADE_MIN_LEVEL = 5;
/** Pending offers a single player can have open at once. */
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
