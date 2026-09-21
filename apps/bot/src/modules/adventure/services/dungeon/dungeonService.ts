import {
  addAdventureLog,
  updateAdventureCharacter,
  type AdventureCharacter,
  type AdventureItem,
} from "@gaulia/database";

import { GauliaError } from "../../../../core/errors";
import { formatDurationMs } from "../../../../core/utils/duration";
import type { Translator } from "../../../../i18n";
import { monsterName, requireMonster, type MonsterDefinition } from "../../data/monsters";
import {
  baseExploreGold,
  baseExploreXp,
  DUNGEON_COOLDOWN_MS,
  ECHOES_PER_DUNGEON,
  ENERGY_PER_DUNGEON,
  HP_EXPLORE_THRESHOLD,
} from "../../data/pacing";
import { actTitle, requireAct } from "../../data/story";
import { grantXp } from "../character/progressionService";
import { computeStats } from "../character/statsService";
import { resolveCombat, type CombatResult } from "../combat/combatEngine";
import { rollMonsterLoot } from "../combat/encounterService";
import { dispatchGameEvents } from "../events/eventDispatcher";
import type { GameEvent } from "../events/gameEvents";
import { grantItems } from "../inventory/inventoryService";

export interface DungeonStatus {
  guardian: MonsterDefinition;
  actIndex: number;
  /** Milliseconds before the next attempt; 0 when the dungeon is available. */
  cooldownMs: number;
}

export function dungeonStatus(character: AdventureCharacter, now = Date.now()): DungeonStatus {
  const act = requireAct(character.actIndex);
  const elapsed = character.lastDungeonAt ? now - character.lastDungeonAt.getTime() : Infinity;

  return {
    guardian: requireMonster(act.guardianId),
    actIndex: character.actIndex,
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
 * Act dungeon: one a week, won or not. It is the appointment that paces the story, bringing most
 * of the echo shards and the relic of the final chapter. A defeat only costs energy, so the player
 * can try again the same day with better gear.
 */
export async function runDungeon(
  character: AdventureCharacter,
  items: AdventureItem[],
  t: Translator,
): Promise<DungeonOutcome> {
  const status = dungeonStatus(character);
  const stats = computeStats(character, items);

  if (status.cooldownMs > 0) {
    throw new GauliaError("adventure.error.dungeonCooldown", {
      duration: formatDurationMs(status.cooldownMs, t),
    });
  }
  if (character.energy < ENERGY_PER_DUNGEON) {
    throw new GauliaError("adventure.error.dungeonEnergy", {
      cost: ENERGY_PER_DUNGEON,
      current: character.energy,
    });
  }
  if (character.hp < Math.round(stats.maxHp * HP_EXPLORE_THRESHOLD)) {
    throw new GauliaError("adventure.error.dungeonHurt");
  }

  const guardian = status.guardian;
  const combat = resolveCombat(stats, character.characterClass, character.hp, guardian, t);
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

    // Journal entries are stored, and the admin panel reads them too: they are written in English.
    await addAdventureLog({
      userId: character.userId,
      type: "DUNGEON",
      message: t("adventure.logs.dungeon", {
        guardian: monsterName(t, guardian),
        act: actTitle(t, requireAct(status.actIndex)),
      }),
    });
    notices.push(t("adventure.notices.dungeonWon", { count: echoes }));
  } else {
    notices.push(t("adventure.notices.dungeonLost"));
  }

  let updated = await updateAdventureCharacter(character.userId, {
    hp: combat.hpLeft,
    energy: character.energy - ENERGY_PER_DUNGEON,
    gold: character.gold + gold,
    echoes: character.echoes + echoes,
    victories: character.victories + (combat.victory ? 1 : 0),
    defeats: character.defeats + (combat.victory ? 0 : 1),
    dungeonClears: character.dungeonClears + (combat.victory ? 1 : 0),
    // The weekly lock only trips on a win: a failure stays retryable.
    lastDungeonAt: combat.victory ? new Date() : character.lastDungeonAt,
  });

  const gain = await grantXp(updated, items, xp);
  updated = gain.character;
  if (gain.levelsGained > 0) {
    notices.push(t("adventure.notices.levelUp", { level: gain.level }));
  }

  const dispatched = await dispatchGameEvents(updated, items, events, t);

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
