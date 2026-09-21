// Generates src/data/blindtestPresets.ts (the blindtest preset categories) from public Spotify
// playlists. Track lists are read from the embed page (open.spotify.com/embed), so no account and
// no API key are needed. To add a category: add an entry to CATEGORIES, then run
// `npm run blindtest:presets -w packages/database`.
//
// Names and descriptions are written here in both languages: they are the only part of the file a
// player ever reads, so regenerating must not drop the English.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUTPUT = join(dirname(fileURLToPath(import.meta.url)), "../src/data/blindtestPresets.ts");
const MAX_TRACKS = 150;
const PREVIEW_PATTERN = /^https:\/\/p\.scdn\.co\/mp3-preview\/[A-Za-z0-9]+/;

/**
 * guess: "both" scores the title and the artist, "title" only the title (cover categories).
 * latinOnly: drops titles that cannot be typed on a keyboard (Japanese, Korean...).
 */
const CATEGORIES = [
  {
    id: "hits-du-moment",
    name: { en: "Current hits", fr: "Hits du moment" },
    description: {
      en: "The most played tracks in France and around the world.",
      fr: "Les titres les plus écoutés en France et dans le monde.",
    },
    playlists: ["37i9dQZEVXbIPWwFssbupI", "37i9dQZF1DXcBWIGoYBM5M"],
  },
  {
    id: "annees-70",
    name: { en: "The 70s", fr: "Années 70" },
    description: {
      en: "Disco, rock and pop from the 70s.",
      fr: "Disco, rock et pop des années 70.",
    },
    playlists: ["37i9dQZF1DWTJ7xPn4vNaz"],
  },
  {
    id: "annees-80",
    name: { en: "The 80s", fr: "Années 80" },
    description: {
      en: "The essential hits of the 80s.",
      fr: "Les tubes incontournables des années 80.",
    },
    playlists: ["37i9dQZF1DX4UtSsGT1Sbe"],
  },
  {
    id: "annees-90",
    name: { en: "The 90s", fr: "Années 90" },
    description: {
      en: "Pop, eurodance and rock from the 90s.",
      fr: "Pop, eurodance et rock des années 90.",
    },
    playlists: ["37i9dQZF1DXbTxeAdrVG2l"],
  },
  {
    id: "annees-2000",
    name: { en: "The 2000s", fr: "Années 2000" },
    description: {
      en: "The hits that defined the 2000s.",
      fr: "Les hits qui ont marqué les années 2000.",
    },
    playlists: ["37i9dQZF1DX4o1oenSJRJd"],
  },
  {
    id: "annees-2010",
    name: { en: "The 2010s", fr: "Années 2010" },
    description: {
      en: "The biggest hits of the 2010s.",
      fr: "Les plus gros succès des années 2010.",
    },
    playlists: ["37i9dQZF1DX5Ejj0EkURtP"],
  },
  {
    id: "chanson-francaise",
    name: { en: "French chanson", fr: "Chanson française" },
    description: {
      en: "The great classics of French song.",
      fr: "Les grands classiques de la chanson française.",
    },
    playlists: ["7aUI6OUkeXotPRLPvN9IV6", "2NOoAnESsilnOLTpP4OXrA"],
  },
  {
    id: "rap-fr-classiques",
    name: { en: "Classic French rap", fr: "Rap français classique" },
    description: {
      en: "The French rap classics of the 90s and 2000s.",
      fr: "Les classiques du rap français des années 90 et 2000.",
    },
    playlists: ["5sdOHvsmAwUZc4osRLTQi1"],
  },
  {
    id: "rap-fr-actuel",
    name: { en: "French rap today", fr: "Rap français actuel" },
    description: {
      en: "The French rap of the moment.",
      fr: "Le rap français du moment.",
    },
    playlists: ["3aj8I39Ok1hAmzRDJ0KYPH"],
  },
  {
    id: "rap-us",
    name: { en: "US rap", fr: "Rap US" },
    description: {
      en: "The best of current American rap.",
      fr: "Le meilleur du rap américain actuel.",
    },
    playlists: ["37i9dQZF1DX0XUsuxWHRQd"],
  },
  {
    id: "rock",
    name: { en: "Classic rock", fr: "Rock classique" },
    description: {
      en: "The landmarks of rock.",
      fr: "Les monuments du rock.",
    },
    playlists: ["37i9dQZF1DWXRqgorJj26U"],
  },
  {
    id: "tubes-a-chanter",
    name: { en: "Singalong hits", fr: "Tubes à chanter" },
    description: {
      en: "The choruses everybody knows by heart.",
      fr: "Les refrains que tout le monde connaît par cœur.",
    },
    playlists: ["37i9dQZF1DWWMOmoXKqHTD"],
  },
  {
    id: "disney",
    name: { en: "Disney (French)", fr: "Disney (VF)" },
    description: {
      en: "Songs from the Disney films, in French.",
      fr: "Les chansons des films Disney en français.",
    },
    playlists: ["37i9dQZF1DWYa24lU2SeaC", "29wcS6GWqMPIpmpygGDGdc"],
  },
  {
    id: "dessins-animes",
    name: { en: "Cartoon themes", fr: "Génériques de dessins animés" },
    description: {
      en: "The cult cartoon themes of the 80s and 90s.",
      fr: "Les génériques cultes des dessins animés des années 80 et 90.",
    },
    playlists: ["6wCO4442A2AGcaLBXAxsP7", "0Yyc1bnaisMJtbktGZsONT"],
  },
  {
    id: "films",
    name: { en: "Film scores", fr: "Musiques de films" },
    description: {
      en: "The most famous soundtracks in cinema.",
      fr: "Les bandes originales les plus célèbres du cinéma.",
    },
    playlists: ["37i9dQZF1DX1tz6EDao8it", "2usejAPtDnhOmU9Js6ULkI"],
  },
  {
    id: "anime",
    name: { en: "Anime openings", fr: "Openings d'anime" },
    description: {
      en: "The most played anime openings.",
      fr: "Les génériques d'anime les plus écoutés.",
    },
    latinOnly: true,
    playlists: ["6am99i50y1FTHzhKAObN3a", "1x3uqbRRfUv5pUGGjRnA6v"],
  },
  {
    id: "jeux-video",
    name: { en: "Video games", fr: "Jeux vidéo" },
    description: {
      en: "Cult video game themes: name the track or the game.",
      fr: "Les thèmes cultes du jeu vidéo : trouve le titre ou le jeu.",
    },
    guess: "title",
    playlists: ["73LW4GPi3f0KeYriI1aTgc", "7o37BQqnptuQdS5Caw7aLn"],
  },
];

const NON_LATIN = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

async function fetchPlaylist(id) {
  const response = await fetch(`https://open.spotify.com/embed/playlist/${id}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!response.ok) throw new Error(`Playlist ${id} : HTTP ${response.status}`);
  const html = await response.text();
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
  const entity = match && JSON.parse(match[1]).props?.pageProps?.state?.data?.entity;
  if (!entity?.trackList) throw new Error(`Playlist ${id} : liste de titres introuvable`);
  return entity;
}

function dedupeKey(title, artist) {
  return `${title}|${artist}`
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s*[-([].*$/, "");
}

async function buildCategory(definition) {
  const tracks = [];
  const seen = new Set();

  for (const playlistId of definition.playlists) {
    const entity = await fetchPlaylist(playlistId);
    for (const item of entity.trackList) {
      const preview = item.audioPreview?.url;
      if (item.entityType !== "track" || !item.isPlayable) continue;
      if (!preview || !PREVIEW_PATTERN.test(preview)) continue;
      if (definition.latinOnly && (NON_LATIN.test(item.title) || NON_LATIN.test(item.subtitle))) {
        continue;
      }
      const key = dedupeKey(item.title, item.subtitle);
      if (seen.has(item.uri) || seen.has(key)) continue;
      seen.add(item.uri);
      seen.add(key);
      tracks.push({
        uri: item.uri,
        title: item.title,
        artist: item.subtitle,
        durationMs: item.duration,
        preview,
      });
    }
    console.log(`  ${playlistId} · ${entity.name} · ${entity.trackList.length} tracks`);
  }

  return {
    id: definition.id,
    name: definition.name,
    description: definition.description,
    guess: definition.guess ?? "both",
    sources: definition.playlists.map((id) => `spotify:playlist:${id}`),
    tracks: tracks.slice(0, MAX_TRACKS),
  };
}

/** `{ en: "...", fr: "..." }` rather than JSON, so the generated file reads like the rest. */
function localized(text) {
  return `{ en: ${JSON.stringify(text.en)}, fr: ${JSON.stringify(text.fr)} }`;
}

function render(categories) {
  const lines = [
    "// Track lists generated by packages/database/scripts/generate-blindtest-presets.mjs: do not edit",
    `// them by hand. Last generation: ${new Date().toISOString().slice(0, 10)}. The 17 category names and descriptions below are`,
    "// written by hand in both languages, since only they are ever read out to a player.",
    "",
    'import type { BlindtestPresetCategory } from "../schemas/blindtest";',
    'import type { LocalizedText } from "./localized";',
    "",
    "/** A preset category names itself in the reader's language; a custom playlist only has one name. */",
    "export interface BlindtestPresetCategoryDefinition",
    '  extends Omit<BlindtestPresetCategory, "name" | "description"> {',
    "  name: LocalizedText;",
    "  description: LocalizedText;",
    "}",
    "",
    "export const BLINDTEST_PRESET_CATEGORIES: readonly BlindtestPresetCategoryDefinition[] = [",
  ];

  for (const category of categories) {
    lines.push(
      "  {",
      `    id: ${JSON.stringify(category.id)},`,
      `    name: ${localized(category.name)},`,
      `    description: ${localized(category.description)},`,
      `    guess: ${JSON.stringify(category.guess)},`,
      `    sources: ${JSON.stringify(category.sources)},`,
      "    tracks: [",
      ...category.tracks.map(
        (track) =>
          `      { uri: ${JSON.stringify(track.uri)}, title: ${JSON.stringify(track.title)}, artist: ${JSON.stringify(track.artist)}, durationMs: ${track.durationMs}, preview: ${JSON.stringify(track.preview)} },`,
      ),
      "    ],",
      "  },",
    );
  }

  lines.push("];", "");
  return lines.join("\n");
}

const categories = [];
for (const definition of CATEGORIES) {
  console.log(`${definition.name.fr}`);
  const category = await buildCategory(definition);
  console.log(`  -> ${category.tracks.length} tracks kept`);
  categories.push(category);
}

writeFileSync(OUTPUT, render(categories));
console.log(`\n${categories.length} categories written to ${OUTPUT}`);
