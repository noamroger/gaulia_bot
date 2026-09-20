import type { ModerationCaseType } from "@prisma/client";

import { prisma } from "../client";

/**
 * Export complet des données personnelles d'un utilisateur, destiné à la page « Mes données » du
 * tableau de bord : c'est ce que l'utilisateur voit à l'écran et télécharge en JSON.
 *
 * Les identifiants des AUTRES membres (modérateur d'une sanction, partenaire d'un échange) sont
 * volontairement absents : ce sont leurs données, pas celles de la personne qui demande l'export.
 * Le nom des serveurs concernés est repris tel qu'il est connu du bot, pour que la liste soit
 * lisible sans avoir à traduire des identifiants.
 */
export const USER_DATA_EXPORT_VERSION = 1;

export interface ExportedModerationCase {
  guildId: string;
  guildName: string | null;
  caseNumber: number;
  type: ModerationCaseType;
  reason: string | null;
  durationSecs: number | null;
  createdAt: Date;
}

export interface ExportedWarn {
  guildId: string;
  guildName: string | null;
  reason: string | null;
  /** Faux pour un avertissement révoqué par un modérateur. */
  active: boolean;
  createdAt: Date;
}

/** Ce que la personne a fait en tant que modérateur : des compteurs, sans les membres visés. */
export interface ExportedModeratorActivity {
  moderationCases: number;
  warns: number;
}

export interface ExportedCreditTransaction {
  type: string;
  amount: number;
  balanceAfter: number;
  guildId: string | null;
  guildName: string | null;
  reason: string | null;
  createdAt: Date;
}

export interface ExportedCredits {
  balance: number;
  totalEarned: number;
  voteCount: number;
  lastVoteAt: Date | null;
  createdAt: Date;
  transactions: ExportedCreditTransaction[];
}

export interface ExportedVote {
  voteId: string;
  weight: number;
  votedAt: Date;
}

export interface ExportedPremiumEntitlement {
  entitlementId: string;
  skuId: string;
  guildId: string | null;
  guildName: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  deleted: boolean;
}

export interface ExportedAdventureItem {
  itemId: string;
  quantity: number;
  equipped: boolean;
  upgradeLevel: number;
}

export interface ExportedAdventureQuest {
  kind: string;
  questId: string;
  target: number;
  progress: number;
  claimedAt: Date | null;
  periodStart: Date;
}

export interface ExportedAdventureAchievement {
  achievementId: string;
  unlockedAt: Date;
}

export interface ExportedAdventureLog {
  type: string;
  message: string;
  createdAt: Date;
}

/** Échange d'objets : le lot des deux côtés, mais pas l'identité du partenaire. */
export interface ExportedAdventureTrade {
  direction: "sent" | "received";
  status: string;
  offeredItems: unknown;
  offeredGold: number;
  requestedItems: unknown;
  requestedGold: number;
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface ExportedAdventure {
  characterClass: string;
  level: number;
  xp: number;
  totalXp: number;
  statPoints: number;
  might: number;
  agility: number;
  spirit: number;
  hp: number;
  energy: number;
  gold: number;
  echoes: number;
  zoneId: string;
  actIndex: number;
  chapterIndex: number;
  chapterProgress: unknown;
  storyEndedAt: Date | null;
  explorations: number;
  victories: number;
  defeats: number;
  dungeonClears: number;
  upgrades: number;
  trades: number;
  streak: number;
  bestStreak: number;
  lastPlayedAt: Date | null;
  createdAt: Date;
  items: ExportedAdventureItem[];
  quests: ExportedAdventureQuest[];
  achievements: ExportedAdventureAchievement[];
  logs: ExportedAdventureLog[];
  tradeHistory: ExportedAdventureTrade[];
}

export interface UserDataExport {
  version: number;
  userId: string;
  generatedAt: Date;
  sanctionsReceived: ExportedModerationCase[];
  warnsReceived: ExportedWarn[];
  moderatorActivity: ExportedModeratorActivity;
  credits: ExportedCredits | null;
  topggVotes: ExportedVote[];
  premiumEntitlements: ExportedPremiumEntitlement[];
  adventure: ExportedAdventure | null;
}

/** Noms des serveurs cités dans l'export, en une seule requête plutôt qu'une par ligne. */
async function guildNames(guildIds: string[]): Promise<Map<string, string | null>> {
  const unique = [...new Set(guildIds.filter((id) => id !== ""))];
  if (unique.length === 0) return new Map();

  const guilds = await prisma.guild.findMany({
    where: { id: { in: unique } },
    select: { id: true, name: true },
  });
  return new Map(guilds.map((guild) => [guild.id, guild.name]));
}

/**
 * Rassemble tout ce que Gaulia conserve sur un utilisateur. Rien n'est tronqué : le volume par
 * personne reste petit (quelques sanctions, un personnage, des mouvements de crédits), et un
 * export partiel n'aurait pas d'intérêt.
 */
export async function exportUserData(userId: string): Promise<UserDataExport> {
  const [
    moderationCases,
    warns,
    moderationCasesAsModerator,
    warnsAsModerator,
    creditAccount,
    creditTransactions,
    votes,
    entitlements,
    character,
  ] = await Promise.all([
    prisma.moderationCase.findMany({
      where: { targetId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        guildId: true,
        caseNumber: true,
        type: true,
        reason: true,
        durationSecs: true,
        createdAt: true,
      },
    }),
    prisma.warn.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { guildId: true, reason: true, active: true, createdAt: true },
    }),
    prisma.moderationCase.count({ where: { moderatorId: userId } }),
    prisma.warn.count({ where: { moderatorId: userId } }),
    prisma.creditAccount.findUnique({ where: { userId } }),
    prisma.creditTransaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.topggVote.findMany({ where: { userId }, orderBy: { votedAt: "desc" } }),
    prisma.premiumEntitlement.findMany({ where: { userId } }),
    prisma.adventureCharacter.findUnique({
      where: { userId },
      include: {
        items: { orderBy: { itemId: "asc" } },
        quests: { orderBy: { periodStart: "desc" } },
        achievements: { orderBy: { unlockedAt: "desc" } },
        logs: { orderBy: { createdAt: "desc" } },
        tradesSent: { orderBy: { createdAt: "desc" } },
        tradesReceived: { orderBy: { createdAt: "desc" } },
      },
    }),
  ]);

  const names = await guildNames([
    ...moderationCases.map((entry) => entry.guildId),
    ...warns.map((entry) => entry.guildId),
    ...creditTransactions.map((entry) => entry.guildId ?? ""),
    ...entitlements.map((entry) => entry.guildId ?? ""),
  ]);

  const tradeHistory: ExportedAdventureTrade[] = character
    ? [
        ...character.tradesSent.map((trade) => ({ ...trade, direction: "sent" as const })),
        ...character.tradesReceived.map((trade) => ({ ...trade, direction: "received" as const })),
      ]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((trade) => ({
          direction: trade.direction,
          status: trade.status,
          offeredItems: trade.offeredItems,
          offeredGold: trade.offeredGold,
          requestedItems: trade.requestedItems,
          requestedGold: trade.requestedGold,
          createdAt: trade.createdAt,
          resolvedAt: trade.resolvedAt,
        }))
    : [];

  return {
    version: USER_DATA_EXPORT_VERSION,
    userId,
    generatedAt: new Date(),
    sanctionsReceived: moderationCases.map((entry) => ({
      guildId: entry.guildId,
      guildName: names.get(entry.guildId) ?? null,
      caseNumber: entry.caseNumber,
      type: entry.type,
      reason: entry.reason,
      durationSecs: entry.durationSecs,
      createdAt: entry.createdAt,
    })),
    warnsReceived: warns.map((entry) => ({
      guildId: entry.guildId,
      guildName: names.get(entry.guildId) ?? null,
      reason: entry.reason,
      active: entry.active,
      createdAt: entry.createdAt,
    })),
    moderatorActivity: {
      moderationCases: moderationCasesAsModerator,
      warns: warnsAsModerator,
    },
    credits: creditAccount
      ? {
          balance: creditAccount.balance,
          totalEarned: creditAccount.totalEarned,
          voteCount: creditAccount.voteCount,
          lastVoteAt: creditAccount.lastVoteAt,
          createdAt: creditAccount.createdAt,
          transactions: creditTransactions.map((entry) => ({
            type: entry.type,
            amount: entry.amount,
            balanceAfter: entry.balanceAfter,
            guildId: entry.guildId,
            guildName: entry.guildId ? (names.get(entry.guildId) ?? null) : null,
            reason: entry.reason,
            createdAt: entry.createdAt,
          })),
        }
      : null,
    topggVotes: votes.map((vote) => ({
      voteId: vote.id,
      weight: vote.weight,
      votedAt: vote.votedAt,
    })),
    premiumEntitlements: entitlements.map((entry) => ({
      entitlementId: entry.id,
      skuId: entry.skuId,
      guildId: entry.guildId,
      guildName: entry.guildId ? (names.get(entry.guildId) ?? null) : null,
      startsAt: entry.startsAt,
      endsAt: entry.endsAt,
      deleted: entry.deleted,
    })),
    adventure: character
      ? {
          characterClass: character.characterClass,
          level: character.level,
          xp: character.xp,
          totalXp: character.totalXp,
          statPoints: character.statPoints,
          might: character.might,
          agility: character.agility,
          spirit: character.spirit,
          hp: character.hp,
          energy: character.energy,
          gold: character.gold,
          echoes: character.echoes,
          zoneId: character.zoneId,
          actIndex: character.actIndex,
          chapterIndex: character.chapterIndex,
          chapterProgress: character.chapterProgress,
          storyEndedAt: character.storyEndedAt,
          explorations: character.explorations,
          victories: character.victories,
          defeats: character.defeats,
          dungeonClears: character.dungeonClears,
          upgrades: character.upgrades,
          trades: character.trades,
          streak: character.streak,
          bestStreak: character.bestStreak,
          lastPlayedAt: character.lastPlayedAt,
          createdAt: character.createdAt,
          items: character.items.map((item) => ({
            itemId: item.itemId,
            quantity: item.quantity,
            equipped: item.equipped,
            upgradeLevel: item.upgradeLevel,
          })),
          quests: character.quests.map((quest) => ({
            kind: quest.kind,
            questId: quest.questId,
            target: quest.target,
            progress: quest.progress,
            claimedAt: quest.claimedAt,
            periodStart: quest.periodStart,
          })),
          achievements: character.achievements.map((achievement) => ({
            achievementId: achievement.achievementId,
            unlockedAt: achievement.unlockedAt,
          })),
          logs: character.logs.map((log) => ({
            type: log.type,
            message: log.message,
            createdAt: log.createdAt,
          })),
          tradeHistory,
        }
      : null,
  };
}

/** Serveur administré par l'utilisateur pour lequel Gaulia a effectivement enregistré quelque chose. */
export interface StoredGuildRef {
  guildId: string;
  name: string | null;
  /** Faux si le bot a quitté le serveur : les données restent, mais plus rien ne s'y ajoute. */
  botPresent: boolean;
}

/**
 * Parmi les serveurs que l'utilisateur peut gérer, ceux qui ont une ligne en base — les seuls dont
 * la suppression a un sens. Une seule requête, quel que soit le nombre de serveurs du compte : le
 * détail de ce qui est enregistré se demande ensuite serveur par serveur (`getGuildDataSummary`).
 */
export async function listStoredGuilds(guildIds: string[]): Promise<StoredGuildRef[]> {
  const unique = [...new Set(guildIds)];
  if (unique.length === 0) return [];

  const guilds = await prisma.guild.findMany({
    where: { id: { in: unique } },
    select: { id: true, name: true, botPresent: true },
    orderBy: { name: "asc" },
  });

  return guilds.map((guild) => ({
    guildId: guild.id,
    name: guild.name,
    botPresent: guild.botPresent,
  }));
}
