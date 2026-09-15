import {
  updateAdventureCharacter,
  type AdventureCharacter,
  type AdventureItem,
} from "@gaulia/database";

import { ENERGY_MAX, ENERGY_REGEN_MS, HP_REGEN_MS, HP_REGEN_RATIO } from "../../data/pacing";
import { computeStats } from "./statsService";

/**
 * Points de vie et énergie ne sont pas régénérés par une tâche de fond : ils sont recalculés à
 * partir de `regenAt` au moment où le joueur agit. Une seule écriture suffit donc, quel que soit
 * le nombre de joueurs inactifs.
 */
export function regeneratedVitals(
  character: AdventureCharacter,
  maxHp: number,
  now: number,
): { hp: number; energy: number; regenAt: Date } {
  const elapsed = Math.max(0, now - character.regenAt.getTime());

  const energy = Math.min(ENERGY_MAX, character.energy + Math.floor(elapsed / ENERGY_REGEN_MS));
  const hpPerTick = Math.max(1, Math.round(maxHp * HP_REGEN_RATIO));
  const hp = Math.min(maxHp, character.hp + Math.floor(elapsed / HP_REGEN_MS) * hpPerTick);

  // Le reste de la période en cours n'est pas perdu : on n'avance `regenAt` que des paliers
  // réellement consommés, sauf quand les deux jauges sont pleines.
  const consumed = Math.min(
    energy >= ENERGY_MAX ? elapsed : Math.floor(elapsed / ENERGY_REGEN_MS) * ENERGY_REGEN_MS,
    hp >= maxHp ? elapsed : Math.floor(elapsed / HP_REGEN_MS) * HP_REGEN_MS,
  );

  return { hp, energy, regenAt: new Date(character.regenAt.getTime() + consumed) };
}

/** Applique la régénération en base si elle a changé quelque chose, et retourne l'état à jour. */
export async function refreshVitals(
  character: AdventureCharacter,
  items: AdventureItem[],
): Promise<AdventureCharacter> {
  const { maxHp } = computeStats(character, items);
  const vitals = regeneratedVitals(character, maxHp, Date.now());

  if (
    vitals.hp === character.hp &&
    vitals.energy === character.energy &&
    vitals.regenAt.getTime() === character.regenAt.getTime()
  ) {
    return character;
  }

  return updateAdventureCharacter(character.userId, vitals);
}

/** Temps restant avant le prochain point d'énergie, en millisecondes (0 si la jauge est pleine). */
export function msUntilNextEnergy(character: AdventureCharacter, now: number): number {
  if (character.energy >= ENERGY_MAX) return 0;
  const elapsed = Math.max(0, now - character.regenAt.getTime());
  return ENERGY_REGEN_MS - (elapsed % ENERGY_REGEN_MS);
}
