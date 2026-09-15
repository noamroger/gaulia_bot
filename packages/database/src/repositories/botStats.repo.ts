import { prisma } from "../client";

const DAY_MS = 86_400_000;
const VOTE_WINDOW_DAYS = 30;

/**
 * Totaux globaux affichés par `/botinfo` : uniquement des agrégats (aucun détail par serveur, par
 * membre ou par sanction), la commande étant utilisable par tout le monde.
 */
export interface BotContentStats {
  guilds: { present: number; premium: number };
  moderation: { cases: number; activeWarns: number; automodGuilds: number };
  music: { settingsGuilds: number; blindtestPlaylists: number };
  adventure: {
    guilds: number;
    players: number;
    finished: number;
    maxLevel: number;
    explorations: number;
    trades: number;
  };
  votesLast30Days: number;
}

export async function getBotContentStats(): Promise<BotContentStats> {
  const now = new Date();
  const voteSince = new Date(now.getTime() - VOTE_WINDOW_DAYS * DAY_MS);

  const [
    present,
    premium,
    cases,
    activeWarns,
    automodGuilds,
    settingsGuilds,
    blindtestPlaylists,
    adventureGuilds,
    players,
    finished,
    totals,
    votesLast30Days,
  ] = await Promise.all([
    prisma.guild.count({ where: { botPresent: true } }),
    // Premium Discord encore valide, ou premium offert contre des crédits encore en cours.
    prisma.guild.count({
      where: {
        botPresent: true,
        OR: [
          { premium: true, OR: [{ premiumExpiresAt: null }, { premiumExpiresAt: { gt: now } }] },
          { premiumGrantedUntil: { gt: now } },
        ],
      },
    }),
    prisma.moderationCase.count(),
    prisma.warn.count({ where: { active: true } }),
    prisma.automodConfig.count(),
    prisma.musicSettings.count(),
    prisma.blindtestPlaylist.count(),
    prisma.adventureSettings.count({ where: { enabled: true } }),
    prisma.adventureCharacter.count(),
    prisma.adventureCharacter.count({ where: { storyEndedAt: { not: null } } }),
    prisma.adventureCharacter.aggregate({
      _max: { level: true },
      _sum: { explorations: true, trades: true },
    }),
    prisma.topggVote.count({ where: { createdAt: { gte: voteSince } } }),
  ]);

  return {
    guilds: { present, premium },
    moderation: { cases, activeWarns, automodGuilds },
    music: { settingsGuilds, blindtestPlaylists },
    adventure: {
      guilds: adventureGuilds,
      players,
      finished,
      maxLevel: totals._max.level ?? 0,
      explorations: totals._sum.explorations ?? 0,
      trades: totals._sum.trades ?? 0,
    },
    votesLast30Days,
  };
}

/** Aller-retour minimal vers Postgres, en millisecondes : latence de la base affichée par `/botinfo`. */
export async function measureDatabaseLatency(): Promise<number> {
  const start = process.hrtime.bigint();
  await prisma.$queryRaw`SELECT 1`;
  return Number(process.hrtime.bigint() - start) / 1_000_000;
}
