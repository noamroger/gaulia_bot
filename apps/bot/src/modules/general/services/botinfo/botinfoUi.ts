import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { MessageActionRowComponentBuilder } from "discord.js";

import { botInviteUrl, Colors, OWNER_WEBSITE_URL } from "../../../../client/Constants";
import { env } from "../../../../config/env";
import { buildContainer, toV2Payload, type V2MessagePayload } from "../../../../core/ui/containers";
import { formatDurationMs } from "../../../../core/utils/duration";
import type { BotInfoSnapshot, ShardLine } from "./botStatsService";
import { USAGE_HISTORY_DAYS, USAGE_WINDOW_DAYS } from "./botStatsService";

/** Vues de `/botinfo`, toutes atteignables d'un bouton : une entrée ici = un onglet. */
export type BotInfoView = "apercu" | "technique" | "shards" | "commandes";

export const BOT_INFO_VIEWS: readonly BotInfoView[] = [
  "apercu",
  "technique",
  "shards",
  "commandes",
];

const VIEW_BUTTONS: Readonly<Record<BotInfoView, { label: string; emoji: string }>> = {
  apercu: { label: "Aperçu", emoji: "🤖" },
  technique: { label: "Technique", emoji: "⚙️" },
  shards: { label: "Shards", emoji: "🛰️" },
  commandes: { label: "Commandes", emoji: "🧩" },
};

/** Nombre de shards détaillés dans la vue « Shards » avant de résumer le reste. */
const MAX_SHARD_LINES = 20;

export function isBotInfoView(value: string): value is BotInfoView {
  return (BOT_INFO_VIEWS as readonly string[]).includes(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(value));
}

/** Valeur chiffrée d'une métrique, toujours en `code` pour ressortir du texte. */
function metric(value: string): string {
  return `\`${value}\``;
}

/** Métrique comptée, accordée au singulier comme au pluriel : « 1 serveur », « 22 serveurs ». */
function countMetric(value: number, singular: string): string {
  return metric(`${formatNumber(value)} ${singular}${Math.abs(value) >= 2 ? "s" : ""}`);
}

/** Horodatage Discord : affiché dans le fuseau de chaque lecteur. */
function timestamp(date: Date, style: "D" | "R" | "f"): string {
  return `<t:${Math.floor(date.getTime() / 1000)}:${style}>`;
}

function percent(ratio: number): string {
  return `${Math.round(ratio * 100)} %`;
}

function section(title: string, lines: (string | null)[]): string {
  return [`**${title}**`, ...lines.filter((line): line is string => line !== null)].join("\n");
}

// ─── Vues ───────────────────────────────────────────────────────────────────

function overviewView(snapshot: BotInfoSnapshot): string[] {
  const { identity, totals, local, catalogue, usage, content } = snapshot;
  const shardState =
    totals.shardCount === 0
      ? "aucun heartbeat enregistré"
      : `${totals.onlineShardCount}/${totals.shardCount} shard(s) en ligne`;

  return [
    `## 🤖 ${identity.tag}\nBot Discord français : modération, automod, musique, jeux et aventure au long cours.`,
    section("Identité", [
      `Identifiant : \`${identity.id}\``,
      `Version : \`${identity.version}\``,
      `Créé le ${timestamp(identity.createdAt, "D")} (${timestamp(identity.createdAt, "R")})`,
      identity.owner ? `Propriétaire : [${identity.owner}](${OWNER_WEBSITE_URL})` : null,
    ]),
    section("En chiffres", [
      `🌍 ${formatNumber(totals.guildCount)} serveur(s) · 👥 ${formatNumber(totals.memberCount)} membre(s)`,
      `🧩 ${formatNumber(catalogue.total)} commande(s) · ⚡ ${formatNumber(usage.totalInRange)} utilisation(s) sur ${USAGE_WINDOW_DAYS} jours`,
      `🎵 ${formatNumber(totals.playerCount)} lecteur(s) en cours · ⚔️ ${formatNumber(content.adventurePlayers)} aventurier(s)`,
      `✨ ${formatNumber(content.premiumGuilds)} serveur(s) premium`,
    ]),
    section("État", [
      `${totals.onlineShardCount > 0 ? "🟢" : "🔴"} ${shardState}`,
      totals.averagePing === null
        ? "Latence moyenne : inconnue"
        : `📡 Latence moyenne : ${totals.averagePing} ms`,
      `⏱️ En ligne depuis ${formatDurationMs(local.uptimeMs)} (shard ${local.shardId})`,
    ]),
    `-# Totaux calculés à partir des heartbeats des shards · ${timestamp(snapshot.fetchedAt, "f")}`,
  ];
}

function technicalView(snapshot: BotInfoSnapshot): string[] {
  const { runtime, local, totals } = snapshot;
  const lavalink =
    runtime.lavalink.length === 0
      ? ["Aucun nœud configuré."]
      : runtime.lavalink.map((node) =>
          [
            `${node.connected ? "🟢" : "🔴"} \`${node.id}\` · ${formatNumber(node.playingPlayers)} lecture(s) sur ${formatNumber(node.players)} lecteur(s)`,
            `-# RAM ${metric(`${formatNumber(node.memoryUsedMb)} Mo`)} · CPU ${metric(percent(node.lavalinkLoad))} du bot, ${metric(percent(node.systemLoad))} système (${node.cpuCores} cœurs) · démarré depuis ${metric(formatDurationMs(node.uptimeMs))}`,
          ].join("\n"),
        );

  return [
    "## ⚙️ Technique",
    section("Exécution", [
      `Node.js ${metric(runtime.node)} · discord.js ${metric(runtime.discordJs)}`,
      `Plateforme : ${metric(`${runtime.platform}/${runtime.arch}`)} · ${countMetric(runtime.cpuCount, "cœur")} · charge ${metric(percent(runtime.loadAverage / runtime.cpuCount))}`,
      `RAM machine : ${metric(`${formatNumber(runtime.systemMemoryMb)} Mo`)}`,
    ]),
    section(`Process du shard ${local.shardId}`, [
      `Mémoire : ${metric(`${formatNumber(local.rssMb)} Mo`)} (dont ${metric(`${formatNumber(local.heapMb)} Mo`)} de tas)`,
      `Cache : ${countMetric(local.guildCount, "serveur")} · ${countMetric(local.cachedUsers, "utilisateur")}`,
      `Latence WebSocket : ${local.wsPing === null ? "en cours de mesure" : metric(`${local.wsPing} ms`)}`,
      `En ligne depuis ${metric(formatDurationMs(local.uptimeMs))}`,
    ]),
    section("Base de données", [
      runtime.databaseLatencyMs === null
        ? "🔴 PostgreSQL injoignable à l'instant."
        : `🟢 PostgreSQL · ping ${metric(`${runtime.databaseLatencyMs} ms`)}`,
    ]),
    section("Lavalink", lavalink),
    `-# ${formatNumber(totals.playerCount)} lecteur(s) audio actif(s) sur l'ensemble des shards.`,
  ];
}

function shardLine(shard: ShardLine): string {
  const marker = shard.current ? "➤" : "　";
  const state = shard.online ? "🟢" : "🔴";
  return [
    `${marker} ${state} **Shard ${shard.shardId}** : ${countMetric(shard.guildCount, "serveur")} · ${countMetric(shard.memberCount, "membre")}`,
    `-# ${metric(`${shard.ping} ms`)} · ${metric(`${formatNumber(shard.memoryMb)} Mo`)} · ${countMetric(shard.playerCount, "lecteur")} · démarré ${timestamp(shard.startedAt, "R")}`,
  ].join("\n");
}

function shardsView(snapshot: BotInfoSnapshot): string[] {
  const { shards, totals, local, identity } = snapshot;

  if (shards.length === 0) {
    return [
      "## 🛰️ Shards",
      "Aucun shard n'a encore envoyé de heartbeat. Les totaux globaux seront disponibles d'ici une minute.",
    ];
  }

  const shown = shards.slice(0, MAX_SHARD_LINES);
  const hidden = shards.length - shown.length;

  return [
    `## 🛰️ Shards\n${totals.onlineShardCount}/${totals.shardCount} en ligne · tu es servi par le shard **${local.shardId}** (➤).`,
    shown.map(shardLine).join("\n"),
    hidden > 0 ? `-# … et ${formatNumber(hidden)} shard(s) supplémentaire(s).` : null,
    section("Cumul des shards en ligne", [
      `🌍 ${countMetric(totals.guildCount, "serveur")} · 👥 ${countMetric(totals.memberCount, "membre")}`,
      totals.averagePing === null
        ? "📡 Latence moyenne : inconnue"
        : `📡 Latence moyenne : ${metric(`${totals.averagePing} ms`)}`,
      identity.approximateGuildCount === null
        ? null
        : `📋 Serveurs déclarés par Discord : ${metric(formatNumber(identity.approximateGuildCount))}`,
    ]),
    "-# Un shard est considéré hors ligne après 90 secondes sans heartbeat.",
  ].filter((line): line is string => line !== null);
}

function commandsView(snapshot: BotInfoSnapshot): string[] {
  const { catalogue, usage } = snapshot;
  const today = usage.daily.at(-1)?.count ?? 0;

  const top =
    usage.topCommands.length === 0
      ? ["Aucune commande utilisée sur la période."]
      : usage.topCommands.map(
          (row, index) => `${index + 1}. \`/${row.commandName}\` — ${formatNumber(row.count)}`,
        );

  return [
    `## 🧩 Commandes\n${formatNumber(catalogue.total)} commande(s) et ${formatNumber(catalogue.components)} bouton(s) ou menu(s).`,
    section("Utilisation", [
      `Aujourd'hui : ${formatNumber(today)}`,
      `${USAGE_WINDOW_DAYS} derniers jours : ${formatNumber(usage.totalInRange)}`,
      `${USAGE_HISTORY_DAYS} derniers jours : ${formatNumber(snapshot.usageHistoryTotal)}`,
    ]),
    section(`Top ${usage.topCommands.length || ""}`.trim(), top),
    `-# Seuls des compteurs par commande sont conservés, ${USAGE_HISTORY_DAYS} jours au maximum, jamais qui a lancé quoi.`,
  ];
}

const RENDERERS: Readonly<Record<BotInfoView, (snapshot: BotInfoSnapshot) => string[]>> = {
  apercu: overviewView,
  technique: technicalView,
  shards: shardsView,
  commandes: commandsView,
};

// ─── Navigation ─────────────────────────────────────────────────────────────

function navigationRow(userId: string, current: BotInfoView): ButtonBuilder[] {
  return BOT_INFO_VIEWS.map((view) => {
    const { label, emoji } = VIEW_BUTTONS[view];
    return new ButtonBuilder()
      .setCustomId(`botinfo:vue:${userId}:${view}`)
      .setLabel(label)
      .setEmoji(emoji)
      .setStyle(view === current ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(view === current);
  });
}

/** Actualisation de la vue courante, puis les liens externes s'ils sont configurés. */
function linkRow(userId: string, current: BotInfoView): MessageActionRowComponentBuilder[] {
  const buttons: MessageActionRowComponentBuilder[] = [
    new ButtonBuilder()
      .setCustomId(`botinfo:refresh:${userId}:${current}`)
      .setLabel("Actualiser")
      .setEmoji("🔄")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setLabel("Ajouter Gaulia")
      .setEmoji("➕")
      .setStyle(ButtonStyle.Link)
      .setURL(botInviteUrl(env.DISCORD_CLIENT_ID)),
  ];

  if (env.DASHBOARD_URL) {
    buttons.push(
      new ButtonBuilder()
        .setLabel("Dashboard")
        .setEmoji("🌐")
        .setStyle(ButtonStyle.Link)
        .setURL(env.DASHBOARD_URL),
    );
  }

  return buttons;
}

/**
 * Rend n'importe quel onglet de `/botinfo` : le composant `botinfo:vue` les affiche tous, donc
 * ajouter une vue à `BOT_INFO_VIEWS` suffit à la rendre navigable.
 */
export function botInfoView(
  snapshot: BotInfoSnapshot,
  view: BotInfoView,
  userId: string,
): V2MessagePayload {
  const container = buildContainer(Colors.Primary, RENDERERS[view](snapshot));

  container.addActionRowComponents(
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      navigationRow(userId, view),
    ),
  );
  container.addActionRowComponents(
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(linkRow(userId, view)),
  );

  return toV2Payload(false, container);
}
