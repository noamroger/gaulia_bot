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

/** Inventaire enrichi des définitions, objets inconnus (retirés du catalogue) exclus. */
export function describeInventory(items: AdventureItem[]): InventoryEntry[] {
  return items.flatMap((row) => {
    const item = findItem(row.itemId);
    return item ? [{ row, item }] : [];
  });
}

export function countItem(items: AdventureItem[], itemId: string): number {
  return items.find((row) => row.itemId === itemId)?.quantity ?? 0;
}

/** Ajoute plusieurs objets d'un coup (butin, récompense de chapitre, don du panel admin). */
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
): Promise<AdventureItem[]> {
  const item = requireItem(itemId);
  if (!item.slot) throw new GauliaError(`${itemLabel(itemId)} ne s'équipe pas.`);
  if (countItem(items, itemId) === 0) {
    throw new GauliaError(`Tu ne possèdes pas ${itemLabel(itemId)}.`);
  }
  if ((item.level ?? 1) > character.level) {
    throw new GauliaError(
      `${itemLabel(itemId)} demande le niveau ${item.level ?? 1} (tu es niveau ${character.level}).`,
    );
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

export interface ConsumeResult {
  character: AdventureCharacter;
  items: AdventureItem[];
  /** Effets réellement appliqués, pour l'affichage (bornés par les maximums). */
  healed: number;
  energy: number;
  xp: number;
}

/** Utilise un consommable : soin, énergie ou expérience, toujours borné par les maximums. */
export async function consumeItem(
  character: AdventureCharacter,
  items: AdventureItem[],
  itemId: string,
): Promise<ConsumeResult> {
  const item = requireItem(itemId);
  if (item.kind !== "CONSOMMABLE" || !item.effect) {
    throw new GauliaError(`${itemLabel(itemId)} ne s'utilise pas.`);
  }
  if ((item.level ?? 1) > character.level) {
    throw new GauliaError(`${itemLabel(itemId)} demande le niveau ${item.level ?? 1}.`);
  }
  if (!(await removeAdventureItem(character.userId, itemId, 1))) {
    throw new GauliaError(`Tu ne possèdes pas ${itemLabel(itemId)}.`);
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
