import { z } from "zod";

export const BLINDTEST_PLAYLIST_MAX_TRACKS = 300;
export const BLINDTEST_PLAYLIST_MIN_TRACKS = 3;
export const BLINDTEST_MAX_PLAYLISTS = 25;
export const BLINDTEST_PLAYLIST_NAME_MAX = 50;

/**
 * Spotify-hosted previews only: the bot has Lavalink load this URL, so a free-form address would
 * let it reach any internal service.
 */
export const BLINDTEST_PREVIEW_PATTERN = /^https:\/\/p\.scdn\.co\/mp3-preview\/[A-Za-z0-9]+/;

export const blindtestTrackSchema = z.object({
  uri: z
    .string()
    .regex(/^spotify:track:[A-Za-z0-9]{22}$/)
    .nullable(),
  title: z.string().trim().min(1).max(200),
  artist: z.string().trim().min(1).max(300),
  /** 0 for a hand-added track (unknown duration). */
  durationMs: z.number().int().min(0).max(3_600_000),
  /** Official 30 second preview; null means a SoundCloud lookup during the game. */
  preview: z.string().regex(BLINDTEST_PREVIEW_PATTERN).max(300).nullable(),
});

export const blindtestTracksSchema = z
  .array(blindtestTrackSchema)
  .max(BLINDTEST_PLAYLIST_MAX_TRACKS);

export type BlindtestTrack = z.infer<typeof blindtestTrackSchema>;

export interface BlindtestPresetCategory {
  id: string;
  name: string;
  description: string;
  /** "title": only the title scores points (cover categories). */
  guess: "both" | "title";
  sources: string[];
  tracks: BlindtestTrack[];
}

export function parseBlindtestTracks(value: unknown): BlindtestTrack[] {
  const parsed = blindtestTracksSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}
