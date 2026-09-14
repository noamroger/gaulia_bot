import { prisma } from "../client";

const DAY_MS = 86_400_000;

/** Durée de conservation des statistiques d'utilisation (annoncée dans la politique de confidentialité). */
export const COMMAND_USAGE_RETENTION_DAYS = 90;

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function recordCommandUsage(commandName: string, category: string): Promise<void> {
  const date = startOfUtcDay(new Date());
  await prisma.commandUsageDaily.upsert({
    where: { date_commandName: { date, commandName } },
    update: { count: { increment: 1 }, category },
    create: { date, commandName, category, count: 1 },
  });
}

/** Total des commandes utilisées sur les `days` derniers jours (UTC, jour courant inclus). */
export async function countCommandUsageSince(days: number): Promise<number> {
  const since = new Date(startOfUtcDay(new Date()).getTime() - (days - 1) * DAY_MS);
  const result = await prisma.commandUsageDaily.aggregate({
    where: { date: { gte: since } },
    _sum: { count: true },
  });
  return result._sum.count ?? 0;
}

/** Supprime les compteurs plus anciens que la durée de conservation ; retourne le nombre de lignes supprimées. */
export async function purgeExpiredCommandUsage(): Promise<number> {
  const cutoff = new Date(
    startOfUtcDay(new Date()).getTime() - (COMMAND_USAGE_RETENTION_DAYS - 1) * DAY_MS,
  );
  const { count } = await prisma.commandUsageDaily.deleteMany({ where: { date: { lt: cutoff } } });
  return count;
}

export interface CommandUsageSummary {
  totalAllTime: number;
  totalInRange: number;
  /** Un point par jour de la période, jours sans utilisation inclus (count = 0). */
  daily: { date: string; count: number }[];
  topCommands: { commandName: string; count: number }[];
  /** Toutes les catégories conservées (même exclues), avec leur total sur la période. */
  categories: { category: string; count: number }[];
}

export async function getCommandUsageSummary(
  days: number,
  excludedCategories: string[] = [],
  topLimit = 10,
): Promise<CommandUsageSummary> {
  const since = new Date(startOfUtcDay(new Date()).getTime() - (days - 1) * DAY_MS);
  const categoryFilter =
    excludedCategories.length > 0 ? { category: { notIn: excludedCategories } } : {};

  const [allTime, byDay, byCommand, knownCategories, categoriesInRange] = await Promise.all([
    prisma.commandUsageDaily.aggregate({ where: categoryFilter, _sum: { count: true } }),
    prisma.commandUsageDaily.groupBy({
      by: ["date"],
      where: { date: { gte: since }, ...categoryFilter },
      _sum: { count: true },
    }),
    prisma.commandUsageDaily.groupBy({
      by: ["commandName"],
      where: { date: { gte: since }, ...categoryFilter },
      _sum: { count: true },
      orderBy: { _sum: { count: "desc" } },
      take: topLimit,
    }),
    prisma.commandUsageDaily.groupBy({ by: ["category"] }),
    prisma.commandUsageDaily.groupBy({
      by: ["category"],
      where: { date: { gte: since } },
      _sum: { count: true },
    }),
  ]);

  const countByDay = new Map(byDay.map((row) => [isoDay(row.date), row._sum.count ?? 0]));
  const daily = Array.from({ length: days }, (_, index) => {
    const date = isoDay(new Date(since.getTime() + index * DAY_MS));
    return { date, count: countByDay.get(date) ?? 0 };
  });

  const countByCategory = new Map(
    categoriesInRange.map((row) => [row.category, row._sum.count ?? 0]),
  );

  return {
    totalAllTime: allTime._sum.count ?? 0,
    totalInRange: daily.reduce((sum, day) => sum + day.count, 0),
    daily,
    topCommands: byCommand.map((row) => ({
      commandName: row.commandName,
      count: row._sum.count ?? 0,
    })),
    categories: knownCategories
      .map((row) => ({ category: row.category, count: countByCategory.get(row.category) ?? 0 }))
      .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category)),
  };
}
