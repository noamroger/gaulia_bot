import type { MonsterFamily } from "../../data/monsters";

/**
 * Évènements de jeu produits par les actions du joueur. Ils sont le seul point de contact entre
 * « ce que fait le joueur » et « ce qui progresse » (quêtes, chapitre, hauts faits) : une nouvelle
 * action n'a qu'à émettre les bons évènements, sans rien savoir des quêtes ni du scénario.
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
  | { type: "DAILY_SET"; amount: number };

export function exploreEvent(zoneId: string): GameEvent {
  return { type: "EXPLORE", zoneId, amount: 1 };
}

export function collectEvents(loot: { itemId: string; quantity: number }[]): GameEvent[] {
  return loot.map(({ itemId, quantity }) => ({ type: "COLLECT", itemId, amount: quantity }));
}
