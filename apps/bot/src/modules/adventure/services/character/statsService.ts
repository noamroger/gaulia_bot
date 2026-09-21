import type { AdventureCharacter, AdventureItem } from "@gaulia/database";

import { adventureUpgradeMultiplier } from "@gaulia/database";

import { findItem, type ItemBonus, type ItemSlot } from "../../data/items";

/** Effective stats, gear included: the whole game reads these values. */
export interface DerivedStats {
  maxHp: number;
  attack: number;
  power: number;
  defense: number;
  /** Percentages, already capped. */
  crit: number;
  dodge: number;
  /** Offensive value the class actually uses (might or spirit). */
  offense: number;
}

const CRIT_CAP = 60;
const DODGE_CAP = 30;

function sumBonuses(items: AdventureItem[]): ItemBonus {
  const total: Required<ItemBonus> = {
    attack: 0,
    defense: 0,
    power: 0,
    maxHp: 0,
    crit: 0,
    dodge: 0,
  };

  for (const row of items) {
    if (!row.equipped) continue;
    const bonus = findItem(row.itemId)?.bonus;
    if (!bonus) continue;

    // The upgrade multiplies the bonuses of the piece, never the base stats.
    const factor = adventureUpgradeMultiplier(row.upgradeLevel);
    total.attack += Math.round((bonus.attack ?? 0) * factor);
    total.defense += Math.round((bonus.defense ?? 0) * factor);
    total.power += Math.round((bonus.power ?? 0) * factor);
    total.maxHp += Math.round((bonus.maxHp ?? 0) * factor);
    total.crit += (bonus.crit ?? 0) * factor;
    total.dodge += (bonus.dodge ?? 0) * factor;
  }

  return total;
}

export function computeStats(character: AdventureCharacter, items: AdventureItem[]): DerivedStats {
  const bonus = sumBonuses(items);

  const maxHp = Math.round(80 + character.level * 12 + character.might * 6 + (bonus.maxHp ?? 0));
  const attack = Math.round(6 + character.might * 3 + character.level * 1.2 + (bonus.attack ?? 0));
  const power = Math.round(5 + character.spirit * 3.2 + character.level * 1.2 + (bonus.power ?? 0));
  const defense = Math.round(
    3 +
      character.agility * 1.2 +
      character.might * 0.8 +
      character.level * 0.8 +
      (bonus.defense ?? 0),
  );
  const crit = Math.min(CRIT_CAP, 5 + character.agility * 0.5 + (bonus.crit ?? 0));
  const dodge = Math.min(DODGE_CAP, 2 + character.agility * 0.35 + (bonus.dodge ?? 0));

  return {
    maxHp,
    attack,
    power,
    defense,
    crit: Math.round(crit * 10) / 10,
    dodge: Math.round(dodge * 10) / 10,
    offense: character.characterClass === "MAGE" ? power : attack,
  };
}

/** Piece worn in a slot, when the character wears one. */
export function equippedIn(items: AdventureItem[], slot: ItemSlot): AdventureItem | undefined {
  return items.find((row) => row.equipped && findItem(row.itemId)?.slot === slot);
}
