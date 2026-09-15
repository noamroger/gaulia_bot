import {
  addAdventureLog,
  updateAdventureCharacter,
  type AdventureCharacter,
  type AdventureItem,
} from "@gaulia/database";

import { GauliaError } from "../../../../core/errors";
import {
  baseExploreGold,
  baseExploreXp,
  DUNGEON_COOLDOWN_MS,
  ECHOES_PER_DUNGEON,
  ENERGY_PER_DUNGEON,
  HP_EXPLORE_THRESHOLD,
} from "../../data/pacing";
import { requireMonster, type MonsterDefinition } from "../../data/monsters";
import { requireAct } from "../../data/story";
import { grantXp } from "../character/progressionService";
import { computeStats } from "../character/statsService";
import { resolveCombat, type CombatResult } from "../combat/combatEngine";
import { rollMonsterLoot } from "../combat/encounterService";
import { dispatchGameEvents } from "../events/eventDispatcher";
import type { GameEvent } from "../events/gameEvents";
import { grantItems } from "../inventory/inventoryService";
import { formatDuration } from "../../ui/format";

export interface DungeonStatus {
  guardian: MonsterDefinition;
  actTitle: string;
  /** Millisecondes avant la prochaine tentative ; 0 si le donjon est disponible. */
  cooldownMs: number;
}

export function dungeonStatus(character: AdventureCharacter, now = Date.now()): DungeonStatus {
  const act = requireAct(character.actIndex);
  const elapsed = character.lastDungeonAt ? now - character.lastDungeonAt.getTime() : Infinity;

  return {
    guardian: requireMonster(act.guardianId),
    actTitle: act.title,
    cooldownMs: Math.max(0, DUNGEON_COOLDOWN_MS - elapsed),
  };
}

export interface DungeonOutcome {
  character: AdventureCharacter;
  guardian: MonsterDefinition;
  combat: CombatResult;
  loot: { itemId: string; quantity: number }[];
  xp: number;
  gold: number;
  echoes: number;
  notices: string[];
}

/**
 * Donjon de l'acte : un seul par semaine, remporté ou non. C'est le rendez-vous qui cadence
 * l'histoire — il rapporte l'essentiel des fragments d'écho et la relique du chapitre final.
 * Une défaite ne consomme que l'énergie : on peut réessayer le jour même en s'équipant mieux.
 */
export async function runDungeon(
  character: AdventureCharacter,
  items: AdventureItem[],
): Promise<DungeonOutcome> {
  const status = dungeonStatus(character);
  const stats = computeStats(character, items);

  if (status.cooldownMs > 0) {
    throw new GauliaError(
      `Le gardien ne se montrera pas avant ${formatDuration(status.cooldownMs)}. Un donjon par semaine, pas davantage.`,
    );
  }
  if (character.energy < ENERGY_PER_DUNGEON) {
    throw new GauliaError(
      `Un donjon demande ${ENERGY_PER_DUNGEON} points d'énergie (tu en as ${character.energy}).`,
    );
  }
  if (character.hp < Math.round(stats.maxHp * HP_EXPLORE_THRESHOLD)) {
    throw new GauliaError("Tu es trop amoché pour affronter un gardien. Soigne-toi d'abord.");
  }

  const guardian = status.guardian;
  const combat = resolveCombat(stats, character.characterClass, character.hp, guardian);
  const notices: string[] = [];

  let xp = 0;
  let gold = 0;
  let echoes = 0;
  let loot: { itemId: string; quantity: number }[] = [];
  const events: GameEvent[] = [];

  if (combat.victory) {
    xp = Math.round(baseExploreXp(character.level) * guardian.xpFactor * 12);
    gold = Math.round(baseExploreGold(character.level) * guardian.goldFactor * 12);
    echoes = ECHOES_PER_DUNGEON;
    loot = rollMonsterLoot(guardian);
    events.push({ type: "DUNGEON", actIndex: character.actIndex, amount: 1 });
    for (const entry of loot) {
      events.push({ type: "COLLECT", itemId: entry.itemId, amount: entry.quantity });
    }
    await grantItems(character.userId, loot);
    await addAdventureLog({
      userId: character.userId,
      type: "DUNGEON",
      message: `Gardien vaincu : ${guardian.name} (${status.actTitle})`,
    });
    notices.push(`🔷 Le gardien cède : **+${echoes} fragments d'écho**.`);
  } else {
    notices.push(
      "💀 Le gardien te repousse. Reviens mieux équipé : il t'attend encore aujourd'hui.",
    );
  }

  let updated = await updateAdventureCharacter(character.userId, {
    hp: combat.hpLeft,
    energy: character.energy - ENERGY_PER_DUNGEON,
    gold: character.gold + gold,
    echoes: character.echoes + echoes,
    victories: character.victories + (combat.victory ? 1 : 0),
    defeats: character.defeats + (combat.victory ? 0 : 1),
    dungeonClears: character.dungeonClears + (combat.victory ? 1 : 0),
    // Le verrou hebdomadaire ne se déclenche qu'à la victoire : un échec reste réessayable.
    lastDungeonAt: combat.victory ? new Date() : character.lastDungeonAt,
  });

  const gain = await grantXp(updated, items, xp);
  updated = gain.character;
  if (gain.levelsGained > 0) notices.push(`⬆️ Niveau **${gain.level}** atteint !`);

  const dispatched = await dispatchGameEvents(updated, items, events);

  return {
    character: dispatched.character,
    guardian,
    combat,
    loot,
    xp,
    gold,
    echoes,
    notices: [...notices, ...dispatched.notices],
  };
}
