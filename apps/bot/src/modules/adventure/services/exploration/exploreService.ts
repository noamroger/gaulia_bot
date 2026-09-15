import {
  updateAdventureCharacter,
  type AdventureCharacter,
  type AdventureItem,
} from "@gaulia/database";

import { GauliaError } from "../../../../core/errors";
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
import { formatDuration } from "../../ui/format";

export interface ExploreOutcome {
  character: AdventureCharacter;
  zone: ZoneDefinition;
  kind: "COMBAT" | "TROUVAILLE" | "CALME";
  monster: MonsterDefinition | null;
  combat: CombatResult | null;
  ambiance: string | null;
  loot: { itemId: string; quantity: number }[];
  xp: number;
  gold: number;
  echoFound: boolean;
  levelsGained: number;
  notices: string[];
  /** Vrai si une potion du sac rendrait des points de vie : commande l'affichage du bouton de soin. */
  canHeal: boolean;
}

/** Multiplicateur de butin : série de jours consécutifs, et flair du rôdeur. */
function lootMultiplier(character: AdventureCharacter): number {
  const streak = Math.min(STREAK_BONUS_MAX, character.streak * STREAK_BONUS_PER_DAY);
  const classBonus = character.characterClass === "RODEUR" ? 0.1 : 0;
  return 1 + streak + classBonus;
}

/**
 * Boucle principale du jeu. Une exploration consomme de l'énergie, tire une rencontre dans la
 * zone courante et en applique toutes les conséquences : combat, butin, expérience, quêtes,
 * chapitre et hauts faits.
 */
export async function explore(
  character: AdventureCharacter,
  items: AdventureItem[],
): Promise<ExploreOutcome> {
  const stats = computeStats(character, items);

  if (character.energy < ENERGY_PER_EXPLORE) {
    throw new GauliaError(
      `Tu n'as plus d'énergie. Le prochain point revient dans ${formatDuration(msUntilNextEnergy(character, Date.now()))} (ou utilise une ration de voyage).`,
    );
  }
  if (character.hp < Math.round(stats.maxHp * HP_EXPLORE_THRESHOLD)) {
    throw new GauliaError(
      "Tu es trop amoché pour repartir. Soigne-toi avec `/aventure utiliser` ou laisse passer un peu de temps.",
    );
  }

  const zone = requireZone(character.zoneId);
  const encounter = drawEncounter(zone);
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
    combat = resolveCombat(stats, character.characterClass, character.hp, monster);
    hp = combat.hpLeft;

    if (combat.victory) {
      xp = Math.round(baseExploreXp(character.level) * zone.xpMultiplier * monster.xpFactor);
      gold = Math.round(
        baseExploreGold(character.level) * zone.goldMultiplier * monster.goldFactor * multiplier,
      );
      loot = rollMonsterLoot(monster);
      events.push({ type: "DEFEAT", family: monster.family, zoneId: zone.id, amount: 1 });
    } else {
      // Pas de mort permanente : on repart à un point de vie, sans rien perdre d'autre.
      xp = Math.round(baseExploreXp(character.level) * 0.25);
      notices.push("🤕 Tu romps le combat de justesse et rentres soigner tes plaies.");
    }
  } else if (encounter.kind === "TROUVAILLE") {
    loot = [encounter.loot];
    xp = Math.round(baseExploreXp(character.level) * zone.xpMultiplier * 0.6);
    gold = Math.round(baseExploreGold(character.level) * zone.goldMultiplier * 0.5 * multiplier);
  } else {
    ambiance = encounter.ambiance;
    xp = Math.round(baseExploreXp(character.level) * 0.35);
  }

  const echoFound = Math.random() < ECHO_FIND_CHANCE;
  if (echoFound) {
    notices.push("🔷 Un écho perdu résonne sous tes pas : **+1 fragment d'écho**.");
  }

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
    notices.push(
      `⬆️ Niveau **${gain.level}** atteint ! Points à répartir : \`/aventure ameliorer\`.`,
    );
  }

  const dispatched = await dispatchGameEvents(updated, items, events);
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
