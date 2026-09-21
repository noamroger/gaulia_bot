import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { MessageActionRowComponentBuilder } from "discord.js";

import { botInviteUrl, Colors, OWNER_WEBSITE_URL } from "../../../../client/Constants";
import { env } from "../../../../config/env";
import { buildContainer, toV2Payload, type V2MessagePayload } from "../../../../core/ui/containers";
import { formatDurationMs } from "../../../../core/utils/duration";
import type { Translator } from "../../../../i18n";
import type { BotInfoSnapshot, ShardLine } from "./botStatsService";
import { USAGE_HISTORY_DAYS, USAGE_WINDOW_DAYS } from "./botStatsService";

/** Tabs of `/botinfo`, all reachable from a button: one entry here is one tab. */
export type BotInfoView = "overview" | "technical" | "shards" | "commands";

export const BOT_INFO_VIEWS: readonly BotInfoView[] = [
  "overview",
  "technical",
  "shards",
  "commands",
];

const VIEW_EMOJIS: Readonly<Record<BotInfoView, string>> = {
  overview: "🤖",
  technical: "⚙️",
  shards: "🛰️",
  commands: "🧩",
};

/** Shards detailed in the "Shards" tab before the rest is summarised. */
const MAX_SHARD_LINES = 20;

export function isBotInfoView(value: string): value is BotInfoView {
  return (BOT_INFO_VIEWS as readonly string[]).includes(value);
}

function formatNumber(value: number, t: Translator): string {
  return new Intl.NumberFormat(t.locale).format(Math.round(value));
}

/** Numeric value of a metric, always in `code` so it stands out from the prose. */
function metric(value: string): string {
  return `\`${value}\``;
}

/**
 * Counted metric, agreeing in number in both languages: "1 server", "22 serveurs". `count` picks
 * the singular or plural branch, `value` is what actually gets printed, grouped for the locale.
 */
function count(t: Translator, key: string, value: number): string {
  return t(`general.botinfo.counts.${key}`, { count: value, value: formatNumber(value, t) });
}

/** Discord timestamp: rendered in each reader's own timezone. */
function timestamp(date: Date, style: "D" | "R" | "f"): string {
  return `<t:${Math.floor(date.getTime() / 1000)}:${style}>`;
}

function percent(ratio: number, t: Translator): string {
  return t("general.botinfo.units.percent", { value: Math.round(ratio * 100) });
}

function megabytes(value: number, t: Translator): string {
  return t("general.botinfo.units.megabyte", { value: formatNumber(value, t) });
}

function section(title: string, lines: (string | null)[]): string {
  return [`**${title}**`, ...lines.filter((line): line is string => line !== null)].join("\n");
}

// ─── Tabs ───────────────────────────────────────────────────────────────────

function overviewView(snapshot: BotInfoSnapshot, t: Translator): string[] {
  const { identity, totals, local, catalogue, usage, content } = snapshot;
  const shardState =
    totals.shardCount === 0
      ? t("general.botinfo.overview.noHeartbeat")
      : t("general.botinfo.overview.shardsOnline", {
          online: totals.onlineShardCount,
          total: totals.shardCount,
        });

  return [
    `## 🤖 ${identity.tag}\n${t("general.botinfo.tagline")}`,
    section(t("general.botinfo.overview.identity"), [
      t("general.botinfo.overview.id", { id: identity.id }),
      t("general.botinfo.overview.version", {
        version: identity.version ?? t("general.botinfo.unknownVersion"),
      }),
      t("general.botinfo.overview.createdAt", {
        date: timestamp(identity.createdAt, "D"),
        relative: timestamp(identity.createdAt, "R"),
      }),
      identity.owner
        ? t("general.botinfo.overview.owner", {
            owner: identity.owner,
            url: OWNER_WEBSITE_URL,
          })
        : null,
    ]),
    section(t("general.botinfo.overview.numbers"), [
      t("general.botinfo.overview.guildsAndMembers", {
        guilds: count(t, "server", totals.guildCount),
        members: count(t, "member", totals.memberCount),
      }),
      t("general.botinfo.overview.commandsAndUsage", {
        commands: count(t, "command", catalogue.total),
        usage: count(t, "usage", usage.totalInRange),
        days: USAGE_WINDOW_DAYS,
      }),
      t("general.botinfo.overview.playersAndAdventurers", {
        players: count(t, "player", totals.playerCount),
        adventurers: count(t, "adventurer", content.adventurePlayers),
      }),
      t("general.botinfo.overview.premiumGuilds", {
        count: formatNumber(content.premiumGuilds, t),
      }),
    ]),
    section(t("general.botinfo.overview.state"), [
      `${totals.onlineShardCount > 0 ? "🟢" : "🔴"} ${shardState}`,
      totals.averagePing === null
        ? t("general.botinfo.overview.averagePingUnknown")
        : t("general.botinfo.overview.averagePing", { ping: totals.averagePing }),
      t("general.botinfo.overview.uptime", {
        duration: formatDurationMs(local.uptimeMs, t),
        shard: local.shardId,
      }),
    ]),
    `-# ${t("general.botinfo.overview.footer", { timestamp: timestamp(snapshot.fetchedAt, "f") })}`,
  ];
}

function technicalView(snapshot: BotInfoSnapshot, t: Translator): string[] {
  const { runtime, local, totals } = snapshot;
  const lavalink =
    runtime.lavalink.length === 0
      ? [t("general.botinfo.technical.lavalinkNone")]
      : runtime.lavalink.map((node) =>
          [
            t("general.botinfo.technical.lavalinkNode", {
              state: node.connected ? "🟢" : "🔴",
              id: node.id,
              playing: formatNumber(node.playingPlayers, t),
              players: count(t, "player", node.players),
            }),
            t("general.botinfo.technical.lavalinkDetail", {
              memory: metric(megabytes(node.memoryUsedMb, t)),
              botLoad: metric(percent(node.lavalinkLoad, t)),
              systemLoad: metric(percent(node.systemLoad, t)),
              cores: node.cpuCores,
              uptime: metric(formatDurationMs(node.uptimeMs, t)),
            }),
          ].join("\n"),
        );

  return [
    `## ⚙️ ${t("general.botinfo.technical.title")}`,
    section(t("general.botinfo.technical.runtime"), [
      t("general.botinfo.technical.versions", {
        node: metric(runtime.node),
        discordJs: metric(runtime.discordJs),
      }),
      t("general.botinfo.technical.platform", {
        platform: metric(`${runtime.platform}/${runtime.arch}`),
        cores: metric(count(t, "core", runtime.cpuCount)),
        load: metric(percent(runtime.loadAverage / runtime.cpuCount, t)),
      }),
      t("general.botinfo.technical.systemMemory", {
        memory: metric(megabytes(runtime.systemMemoryMb, t)),
      }),
    ]),
    section(t("general.botinfo.technical.process", { shard: local.shardId }), [
      t("general.botinfo.technical.memory", {
        rss: metric(megabytes(local.rssMb, t)),
        heap: metric(megabytes(local.heapMb, t)),
      }),
      t("general.botinfo.technical.cache", {
        guilds: metric(count(t, "server", local.guildCount)),
        users: metric(count(t, "user", local.cachedUsers)),
      }),
      t("general.botinfo.technical.wsPing", {
        ping:
          local.wsPing === null
            ? t("general.botinfo.technical.wsPingMeasuring")
            : metric(`${local.wsPing} ms`),
      }),
      t("general.botinfo.technical.uptime", {
        duration: metric(formatDurationMs(local.uptimeMs, t)),
      }),
    ]),
    section(t("general.botinfo.technical.database"), [
      runtime.databaseLatencyMs === null
        ? t("general.botinfo.technical.databaseDown")
        : t("general.botinfo.technical.databaseUp", {
            ping: metric(`${runtime.databaseLatencyMs} ms`),
          }),
    ]),
    section(t("general.botinfo.technical.lavalink"), lavalink),
    `-# ${t("general.botinfo.technical.footer", { count: formatNumber(totals.playerCount, t) })}`,
  ];
}

function shardLine(shard: ShardLine, t: Translator): string {
  return [
    t("general.botinfo.shards.line", {
      marker: shard.current ? "➤" : "　",
      state: shard.online ? "🟢" : "🔴",
      shard: shard.shardId,
      guilds: count(t, "server", shard.guildCount),
      members: count(t, "member", shard.memberCount),
    }),
    t("general.botinfo.shards.lineDetail", {
      ping: metric(`${shard.ping} ms`),
      memory: metric(megabytes(shard.memoryMb, t)),
      players: count(t, "player", shard.playerCount),
      relative: timestamp(shard.startedAt, "R"),
    }),
  ].join("\n");
}

function shardsView(snapshot: BotInfoSnapshot, t: Translator): string[] {
  const { shards, totals, local, identity } = snapshot;
  const title = `## 🛰️ ${t("general.botinfo.shards.title")}`;

  if (shards.length === 0) {
    return [title, t("general.botinfo.shards.none")];
  }

  const shown = shards.slice(0, MAX_SHARD_LINES);
  const hidden = shards.length - shown.length;

  return [
    `${title}\n${t("general.botinfo.shards.header", {
      online: totals.onlineShardCount,
      total: totals.shardCount,
      shard: local.shardId,
    })}`,
    shown.map((shard) => shardLine(shard, t)).join("\n"),
    hidden > 0 ? t("general.botinfo.shards.more", { count: formatNumber(hidden, t) }) : null,
    section(t("general.botinfo.shards.totals"), [
      t("general.botinfo.shards.guildsAndMembers", {
        guilds: count(t, "server", totals.guildCount),
        members: count(t, "member", totals.memberCount),
      }),
      totals.averagePing === null
        ? t("general.botinfo.shards.averagePingUnknown")
        : t("general.botinfo.shards.averagePing", { ping: metric(`${totals.averagePing} ms`) }),
      identity.approximateGuildCount === null
        ? null
        : t("general.botinfo.shards.declaredGuilds", {
            count: metric(formatNumber(identity.approximateGuildCount, t)),
          }),
    ]),
    `-# ${t("general.botinfo.shards.footer")}`,
  ].filter((line): line is string => line !== null);
}

function commandsView(snapshot: BotInfoSnapshot, t: Translator): string[] {
  const { catalogue, usage } = snapshot;
  const today = usage.daily.at(-1)?.count ?? 0;

  const top =
    usage.topCommands.length === 0
      ? [t("general.botinfo.commands.topNone")]
      : usage.topCommands.map((row, index) =>
          t("general.botinfo.commands.topLine", {
            rank: index + 1,
            command: row.commandName,
            count: formatNumber(row.count, t),
          }),
        );

  return [
    `## 🧩 ${t("general.botinfo.commands.title")}\n${t("general.botinfo.commands.header", {
      commands: count(t, "command", catalogue.total),
      components: count(t, "component", catalogue.components),
    })}`,
    section(t("general.botinfo.commands.usage"), [
      t("general.botinfo.commands.today", { count: formatNumber(today, t) }),
      t("general.botinfo.commands.window", {
        days: USAGE_WINDOW_DAYS,
        count: formatNumber(usage.totalInRange, t),
      }),
      t("general.botinfo.commands.history", {
        days: USAGE_HISTORY_DAYS,
        count: formatNumber(snapshot.usageHistoryTotal, t),
      }),
    ]),
    section(
      t("general.botinfo.commands.top", { count: usage.topCommands.length || "" }).trim(),
      top,
    ),
    t("general.botinfo.commands.footer", { days: USAGE_HISTORY_DAYS }),
  ];
}

const RENDERERS: Readonly<
  Record<BotInfoView, (snapshot: BotInfoSnapshot, t: Translator) => string[]>
> = {
  overview: overviewView,
  technical: technicalView,
  shards: shardsView,
  commands: commandsView,
};

// ─── Navigation ─────────────────────────────────────────────────────────────

function navigationRow(userId: string, current: BotInfoView, t: Translator): ButtonBuilder[] {
  return BOT_INFO_VIEWS.map((view) =>
    new ButtonBuilder()
      .setCustomId(`botinfo:view:${userId}:${view}`)
      .setLabel(t(`general.botinfo.views.${view}`))
      .setEmoji(VIEW_EMOJIS[view])
      .setStyle(view === current ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(view === current),
  );
}

/** Refresh of the current tab, then the external links when they are configured. */
function linkRow(
  userId: string,
  current: BotInfoView,
  t: Translator,
): MessageActionRowComponentBuilder[] {
  const buttons: MessageActionRowComponentBuilder[] = [
    new ButtonBuilder()
      .setCustomId(`botinfo:refresh:${userId}:${current}`)
      .setLabel(t("general.botinfo.refresh"))
      .setEmoji("🔄")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setLabel(t("general.botinfo.addBot"))
      .setEmoji("➕")
      .setStyle(ButtonStyle.Link)
      .setURL(botInviteUrl(env.DISCORD_CLIENT_ID)),
  ];

  if (env.DASHBOARD_URL) {
    buttons.push(
      new ButtonBuilder()
        .setLabel(t("general.botinfo.dashboard"))
        .setEmoji("🌐")
        .setStyle(ButtonStyle.Link)
        .setURL(env.DASHBOARD_URL),
    );
  }

  return buttons;
}

/**
 * Renders any `/botinfo` tab: the `botinfo:view` component displays them all, so adding a view to
 * `BOT_INFO_VIEWS` is enough to make it navigable.
 */
export function botInfoView(
  snapshot: BotInfoSnapshot,
  view: BotInfoView,
  userId: string,
  t: Translator,
): V2MessagePayload {
  const container = buildContainer(Colors.Primary, RENDERERS[view](snapshot, t));

  container.addActionRowComponents(
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      navigationRow(userId, view, t),
    ),
  );
  container.addActionRowComponents(
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      linkRow(userId, view, t),
    ),
  );

  return toV2Payload(false, container);
}
