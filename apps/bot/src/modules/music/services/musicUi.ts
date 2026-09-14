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

export type MusicMessagePayload = V2MessagePayload & { allowedMentions: MessageMentionOptions };

export function formatTrackTime(ms: number): string {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

function formatTrackDuration(track: Track): string {
  return Number.isFinite(track.info.duration) && track.info.duration > 0
    ? formatTrackTime(track.info.duration)
    : "live";
}

export function trackLink(track: Track | UnresolvedTrack): string {
  const title = escapeMarkdown(track.info.title).replace(/[[\]]/g, "");
  return track.info.uri ? `[${title}](${track.info.uri})` : `**${title}**`;
}

export function interventionOf(user: User): string {
  return `avec l'intervention de <@${user.id}>`;
}

function requesterName(track: Track): string {
  const requester = track.requester as { username?: string } | undefined;
  return requester?.username ?? "inconnu";
}

export function buildTrackContainer(
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
          `Titre : ${trackLink(track)}`,
          `Source : \`${track.info.sourceName}\``,
          `Durée : \`${formatTrackDuration(track)}\``,
          `Ajoutée par \`${requesterName(track)}\``,
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

/** Message d'action musique : membre à l'origine de l'action, titre et phrase, sans notifier les mentions. */
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
