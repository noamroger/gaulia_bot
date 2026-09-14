import { prisma } from "../client";

/** Remplace l'identité d'un modérateur effacé, pour garder l'historique des AUTRES membres cohérent. */
const ANONYMIZED_USER_ID = "0";
const ANONYMIZED_USER_TAG = "Utilisateur supprimé";

export interface GuildDataSummary {
  guildId: string;
  configured: boolean;
  name: string | null;
  moderationCases: number;
  warns: number;
  automodConfig: boolean;
  musicSettings: boolean;
  blindtestPlaylists: number;
  premiumEntitlements: number;
}

export interface UserDataSummary {
  userId: string;
  moderationCasesAsTarget: number;
  moderationCasesAsModerator: number;
  warnsAsTarget: number;
  warnsAsModerator: number;
  premiumEntitlements: number;
}

export async function getGuildDataSummary(guildId: string): Promise<GuildDataSummary> {
  const [
    guild,
    moderationCases,
    warns,
    automodConfigs,
    musicSettings,
    blindtestPlaylists,
    premiumEntitlements,
  ] = await Promise.all([
    prisma.guild.findUnique({ where: { id: guildId }, select: { name: true } }),
    prisma.moderationCase.count({ where: { guildId } }),
    prisma.warn.count({ where: { guildId } }),
    prisma.automodConfig.count({ where: { guildId } }),
    prisma.musicSettings.count({ where: { guildId } }),
    prisma.blindtestPlaylist.count({ where: { guildId } }),
    prisma.premiumEntitlement.count({ where: { guildId } }),
  ]);

  return {
    guildId,
    configured: guild !== null,
    name: guild?.name ?? null,
    moderationCases,
    warns,
    automodConfig: automodConfigs > 0,
    musicSettings: musicSettings > 0,
    blindtestPlaylists,
    premiumEntitlements,
  };
}

/**
 * Supprime toutes les données d'un serveur. Modération, avertissements, automod et musique partent
 * en cascade avec la ligne `guilds`. Si le bot est encore sur le serveur, une configuration vierge
 * (nom, icône, nombre de membres) sera recréée à la prochaine synchronisation.
 */
export async function eraseGuildData(guildId: string): Promise<GuildDataSummary> {
  const summary = await getGuildDataSummary(guildId);
  await prisma.$transaction([
    prisma.premiumEntitlement.deleteMany({ where: { guildId } }),
    prisma.guild.deleteMany({ where: { id: guildId } }),
  ]);
  return summary;
}

export async function getUserDataSummary(userId: string): Promise<UserDataSummary> {
  const [
    moderationCasesAsTarget,
    moderationCasesAsModerator,
    warnsAsTarget,
    warnsAsModerator,
    premiumEntitlements,
  ] = await Promise.all([
    prisma.moderationCase.count({ where: { targetId: userId } }),
    prisma.moderationCase.count({ where: { moderatorId: userId } }),
    prisma.warn.count({ where: { userId } }),
    prisma.warn.count({ where: { moderatorId: userId } }),
    prisma.premiumEntitlement.count({ where: { userId } }),
  ]);

  return {
    userId,
    moderationCasesAsTarget,
    moderationCasesAsModerator,
    warnsAsTarget,
    warnsAsModerator,
    premiumEntitlements,
  };
}

/**
 * Supprime les sanctions et avertissements reçus par l'utilisateur, anonymise ceux qu'il a donnés
 * en tant que modérateur, et supprime ses droits premium en cache.
 */
export async function eraseUserData(userId: string): Promise<UserDataSummary> {
  const summary = await getUserDataSummary(userId);
  await prisma.$transaction([
    prisma.moderationCase.deleteMany({ where: { targetId: userId } }),
    prisma.warn.deleteMany({ where: { userId } }),
    prisma.moderationCase.updateMany({
      where: { moderatorId: userId },
      data: { moderatorId: ANONYMIZED_USER_ID, moderatorTag: ANONYMIZED_USER_TAG },
    }),
    prisma.warn.updateMany({
      where: { moderatorId: userId },
      data: { moderatorId: ANONYMIZED_USER_ID },
    }),
    prisma.premiumEntitlement.deleteMany({ where: { userId } }),
  ]);
  return summary;
}
