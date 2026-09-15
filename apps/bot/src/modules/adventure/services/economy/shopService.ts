import {
  removeAdventureItem,
  updateAdventureCharacter,
  type AdventureCharacter,
  type AdventureItem,
} from "@gaulia/database";

import { GauliaError } from "../../../../core/errors";
import { itemLabel, requireItem } from "../../data/items";
import { dispatchGameEvents } from "../events/eventDispatcher";
import { countItem, grantItems } from "../inventory/inventoryService";

export interface TradeResult {
  character: AdventureCharacter;
  quantity: number;
  total: number;
  notices: string[];
}

/** Achat chez le marchand : contrôle du niveau, du prix et de la bourse. */
export async function buyItem(
  character: AdventureCharacter,
  items: AdventureItem[],
  itemId: string,
  quantity: number,
): Promise<TradeResult> {
  const item = requireItem(itemId);
  if (item.price === undefined) {
    throw new GauliaError(`${itemLabel(itemId)} ne se vend nulle part.`);
  }
  if ((item.level ?? 1) > character.level) {
    throw new GauliaError(
      `${itemLabel(itemId)} est réservé au niveau ${item.level ?? 1} (tu es niveau ${character.level}).`,
    );
  }

  const total = item.price * quantity;
  if (total > character.gold) {
    throw new GauliaError(
      `Il te manque ${total - character.gold} pièces pour ${quantity} × ${itemLabel(itemId)}.`,
    );
  }

  await grantItems(character.userId, [{ itemId, quantity }]);
  const updated = await updateAdventureCharacter(character.userId, {
    gold: character.gold - total,
  });
  const dispatched = await dispatchGameEvents(updated, items, [
    { type: "GOLD_SPENT", amount: total },
  ]);

  return { character: dispatched.character, quantity, total, notices: dispatched.notices };
}

/** Revente au marchand. Les reliques du scénario ne se vendent pas. */
export async function sellItem(
  character: AdventureCharacter,
  items: AdventureItem[],
  itemId: string,
  quantity: number,
): Promise<TradeResult> {
  const item = requireItem(itemId);
  if (item.kind === "RELIQUE" || item.sellPrice <= 0) {
    throw new GauliaError(`${itemLabel(itemId)} n'intéresse aucun marchand.`);
  }
  if (countItem(items, itemId) < quantity) {
    throw new GauliaError(`Tu ne possèdes pas ${quantity} × ${itemLabel(itemId)}.`);
  }
  if (items.some((row) => row.itemId === itemId && row.equipped)) {
    throw new GauliaError("Déséquipe cette pièce avant de la vendre.");
  }

  if (!(await removeAdventureItem(character.userId, itemId, quantity))) {
    throw new GauliaError(`Tu ne possèdes pas ${quantity} × ${itemLabel(itemId)}.`);
  }

  const total = item.sellPrice * quantity;
  const updated = await updateAdventureCharacter(character.userId, {
    gold: character.gold + total,
  });

  return { character: updated, quantity, total, notices: [] };
}
