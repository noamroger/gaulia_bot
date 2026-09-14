import { listShardStatuses } from "@gaulia/database";
import type { FastifyInstance } from "fastify";

const STALE_AFTER_MS = 90_000;

export default async function statsRoutes(app: FastifyInstance): Promise<void> {
  // Public : agrégats uniquement, aucune donnée par utilisateur/serveur.
  app.get("/stats", async () => {
    const shards = await listShardStatuses();
    const now = Date.now();
    const onlineShards = shards.filter((shard) => now - shard.updatedAt.getTime() < STALE_AFTER_MS);

    return {
      shardCount: shards.length,
      onlineShardCount: onlineShards.length,
      guildCount: onlineShards.reduce((sum, shard) => sum + shard.guildCount, 0),
      averagePing:
        onlineShards.length === 0
          ? null
          : Math.round(
              onlineShards.reduce((sum, shard) => sum + shard.ping, 0) / onlineShards.length,
            ),
      shards: shards.map((shard) => ({
        shardId: shard.shardId,
        guildCount: shard.guildCount,
        ping: shard.ping,
        online: now - shard.updatedAt.getTime() < STALE_AFTER_MS,
        startedAt: shard.startedAt,
        updatedAt: shard.updatedAt,
      })),
    };
  });
}
