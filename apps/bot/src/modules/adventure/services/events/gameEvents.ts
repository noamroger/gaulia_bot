import type { MonsterFamily } from "../../data/monsters";

/**
 * Game events produced by the player's actions. They are the only contact point between what the
 * player does and what progresses (quests, chapter, achievements): a new action only has to emit
 * the right events, knowing nothing about the quests or the story.
 */
export type GameEvent =
  | { type: "EXPLORE"; zoneId: string; amount: number }
  | { type: "DEFEAT"; family: MonsterFamily; zoneId: string; amount: number }
  | { type: "COLLECT"; itemId: string; amount: number }
  | { type: "CRAFT"; itemId: string; amount: number }
  | { type: "DUNGEON"; actIndex: number; amount: number }
  | { type: "GOLD_EARNED"; amount: number }
  | { type: "GOLD_SPENT"; amount: number }
  | { type: "POTION"; amount: number }
  | { type: "TRAVEL"; zoneId: string; amount: number }
  | { type: "UPGRADE"; itemId: string; amount: number }
  | { type: "TRADE"; amount: number }
  | { type: "DAILY_SET"; amount: number };

export function exploreEvent(zoneId: string): GameEvent {
  return { type: "EXPLORE", zoneId, amount: 1 };
}

export function collectEvents(loot: { itemId: string; quantity: number }[]): GameEvent[] {
  return loot.map(({ itemId, quantity }) => ({ type: "COLLECT", itemId, amount: quantity }));
}
