import { countCommandUsageSince, listShardStatuses } from "@gaulia/database";
import type { FastifyInstance } from "fastify";

const STALE_AFTER_MS = 90_000;
const CACHE_TTL_MS = 60_000;
const COMMAND_WINDOW_DAYS = 30;

interface PublicStats {
  online: boolean;
  guildCount: number;
  memberCount: number;
  commandsLast30Days: number;
}

let cache: { expiresAt: number; value: Promise<PublicStats> } | null = null;

async function computePublicStats(): Promise<PublicStats> {
  const [shards, commandsLast30Days] = await Promise.all([
    listShardStatuses(),
    countCommandUsageSince(COMMAND_WINDOW_DAYS),
  ]);
  const now = Date.now();
  const online = shards.filter((shard) => now - shard.updatedAt.getTime() < STALE_AFTER_MS);

  return {
    online: online.length > 0,
    guildCount: online.reduce((sum, shard) => sum + shard.guildCount, 0),
    memberCount: online.reduce((sum, shard) => sum + shard.memberCount, 0),
    commandsLast30Days,
  };
}

/**
 * Public home page statistics: global totals only (nothing per shard, server or user), cached for
 * 60 s so a rush of visits does not hammer the database.
 */
export default async function statsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/stats", async (_request, reply) => {
    const now = Date.now();
    if (!cache || cache.expiresAt <= now) {
      const value = computePublicStats().catch((error: unknown) => {
        cache = null;
        throw error;
      });
      cache = { expiresAt: now + CACHE_TTL_MS, value };
    }

    void reply.header("Cache-Control", `public, max-age=${CACHE_TTL_MS / 1000}`);
    return cache.value;
  });
}
