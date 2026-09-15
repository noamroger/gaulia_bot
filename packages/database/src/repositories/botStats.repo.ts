import { prisma } from "../client";

/**
 * Compteurs globaux affichés par `/botinfo` : uniquement des totaux (aucun détail par serveur ni
 * par membre), la commande étant utilisable par tout le monde.
 */
export interface BotContentStats {
  premiumGuilds: number;
  adventurePlayers: number;
}

export async function getBotContentStats(): Promise<BotContentStats> {
  const now = new Date();

  const [premiumGuilds, adventurePlayers] = await Promise.all([
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
    prisma.adventureCharacter.count(),
  ]);

  return { premiumGuilds, adventurePlayers };
}

/** Aller-retour minimal vers Postgres, en millisecondes : latence de la base affichée par `/botinfo`. */
export async function measureDatabaseLatency(): Promise<number> {
  const start = process.hrtime.bigint();
  await prisma.$queryRaw`SELECT 1`;
  return Number(process.hrtime.bigint() - start) / 1_000_000;
}
