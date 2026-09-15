import type { AdventureClass } from "@gaulia/database";

import type { MonsterDefinition } from "../../data/monsters";
import type { DerivedStats } from "../character/statsService";

const MAX_ROUNDS = 30;
const CRIT_MULTIPLIER = 1.8;

/** Passifs de classe, appliqués au moment du calcul des dégâts. */
const CLASS_MODIFIERS: Readonly<
  Record<AdventureClass, { dealt: number; taken: number; critBonus: number }>
> = {
  GUERRIER: { dealt: 1, taken: 0.85, critBonus: 0 },
  MAGE: { dealt: 1.2, taken: 1.1, critBonus: 0 },
  RODEUR: { dealt: 1, taken: 1, critBonus: 5 },
};

export interface CombatResult {
  victory: boolean;
  /** Points de vie restants (jamais négatifs : une défaite laisse le personnage à 1 PV). */
  hpLeft: number;
  rounds: number;
  damageDealt: number;
  damageTaken: number;
  /** Deux ou trois lignes résumant le combat, prêtes à l'affichage. */
  highlights: string[];
}

function variance(): number {
  return 0.85 + Math.random() * 0.3;
}

/**
 * Combat au tour par tour résolu d'un bloc : le joueur n'a pas à cliquer entre chaque échange,
 * mais le résumé raconte ce qui s'est passé. Les deux camps frappent à tour de rôle, le joueur
 * commence.
 */
export function resolveCombat(
  stats: DerivedStats,
  characterClass: AdventureClass,
  hp: number,
  monster: MonsterDefinition,
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
    `⚔️ ${rounds} échange(s) · ${damageDealt} dégâts infligés · ${damageTaken} subis`,
  ];
  if (crits > 0) highlights.push(`💥 ${crits} coup(s) critique(s) placé(s).`);
  if (dodges > 0) highlights.push(`🌀 ${dodges} attaque(s) esquivée(s).`);
  if (!victory && rounds >= MAX_ROUNDS) {
    highlights.push("🕰️ Le combat s'éternise : tu romps le contact avant l'épuisement.");
  }

  return {
    victory,
    hpLeft: Math.max(1, playerHp),
    rounds,
    damageDealt,
    damageTaken,
    highlights,
  };
}
