import {
  updateAdventureCharacter,
  type AdventureCharacter,
  type AdventureItem,
} from "@gaulia/database";

import { applyAdventureXp, xpToNextLevel } from "../../data/pacing";
import { computeStats } from "./statsService";

export interface XpGain {
  character: AdventureCharacter;
  levelsGained: number;
  /** Level reached once the gain is applied. */
  level: number;
}

/** Adds experience and chains level ups. Each level restores full health and grants stat points. */
export async function grantXp(
  character: AdventureCharacter,
  items: AdventureItem[],
  amount: number,
): Promise<XpGain> {
  if (amount <= 0) return { character, levelsGained: 0, level: character.level };

  const { level, xp, totalXp, statPoints, levelsGained } = applyAdventureXp(character, amount);

  const patch: Parameters<typeof updateAdventureCharacter>[1] = { level, xp, totalXp, statPoints };
  if (levelsGained > 0) {
    patch.hp = computeStats({ ...character, level, statPoints }, items).maxHp;
  }

  return {
    character: await updateAdventureCharacter(character.userId, patch),
    levelsGained,
    level,
  };
}

/** Share of the current level's experience bar, between 0 and 1. */
export function xpRatio(character: AdventureCharacter): number {
  const needed = xpToNextLevel(character.level);
  if (needed === 0) return 1;
  return Math.min(1, character.xp / needed);
}
