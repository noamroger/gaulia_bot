import {
  updateAdventureCharacter,
  type AdventureCharacter,
  type AdventureItem,
} from "@gaulia/database";

import { GauliaError } from "../../../../core/errors";
import { formatDurationMs } from "../../../../core/utils/duration";
import type { Translator } from "../../../../i18n";
import type { MonsterDefinition } from "../../data/monsters";
import {
  baseExploreGold,
  baseExploreXp,
  ECHO_FIND_CHANCE,
  ENERGY_PER_EXPLORE,
  HP_EXPLORE_THRESHOLD,
  STREAK_BONUS_MAX,
  STREAK_BONUS_PER_DAY,
} from "../../data/pacing";
import { requireZone, type ZoneDefinition } from "../../data/zones";
import { computeStats } from "../character/statsService";
import { grantXp } from "../character/progressionService";
import { msUntilNextEnergy } from "../character/vitalsService";
import { resolveCombat, type CombatResult } from "../combat/combatEngine";
import { drawEncounter, rollMonsterLoot } from "../combat/encounterService";
import { dispatchGameEvents } from "../events/eventDispatcher";
import type { GameEvent } from "../events/gameEvents";
import { grantItems, healingItems } from "../inventory/inventoryService";

export interface ExploreOutcome {
  character: AdventureCharacter;
  zone: ZoneDefinition;
  kind: "COMBAT" | "FIND" | "CALM";
  monster: MonsterDefinition | null;
  combat: CombatResult | null;
  ambiance: string | null;
  loot: { itemId: string; quantity: number }[];
  xp: number;
  gold: number;
  echoFound: boolean;
  levelsGained: number;
  notices: string[];
  /** True when a potion in the bag would restore health: drives the heal button. */
  canHeal: boolean;
}

/** Loot multiplier: streak of consecutive days, plus the ranger's flair. */
function lootMultiplier(character: AdventureCharacter): number {
  const streak = Math.min(STREAK_BONUS_MAX, character.streak * STREAK_BONUS_PER_DAY);
  const classBonus = character.characterClass === "RODEUR" ? 0.1 : 0;
  return 1 + streak + classBonus;
}

/**
 * Main loop of the game. An exploration spends energy, draws an encounter in the current zone and
 * applies every consequence: fight, loot, experience, quests, chapter and achievements.
 */
export async function explore(
  character: AdventureCharacter,
  items: AdventureItem[],
  t: Translator,
): Promise<ExploreOutcome> {
  const stats = computeStats(character, items);

  if (character.energy < ENERGY_PER_EXPLORE) {
    throw new GauliaError("adventure.error.noEnergy", {
      duration: formatDurationMs(msUntilNextEnergy(character, Date.now()), t),
    });
  }
  if (character.hp < Math.round(stats.maxHp * HP_EXPLORE_THRESHOLD)) {
    throw new GauliaError("adventure.error.tooHurt");
  }

  const zone = requireZone(character.zoneId);
  const encounter = drawEncounter(zone, t);
  const multiplier = lootMultiplier(character);

  let xp = 0;
  let gold = 0;
  let hp = character.hp;
  let loot: { itemId: string; quantity: number }[] = [];
  let combat: CombatResult | null = null;
  let monster: MonsterDefinition | null = null;
  let ambiance: string | null = null;
  const events: GameEvent[] = [{ type: "EXPLORE", zoneId: zone.id, amount: 1 }];
  const notices: string[] = [];

  if (encounter.kind === "COMBAT") {
    monster = encounter.monster;
    combat = resolveCombat(stats, character.characterClass, character.hp, monster, t);
    hp = combat.hpLeft;

    if (combat.victory) {
      xp = Math.round(baseExploreXp(character.level) * zone.xpMultiplier * monster.xpFactor);
      gold = Math.round(
        baseExploreGold(character.level) * zone.goldMultiplier * monster.goldFactor * multiplier,
      );
      loot = rollMonsterLoot(monster);
      events.push({ type: "DEFEAT", family: monster.family, zoneId: zone.id, amount: 1 });
    } else {
      // No permanent death: the player leaves with one health point and loses nothing else.
      xp = Math.round(baseExploreXp(character.level) * 0.25);
      notices.push(t("adventure.notices.combatBreak"));
    }
  } else if (encounter.kind === "FIND") {
    loot = [encounter.loot];
    xp = Math.round(baseExploreXp(character.level) * zone.xpMultiplier * 0.6);
    gold = Math.round(baseExploreGold(character.level) * zone.goldMultiplier * 0.5 * multiplier);
  } else {
    ambiance = encounter.ambiance;
    xp = Math.round(baseExploreXp(character.level) * 0.35);
  }

  const echoFound = Math.random() < ECHO_FIND_CHANCE;
  if (echoFound) notices.push(t("adventure.notices.echoFound"));

  if (loot.length > 0) {
    await grantItems(character.userId, loot);
    for (const entry of loot) {
      events.push({ type: "COLLECT", itemId: entry.itemId, amount: entry.quantity });
    }
  }
  if (gold > 0) events.push({ type: "GOLD_EARNED", amount: gold });

  let updated = await updateAdventureCharacter(character.userId, {
    hp,
    energy: character.energy - ENERGY_PER_EXPLORE,
    gold: character.gold + gold,
    echoes: character.echoes + (echoFound ? 1 : 0),
    explorations: character.explorations + 1,
    victories: character.victories + (combat?.victory ? 1 : 0),
    defeats: character.defeats + (combat && !combat.victory ? 1 : 0),
  });

  const gain = await grantXp(updated, items, xp);
  updated = gain.character;
  if (gain.levelsGained > 0) {
    notices.push(t("adventure.notices.levelUpPoints", { level: gain.level }));
  }

  const dispatched = await dispatchGameEvents(updated, items, events, t);
  const healed = dispatched.character;

  return {
    character: healed,
    canHeal: healed.hp < stats.maxHp && healingItems(items).length > 0,
    zone,
    kind: encounter.kind,
    monster,
    combat,
    ambiance,
    loot,
    xp,
    gold,
    echoFound,
    levelsGained: gain.levelsGained,
    notices: [...notices, ...dispatched.notices],
  };
}
