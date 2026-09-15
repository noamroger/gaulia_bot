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

/** Personnage et inventaire, jauges déjà régénérées : le point d'entrée de toutes les commandes. */
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
    throw new GauliaError(
      "Tu n'as pas encore d'aventurier. Commence avec `/aventure commencer` pour choisir ta classe.",
    );
  }
  return context;
}

/** Crée le personnage, lui donne son équipement de départ et l'équipe. */
export async function startAdventure(
  userId: string,
  username: string,
  characterClass: AdventureClass,
): Promise<CharacterContext> {
  if (await getAdventureCharacter(userId)) {
    throw new GauliaError("Tu as déjà un aventurier. Consulte-le avec `/aventure profil`.");
  }

  const definition = classDefinition(characterClass);
  await createAdventureCharacter({
    userId,
    username,
    characterClass,
    // Les points de vie dépendent des caractéristiques : posés juste après, une fois la tenue de
    // départ équipée, pour que l'aventurier démarre au maximum.
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
    // Équipe la tenue de départ, pour que la première exploration soit jouable sans réglage.
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
 * Marque le passage du jour : met à jour le pseudo affiché dans le panel admin et fait vivre la
 * série de jours consécutifs (un jour manqué la remet à 1, jamais à 0 : la reprise reste douce).
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
