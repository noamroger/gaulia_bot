import {
  adventureUpgradeCost,
  ADVENTURE_MAX_UPGRADE,
  removeAdventureItem,
  updateAdventureCharacter,
  upgradeAdventureItem,
  type AdventureCharacter,
  type AdventureItem,
  type AdventureUpgradeCost,
} from "@gaulia/database";

import { GauliaError } from "../../../../core/errors";
import type { Translator } from "../../../../i18n";
import { findItem, itemLabel, requireItem, type ItemDefinition } from "../../data/items";
import { dispatchGameEvents } from "../events/eventDispatcher";
import { countItem } from "../inventory/inventoryService";

export interface UpgradePlan {
  item: ItemDefinition;
  row: AdventureItem;
  nextLevel: number;
  cost: AdventureUpgradeCost;
  /** What is still missing, ready to display; empty when the upgrade is affordable. */
  missing: string[];
}

/** What the next tier would cost, and what is missing to afford it. */
export function planUpgrade(
  character: AdventureCharacter,
  items: AdventureItem[],
  itemId: string,
  t: Translator,
): UpgradePlan {
  const item = requireItem(itemId);
  if (!item.slot) {
    throw new GauliaError("adventure.error.notGear", { item: itemLabel(t, itemId) });
  }

  const row = items.find((entry) => entry.itemId === itemId);
  if (!row) {
    throw new GauliaError("adventure.error.notOwnedSimple", { item: itemLabel(t, itemId) });
  }

  const nextLevel = row.upgradeLevel + 1;
  if (nextLevel > ADVENTURE_MAX_UPGRADE) {
    throw new GauliaError("adventure.error.maxUpgrade", {
      item: itemLabel(t, itemId),
      max: ADVENTURE_MAX_UPGRADE,
    });
  }

  const cost = adventureUpgradeCost(item, nextLevel);
  if (!cost) throw new GauliaError("adventure.error.cannotUpgrade", { item: itemLabel(t, itemId) });

  const missing: string[] = [];
  if (character.gold < cost.gold) missing.push(`${cost.gold - character.gold} 🪙`);
  for (const material of cost.materials) {
    const owned = countItem(items, material.itemId);
    if (owned < material.quantity) {
      missing.push(
        t("adventure.views.upgrade.material", {
          quantity: material.quantity - owned,
          item: itemLabel(t, material.itemId),
        }),
      );
    }
  }

  return { item, row, nextLevel, cost, missing };
}

export interface UpgradeResult {
  character: AdventureCharacter;
  plan: UpgradePlan;
  notices: string[];
}

/**
 * Raises a piece by one tier. The cost is deterministic and nothing can fail: no destruction
 * lottery, only resources to gather.
 */
export async function upgradeItem(
  character: AdventureCharacter,
  items: AdventureItem[],
  itemId: string,
  t: Translator,
): Promise<UpgradeResult> {
  const plan = planUpgrade(character, items, itemId, t);
  if (plan.missing.length > 0) {
    throw new GauliaError("adventure.error.missingForUpgrade", {
      missing: plan.missing.join(", "),
    });
  }

  for (const material of plan.cost.materials) {
    if (!(await removeAdventureItem(character.userId, material.itemId, material.quantity))) {
      throw new GauliaError("adventure.error.missingMaterial", {
        item: itemLabel(t, material.itemId),
      });
    }
  }
  await upgradeAdventureItem(character.userId, itemId, plan.nextLevel);

  const updated = await updateAdventureCharacter(character.userId, {
    gold: character.gold - plan.cost.gold,
    upgrades: character.upgrades + 1,
  });
  const dispatched = await dispatchGameEvents(
    updated,
    items,
    [
      { type: "UPGRADE", itemId, amount: 1 },
      { type: "GOLD_SPENT", amount: plan.cost.gold },
    ],
    t,
  );

  return { character: dispatched.character, plan, notices: dispatched.notices };
}

/** Upgradable pieces in the bag, for the autocomplete and the forge menu. */
export function upgradableItems(items: AdventureItem[]): AdventureItem[] {
  return items.filter(
    (row) => findItem(row.itemId)?.slot !== undefined && row.upgradeLevel < ADVENTURE_MAX_UPGRADE,
  );
}
