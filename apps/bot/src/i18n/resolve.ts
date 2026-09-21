import { getOrCreateGuild, getUserLanguage } from "@gaulia/database";
import type { BaseInteraction } from "discord.js";

import { DEFAULT_LOCALE, matchDiscordLocale, readStoredLocale, type AppLocale } from "./locales";
import { createTranslator, type Translator } from "./translator";

/**
 * Stored overrides are read on almost every interaction, so they are cached briefly rather than
 * queried each time. `/language` drops its own entry, so a change is visible immediately.
 */
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  language: AppLocale | null;
  expiresAt: number;
}

const guildCache = new Map<string, CacheEntry>();
const userCache = new Map<string, CacheEntry>();

function readCache(cache: Map<string, CacheEntry>, id: string): CacheEntry | undefined {
  const entry = cache.get(id);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(id);
    return undefined;
  }
  return entry;
}

async function storedGuildLanguage(guildId: string): Promise<AppLocale | null> {
  const cached = readCache(guildCache, guildId);
  if (cached) return cached.language;

  const guild = await getOrCreateGuild(guildId);
  const language = readStoredLocale(guild.language);
  guildCache.set(guildId, { language, expiresAt: Date.now() + CACHE_TTL_MS });
  return language;
}

async function storedUserLanguage(userId: string): Promise<AppLocale | null> {
  const cached = readCache(userCache, userId);
  if (cached) return cached.language;

  const language = readStoredLocale(await getUserLanguage(userId));
  userCache.set(userId, { language, expiresAt: Date.now() + CACHE_TTL_MS });
  return language;
}

export function forgetGuildLanguage(guildId: string): void {
  guildCache.delete(guildId);
}

export function forgetUserLanguage(userId: string): void {
  userCache.delete(userId);
}

/** Which step of the resolution decided the language, for `/language show` to explain itself. */
export type LocaleSource = "user" | "discordUser" | "guild" | "discordGuild" | "default";

export interface ResolvedLocale {
  locale: AppLocale;
  source: LocaleSource;
}

/**
 * Language of a message only its recipient reads. Their own choice wins, then the language their
 * Discord client is in, then the guild's, and English when none of it is conclusive.
 */
export async function describeUserLocale(interaction: BaseInteraction): Promise<ResolvedLocale> {
  const chosen = await storedUserLanguage(interaction.user.id);
  if (chosen) return { locale: chosen, source: "user" };

  const fromClient = matchDiscordLocale(interaction.locale);
  if (fromClient) return { locale: fromClient, source: "discordUser" };

  if (interaction.guildId) {
    const guildLanguage = await storedGuildLanguage(interaction.guildId);
    if (guildLanguage) return { locale: guildLanguage, source: "guild" };
  }

  const fromGuild = matchDiscordLocale(interaction.guildLocale);
  if (fromGuild) return { locale: fromGuild, source: "discordGuild" };

  return { locale: DEFAULT_LOCALE, source: "default" };
}

export async function resolveUserLocale(interaction: BaseInteraction): Promise<AppLocale> {
  return (await describeUserLocale(interaction)).locale;
}

/** Stored guild override, or null when the guild follows its Discord locale. */
export async function guildLanguageOverride(guildId: string): Promise<AppLocale | null> {
  return storedGuildLanguage(guildId);
}

/**
 * Language of a message the whole channel reads: the guild's choice, then the language the guild
 * itself is set to on Discord, then English. A single member's client locale never decides here.
 */
export async function resolveGuildLocale(
  guildId: string | null,
  discordGuildLocale?: string | null,
): Promise<AppLocale> {
  if (guildId) {
    const chosen = await storedGuildLanguage(guildId);
    if (chosen) return chosen;
  }
  return matchDiscordLocale(discordGuildLocale) ?? DEFAULT_LOCALE;
}

/** Translator for a reply addressed to the member who triggered the interaction. */
export async function translatorFor(interaction: BaseInteraction): Promise<Translator> {
  return createTranslator(await resolveUserLocale(interaction));
}

/**
 * Translator for a member who is not the one interacting, so their Discord client locale is out of
 * reach: their own choice, then English.
 */
export async function absentUserTranslator(userId: string): Promise<Translator> {
  return createTranslator((await storedUserLanguage(userId)) ?? DEFAULT_LOCALE);
}

/** Translator for a message posted to a channel, addressed to the guild rather than one member. */
export async function guildTranslatorFor(
  guildId: string | null,
  discordGuildLocale?: string | null,
): Promise<Translator> {
  return createTranslator(await resolveGuildLocale(guildId, discordGuildLocale));
}
