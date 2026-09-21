import {
  addAdventureItem,
  equipAdventureItem,
  listAdventureItems,
  removeAdventureItem,
  unequipAdventureItem,
  updateAdventureCharacter,
  type AdventureCharacter,
  type AdventureItem,
} from "@gaulia/database";

import { GauliaError } from "../../../../core/errors";
import type { Translator } from "../../../../i18n";
import {
  findItem,
  itemLabel,
  itemsBySlot,
  requireItem,
  type ItemDefinition,
} from "../../data/items";
import { ENERGY_MAX } from "../../data/pacing";
import { computeStats } from "../character/statsService";

export interface InventoryEntry {
  row: AdventureItem;
  item: ItemDefinition;
}

/** Inventory enriched with the definitions, unknown items (dropped from the catalog) excluded. */
export function describeInventory(items: AdventureItem[]): InventoryEntry[] {
  return items.flatMap((row) => {
    const item = findItem(row.itemId);
    return item ? [{ row, item }] : [];
  });
}

export function countItem(items: AdventureItem[], itemId: string): number {
  return items.find((row) => row.itemId === itemId)?.quantity ?? 0;
}

/** Adds several items at once (loot, chapter reward, grant from the admin panel). */
export async function grantItems(
  userId: string,
  loot: { itemId: string; quantity: number }[],
): Promise<void> {
  for (const { itemId, quantity } of loot) {
    if (quantity > 0) await addAdventureItem(userId, itemId, quantity);
  }
}

export async function equipItem(
  character: AdventureCharacter,
  items: AdventureItem[],
  itemId: string,
  t: Translator,
): Promise<AdventureItem[]> {
  const item = requireItem(itemId);
  if (!item.slot) {
    throw new GauliaError("adventure.error.notEquippable", { item: itemLabel(t, itemId) });
  }
  if (countItem(items, itemId) === 0) {
    throw new GauliaError("adventure.error.notOwnedSimple", { item: itemLabel(t, itemId) });
  }
  if ((item.level ?? 1) > character.level) {
    throw new GauliaError("adventure.error.itemLevel", {
      item: itemLabel(t, itemId),
      required: item.level ?? 1,
      current: character.level,
    });
  }

  await equipAdventureItem(
    character.userId,
    itemId,
    itemsBySlot(item.slot).map((entry) => entry.id),
  );
  return listAdventureItems(character.userId);
}

export async function unequipItem(userId: string, itemId: string): Promise<AdventureItem[]> {
  await unequipAdventureItem(userId, itemId);
  return listAdventureItems(userId);
}

/**
 * Healing potions in the bag, weakest first: the heal button takes the first one that is enough,
 * so an elixir is not wasted on a scratch.
 */
export function healingItems(items: AdventureItem[]): InventoryEntry[] {
  return describeInventory(items)
    .filter((entry) => (entry.item.effect?.hp ?? 0) > 0)
    .sort((a, b) => (a.item.effect?.hp ?? 0) - (b.item.effect?.hp ?? 0));
}

/** Best potion to drink to fill `missing` health (the cheapest one that is enough). */
export function bestHealingItem(
  items: AdventureItem[],
  missing: number,
  level: number,
): InventoryEntry | undefined {
  const usable = healingItems(items).filter((entry) => (entry.item.level ?? 1) <= level);
  return (
    usable.find((entry) => (entry.item.effect?.hp ?? 0) >= missing) ?? usable[usable.length - 1]
  );
}

export interface ConsumeResult {
  character: AdventureCharacter;
  items: AdventureItem[];
  /** Effects actually applied, for display (capped by the maximums). */
  healed: number;
  energy: number;
  xp: number;
}

/** Uses a consumable: healing, energy or experience, always capped by the maximums. */
export async function consumeItem(
  character: AdventureCharacter,
  items: AdventureItem[],
  itemId: string,
  t: Translator,
): Promise<ConsumeResult> {
  const item = requireItem(itemId);
  if (item.kind !== "CONSOMMABLE" || !item.effect) {
    throw new GauliaError("adventure.error.notUsable", { item: itemLabel(t, itemId) });
  }
  if ((item.level ?? 1) > character.level) {
    throw new GauliaError("adventure.error.itemLevelSimple", {
      item: itemLabel(t, itemId),
      required: item.level ?? 1,
    });
  }
  if (!(await removeAdventureItem(character.userId, itemId, 1))) {
    throw new GauliaError("adventure.error.notOwnedSimple", { item: itemLabel(t, itemId) });
  }

  const { maxHp } = computeStats(character, items);
  const healed = Math.min(item.effect.hp ?? 0, maxHp - character.hp);
  const energy = Math.min(item.effect.energy ?? 0, ENERGY_MAX - character.energy);

  const updated = await updateAdventureCharacter(character.userId, {
    hp: character.hp + healed,
    energy: character.energy + energy,
  });

  return {
    character: updated,
    items: await listAdventureItems(character.userId),
    healed,
    energy,
    xp: item.effect.xp ?? 0,
  };
}
