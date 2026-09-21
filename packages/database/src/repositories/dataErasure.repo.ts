import { prisma } from "../client";

/** Stands in for an erased moderator, to keep the history of the OTHER members consistent. */
const ANONYMIZED_USER_ID = "0";
const ANONYMIZED_USER_TAG = "Deleted user";

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
  /** Credit balance (top.gg), cleared along with the account. */
  creditBalance: number;
  topggVotes: number;
  /** Adventure character level, deleted with its inventory and progress. */
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
 * Deletes every record of a guild. Moderation, warns, automod and music cascade with the `guilds`
 * row. If the bot is still in the guild, a blank config is recreated on the next sync.
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
 * Full erasure, admin panel only: it serves a manually checked GDPR request, so unlike the
 * self-service path (`eraseOwnUserData`) it also touches the moderation history. Sanctions the user
 * issued as a moderator are anonymized rather than deleted, so the other members keep their
 * history. The top.gg vote history goes too, so a cashed vote could be credited again on a
 * redelivery: accepted, in order to keep nothing about the user.
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
    // Inventory, quests, achievements and logs cascade with the character.
    prisma.adventureCharacter.deleteMany({ where: { userId } }),
    prisma.userPreference.deleteMany({ where: { userId } }),
  ]);
  return summary;
}

/**
 * Erasure the user triggers themselves from the "My data" page.
 *
 * The moderation history is left out: a sanction belongs to the guild that issued it, not to the
 * sanctioned member. Otherwise being banned would be enough to wipe one's own record, and
 * moderators would lose the history warn escalation relies on. It goes with the guild data
 * (`eraseGuildData`), or through a request handled in the admin panel (`eraseUserData`).
 */
export async function eraseOwnUserData(userId: string): Promise<UserDataSummary> {
  const summary = await getUserDataSummary(userId);
  await prisma.$transaction([
    prisma.premiumEntitlement.deleteMany({ where: { userId } }),
    prisma.topggVote.deleteMany({ where: { userId } }),
    prisma.creditAccount.deleteMany({ where: { userId } }),
    // Inventory, quests, achievements and logs cascade with the character.
    prisma.adventureCharacter.deleteMany({ where: { userId } }),
    prisma.userPreference.deleteMany({ where: { userId } }),
  ]);
  return summary;
}
