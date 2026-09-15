import { requireMonster, type MonsterDefinition } from "../../data/monsters";
import { requireZone, type ZoneDefinition, type ZoneLoot } from "../../data/zones";

/** Ce que l'exploration a mis sur le chemin du joueur. */
export type Encounter =
  | { kind: "COMBAT"; monster: MonsterDefinition }
  | { kind: "TROUVAILLE"; loot: { itemId: string; quantity: number } }
  | { kind: "CALME"; ambiance: string };

const COMBAT_CHANCE = 0.6;
const LOOT_CHANCE = 0.28;

function pick<T>(entries: readonly T[]): T {
  const index = Math.floor(Math.random() * entries.length);
  return entries[index] ?? entries[0]!;
}

function pickWeighted(loot: readonly ZoneLoot[]): ZoneLoot {
  const total = loot.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of loot) {
    roll -= entry.weight;
    if (roll <= 0) return entry;
  }
  return loot[loot.length - 1]!;
}

export function randomQuantity(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Tire une rencontre dans la zone : bagarre le plus souvent, trouvaille sinon, calme parfois. */
export function drawEncounter(zone: ZoneDefinition): Encounter {
  const roll = Math.random();

  if (roll < COMBAT_CHANCE) {
    return { kind: "COMBAT", monster: requireMonster(pick(zone.monsters)) };
  }

  if (roll < COMBAT_CHANCE + LOOT_CHANCE) {
    const entry = pickWeighted(zone.loot);
    return {
      kind: "TROUVAILLE",
      loot: { itemId: entry.itemId, quantity: randomQuantity(entry.min, entry.max) },
    };
  }

  return { kind: "CALME", ambiance: pick(zone.ambiances) };
}

/** Butin lâché par un monstre vaincu. */
export function rollMonsterLoot(
  monster: MonsterDefinition,
): { itemId: string; quantity: number }[] {
  return monster.loot.flatMap((entry) =>
    Math.random() < entry.chance
      ? [{ itemId: entry.itemId, quantity: randomQuantity(entry.min, entry.max) }]
      : [],
  );
}

export function zoneOf(zoneId: string): ZoneDefinition {
  return requireZone(zoneId);
}
