import {
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  escapeMarkdown,
  type MessageMentionOptions,
  type User,
} from "discord.js";
import type { Track, UnresolvedTrack } from "lavalink-client";

import { Colors, Emojis } from "../../../client/Constants";
import { toV2Payload, type V2MessagePayload } from "../../../core/ui/containers";
import type { Translator } from "../../../i18n";

export type MusicMessagePayload = V2MessagePayload & { allowedMentions: MessageMentionOptions };

/** Clock position of a track (`m:ss`), which reads the same in every language. */
export function formatClockTime(ms: number): string {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

function formatTrackDuration(track: Track, t: Translator): string {
  return Number.isFinite(track.info.duration) && track.info.duration > 0
    ? formatClockTime(track.info.duration)
    : t("music.ui.live");
}

export function trackLink(track: Track | UnresolvedTrack): string {
  const title = escapeMarkdown(track.info.title).replace(/[[\]]/g, "");
  return track.info.uri ? `[${title}](${track.info.uri})` : `**${title}**`;
}

function requesterName(track: Track, t: Translator): string {
  const requester = track.requester as { username?: string } | undefined;
  return requester?.username ?? t("music.ui.unknownRequester");
}

export function buildTrackContainer(
  t: Translator,
  title: string,
  track: Track,
  extraLines: string[] = [],
): ContainerBuilder {
  const container = new ContainerBuilder()
    .setAccentColor(Colors.Music)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          `### ${Emojis.Music} ${title}`,
          t("music.ui.trackTitle", { track: trackLink(track) }),
          t("music.ui.trackSource", { source: track.info.sourceName }),
          t("music.ui.trackDuration", { duration: formatTrackDuration(track, t) }),
          t("music.ui.trackRequester", { requester: requesterName(track, t) }),
          ...extraLines,
        ].join("\n"),
      ),
    );

  if (track.info.artworkUrl) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(track.info.artworkUrl),
      ),
    );
  }

  return container;
}

/** Music action message: the member behind it, a title and a sentence, mentions muted. */
export function musicActionPayload(
  user: User,
  emoji: string,
  title: string,
  description: string,
): MusicMessagePayload {
  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**${escapeMarkdown(user.username)}**\n### ${emoji} ${title}\n${description}`,
      ),
    )
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(user.displayAvatarURL({ size: 128 })));

  return {
    ...toV2Payload(
      false,
      new ContainerBuilder().setAccentColor(Colors.Music).addSectionComponents(section),
    ),
    allowedMentions: { parse: [] },
  };
}
