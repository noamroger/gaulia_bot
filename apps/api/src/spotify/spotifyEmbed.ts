import {
  BLINDTEST_PLAYLIST_MAX_TRACKS,
  BLINDTEST_PREVIEW_PATTERN,
  blindtestTrackSchema,
  type BlindtestTrack,
} from "@gaulia/database";

export type SpotifyLinkType = "playlist" | "album" | "track";

export interface SpotifyLink {
  type: SpotifyLinkType;
  id: string;
}

export interface SpotifyImport {
  name: string;
  tracks: BlindtestTrack[];
}

interface EmbedTrackItem {
  uri?: string;
  title?: string;
  subtitle?: string;
  duration?: number;
  isPlayable?: boolean;
  entityType?: string;
  audioPreview?: { url?: string } | null;
}

interface EmbedEntity extends EmbedTrackItem {
  name?: string;
  artists?: { name?: string }[];
  trackList?: EmbedTrackItem[];
}

const LINK_PATTERN =
  /^(?:https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}(?:-[a-z]{2})?\/)?(playlist|album|track)\/|spotify:(playlist|album|track):)([A-Za-z0-9]{22})(?:[/?#].*)?$/i;
const FETCH_TIMEOUT_MS = 10_000;

export function parseSpotifyLink(input: string): SpotifyLink | null {
  const match = input.trim().match(LINK_PATTERN);
  const type = (match?.[1] ?? match?.[2])?.toLowerCase();
  const id = match?.[3];
  if (!id || (type !== "playlist" && type !== "album" && type !== "track")) return null;
  return { type, id };
}

function toTrack(item: EmbedTrackItem): BlindtestTrack | null {
  const previewUrl = item.audioPreview?.url;
  const parsed = blindtestTrackSchema.safeParse({
    uri: item.uri ?? null,
    title: item.title,
    artist: item.subtitle,
    durationMs: Math.round(item.duration ?? 0),
    preview: previewUrl && BLINDTEST_PREVIEW_PATTERN.test(previewUrl) ? previewUrl : null,
  });
  return parsed.success ? parsed.data : null;
}

/**
 * Lit les titres d'un lien Spotify public via sa page d'intégration (open.spotify.com/embed),
 * sans compte ni clé d'API. Une playlist est limitée aux 100 premiers titres par Spotify.
 */
export async function fetchSpotifyImport(link: SpotifyLink): Promise<SpotifyImport | null> {
  const response = await fetch(`https://open.spotify.com/embed/${link.type}/${link.id}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) return null;

  const html = await response.text();
  const json = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s)?.[1];
  if (!json) return null;

  const data = JSON.parse(json) as {
    props?: { pageProps?: { state?: { data?: { entity?: EmbedEntity } } } };
  };
  const entity = data.props?.pageProps?.state?.data?.entity;
  if (!entity) return null;

  const items: EmbedTrackItem[] =
    link.type === "track"
      ? [
          {
            ...entity,
            title: entity.title ?? entity.name,
            subtitle: entity.artists
              ?.map((artist) => artist.name)
              .filter(Boolean)
              .join(", "),
            entityType: "track",
          },
        ]
      : (entity.trackList ?? []);

  const tracks = items
    .filter((item) => item.entityType === "track" && item.isPlayable !== false)
    .map(toTrack)
    .filter((track): track is BlindtestTrack => track !== null)
    .slice(0, BLINDTEST_PLAYLIST_MAX_TRACKS);

  return { name: entity.name ?? entity.title ?? "Spotify", tracks };
}
