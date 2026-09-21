import type { BlindtestTrack } from "./types";

/** Limits duplicated from @gaulia/database (the dashboard does not import that package). */
export const BLINDTEST_PLAYLIST_MAX_TRACKS = 300;
export const BLINDTEST_PLAYLIST_MIN_TRACKS = 3;
export const BLINDTEST_MAX_PLAYLISTS = 25;
export const BLINDTEST_PLAYLIST_NAME_MAX = 50;

/** Identifies a track for dedupe: Spotify link, otherwise title and artist. */
export function blindtestTrackKey(track: BlindtestTrack): string {
  if (track.uri) return track.uri;
  return `${track.title}|${track.artist}`
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
