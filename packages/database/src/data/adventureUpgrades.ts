import type { AdventureItemDefinition, AdventureItemRarity } from "./adventureItems";

/**
 * Gear upgrades. The idea: a piece already found or crafted is improved at the forge against
 * resources and gold, up to +10. It is what high level materials are for, and a way to keep a
 * favourite piece useful for longer.
 *
 * An upgrade belongs to one player's copy (an inventory row): it does not follow the item through
 * a trade, which avoids a market of pre-upgraded gear and rewards whoever spent their own
 * resources.
 */

export const ADVENTURE_MAX_UPGRADE = 10;
/** Bonus gained per tier: +12 %, so +120 % on a piece taken to the maximum. */
export const ADVENTURE_UPGRADE_STEP = 0.12;

export interface AdventureUpgradeCost {
  gold: number;
  materials: { itemId: string; quantity: number }[];
}

/** Materials required by rarity: the rarer the piece, the harder the resource. */
const UPGRADE_MATERIALS: Readonly<Record<AdventureItemRarity, string[]>> = {
  COMMUNE: ["lingot-fer"],
  RARE: ["lingot-fer", "ecaille-drake"],
  EPIQUE: ["ecaille-drake", "coeur-elementaire"],
  LEGENDAIRE: ["coeur-elementaire", "eclat-echo"],
};

/** Multiplier applied to the bonuses of the piece (1 at tier 0, 2.2 at tier 10). */
export function adventureUpgradeMultiplier(level: number): number {
  const clamped = Math.max(0, Math.min(ADVENTURE_MAX_UPGRADE, level));
  return 1 + ADVENTURE_UPGRADE_STEP * clamped;
}

/** Suffix shown after the name of an upgraded item ("Iron sword **+3**"). */
export function adventureUpgradeSuffix(level: number): string {
  return level > 0 ? ` +${level}` : "";
}

/**
 * Cost of moving to tier `nextLevel`. Returns null when the item cannot be upgraded (anything that
 * is not a piece of gear) or when the maximum is already reached.
 */
export function adventureUpgradeCost(
  item: AdventureItemDefinition,
  nextLevel: number,
): AdventureUpgradeCost | null {
  if (!item.slot || nextLevel < 1 || nextLevel > ADVENTURE_MAX_UPGRADE) return null;

  // Reference value of the piece: its shop price, or four times what it sells back for.
  const value = item.price ?? item.sellPrice * 4;
  const gold = Math.max(50, Math.round(value * 0.35 * nextLevel ** 1.4));

  const materials = UPGRADE_MATERIALS[item.rarity].map((itemId, index) => ({
    itemId,
    quantity: Math.max(1, Math.ceil((nextLevel * (index === 0 ? 1.5 : 0.6)) / 2)),
  }));

  return { gold, materials };
}
