import {
  addAdventureItem,
  createAdventureCharacter,
  equipAdventureItem,
  getAdventureCharacter,
  listAdventureItems,
  updateAdventureCharacter,
  type AdventureCharacter,
  type AdventureClass,
  type AdventureItem,
} from "@gaulia/database";

import { GauliaError } from "../../../../core/errors";
import { classDefinition } from "../../data/classes";
import { findItem } from "../../data/items";
import { ENERGY_MAX } from "../../data/pacing";
import { computeStats } from "./statsService";
import { refreshVitals } from "./vitalsService";

/** Character and inventory, gauges already regenerated: the entry point of every command. */
export interface CharacterContext {
  character: AdventureCharacter;
  items: AdventureItem[];
}

export async function loadCharacter(userId: string): Promise<CharacterContext | null> {
  const character = await getAdventureCharacter(userId);
  if (!character) return null;

  const items = await listAdventureItems(userId);
  return { character: await refreshVitals(character, items), items };
}

export async function requireCharacter(userId: string): Promise<CharacterContext> {
  const context = await loadCharacter(userId);
  if (!context) {
    throw new GauliaError("adventure.error.noCharacter");
  }
  return context;
}

/** Creates the character, hands out the starting gear and equips it. */
export async function startAdventure(
  userId: string,
  username: string,
  characterClass: AdventureClass,
): Promise<CharacterContext> {
  if (await getAdventureCharacter(userId)) {
    throw new GauliaError("adventure.error.alreadyStarted");
  }

  const definition = classDefinition(characterClass);
  await createAdventureCharacter({
    userId,
    username,
    characterClass,
    // Health depends on the stats, so it is set right after the starting gear is equipped, for
    // the adventurer to begin at full.
    hp: 1,
    energy: ENERGY_MAX,
  });

  const withStats = await updateAdventureCharacter(userId, {
    might: definition.might,
    agility: definition.agility,
    spirit: definition.spirit,
  });

  for (const { itemId, quantity } of definition.startingItems) {
    await addAdventureItem(userId, itemId, quantity);
    // Equip the starting gear, so the first exploration is playable with no setup.
    if (findItem(itemId)?.slot) await equipAdventureItem(userId, itemId, [itemId]);
  }

  const items = await listAdventureItems(userId);
  const character = await updateAdventureCharacter(userId, {
    hp: computeStats(withStats, items).maxHp,
  });

  return { character, items };
}

function utcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

const DAY_MS = 24 * 3_600_000;

/**
 * Marks the visit of the day: refreshes the username shown in the admin panel and keeps the streak
 * of consecutive days alive (a missed day resets it to 1, never to 0, so coming back stays gentle).
 */
export async function touchPlayed(
  character: AdventureCharacter,
  username: string,
): Promise<{ character: AdventureCharacter; newDay: boolean }> {
  const now = new Date();
  const today = utcDay(now);
  const lastDay = character.lastStreakDay ? utcDay(character.lastStreakDay) : null;

  if (lastDay && lastDay.getTime() === today.getTime()) {
    const updated =
      character.username === username
        ? await updateAdventureCharacter(character.userId, { lastPlayedAt: now })
        : await updateAdventureCharacter(character.userId, { lastPlayedAt: now, username });
    return { character: updated, newDay: false };
  }

  const continued = lastDay !== null && today.getTime() - lastDay.getTime() === DAY_MS;
  const streak = continued ? character.streak + 1 : 1;

  const updated = await updateAdventureCharacter(character.userId, {
    username,
    lastPlayedAt: now,
    lastStreakDay: today,
    streak,
    bestStreak: Math.max(character.bestStreak, streak),
  });
  return { character: updated, newDay: true };
}
