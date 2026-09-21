import type { AdventureClass } from "@gaulia/database";

import type { Translator } from "../../../../i18n";

import type { MonsterDefinition } from "../../data/monsters";
import type { DerivedStats } from "../character/statsService";

const MAX_ROUNDS = 30;
const CRIT_MULTIPLIER = 1.8;

/** Class passives, applied while computing damage. */
const CLASS_MODIFIERS: Readonly<
  Record<AdventureClass, { dealt: number; taken: number; critBonus: number }>
> = {
  GUERRIER: { dealt: 1, taken: 0.85, critBonus: 0 },
  MAGE: { dealt: 1.2, taken: 1.1, critBonus: 0 },
  RODEUR: { dealt: 1, taken: 1, critBonus: 5 },
};

export interface CombatResult {
  victory: boolean;
  /** Health left (never negative: a defeat leaves the character at 1 HP). */
  hpLeft: number;
  rounds: number;
  damageDealt: number;
  damageTaken: number;
  /** Two or three lines summing up the fight, ready to display. */
  highlights: string[];
}

function variance(): number {
  return 0.85 + Math.random() * 0.3;
}

/**
 * Turn based fight resolved in one go: the player does not click between exchanges, but the
 * summary tells what happened. Both sides strike in turn, the player first.
 */
export function resolveCombat(
  stats: DerivedStats,
  characterClass: AdventureClass,
  hp: number,
  monster: MonsterDefinition,
  t: Translator,
): CombatResult {
  const modifiers = CLASS_MODIFIERS[characterClass];
  const critChance = (stats.crit + modifiers.critBonus) / 100;

  let playerHp = hp;
  let monsterHp = monster.hp;
  let damageDealt = 0;
  let damageTaken = 0;
  let crits = 0;
  let dodges = 0;
  let rounds = 0;

  while (playerHp > 0 && monsterHp > 0 && rounds < MAX_ROUNDS) {
    rounds += 1;

    const critical = Math.random() < critChance;
    if (critical) crits += 1;
    const hit = Math.max(
      1,
      Math.round(
        (stats.offense * variance() - monster.defense * 0.5) *
          modifiers.dealt *
          (critical ? CRIT_MULTIPLIER : 1),
      ),
    );
    monsterHp -= hit;
    damageDealt += hit;
    if (monsterHp <= 0) break;

    if (Math.random() < stats.dodge / 100) {
      dodges += 1;
      continue;
    }
    const blow = Math.max(
      1,
      Math.round((monster.attack * variance() - stats.defense * 0.5) * modifiers.taken),
    );
    playerHp -= blow;
    damageTaken += blow;
  }

  const victory = monsterHp <= 0;
  const highlights = [
    t("adventure.combat.summary", {
      rounds,
      dealt: damageDealt,
      taken: damageTaken,
    }),
  ];
  if (crits > 0) highlights.push(t("adventure.combat.crits", { count: crits }));
  if (dodges > 0) highlights.push(t("adventure.combat.dodges", { count: dodges }));
  if (!victory && rounds >= MAX_ROUNDS) highlights.push(t("adventure.combat.timeout"));

  return {
    victory,
    hpLeft: Math.max(1, playerHp),
    rounds,
    damageDealt,
    damageTaken,
    highlights,
  };
}
