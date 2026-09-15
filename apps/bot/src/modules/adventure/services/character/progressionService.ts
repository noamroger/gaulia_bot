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
  /** Niveau atteint après l'application du gain. */
  level: number;
}

/**
 * Ajoute de l'expérience et enchaîne les passages de niveau. Chaque niveau rend toute la vie et
 * accorde des points de caractéristique à répartir : monter de niveau relance toujours le joueur.
 */
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

/** Part de la barre d'expérience du niveau courant, entre 0 et 1. */
export function xpRatio(character: AdventureCharacter): number {
  const needed = xpToNextLevel(character.level);
  if (needed === 0) return 1;
  return Math.min(1, character.xp / needed);
}
