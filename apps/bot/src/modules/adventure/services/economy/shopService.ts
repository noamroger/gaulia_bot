import {
  removeAdventureItem,
  updateAdventureCharacter,
  type AdventureCharacter,
  type AdventureItem,
} from "@gaulia/database";

import { GauliaError } from "../../../../core/errors";
import type { Translator } from "../../../../i18n";
import { itemLabel, requireItem } from "../../data/items";
import { dispatchGameEvents } from "../events/eventDispatcher";
import { countItem, grantItems } from "../inventory/inventoryService";

export interface ShopResult {
  character: AdventureCharacter;
  quantity: number;
  total: number;
  notices: string[];
}

/** Upgrade tier lost by giving up the last copy of a piece (0 when there is nothing to lose). */
function lostUpgradeLevel(items: AdventureItem[], itemId: string, quantity: number): number {
  const row = items.find((entry) => entry.itemId === itemId);
  return row && row.upgradeLevel > 0 && row.quantity === quantity ? row.upgradeLevel : 0;
}

/** Buying from the merchant: level, price and purse are checked. */
export async function buyItem(
  character: AdventureCharacter,
  items: AdventureItem[],
  itemId: string,
  quantity: number,
  t: Translator,
): Promise<ShopResult> {
  const item = requireItem(itemId);
  if (item.price === undefined) {
    throw new GauliaError("adventure.error.notForSale", { item: itemLabel(t, itemId) });
  }
  if ((item.level ?? 1) > character.level) {
    throw new GauliaError("adventure.error.itemLevel", {
      item: itemLabel(t, itemId),
      required: item.level ?? 1,
      current: character.level,
    });
  }

  const total = item.price * quantity;
  if (total > character.gold) {
    throw new GauliaError("adventure.error.notEnoughGold", {
      missing: total - character.gold,
      quantity,
      item: itemLabel(t, itemId),
    });
  }

  await grantItems(character.userId, [{ itemId, quantity }]);
  const updated = await updateAdventureCharacter(character.userId, {
    gold: character.gold - total,
  });
  const dispatched = await dispatchGameEvents(
    updated,
    items,
    [{ type: "GOLD_SPENT", amount: total }],
    t,
  );

  return { character: dispatched.character, quantity, total, notices: dispatched.notices };
}

/** Selling back to the merchant. Story relics cannot be sold. */
export async function sellItem(
  character: AdventureCharacter,
  items: AdventureItem[],
  itemId: string,
  quantity: number,
  t: Translator,
): Promise<ShopResult> {
  const item = requireItem(itemId);
  if (item.kind === "RELIQUE" || item.sellPrice <= 0) {
    throw new GauliaError("adventure.error.notSellable", { item: itemLabel(t, itemId) });
  }
  if (countItem(items, itemId) < quantity) {
    throw new GauliaError("adventure.error.notOwned", { quantity, item: itemLabel(t, itemId) });
  }
  if (items.some((row) => row.itemId === itemId && row.equipped)) {
    throw new GauliaError("adventure.error.unequipFirst");
  }

  // The upgrade lives on the inventory row: giving up the last copy erases it.
  const lost = lostUpgradeLevel(items, itemId, quantity);
  const warning = t("adventure.notices.upgradeLost", {
    level: lost,
    item: itemLabel(t, itemId),
  });

  if (!(await removeAdventureItem(character.userId, itemId, quantity))) {
    throw new GauliaError("adventure.error.notOwned", { quantity, item: itemLabel(t, itemId) });
  }

  const total = item.sellPrice * quantity;
  const updated = await updateAdventureCharacter(character.userId, {
    gold: character.gold + total,
  });

  return { character: updated, quantity, total, notices: lost > 0 ? [warning] : [] };
}
