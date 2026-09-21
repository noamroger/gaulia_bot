import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  COMMAND_USAGE_RETENTION_DAYS,
  countCommandUsageSince,
  getBotContentStats,
  getCommandUsageSummary,
  listShardStatuses,
  measureDatabaseLatency,
  type BotContentStats,
  type CommandUsageSummary,
} from "@gaulia/database";
import { version as discordJsVersion } from "discord.js";

import type { GauliaClient } from "../../../../client/GauliaClient";
import { env } from "../../../../config/env";

/** Past this, the shard stopped writing heartbeats and counts as offline (same threshold as the API). */
const SHARD_STALE_AFTER_MS = 90_000;
/** Window the command usage statistics are computed over. */
export const USAGE_WINDOW_DAYS = 30;
/**
 * Long window shown by `/botinfo`: the retention period itself, past which the counters are purged
 * (apps/api/src/jobs/retentionJob.ts). Nothing is kept forever.
 */
export const USAGE_HISTORY_DAYS = COMMAND_USAGE_RETENTION_DAYS;
const TOP_COMMANDS = 5;

export interface ShardLine {
  shardId: number;
  guildCount: number;
  memberCount: number;
  ping: number;
  memoryMb: number;
  playerCount: number;
  online: boolean;
  startedAt: Date;
  updatedAt: Date;
  /** True for the shard answering this interaction. */
  current: boolean;
}

export interface LavalinkNodeLine {
  id: string;
  connected: boolean;
  players: number;
  playingPlayers: number;
  uptimeMs: number;
  memoryUsedMb: number;
  cpuCores: number;
  systemLoad: number;
  lavalinkLoad: number;
}

export interface BotInfoSnapshot {
  fetchedAt: Date;
  identity: {
    tag: string;
    id: string;
    createdAt: Date;
    version: string | null;
    owner: string | null;
    /** Server count reported by Discord, independent of the heartbeats. */
    approximateGuildCount: number | null;
  };
  /** Online shards only: a silent shard would skew the totals. */
  totals: {
    guildCount: number;
    memberCount: number;
    playerCount: number;
    shardCount: number;
    onlineShardCount: number;
    averagePing: number | null;
  };
  local: {
    shardId: number;
    /** `null` until the gateway has measured a latency (startup, reconnection). */
    wsPing: number | null;
    guildCount: number;
    cachedUsers: number;
    rssMb: number;
    heapMb: number;
    uptimeMs: number;
  };
  runtime: {
    node: string;
    discordJs: string;
    platform: string;
    arch: string;
    cpuCount: number;
    loadAverage: number;
    systemMemoryMb: number;
    databaseLatencyMs: number | null;
    lavalink: LavalinkNodeLine[];
  };
  shards: ShardLine[];
  catalogue: {
    total: number;
    components: number;
  };
  usage: CommandUsageSummary;
  /** Total over the whole retention period, recomputed rather than read from `usage.totalAllTime`. */
  usageHistoryTotal: number;
  content: BotContentStats;
}

/** `null` when the manifest cannot be read, so the view can label it in the reader's language. */
function botVersion(): string | null {
  // 5 levels above modules/general/services/botinfo, in dev (src) as in the build (dist).
  const manifest = path.resolve(__dirname, "../../../../../package.json");
  try {
    const parsed: unknown = JSON.parse(readFileSync(manifest, "utf8"));
    const version = (parsed as { version?: unknown }).version;
    return typeof version === "string" ? version : null;
  } catch {
    return null;
  }
}

function describeLavalink(client: GauliaClient): LavalinkNodeLine[] {
  const nodes = client.lavalink?.nodeManager?.nodes;
  if (!nodes) return [];

  return [...nodes.values()].map((node) => ({
    id: node.options.id ?? "main",
    connected: node.connected,
    players: node.stats.players,
    playingPlayers: node.stats.playingPlayers,
    uptimeMs: node.stats.uptime,
    memoryUsedMb: Math.round(node.stats.memory.used / 1_048_576),
    cpuCores: node.stats.cpu.cores,
    systemLoad: node.stats.cpu.systemLoad,
    lavalinkLoad: node.stats.cpu.lavalinkLoad,
  }));
}

/** Application owner: the team when the bot belongs to one, the user otherwise. */
async function describeOwner(client: GauliaClient): Promise<{
  owner: string | null;
  approximateGuildCount: number | null;
}> {
  try {
    const application = await client.application?.fetch();
    if (!application) return { owner: null, approximateGuildCount: null };

    const owner = application.owner;
    return {
      owner: owner === null ? null : "name" in owner ? owner.name : owner.tag,
      approximateGuildCount: application.approximateGuildCount ?? null,
    };
  } catch {
    return { owner: null, approximateGuildCount: null };
  }
}

/**
 * Full snapshot behind every `/botinfo` tab. Global totals come from the heartbeats in the
 * database, since a process only caches its own shard; the rest comes from this process and from
 * the catalogue loaded in memory.
 */
export async function collectBotInfo(client: GauliaClient): Promise<BotInfoSnapshot> {
  const [shardRows, usage, usageHistoryTotal, content, databaseLatencyMs, application] =
    await Promise.all([
      listShardStatuses(),
      getCommandUsageSummary(USAGE_WINDOW_DAYS, [], TOP_COMMANDS),
      countCommandUsageSince(USAGE_HISTORY_DAYS),
      getBotContentStats(),
      measureDatabaseLatency().catch(() => null),
      describeOwner(client),
    ]);

  const now = Date.now();
  const currentShardId = client.shard?.ids[0] ?? 0;
  const shards: ShardLine[] = shardRows.map((shard) => ({
    shardId: shard.shardId,
    guildCount: shard.guildCount,
    memberCount: shard.memberCount,
    ping: shard.ping,
    memoryMb: shard.memoryMb,
    playerCount: shard.playerCount,
    online: now - shard.updatedAt.getTime() < SHARD_STALE_AFTER_MS,
    startedAt: shard.startedAt,
    updatedAt: shard.updatedAt,
    current: shard.shardId === currentShardId,
  }));

  const online = shards.filter((shard) => shard.online);
  const sumOnline = (pick: (shard: ShardLine) => number): number =>
    online.reduce((total, shard) => total + pick(shard), 0);

  const memory = process.memoryUsage();
  // The gateway reports -1, or even NaN, until a heartbeat has been measured.
  const rawPing = client.ws.ping;
  const wsPing = Number.isFinite(rawPing) ? rawPing : -1;

  return {
    fetchedAt: new Date(),
    identity: {
      tag: client.user?.tag ?? "Gaulia",
      id: client.user?.id ?? env.DISCORD_CLIENT_ID,
      createdAt: client.user?.createdAt ?? new Date(0),
      version: botVersion(),
      ...application,
    },
    totals: {
      guildCount: sumOnline((shard) => shard.guildCount),
      memberCount: sumOnline((shard) => shard.memberCount),
      playerCount: sumOnline((shard) => shard.playerCount),
      shardCount: shards.length,
      onlineShardCount: online.length,
      averagePing:
        online.length === 0 ? null : Math.round(sumOnline((shard) => shard.ping) / online.length),
    },
    local: {
      shardId: currentShardId,
      wsPing: wsPing >= 0 ? Math.round(wsPing) : null,
      guildCount: client.guilds.cache.size,
      cachedUsers: client.users.cache.size,
      rssMb: Math.round(memory.rss / 1_048_576),
      heapMb: Math.round(memory.heapUsed / 1_048_576),
      // `uptime` is null before ready, so process time is the best approximation.
      uptimeMs: client.uptime ?? Math.round(process.uptime() * 1000),
    },
    runtime: {
      node: process.versions.node,
      discordJs: discordJsVersion,
      platform: process.platform,
      arch: process.arch,
      cpuCount: os.cpus().length,
      loadAverage: os.loadavg()[0] ?? 0,
      systemMemoryMb: Math.round(os.totalmem() / 1_048_576),
      databaseLatencyMs: databaseLatencyMs === null ? null : Math.round(databaseLatencyMs),
      lavalink: describeLavalink(client),
    },
    shards,
    catalogue: {
      total: client.commands.size,
      components: client.components.size,
    },
    usage,
    usageHistoryTotal,
    content,
  };
}
