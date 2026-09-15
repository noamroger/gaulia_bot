import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { MessageActionRowComponentBuilder } from "discord.js";

import { Colors } from "../../../../client/Constants";
import { env } from "../../../../config/env";
import { buildContainer, toV2Payload, type V2MessagePayload } from "../../../../core/ui/containers";
import { formatDurationMs } from "../../../../core/utils/duration";
import type { BotInfoSnapshot, ShardLine } from "./botStatsService";
import { USAGE_WINDOW_DAYS } from "./botStatsService";

/** Vues de `/botinfo`, toutes atteignables d'un bouton : une entrée ici = un onglet. */
export type BotInfoView = "apercu" | "technique" | "shards" | "commandes" | "modules";

export const BOT_INFO_VIEWS: readonly BotInfoView[] = [
  "apercu",
  "technique",
  "shards",
  "commandes",
  "modules",
];

const VIEW_BUTTONS: Readonly<Record<BotInfoView, { label: string; emoji: string }>> = {
  apercu: { label: "Aperçu", emoji: "🤖" },
  technique: { label: "Technique", emoji: "⚙️" },
  shards: { label: "Shards", emoji: "🛰️" },
  commandes: { label: "Commandes", emoji: "🧩" },
  modules: { label: "Modules", emoji: "📦" },
};

/** Nombre de shards détaillés dans la vue « Shards » avant de résumer le reste. */
const MAX_SHARD_LINES = 20;
const SPARKLINE_BLOCKS = "▁▂▃▄▅▆▇█";
const BAR_LENGTH = 10;

export function isBotInfoView(value: string): value is BotInfoView {
  return (BOT_INFO_VIEWS as readonly string[]).includes(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(value));
}

/** Horodatage Discord : affiché dans le fuseau de chaque lecteur. */
function timestamp(date: Date, style: "D" | "R" | "f"): string {
  return `<t:${Math.floor(date.getTime() / 1000)}:${style}>`;
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)} %`;
}

/** Les compteurs quotidiens sont datés en UTC : on les affiche tels quels, sans décalage. */
function formatDay(isoDay: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${isoDay}T00:00:00Z`));
}

/** Courbe compacte d'une série de valeurs, en blocs Unicode. */
function sparkline(values: number[]): string {
  const max = Math.max(...values, 1);
  return values
    .map((value) => {
      const index = Math.round((value / max) * (SPARKLINE_BLOCKS.length - 1));
      return SPARKLINE_BLOCKS[index] ?? SPARKLINE_BLOCKS[0];
    })
    .join("");
}

function bar(ratio: number): string {
  const filled = Math.max(0, Math.min(BAR_LENGTH, Math.round(ratio * BAR_LENGTH)));
  return `${"█".repeat(filled)}${"░".repeat(BAR_LENGTH - filled)}`;
}

function section(title: string, lines: (string | null)[]): string {
  return [`**${title}**`, ...lines.filter((line): line is string => line !== null)].join("\n");
}

const MODULE_LABELS: Readonly<Record<string, string>> = {
  general: "Général",
  moderation: "Modération",
  automod: "Automod",
  music: "Musique",
  fun: "Fun",
  adventure: "Aventure",
  premium: "Premium",
};

function moduleLabel(category: string): string {
  return MODULE_LABELS[category] ?? category.charAt(0).toUpperCase() + category.slice(1);
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
      identity.owner ? `Propriétaire : ${identity.owner}` : null,
    ]),
    section("En chiffres", [
      `🌍 ${formatNumber(totals.guildCount)} serveur(s) · 👥 ${formatNumber(totals.memberCount)} membre(s)`,
      `🧩 ${formatNumber(catalogue.total)} commande(s) · ⚡ ${formatNumber(usage.totalInRange)} utilisation(s) sur ${USAGE_WINDOW_DAYS} jours`,
      `🎵 ${formatNumber(totals.playerCount)} lecteur(s) en cours · ⚔️ ${formatNumber(content.adventure.players)} aventurier(s)`,
      `✨ ${formatNumber(content.guilds.premium)} serveur(s) premium`,
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
            `${node.connected ? "🟢" : "🔴"} \`${node.id}\` — ${formatNumber(node.playingPlayers)} lecture(s) sur ${formatNumber(node.players)} lecteur(s)`,
            `-# RAM ${formatNumber(node.memoryUsedMb)} Mo · CPU ${percent(node.lavalinkLoad)} du bot, ${percent(node.systemLoad)} système (${node.cpuCores} cœurs) · démarré depuis ${formatDurationMs(node.uptimeMs)}`,
          ].join("\n"),
        );

  return [
    "## ⚙️ Technique",
    section("Exécution", [
      `Node.js \`${runtime.node}\` · discord.js \`${runtime.discordJs}\``,
      `Plateforme : \`${runtime.platform}/${runtime.arch}\` · ${runtime.cpuCount} cœur(s) · charge ${runtime.loadAverage.toFixed(2)}`,
      `Environnement : \`${runtime.environment}\` · RAM machine ${formatNumber(runtime.systemMemoryMb)} Mo`,
    ]),
    section(`Process du shard ${local.shardId}`, [
      `Mémoire : ${formatNumber(local.rssMb)} Mo (dont ${formatNumber(local.heapMb)} Mo de tas)`,
      `Cache : ${formatNumber(local.guildCount)} serveur(s), ${formatNumber(local.cachedUsers)} utilisateur(s)`,
      `Latence WebSocket : ${local.wsPing === null ? "en cours de mesure" : `${local.wsPing} ms`} · en ligne depuis ${formatDurationMs(local.uptimeMs)}`,
    ]),
    section("Base de données", [
      runtime.databaseLatencyMs === null
        ? "🔴 Injoignable à l'instant."
        : `🟢 PostgreSQL — aller-retour en ${runtime.databaseLatencyMs} ms`,
    ]),
    section("Lavalink", lavalink),
    `-# ${formatNumber(totals.playerCount)} lecteur(s) audio actif(s) sur l'ensemble des shards.`,
  ];
}

function shardLine(shard: ShardLine): string {
  const marker = shard.current ? "➤" : "　";
  const state = shard.online ? "🟢" : "🔴";
  return [
    `${marker} ${state} **Shard ${shard.shardId}** — ${formatNumber(shard.guildCount)} serveur(s), ${formatNumber(shard.memberCount)} membre(s)`,
    `-# ${shard.ping} ms · ${formatNumber(shard.memoryMb)} Mo · ${formatNumber(shard.playerCount)} lecteur(s) · démarré ${timestamp(shard.startedAt, "R")}`,
  ].join("\n");
}

function shardsView(snapshot: BotInfoSnapshot): string[] {
  const { shards, totals, local } = snapshot;

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
      `🌍 ${formatNumber(totals.guildCount)} serveur(s) · 👥 ${formatNumber(totals.memberCount)} membre(s)`,
      totals.averagePing === null
        ? "📡 Latence moyenne : inconnue"
        : `📡 Latence moyenne : ${totals.averagePing} ms`,
      snapshot.identity.approximateGuildCount === null
        ? null
        : `📋 Serveurs déclarés par Discord : ${formatNumber(snapshot.identity.approximateGuildCount)}`,
    ]),
    "-# Un shard est considéré hors ligne après 90 secondes sans heartbeat.",
  ].filter((line): line is string => line !== null);
}

function commandsView(snapshot: BotInfoSnapshot): string[] {
  const { catalogue, usage } = snapshot;
  const daily = usage.daily;
  const today = daily.at(-1)?.count ?? 0;
  const lastWeek = daily.slice(-7).reduce((sum, day) => sum + day.count, 0);
  const average = daily.length === 0 ? 0 : usage.totalInRange / daily.length;
  const busiest = daily.reduce(
    (best, day) => (day.count > best.count ? day : best),
    daily[0] ?? { date: "", count: 0 },
  );

  const top =
    usage.topCommands.length === 0
      ? ["Aucune commande utilisée sur la période."]
      : usage.topCommands.map(
          (row, index) => `${index + 1}. \`/${row.commandName}\` — ${formatNumber(row.count)}`,
        );

  return [
    "## 🧩 Commandes",
    section("Catalogue", [
      `${formatNumber(catalogue.total)} commande(s) : ${formatNumber(catalogue.chatInput)} slash et ${formatNumber(catalogue.contextMenu)} menu(s) contextuel(s)`,
      `${formatNumber(catalogue.invocations)} chemin(s) invocable(s) · ${formatNumber(catalogue.options)} option(s)`,
      `${formatNumber(catalogue.components)} composant(s) interactif(s) enregistré(s)`,
    ]),
    section(`Utilisation sur ${USAGE_WINDOW_DAYS} jours`, [
      `Total : ${formatNumber(usage.totalInRange)} · moyenne ${formatNumber(average)}/jour`,
      `Aujourd'hui : ${formatNumber(today)} · 7 derniers jours : ${formatNumber(lastWeek)}`,
      busiest.count > 0
        ? `Meilleur jour : ${formatDay(busiest.date)} (${formatNumber(busiest.count)})`
        : null,
      `Depuis toujours : ${formatNumber(usage.totalAllTime)}`,
    ]),
    daily.length > 0 ? `\`${sparkline(daily.map((day) => day.count))}\`` : null,
    section(`Top ${usage.topCommands.length || ""}`.trim(), top),
    "-# Seuls des compteurs par commande sont conservés, jamais qui a lancé quoi.",
  ].filter((line): line is string => line !== null);
}

function modulesView(snapshot: BotInfoSnapshot): string[] {
  const { catalogue, content } = snapshot;
  const maxUsages = Math.max(...catalogue.modules.map((row) => row.usages), 1);

  const modules = catalogue.modules.map((row) => {
    const paths =
      row.invocations > row.commands ? ` (${formatNumber(row.invocations)} chemins)` : "";
    return `\`${bar(row.usages / maxUsages)}\` **${moduleLabel(row.category)}** — ${formatNumber(row.commands)} commande(s)${paths}, ${formatNumber(row.usages)} utilisation(s)`;
  });

  return [
    `## 📦 Modules\nRépartition des utilisations sur ${USAGE_WINDOW_DAYS} jours.`,
    modules.join("\n"),
    section("Modération", [
      `${formatNumber(content.moderation.cases)} sanction(s) enregistrée(s) · ${formatNumber(content.moderation.activeWarns)} avertissement(s) actif(s)`,
      `${formatNumber(content.moderation.automodGuilds)} serveur(s) avec l'automod configuré`,
    ]),
    section("Musique", [
      `${formatNumber(content.music.settingsGuilds)} serveur(s) avec des réglages musique`,
      `${formatNumber(content.music.blindtestPlaylists)} playlist(s) de blindtest créée(s)`,
    ]),
    section("Aventure", [
      `${formatNumber(content.adventure.players)} aventurier(s) · niveau le plus haut : ${formatNumber(content.adventure.maxLevel)}`,
      `${formatNumber(content.adventure.explorations)} exploration(s) · ${formatNumber(content.adventure.trades)} échange(s) conclu(s)`,
      `${formatNumber(content.adventure.finished)} scénario(s) terminé(s) · activée sur ${formatNumber(content.adventure.guilds)} serveur(s)`,
    ]),
    section("Communauté", [
      `${formatNumber(content.guilds.premium)} serveur(s) premium sur ${formatNumber(content.guilds.present)}`,
      `${formatNumber(content.votesLast30Days)} vote(s) top.gg sur 30 jours`,
    ]),
  ];
}

const RENDERERS: Readonly<Record<BotInfoView, (snapshot: BotInfoSnapshot) => string[]>> = {
  apercu: overviewView,
  technique: technicalView,
  shards: shardsView,
  commandes: commandsView,
  modules: modulesView,
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
      .setURL(`https://discord.com/oauth2/authorize?client_id=${env.DISCORD_CLIENT_ID}`),
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
