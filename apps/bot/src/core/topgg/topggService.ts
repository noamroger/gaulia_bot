import type { ShardingManager } from "discord.js";

import { logger } from "../../client/logger";
import { env } from "../../config/env";

/**
 * top.gg API v1: the key from the "Integrations & API" tab of the bot page goes in
 * `Authorization: Bearer <key>`, and project metrics are published on
 * `PATCH /projects/@me/metrics`, the project being deduced from the key.
 */
const TOPGG_API_BASE = "https://top.gg/api/v1";

/** top.gg recommends publishing on a schedule rather than on every join or leave. */
const POST_INTERVAL_MS = 30 * 60_000;

/** Laisse aux shards le temps de terminer leur connexion avant le premier envoi. */
const FIRST_POST_DELAY_MS = 60_000;

const REQUEST_TIMEOUT_MS = 10_000;

export function isTopggEnabled(): boolean {
  return env.TOPGG_API_KEY !== "";
}

async function postMetrics(serverCount: number, shardCount: number): Promise<void> {
  const response = await fetch(`${TOPGG_API_BASE}/projects/@me/metrics`, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${env.TOPGG_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ server_count: serverCount, shard_count: shardCount }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`top.gg answered ${response.status} ${response.statusText} ${body}`.trim());
  }
}

/**
 * Additionne les serveurs vus par chaque shard. `fetchClientValues` interroge tous les process
 * child processes: that is the only way to get the real total, since a shard's
 * `client.guilds.cache` only knows its own servers, hence a send driven by the parent process.
 */
async function totalGuildCount(manager: ShardingManager): Promise<number> {
  const counts = (await manager.fetchClientValues("guilds.cache.size")) as (number | undefined)[];
  return counts.reduce((sum: number, count) => sum + (count ?? 0), 0);
}

async function publishStats(manager: ShardingManager): Promise<void> {
  try {
    const serverCount = await totalGuildCount(manager);
    const shardCount = manager.shards.size;
    await postMetrics(serverCount, shardCount);
    logger.info({ serverCount, shardCount }, "Statistics published to top.gg");
  } catch (error) {
    // A top.gg failure must never disturb the bot: log it and retry on the next round.
    logger.error({ err: error }, "Could not publish the statistics to top.gg");
  }
}

/**
 * Publishes the server count to top.gg on a schedule, from the parent process. Without
 * `TOPGG_API_KEY` the integration simply stays off.
 */
export function startTopggStatsJob(manager: ShardingManager): void {
  if (!isTopggEnabled()) {
    logger.info("TOPGG_API_KEY missing, top.gg statistics publishing disabled");
    return;
  }

  setTimeout(() => void publishStats(manager), FIRST_POST_DELAY_MS).unref();
  setInterval(() => void publishStats(manager), POST_INTERVAL_MS).unref();
}
