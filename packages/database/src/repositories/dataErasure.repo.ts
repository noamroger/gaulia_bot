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
  adventureSettings: boolean;
  premiumEntitlements: number;
}

export interface UserDataSummary {
  userId: string;
  moderationCasesAsTarget: number;
  moderationCasesAsModerator: number;
  warnsAsTarget: number;
  warnsAsModerator: number;
  premiumEntitlements: number;
  /** Solde de crédits (top.gg) qui sera remis à zéro avec la suppression du compte. */
  creditBalance: number;
  topggVotes: number;
  /** Personnage d'aventure (niveau atteint), supprimé avec son inventaire et sa progression. */
  adventureLevel: number | null;
}

export async function getGuildDataSummary(guildId: string): Promise<GuildDataSummary> {
  const [
    guild,
    moderationCases,
    warns,
    automodConfigs,
    musicSettings,
    blindtestPlaylists,
    adventureSettings,
    premiumEntitlements,
  ] = await Promise.all([
    prisma.guild.findUnique({ where: { id: guildId }, select: { name: true } }),
    prisma.moderationCase.count({ where: { guildId } }),
    prisma.warn.count({ where: { guildId } }),
    prisma.automodConfig.count({ where: { guildId } }),
    prisma.musicSettings.count({ where: { guildId } }),
    prisma.blindtestPlaylist.count({ where: { guildId } }),
    prisma.adventureSettings.count({ where: { guildId } }),
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
    adventureSettings: adventureSettings > 0,
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
    creditAccount,
    topggVotes,
    adventureCharacter,
  ] = await Promise.all([
    prisma.moderationCase.count({ where: { targetId: userId } }),
    prisma.moderationCase.count({ where: { moderatorId: userId } }),
    prisma.warn.count({ where: { userId } }),
    prisma.warn.count({ where: { moderatorId: userId } }),
    prisma.premiumEntitlement.count({ where: { userId } }),
    prisma.creditAccount.findUnique({ where: { userId }, select: { balance: true } }),
    prisma.topggVote.count({ where: { userId } }),
    prisma.adventureCharacter.findUnique({ where: { userId }, select: { level: true } }),
  ]);

  return {
    userId,
    moderationCasesAsTarget,
    moderationCasesAsModerator,
    warnsAsTarget,
    warnsAsModerator,
    premiumEntitlements,
    creditBalance: creditAccount?.balance ?? 0,
    topggVotes,
    adventureLevel: adventureCharacter?.level ?? null,
  };
}

/**
 * Suppression complète, réservée au panel admin : elle traite une demande RGPD vérifiée à la main
 * et touche donc aussi l'historique de modération, ce que la suppression en libre-service
 * (`eraseOwnUserData`) ne fait pas.
 *
 * Supprime les sanctions et avertissements reçus par l'utilisateur, anonymise ceux qu'il a donnés
 * en tant que modérateur, et supprime ses droits premium en cache, son personnage d'aventure
 * (inventaire et progression compris) ainsi que son compte de crédits
 * (son historique de votes top.gg part avec, donc un vote déjà encaissé pourra être recrédité si
 * top.gg le relivre - cas marginal accepté pour ne rien conserver de l'utilisateur).
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
    prisma.topggVote.deleteMany({ where: { userId } }),
    prisma.creditAccount.deleteMany({ where: { userId } }),
    // Inventaire, quêtes, hauts faits et journal partent en cascade avec le personnage.
    prisma.adventureCharacter.deleteMany({ where: { userId } }),
  ]);
  return summary;
}

/**
 * Suppression déclenchée par l'utilisateur lui-même depuis la page « Mes données ».
 *
 * L'historique de modération n'y figure pas : une sanction appartient au serveur qui l'a
 * prononcée, pas au membre sanctionné. Sans cela, il suffirait d'être banni pour effacer son
 * propre casier, et les modérateurs perdraient l'historique sur lequel repose l'escalade des
 * avertissements. Il part avec les données du serveur (`eraseGuildData`), ou sur demande traitée
 * depuis le panel admin (`eraseUserData`).
 *
 * Le reste - droits premium en cache, votes top.gg, compte de crédits, personnage d'aventure avec
 * son inventaire et sa progression - suit le compte et est bien supprimé.
 */
export async function eraseOwnUserData(userId: string): Promise<UserDataSummary> {
  const summary = await getUserDataSummary(userId);
  await prisma.$transaction([
    prisma.premiumEntitlement.deleteMany({ where: { userId } }),
    prisma.topggVote.deleteMany({ where: { userId } }),
    prisma.creditAccount.deleteMany({ where: { userId } }),
    // Inventaire, quêtes, hauts faits et journal partent en cascade avec le personnage.
    prisma.adventureCharacter.deleteMany({ where: { userId } }),
  ]);
  return summary;
}
