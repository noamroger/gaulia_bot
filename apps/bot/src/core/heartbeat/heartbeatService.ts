import { recordShardMetrics, upsertShardHeartbeat } from "@gaulia/database";

import type { GauliaClient } from "../../client/GauliaClient";

const HEARTBEAT_INTERVAL_MS = 20_000;

let heartbeatTimer: NodeJS.Timeout | undefined;

function currentShardId(client: GauliaClient): number {
  return client.shard?.ids[0] ?? 0;
}

async function sendHeartbeat(client: GauliaClient, startedAt: Date): Promise<void> {
  const shardId = currentShardId(client);
  const guildCount = client.guilds.cache.size;
  const memberCount = client.guilds.cache.reduce((sum, guild) => sum + guild.memberCount, 0);
  // -1 until the gateway has measured a latency.
  const rawPing = client.ws.ping;

  try {
    await Promise.all([
      upsertShardHeartbeat({
        shardId,
        guildCount,
        memberCount,
        ping: Math.max(0, Math.round(rawPing)),
        memoryMb: Math.round(process.memoryUsage().rss / 1_048_576),
        playerCount: client.lavalink.players.size,
        startedAt,
      }),
      recordShardMetrics({
        shardId,
        guildCount,
        memberCount,
        ping: rawPing >= 0 ? Math.round(rawPing) : null,
      }),
    ]);
  } catch (error) {
    client.logger.error({ err: error }, "Could not write the shard heartbeat");
  }
}

/**
 * Starts this shard process's periodic heartbeat, read by the API for the dashboard statistics
 * (current shard state and history). Called once from events/ready.ts.
 */
export function startHeartbeat(client: GauliaClient): void {
  const startedAt = new Date();

  void sendHeartbeat(client, startedAt);
  heartbeatTimer = setInterval(() => void sendHeartbeat(client, startedAt), HEARTBEAT_INTERVAL_MS);
}

export function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = undefined;
  }
}
