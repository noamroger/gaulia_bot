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
import { findItem, itemLabel, requireItem, type ItemDefinition } from "../../data/items";
import { dispatchGameEvents } from "../events/eventDispatcher";
import { countItem } from "../inventory/inventoryService";

export interface UpgradePlan {
  item: ItemDefinition;
  row: AdventureItem;
  nextLevel: number;
  cost: AdventureUpgradeCost;
  /** Ce qui manque encore, prêt à l'affichage ; vide quand le renforcement est payable. */
  missing: string[];
}

/** Ce que coûterait le prochain palier, et ce qui manque éventuellement pour l'offrir. */
export function planUpgrade(
  character: AdventureCharacter,
  items: AdventureItem[],
  itemId: string,
): UpgradePlan {
  const item = requireItem(itemId);
  if (!item.slot) {
    throw new GauliaError(
      `${itemLabel(itemId)} n'est pas une pièce d'équipement : rien à renforcer.`,
    );
  }

  const row = items.find((entry) => entry.itemId === itemId);
  if (!row) throw new GauliaError(`Tu ne possèdes pas ${itemLabel(itemId)}.`);

  const nextLevel = row.upgradeLevel + 1;
  if (nextLevel > ADVENTURE_MAX_UPGRADE) {
    throw new GauliaError(
      `${itemLabel(itemId)} est déjà au palier maximum (+${ADVENTURE_MAX_UPGRADE}).`,
    );
  }

  const cost = adventureUpgradeCost(item, nextLevel);
  if (!cost) throw new GauliaError(`${itemLabel(itemId)} ne se renforce pas.`);

  const missing: string[] = [];
  if (character.gold < cost.gold) missing.push(`${cost.gold - character.gold} 🪙`);
  for (const material of cost.materials) {
    const owned = countItem(items, material.itemId);
    if (owned < material.quantity) {
      missing.push(`${material.quantity - owned} × ${itemLabel(material.itemId)}`);
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
 * Renforce une pièce d'un palier. Le coût est déterministe et rien ne peut échouer : pas de
 * loterie de destruction, seulement des ressources à réunir.
 */
export async function upgradeItem(
  character: AdventureCharacter,
  items: AdventureItem[],
  itemId: string,
): Promise<UpgradeResult> {
  const plan = planUpgrade(character, items, itemId);
  if (plan.missing.length > 0) {
    throw new GauliaError(`Il te manque ${plan.missing.join(", ")} pour ce renforcement.`);
  }

  for (const material of plan.cost.materials) {
    if (!(await removeAdventureItem(character.userId, material.itemId, material.quantity))) {
      throw new GauliaError(`Il te manque ${itemLabel(material.itemId)} pour ce renforcement.`);
    }
  }
  await upgradeAdventureItem(character.userId, itemId, plan.nextLevel);

  const updated = await updateAdventureCharacter(character.userId, {
    gold: character.gold - plan.cost.gold,
    upgrades: character.upgrades + 1,
  });
  const dispatched = await dispatchGameEvents(updated, items, [
    { type: "UPGRADE", itemId, amount: 1 },
    { type: "GOLD_SPENT", amount: plan.cost.gold },
  ]);

  return { character: dispatched.character, plan, notices: dispatched.notices };
}

/** Pièces renforçables du sac, pour l'autocomplétion et le menu de la forge. */
export function upgradableItems(items: AdventureItem[]): AdventureItem[] {
  return items.filter(
    (row) => findItem(row.itemId)?.slot !== undefined && row.upgradeLevel < ADVENTURE_MAX_UPGRADE,
  );
}
