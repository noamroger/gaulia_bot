import type { AdventureItemDefinition, AdventureItemRarity } from "./adventureItems";

/**
 * Renforcement des pièces d'équipement. Le principe : une pièce déjà trouvée ou forgée se fait
 * améliorer à la forge contre des ressources et de l'or, jusqu'à +10. C'est le débouché des
 * matériaux de haut niveau, et une façon de garder utile un équipement aimé plus longtemps.
 *
 * Le renforcement porte sur l'exemplaire d'un joueur (ligne d'inventaire) : il ne suit pas l'objet
 * lors d'un échange — ce qui évite un marché de pièces déjà renforcées, et récompense celui qui a
 * dépensé ses propres ressources.
 */

export const ADVENTURE_MAX_UPGRADE = 10;
/** Gain de bonus par palier : +12 %, soit +120 % sur une pièce menée au maximum. */
export const ADVENTURE_UPGRADE_STEP = 0.12;

export interface AdventureUpgradeCost {
  gold: number;
  materials: { itemId: string; quantity: number }[];
}

/** Matériaux exigés selon la rareté : plus la pièce est rare, plus la ressource est difficile. */
const UPGRADE_MATERIALS: Readonly<Record<AdventureItemRarity, string[]>> = {
  COMMUNE: ["lingot-fer"],
  RARE: ["lingot-fer", "ecaille-drake"],
  EPIQUE: ["ecaille-drake", "coeur-elementaire"],
  LEGENDAIRE: ["coeur-elementaire", "eclat-echo"],
};

/** Multiplicateur appliqué aux bonus de la pièce (1 au palier 0, 2,2 au palier 10). */
export function adventureUpgradeMultiplier(level: number): number {
  const clamped = Math.max(0, Math.min(ADVENTURE_MAX_UPGRADE, level));
  return 1 + ADVENTURE_UPGRADE_STEP * clamped;
}

/** Suffixe affiché après le nom d'un objet renforcé (« Épée de fer **+3** »). */
export function adventureUpgradeSuffix(level: number): string {
  return level > 0 ? ` +${level}` : "";
}

/**
 * Coût du passage au palier `nextLevel`. Retourne null si l'objet ne se renforce pas (tout ce qui
 * n'est pas une pièce d'équipement) ou si le maximum est déjà atteint.
 */
export function adventureUpgradeCost(
  item: AdventureItemDefinition,
  nextLevel: number,
): AdventureUpgradeCost | null {
  if (!item.slot || nextLevel < 1 || nextLevel > ADVENTURE_MAX_UPGRADE) return null;

  // Valeur de référence de la pièce : son prix en boutique, ou quatre fois sa revente.
  const value = item.price ?? item.sellPrice * 4;
  const gold = Math.max(50, Math.round(value * 0.35 * nextLevel ** 1.4));

  const materials = UPGRADE_MATERIALS[item.rarity].map((itemId, index) => ({
    itemId,
    quantity: Math.max(1, Math.ceil((nextLevel * (index === 0 ? 1.5 : 0.6)) / 2)),
  }));

  return { gold, materials };
}
