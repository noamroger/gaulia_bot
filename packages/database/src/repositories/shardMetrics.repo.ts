import { prisma } from "../client";

const DAY_MS = 86_400_000;
const BUCKET_MS = 10 * 60_000;

/** Durée de conservation de l'historique des shards (annoncée dans la politique de confidentialité). */
export const SHARD_METRICS_RETENTION_DAYS = 90;

/** Pas d'affichage par période, pour garder entre 120 et 180 points par graphique. */
const STEP_MINUTES_BY_DAYS: Readonly<Record<number, number>> = { 7: 60, 30: 240, 90: 720 };

export interface ShardMetricInput {
  shardId: number;
  guildCount: number;
  memberCount: number;
  /** null tant que le ping de la gateway n'a pas encore été mesuré. */
  ping: number | null;
}

export interface ShardMetricPoint {
  /** Début de la tranche (ISO). */
  at: string;
  /** null : aucun shard n'a envoyé de heartbeat pendant la tranche. */
  guildCount: number | null;
  memberCount: number | null;
  ping: number | null;
}

export interface ShardMetricHistory {
  stepMinutes: number;
  points: ShardMetricPoint[];
}

/** Met à jour la tranche de 10 minutes courante du shard ; appelé à chaque heartbeat. */
export async function recordShardMetrics(input: ShardMetricInput): Promise<void> {
  const bucket = new Date(Math.floor(Date.now() / BUCKET_MS) * BUCKET_MS);
  const pingTotal = input.ping ?? 0;
  const pingSamples = input.ping === null ? 0 : 1;

  await prisma.shardMetricSample.upsert({
    where: { shardId_bucket: { shardId: input.shardId, bucket } },
    update: {
      guildCount: input.guildCount,
      memberCount: input.memberCount,
      pingTotal: { increment: pingTotal },
      pingSamples: { increment: pingSamples },
    },
    create: {
      shardId: input.shardId,
      bucket,
      guildCount: input.guildCount,
      memberCount: input.memberCount,
      pingTotal,
      pingSamples,
    },
  });
}

export async function purgeExpiredShardMetrics(): Promise<number> {
  const cutoff = new Date(Date.now() - SHARD_METRICS_RETENTION_DAYS * DAY_MS);
  const { count } = await prisma.shardMetricSample.deleteMany({
    where: { bucket: { lt: cutoff } },
  });
  return count;
}

/**
 * Historique mutualisé de tous les shards : pour chaque pas d'affichage, moyenne de chaque shard
 * sur le pas, puis somme des shards (serveurs, membres) ou moyenne (ping).
 */
export async function getShardMetricHistory(days: number): Promise<ShardMetricHistory> {
  const stepMinutes = STEP_MINUTES_BY_DAYS[days] ?? 60;
  const stepMs = stepMinutes * 60_000;
  const slotCount = Math.round((days * DAY_MS) / stepMs);
  const lastSlot = Math.floor(Date.now() / stepMs);
  const firstSlot = lastSlot - slotCount + 1;

  const rows = await prisma.$queryRaw<
    { slot: bigint; guilds: number; members: number; ping: number | null }[]
  >`
    WITH per_shard AS (
      SELECT
        "shardId",
        floor(extract(epoch FROM "bucket") * 1000 / ${stepMs})::bigint AS slot,
        avg("guildCount") AS guilds,
        avg("memberCount") AS members,
        sum("pingTotal")::float8 / nullif(sum("pingSamples"), 0) AS ping
      FROM "shard_metric_samples"
      WHERE "bucket" >= ${new Date(firstSlot * stepMs)}
      GROUP BY "shardId", slot
    )
    SELECT
      slot,
      sum(guilds)::float8 AS guilds,
      sum(members)::float8 AS members,
      avg(ping)::float8 AS ping
    FROM per_shard
    GROUP BY slot
    ORDER BY slot
  `;

  const bySlot = new Map(rows.map((row) => [Number(row.slot), row]));
  const points = Array.from({ length: slotCount }, (_, index) => {
    const slot = firstSlot + index;
    const row = bySlot.get(slot);
    return {
      at: new Date(slot * stepMs).toISOString(),
      guildCount: row ? Math.round(row.guilds) : null,
      memberCount: row ? Math.round(row.members) : null,
      ping: row?.ping === null || row?.ping === undefined ? null : Math.round(row.ping),
    };
  });

  return { stepMinutes, points };
}
