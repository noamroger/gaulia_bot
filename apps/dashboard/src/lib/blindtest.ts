import type { BlindtestTrack } from "./types";

/** Limites dupliquées depuis @gaulia/database (le dashboard n'importe pas ce package). */
export const BLINDTEST_PLAYLIST_MAX_TRACKS = 300;
export const BLINDTEST_PLAYLIST_MIN_TRACKS = 3;
export const BLINDTEST_MAX_PLAYLISTS = 25;
export const BLINDTEST_PLAYLIST_NAME_MAX = 50;

/** Identifie un titre pour éviter les doublons : lien Spotify, sinon titre et artiste. */
export function blindtestTrackKey(track: BlindtestTrack): string {
  if (track.uri) return track.uri;
  return `${track.title}|${track.artist}`
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
