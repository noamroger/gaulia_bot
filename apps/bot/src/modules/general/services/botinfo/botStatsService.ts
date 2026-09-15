import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  getBotContentStats,
  getCommandUsageSummary,
  listShardStatuses,
  measureDatabaseLatency,
  type BotContentStats,
  type CommandUsageSummary,
} from "@gaulia/database";
import {
  ApplicationCommandOptionType,
  version as discordJsVersion,
  type APIApplicationCommandOption,
} from "discord.js";

import type { GauliaClient } from "../../../../client/GauliaClient";
import { env } from "../../../../config/env";
import type { Command } from "../../../../structures/Command";

/** Au-delà, le shard n'a plus écrit de heartbeat : il est considéré hors ligne (même seuil que l'API). */
const SHARD_STALE_AFTER_MS = 90_000;
/** Fenêtre d'analyse des statistiques d'utilisation des commandes. */
export const USAGE_WINDOW_DAYS = 30;
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
  /** Vrai pour le shard qui répond à cette interaction. */
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

export interface ModuleLine {
  category: string;
  commands: number;
  /** Chemins invocables du module : `/aventure` en compte autant qu'il a de sous-commandes. */
  invocations: number;
  usages: number;
}

export interface BotInfoSnapshot {
  fetchedAt: Date;
  identity: {
    tag: string;
    id: string;
    createdAt: Date;
    version: string;
    owner: string | null;
    /** Nombre de serveurs renvoyé par Discord, indépendant des heartbeats. */
    approximateGuildCount: number | null;
  };
  /** Somme des shards en ligne ; `null` si aucun heartbeat n'est encore enregistré. */
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
    /** `null` tant que la gateway n'a pas mesuré de latence (démarrage, reconnexion). */
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
    environment: string;
    databaseLatencyMs: number | null;
    lavalink: LavalinkNodeLine[];
  };
  shards: ShardLine[];
  catalogue: {
    total: number;
    chatInput: number;
    contextMenu: number;
    /** Sous-commandes réellement invocables (une commande sans sous-commande compte pour une). */
    invocations: number;
    options: number;
    components: number;
    modules: ModuleLine[];
  };
  usage: CommandUsageSummary;
  content: BotContentStats;
}

function botVersion(): string {
  // 5 niveaux au-dessus de modules/general/services/botinfo, en dev (src) comme compilé (dist).
  const manifest = path.resolve(__dirname, "../../../../../package.json");
  try {
    const parsed: unknown = JSON.parse(readFileSync(manifest, "utf8"));
    const version = (parsed as { version?: unknown }).version;
    return typeof version === "string" ? version : "inconnue";
  } catch {
    return "inconnue";
  }
}

/** Compte les chemins invocables d'une commande (`/a`, `/a b`, `/a b c`) et leurs options. */
function countUsages(options: readonly APIApplicationCommandOption[]): {
  invocations: number;
  options: number;
} {
  let invocations = 0;
  let count = 0;

  for (const option of options) {
    if (
      option.type === ApplicationCommandOptionType.Subcommand ||
      option.type === ApplicationCommandOptionType.SubcommandGroup
    ) {
      const nested = countUsages(option.options ?? []);
      invocations += Math.max(1, nested.invocations);
      count += nested.options;
    } else {
      count += 1;
    }
  }

  return { invocations, options: count };
}

function describeCatalogue(
  client: GauliaClient,
  usage: CommandUsageSummary,
): BotInfoSnapshot["catalogue"] {
  const usagesByCategory = new Map(usage.categories.map((row) => [row.category, row.count]));
  const commandsByCategory = new Map<string, { commands: number; invocations: number }>();
  let chatInput = 0;
  let contextMenu = 0;
  let invocations = 0;
  let options = 0;

  for (const command of client.commands.values() as IterableIterator<Command>) {
    const category = command.category ?? "general";
    const paths =
      command.type === "chatInput"
        ? Math.max(1, countUsages(command.data.toJSON().options ?? []).invocations)
        : 1;

    const module = commandsByCategory.get(category) ?? { commands: 0, invocations: 0 };
    commandsByCategory.set(category, {
      commands: module.commands + 1,
      invocations: module.invocations + paths,
    });

    invocations += paths;
    if (command.type === "chatInput") {
      chatInput += 1;
      options += countUsages(command.data.toJSON().options ?? []).options;
    } else {
      contextMenu += 1;
    }
  }

  const modules = [...commandsByCategory]
    .map(([category, module]) => ({
      category,
      ...module,
      usages: usagesByCategory.get(category) ?? 0,
    }))
    .sort((a, b) => b.usages - a.usages || b.commands - a.commands);

  return {
    total: client.commands.size,
    chatInput,
    contextMenu,
    invocations,
    options,
    components: client.components.size,
    modules,
  };
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

/** Propriétaire de l'application : l'équipe si le bot en appartient à une, sinon l'utilisateur. */
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
 * Photographie complète de l'état du bot, toutes vues de `/botinfo` confondues : les totaux
 * globaux viennent des heartbeats en base (le cache discord.js d'un process ne connaît que SON
 * shard), le reste de ce process et du catalogue chargé en mémoire.
 */
export async function collectBotInfo(client: GauliaClient): Promise<BotInfoSnapshot> {
  const [shardRows, usage, content, databaseLatencyMs, application] = await Promise.all([
    listShardStatuses(),
    getCommandUsageSummary(USAGE_WINDOW_DAYS, [], TOP_COMMANDS),
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
  // La gateway renvoie -1, voire NaN, tant qu'aucun battement n'a été mesuré.
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
      // `uptime` est nul avant le ready : le temps de process reste la meilleure approximation.
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
      environment: env.NODE_ENV,
      databaseLatencyMs: databaseLatencyMs === null ? null : Math.round(databaseLatencyMs),
      lavalink: describeLavalink(client),
    },
    shards,
    catalogue: describeCatalogue(client, usage),
    usage,
    content,
  };
}
