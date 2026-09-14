import type { Guild } from "@prisma/client";

import { prisma } from "../client";

/**
 * Récupère la config d'un serveur, ou la crée avec les valeurs par défaut si elle n'existe pas encore.
 */
export async function getOrCreateGuild(guildId: string): Promise<Guild> {
  return prisma.guild.upsert({
    where: { id: guildId },
    update: {},
    create: { id: guildId },
  });
}

export async function updateGuild(
  guildId: string,
  data: Partial<
    Pick<
      Guild,
      | "language"
      | "modLogChannelId"
      | "automodLogChannelId"
      | "djRoleId"
      | "musicChannelId"
      | "funChannelIds"
    >
  >,
): Promise<Guild> {
  return prisma.guild.upsert({
    where: { id: guildId },
    update: data,
    create: { id: guildId, ...data },
  });
}

export async function setGuildPremium(
  guildId: string,
  premium: boolean,
  premiumExpiresAt: Date | null,
): Promise<Guild> {
  return prisma.guild.upsert({
    where: { id: guildId },
    update: { premium, premiumExpiresAt },
    create: { id: guildId, premium, premiumExpiresAt },
  });
}

/**
 * Synchronise le nom et/ou la présence du bot sur le serveur (guildCreate/guildDelete/guildUpdate/
 * sync au ready). L'API/dashboard ne liste que les serveurs où `botPresent` est vrai ; `name` sert
 * uniquement à l'affichage (ex: panel admin, pour les serveurs où l'admin connecté n'est pas membre).
 */
export async function upsertGuildInfo(
  guildId: string,
  data: { name?: string; icon?: string | null; memberCount?: number; botPresent?: boolean },
): Promise<Guild> {
  return prisma.guild.upsert({
    where: { id: guildId },
    update: data,
    create: { id: guildId, ...data },
  });
}

export async function listPresentGuildIds(): Promise<string[]> {
  const guilds = await prisma.guild.findMany({
    where: { botPresent: true },
    select: { id: true },
  });
  return guilds.map((guild) => guild.id);
}

/** Parmi une liste de guildId (ex: ceux gérables par un utilisateur côté Discord), retourne ceux où le bot est présent. */
export async function filterPresentGuildIds(guildIds: string[]): Promise<string[]> {
  if (guildIds.length === 0) return [];
  const guilds = await prisma.guild.findMany({
    where: { id: { in: guildIds }, botPresent: true },
    select: { id: true },
  });
  return guilds.map((guild) => guild.id);
}

/** Serveurs où le bot est présent, pour le panel admin réservé au(x) propriétaire(s) du bot. */
export async function listPresentGuilds(): Promise<Guild[]> {
  return prisma.guild.findMany({ where: { botPresent: true }, orderBy: { createdAt: "desc" } });
}
