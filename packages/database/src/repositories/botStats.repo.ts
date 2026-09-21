import { prisma } from "../client";

/**
 * Global counters shown by `/botinfo`: totals only (no per-guild or per-member detail), since
 * anyone can run the command.
 */
export interface BotContentStats {
  premiumGuilds: number;
  adventurePlayers: number;
}

export async function getBotContentStats(): Promise<BotContentStats> {
  const now = new Date();

  const [premiumGuilds, adventurePlayers] = await Promise.all([
    // Discord premium still valid, or credit-granted premium still running.
    prisma.guild.count({
      where: {
        botPresent: true,
        OR: [
          { premium: true, OR: [{ premiumExpiresAt: null }, { premiumExpiresAt: { gt: now } }] },
          { premiumGrantedUntil: { gt: now } },
        ],
      },
    }),
    prisma.adventureCharacter.count(),
  ]);

  return { premiumGuilds, adventurePlayers };
}

/** Minimal Postgres round trip in milliseconds, shown as database latency by `/botinfo`. */
export async function measureDatabaseLatency(): Promise<number> {
  const start = process.hrtime.bigint();
  await prisma.$queryRaw`SELECT 1`;
  return Number(process.hrtime.bigint() - start) / 1_000_000;
}
