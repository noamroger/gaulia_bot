import {
  BLINDTEST_PLAYLIST_MIN_TRACKS,
  BLINDTEST_PRESET_CATEGORIES,
  getBlindtestPlaylist,
  getMusicSettings,
  listBlindtestPlaylists,
  localized,
  type BlindtestTrack,
} from "@gaulia/database";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  escapeMarkdown,
  PermissionFlagsBits,
  TextDisplayBuilder,
  type ApplicationCommandOptionChoiceData,
  type GuildMember,
  type GuildTextBasedChannel,
  type Message,
  type MessageActionRowComponentBuilder,
  type MessageMentionOptions,
} from "discord.js";
import type { Player, Track, UnresolvedTrack } from "lavalink-client";

import { Colors } from "../../../client/Constants";
import type { GauliaClient } from "../../../client/GauliaClient";
import { GauliaError } from "../../../core/errors";
import { toV2Payload, type V2MessagePayload } from "../../../core/ui/containers";
import { formatDurationMs } from "../../../core/utils/duration";
import { guildTranslatorFor, type Translator } from "../../../i18n";
import { artistAnswers, matchesAny, normalizeAnswer, titleAnswers } from "./blindtestAnswers";
import { getOrCreateConfiguredPlayer, guildTranslator } from "./playerUtils";

/** Flag set on the Lavalink player while a game runs (it hides the "now playing" card). */
export const BLINDTEST_PLAYER_FLAG = "blindtest";

export const BLINDTEST_DEFAULT_ROUNDS = 10;
export const BLINDTEST_DEFAULT_SECONDS = 30;

const CUSTOM_PREFIX = "custom:";
const INTRO_DELAY_MS = 8_000;
const REVEAL_DELAY_MS = 7_000;
const MAX_TRACK_ATTEMPTS = 3;
const FALLBACK_SEARCH_RESULTS = 5;
const FALLBACK_DURATION_TOLERANCE_MS = 10_000;
const MAX_ANSWER_LENGTH = 200;
const LEADERBOARD_SIZE = 10;
const ROUND_LEADERBOARD_SIZE = 5;
const MAX_AUTOCOMPLETE_CHOICES = 25;
const MAX_CHOICE_NAME_LENGTH = 100;
const MAX_LISTED_CHANNELS = 5;

type EndReason = "timeout" | "found" | "skipped" | "error";
type FinishReason = "completed" | "stopped" | "interrupted" | "unplayable" | "error";

type BlindtestPayload = V2MessagePayload & { allowedMentions: MessageMentionOptions };

/** Preset category or custom server list, ready to be played. */
export interface BlindtestCategory {
  name: string;
  description: string | null;
  guess: "both" | "title";
  tracks: BlindtestTrack[];
}

interface Round {
  number: number;
  track: BlindtestTrack;
  titles: string[];
  artists: string[];
  titleFoundBy: string | null;
  artistFoundBy: string | null;
  endsAt: number;
  endReason: EndReason | null;
  message: Message | null;
  timer: NodeJS.Timeout | null;
}

interface Session {
  client: GauliaClient;
  guildId: string;
  channel: GuildTextBasedChannel;
  voiceChannelId: string;
  hostId: string;
  category: BlindtestCategory;
  totalRounds: number;
  roundSeconds: number;
  pool: BlindtestTrack[];
  played: number;
  scores: Map<string, number>;
  round: Round | null;
  pending: NodeJS.Timeout | null;
  ended: boolean;
  /** Language of the server: every message of a game is read by the whole channel. */
  t: Translator;
}

interface PlayableClip {
  track: Track | UnresolvedTrack;
  position: number;
  endTime?: number;
}

/** Running games, per server, in memory of the shard process only. */
const sessions = new Map<string, Session>();

export function isBlindtestRunning(guildId: string): boolean {
  return sessions.has(guildId);
}

/**
 * Applies the blindtest channels set on the dashboard (empty means anywhere), which are separate
 * from the music command channel. A thread follows its parent; administrators are never blocked.
 */
export async function assertBlindtestChannel(
  member: GuildMember,
  channel: GuildTextBasedChannel | null,
  channelId: string,
): Promise<void> {
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return;

  const { blindtestChannelIds } = await getMusicSettings(member.guild.id);
  if (blindtestChannelIds.length === 0) return;

  const effectiveChannelId = channel?.isThread() ? (channel.parentId ?? channelId) : channelId;
  if (blindtestChannelIds.includes(effectiveChannelId)) return;

  const listed = blindtestChannelIds
    .slice(0, MAX_LISTED_CHANNELS)
    .map((id) => `<#${id}>`)
    .join(", ");
  const more = blindtestChannelIds.length > MAX_LISTED_CHANNELS ? "…" : "";
  throw new GauliaError("music.blindtest.error.channelOnly", { channels: `${listed}${more}` });
}

interface CategoryOption {
  value: string;
  name: string;
  trackCount: number;
  custom: boolean;
}

/** Preset categories that are not turned off, then the custom lists of the server. */
async function availableCategories(guildId: string, t: Translator): Promise<CategoryOption[]> {
  const [settings, playlists] = await Promise.all([
    getMusicSettings(guildId),
    listBlindtestPlaylists(guildId),
  ]);

  const custom = playlists.map((playlist) => ({
    value: `${CUSTOM_PREFIX}${playlist.id}`,
    name: playlist.name,
    trackCount: playlist.trackCount,
    custom: true,
  }));
  const presets = BLINDTEST_PRESET_CATEGORIES.filter(
    (category) => !settings.blindtestDisabledCategories.includes(category.id),
  ).map((category) => ({
    value: category.id,
    name: localized(category.name, t.locale),
    trackCount: category.tracks.length,
    custom: false,
  }));

  return [...custom, ...presets];
}

function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1)}…`;
}

function trackCount(t: Translator, count: number): string {
  return t("music.blindtest.category.tracks", { count });
}

export async function blindtestCategoryChoices(
  guildId: string,
  input: string,
  t: Translator,
): Promise<ApplicationCommandOptionChoiceData<string>[]> {
  const query = normalizeAnswer(input);
  const options = await availableCategories(guildId, t);

  return options
    .filter((option) => !query || normalizeAnswer(option.name).includes(query))
    .slice(0, MAX_AUTOCOMPLETE_CHOICES)
    .map((option) => ({
      name: truncate(
        t("music.blindtest.category.choice", {
          name: option.custom
            ? t("music.blindtest.category.customName", { name: option.name })
            : option.name,
          tracks: trackCount(t, option.trackCount),
        }),
        MAX_CHOICE_NAME_LENGTH,
      ),
      value: option.value,
    }));
}

export async function listBlindtestCategoryLines(
  guildId: string,
  t: Translator,
): Promise<string[]> {
  const options = await availableCategories(guildId, t);
  if (options.length === 0) {
    return [t("music.blindtest.category.none")];
  }

  const line = (option: CategoryOption) =>
    t("music.blindtest.category.line", {
      name: option.name,
      tracks: trackCount(t, option.trackCount),
    });
  const custom = options.filter((option) => option.custom);
  const presets = options.filter((option) => !option.custom);

  return [
    ...(custom.length > 0
      ? [[t("music.blindtest.category.customHeading"), ...custom.map(line)].join("\n")]
      : []),
    ...(presets.length > 0
      ? [[t("music.blindtest.category.presetHeading"), ...presets.map(line)].join("\n")]
      : []),
  ];
}

export async function resolveBlindtestCategory(
  guildId: string,
  value: string,
): Promise<BlindtestCategory> {
  if (value.startsWith(CUSTOM_PREFIX)) {
    const playlist = await getBlindtestPlaylist(guildId, value.slice(CUSTOM_PREFIX.length));
    if (!playlist) throw new GauliaError("music.blindtest.error.unknownPlaylist");
    if (playlist.tracks.length < BLINDTEST_PLAYLIST_MIN_TRACKS) {
      throw new GauliaError("music.blindtest.error.playlistTooSmall", {
        name: playlist.name,
        count: BLINDTEST_PLAYLIST_MIN_TRACKS,
      });
    }
    return { name: playlist.name, description: null, guess: "both", tracks: playlist.tracks };
  }

  const preset = BLINDTEST_PRESET_CATEGORIES.find((category) => category.id === value);
  if (!preset) {
    throw new GauliaError("music.blindtest.error.unknownCategory");
  }
  const settings = await getMusicSettings(guildId);
  if (settings.blindtestDisabledCategories.includes(preset.id)) {
    throw new GauliaError("music.blindtest.error.disabledCategory");
  }
  // The game is read by the whole channel, so the category follows the language of the server.
  const { locale } = await guildTranslatorFor(guildId);
  return {
    name: localized(preset.name, locale),
    description: localized(preset.description, locale),
    guess: preset.guess,
    tracks: preset.tracks,
  };
}

function shuffled<T>(values: readonly T[]): T[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function blindtestPayload(
  lines: string[],
  rows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [],
): BlindtestPayload {
  const container = new ContainerBuilder()
    .setAccentColor(Colors.Primary)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join("\n")));
  for (const row of rows) container.addActionRowComponents(row);

  return { ...toV2Payload(false, container), allowedMentions: { parse: [] } };
}

function controlButton(action: "skip" | "stop", guildId: string, t: Translator): ButtonBuilder {
  return new ButtonBuilder()
    .setCustomId(`blindtest:${action}:${guildId}`)
    .setLabel(t(`music.blindtest.button.${action}`))
    .setStyle(action === "skip" ? ButtonStyle.Secondary : ButtonStyle.Danger);
}

function controlRow(session: Session, actions: ("skip" | "stop")[]) {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    actions.map((action) => controlButton(action, session.guildId, session.t)),
  );
}

function roundCount(t: Translator, count: number): string {
  return t("music.blindtest.rounds", { count });
}

function leaderboard(session: Session, size: number): string[] {
  const { t } = session;
  const ranking = [...session.scores].sort((a, b) => b[1] - a[1]).slice(0, size);
  if (ranking.length === 0) return [t("music.blindtest.leaderboard.empty")];
  return ranking.map(([userId, score], index) =>
    t("music.blindtest.leaderboard.entry", {
      rank: index + 1,
      user: userId,
      points: t("music.blindtest.leaderboard.points", { count: score }),
    }),
  );
}

function foundLine(t: Translator, label: string, userId: string | null, over: boolean): string {
  if (userId) return t("music.blindtest.round.foundBy", { label, user: userId });
  return t(over ? "music.blindtest.round.notFound" : "music.blindtest.round.pending", { label });
}

function renderIntro(session: Session): BlindtestPayload {
  const { t } = session;
  return blindtestPayload(
    [
      `### ${t("music.blindtest.intro.title", { category: escapeMarkdown(session.category.name) })}`,
      ...(session.category.description ? [session.category.description] : []),
      "",
      t("music.blindtest.intro.setup", {
        rounds: roundCount(t, session.totalRounds),
        duration: formatDurationMs(session.roundSeconds * 1000, t),
        channel: session.voiceChannelId,
      }),
      t(`music.blindtest.rules.${session.category.guess}`),
      "",
      `-# ${t("music.blindtest.intro.footer", { host: session.hostId })}`,
    ],
    [controlRow(session, ["stop"])],
  );
}

function renderRound(session: Session, round: Round): BlindtestPayload {
  const { t } = session;
  const over = round.endReason !== null;
  const lines = [
    `### ${t("music.blindtest.round.heading", { number: round.number, total: session.totalRounds })}`,
  ];

  if (over) {
    const { track } = round;
    lines.push(
      t("music.blindtest.round.answer", {
        title: escapeMarkdown(track.title),
        artist: escapeMarkdown(track.artist),
      }),
    );
    if (track.uri) {
      const url = `https://open.spotify.com/track/${track.uri.split(":").pop()}`;
      lines.push(`-# ${t("music.blindtest.round.spotify", { url })}`);
    }
  } else {
    lines.push(
      t("music.blindtest.round.listening", {
        timestamp: `<t:${Math.ceil(round.endsAt / 1000)}:R>`,
      }),
    );
  }

  lines.push("", foundLine(t, t("music.blindtest.round.titleLabel"), round.titleFoundBy, over));
  if (session.category.guess === "both") {
    lines.push(foundLine(t, t("music.blindtest.round.artistLabel"), round.artistFoundBy, over));
  }

  if (round.endReason === "skipped") lines.push(`-# ${t("music.blindtest.round.skipped")}`);
  if (round.endReason === "error") lines.push(`-# ${t("music.blindtest.round.failed")}`);

  if (over) {
    lines.push(
      "",
      t("music.blindtest.leaderboard.heading"),
      ...leaderboard(session, ROUND_LEADERBOARD_SIZE),
    );
  }

  return blindtestPayload(lines, over ? [] : [controlRow(session, ["skip", "stop"])]);
}

function renderFinal(session: Session, reason: FinishReason, stoppedBy?: string): BlindtestPayload {
  const { t } = session;
  const heading = t("music.blindtest.final.heading", {
    title: t(`music.blindtest.final.title.${reason}`),
    category: escapeMarkdown(session.category.name),
  });

  return blindtestPayload([
    `### ${heading}`,
    t(`music.blindtest.final.details.${reason}`, {
      user: stoppedBy ?? session.hostId,
      rounds: roundCount(t, session.played),
    }),
    "",
    t("music.blindtest.leaderboard.finalHeading"),
    ...leaderboard(session, LEADERBOARD_SIZE),
  ]);
}

function runSafely(session: Session, task: () => Promise<void>): void {
  task().catch((error: unknown) => {
    session.client.logger.error({ err: error, guildId: session.guildId }, "Blindtest error");
    void finish(session, "error");
  });
}

async function editRoundMessage(session: Session, round: Round): Promise<void> {
  await round.message?.edit(renderRound(session, round)).catch(() => undefined);
}

async function findClip(
  session: Session,
  player: Player,
  track: BlindtestTrack,
): Promise<PlayableClip | null> {
  const requester = session.client.user;

  if (track.preview) {
    const preview = await player.search({ query: track.preview }, requester).catch(() => null);
    const previewTrack = preview?.tracks[0];
    if (previewTrack) return { track: previewTrack, position: 0 };
  }

  const title = titleAnswers(track.title)[0] ?? track.title;
  const artist = track.artist.split(",")[0] ?? track.artist;
  const fallback = await player
    .search({ query: `${artist} ${title}`, source: "scsearch" }, requester)
    .catch(() => null);
  // Unknown length (track added by hand): trust the first result.
  const match = fallback?.tracks
    .slice(0, FALLBACK_SEARCH_RESULTS)
    .find(
      (candidate) =>
        !candidate.info.isStream &&
        (track.durationMs === 0 ||
          Math.abs((candidate.info.duration ?? 0) - track.durationMs) <=
            FALLBACK_DURATION_TOLERANCE_MS),
    );
  if (!match) return null;

  const clipMs = session.roundSeconds * 1000;
  const duration = match.info.duration ?? track.durationMs;
  const position = Math.max(0, Math.min(Math.floor(duration * 0.3), duration - clipMs));
  return { track: match, position, endTime: position + clipMs };
}

async function nextRound(session: Session): Promise<void> {
  session.pending = null;
  if (session.ended) return;
  if (session.played >= session.totalRounds) return finish(session, "completed");

  const player = session.client.lavalink.getPlayer(session.guildId);
  if (!player) return finish(session, "interrupted");

  let clip: PlayableClip | null = null;
  let track: BlindtestTrack | undefined;
  for (let attempt = 0; attempt < MAX_TRACK_ATTEMPTS && !clip; attempt++) {
    track = session.pool.pop();
    if (!track) break;
    clip = await findClip(session, player, track);
  }
  if (session.ended) return;
  if (!clip || !track) return finish(session, "unplayable");

  session.played++;
  const round: Round = {
    number: session.played,
    track,
    titles: titleAnswers(track.title),
    artists: artistAnswers(track.artist),
    titleFoundBy: null,
    artistFoundBy: null,
    endsAt: Date.now() + session.roundSeconds * 1000,
    endReason: null,
    message: null,
    timer: null,
  };
  session.round = round;

  await player.play({
    clientTrack: clip.track,
    position: clip.position,
    ...(clip.endTime !== undefined ? { endTime: clip.endTime } : {}),
  });

  round.endsAt = Date.now() + session.roundSeconds * 1000;
  round.timer = setTimeout(
    () => runSafely(session, () => endRound(session, round, "timeout")),
    session.roundSeconds * 1000,
  );
  round.message = await session.channel.send(renderRound(session, round));
}

async function endRound(session: Session, round: Round, reason: EndReason): Promise<void> {
  if (round.endReason !== null || session.round !== round) return;
  round.endReason = reason;
  if (round.timer) clearTimeout(round.timer);

  const player = session.client.lavalink.getPlayer(session.guildId);
  if (player?.queue.current) await player.stopPlaying(false, false).catch(() => undefined);

  await editRoundMessage(session, round);
  if (session.ended) return;

  session.pending = setTimeout(() => runSafely(session, () => nextRound(session)), REVEAL_DELAY_MS);
}

async function finish(session: Session, reason: FinishReason, stoppedBy?: string): Promise<void> {
  if (session.ended) return;
  session.ended = true;
  sessions.delete(session.guildId);
  if (session.pending) clearTimeout(session.pending);

  const { round } = session;
  if (round && round.endReason === null) {
    round.endReason = reason === "stopped" ? "skipped" : "error";
    if (round.timer) clearTimeout(round.timer);
    await editRoundMessage(session, round);
  }

  const player = session.client.lavalink.getPlayer(session.guildId);
  if (player && reason !== "interrupted") {
    player.set(BLINDTEST_PLAYER_FLAG, false);
    await player.destroy().catch(() => undefined);
  }

  await session.channel.send(renderFinal(session, reason, stoppedBy)).catch(() => undefined);
}

export async function startBlindtest(
  client: GauliaClient,
  options: {
    member: GuildMember;
    channel: GuildTextBasedChannel;
    category: BlindtestCategory;
    rounds: number;
    roundSeconds: number;
  },
): Promise<BlindtestPayload> {
  const { member, channel, category } = options;
  const guildId = member.guild.id;

  if (sessions.has(guildId)) {
    throw new GauliaError("music.blindtest.error.alreadyRunning");
  }

  const voiceChannelId = member.voice.channelId;
  if (!voiceChannelId) {
    throw new GauliaError("music.blindtest.error.joinVoice");
  }

  const existing = client.lavalink.getPlayer(guildId);
  if (existing?.queue.current || (existing?.queue.tracks.length ?? 0) > 0) {
    throw new GauliaError("music.blindtest.error.musicPlaying");
  }
  if (existing?.voiceChannelId && existing.voiceChannelId !== voiceChannelId) {
    throw new GauliaError("music.blindtest.error.otherVoiceChannel");
  }

  const player = await getOrCreateConfiguredPlayer(client, {
    guildId,
    voiceChannelId,
    textChannelId: channel.id,
  });
  if (sessions.has(guildId)) {
    throw new GauliaError("music.blindtest.error.alreadyRunning");
  }

  player.set(BLINDTEST_PLAYER_FLAG, true);
  if (!player.connected) await player.connect();

  const session: Session = {
    client,
    guildId,
    channel,
    voiceChannelId,
    hostId: member.id,
    category,
    totalRounds: Math.min(options.rounds, category.tracks.length),
    roundSeconds: options.roundSeconds,
    pool: shuffled(category.tracks),
    played: 0,
    scores: new Map(),
    round: null,
    pending: null,
    ended: false,
    t: await guildTranslator(client, guildId),
  };
  sessions.set(guildId, session);
  session.pending = setTimeout(() => runSafely(session, () => nextRound(session)), INTRO_DELAY_MS);

  return renderIntro(session);
}

/** Checks that a game exists and that this member may control it (host or Manage Server). */
export function requireBlindtestControl(guildId: string, member: GuildMember): Session {
  const session = sessions.get(guildId);
  if (!session) throw new GauliaError("music.blindtest.error.notRunning");
  if (member.id !== session.hostId && !member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    throw new GauliaError("music.blindtest.error.notHost");
  }
  return session;
}

export async function skipBlindtestRound(session: Session): Promise<void> {
  const { round } = session;
  if (!round || round.endReason !== null) {
    throw new GauliaError("music.blindtest.error.noRound");
  }
  await endRound(session, round, "skipped");
}

export async function stopBlindtest(session: Session, userId: string): Promise<void> {
  await finish(session, "stopped", userId);
}

/** Called when the player is destroyed outside the game (empty voice channel, disconnect). */
export async function abortBlindtest(guildId: string): Promise<void> {
  const session = sessions.get(guildId);
  if (session) await finish(session, "interrupted");
}

/** Unplayable or stuck clip: the round is cancelled without any point. */
export async function failBlindtestRound(guildId: string): Promise<void> {
  const session = sessions.get(guildId);
  const round = session?.round;
  if (session && round && round.endReason === null) await endRound(session, round, "error");
}

export async function handleBlindtestMessage(message: Message): Promise<void> {
  if (!message.inGuild() || message.author.bot) return;

  const session = sessions.get(message.guildId);
  const round = session?.round;
  if (!session || !round || round.endReason !== null) return;
  if (message.channelId !== session.channel.id) return;
  if (!message.content || message.content.length > MAX_ANSWER_LENGTH) return;

  const member =
    message.member ?? (await message.guild.members.fetch(message.author.id).catch(() => null));
  if (member?.voice.channelId !== session.voiceChannelId) return;

  const userId = message.author.id;
  let points = 0;

  if (!round.titleFoundBy && matchesAny(message.content, round.titles)) {
    round.titleFoundBy = userId;
    points++;
  }
  if (
    session.category.guess === "both" &&
    !round.artistFoundBy &&
    matchesAny(message.content, round.artists)
  ) {
    round.artistFoundBy = userId;
    points++;
  }
  if (points === 0) return;

  session.scores.set(userId, (session.scores.get(userId) ?? 0) + points);

  const complete =
    round.titleFoundBy !== null &&
    (session.category.guess === "title" || round.artistFoundBy !== null);
  if (complete) {
    await endRound(session, round, "found");
  } else {
    await editRoundMessage(session, round);
  }
}
