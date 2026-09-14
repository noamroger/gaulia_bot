// Génère src/modules/fun/data/blindtestCategories.ts à partir de playlists Spotify publiques.
// Les titres sont lus sur la page d'intégration (open.spotify.com/embed), sans compte ni clé d'API.
// Pour ajouter une catégorie : ajoute une entrée dans CATEGORIES, puis lance
// `npm run blindtest:categories -w apps/bot`.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUTPUT = join(
  dirname(fileURLToPath(import.meta.url)),
  "../src/modules/fun/data/blindtestCategories.ts",
);
const MAX_TRACKS = 150;

/**
 * guess : "both" = points pour le titre et l'artiste ; "title" = titre seulement (reprises).
 * latinOnly : écarte les titres impossibles à taper au clavier (japonais, coréen…).
 */
const CATEGORIES = [
  {
    id: "hits-du-moment",
    name: "Hits du moment",
    description: "Les titres les plus écoutés en France et dans le monde.",
    playlists: ["37i9dQZEVXbIPWwFssbupI", "37i9dQZF1DXcBWIGoYBM5M"],
  },
  {
    id: "annees-70",
    name: "Années 70",
    description: "Disco, rock et pop des années 70.",
    playlists: ["37i9dQZF1DWTJ7xPn4vNaz"],
  },
  {
    id: "annees-80",
    name: "Années 80",
    description: "Les tubes incontournables des années 80.",
    playlists: ["37i9dQZF1DX4UtSsGT1Sbe"],
  },
  {
    id: "annees-90",
    name: "Années 90",
    description: "Pop, eurodance et rock des années 90.",
    playlists: ["37i9dQZF1DXbTxeAdrVG2l"],
  },
  {
    id: "annees-2000",
    name: "Années 2000",
    description: "Les hits qui ont marqué les années 2000.",
    playlists: ["37i9dQZF1DX4o1oenSJRJd"],
  },
  {
    id: "annees-2010",
    name: "Années 2010",
    description: "Les plus gros succès des années 2010.",
    playlists: ["37i9dQZF1DX5Ejj0EkURtP"],
  },
  {
    id: "chanson-francaise",
    name: "Chanson française",
    description: "Les grands classiques de la chanson française.",
    playlists: ["7aUI6OUkeXotPRLPvN9IV6", "2NOoAnESsilnOLTpP4OXrA"],
  },
  {
    id: "rap-fr-classiques",
    name: "Rap français classique",
    description: "Les classiques du rap français des années 90 et 2000.",
    playlists: ["5sdOHvsmAwUZc4osRLTQi1"],
  },
  {
    id: "rap-fr-actuel",
    name: "Rap français actuel",
    description: "Le rap français du moment.",
    playlists: ["3aj8I39Ok1hAmzRDJ0KYPH"],
  },
  {
    id: "rap-us",
    name: "Rap US",
    description: "Le meilleur du rap américain actuel.",
    playlists: ["37i9dQZF1DX0XUsuxWHRQd"],
  },
  {
    id: "rock",
    name: "Rock classique",
    description: "Les monuments du rock.",
    playlists: ["37i9dQZF1DWXRqgorJj26U"],
  },
  {
    id: "tubes-a-chanter",
    name: "Tubes à chanter",
    description: "Les refrains que tout le monde connaît par cœur.",
    playlists: ["37i9dQZF1DWWMOmoXKqHTD"],
  },
  {
    id: "disney",
    name: "Disney (VF)",
    description: "Les chansons des films Disney en français.",
    playlists: ["37i9dQZF1DWYa24lU2SeaC", "29wcS6GWqMPIpmpygGDGdc"],
  },
  {
    id: "dessins-animes",
    name: "Génériques de dessins animés",
    description: "Les génériques cultes des dessins animés des années 80 et 90.",
    playlists: ["6wCO4442A2AGcaLBXAxsP7", "0Yyc1bnaisMJtbktGZsONT"],
  },
  {
    id: "films",
    name: "Musiques de films",
    description: "Les bandes originales les plus célèbres du cinéma.",
    playlists: ["37i9dQZF1DX1tz6EDao8it", "2usejAPtDnhOmU9Js6ULkI"],
  },
  {
    id: "anime",
    name: "Openings d'anime",
    description: "Les génériques d'anime les plus écoutés.",
    latinOnly: true,
    playlists: ["6am99i50y1FTHzhKAObN3a", "1x3uqbRRfUv5pUGGjRnA6v"],
  },
  {
    id: "jeux-video",
    name: "Jeux vidéo",
    description: "Les thèmes cultes du jeu vidéo : trouve le titre ou le jeu.",
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
    .replace(/\s*[-(\[].*$/, "");
}

async function buildCategory(definition) {
  const tracks = [];
  const seen = new Set();

  for (const playlistId of definition.playlists) {
    const entity = await fetchPlaylist(playlistId);
    for (const item of entity.trackList) {
      const preview = item.audioPreview?.url;
      if (item.entityType !== "track" || !item.isPlayable || !preview) continue;
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
    console.log(`  ${playlistId} · ${entity.name} · ${entity.trackList.length} titres`);
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

function render(categories) {
  const lines = [
    "// Fichier généré par apps/bot/scripts/generate-blindtest-categories.mjs : ne pas modifier à la main.",
    `// Dernière génération : ${new Date().toISOString().slice(0, 10)}.`,
    "",
    "export interface BlindtestTrack {",
    "  uri: string;",
    "  title: string;",
    "  artist: string;",
    "  durationMs: number;",
    "  /** Extrait officiel de 30 secondes fourni par Spotify. */",
    "  preview: string;",
    "}",
    "",
    "export interface BlindtestCategory {",
    "  id: string;",
    "  name: string;",
    "  description: string;",
    '  /** "title" : seul le titre rapporte des points (catégories de reprises). */',
    '  guess: "both" | "title";',
    "  sources: string[];",
    "  tracks: BlindtestTrack[];",
    "}",
    "",
    "export const BLINDTEST_CATEGORIES: readonly BlindtestCategory[] = [",
  ];

  for (const category of categories) {
    lines.push(
      "  {",
      `    id: ${JSON.stringify(category.id)},`,
      `    name: ${JSON.stringify(category.name)},`,
      `    description: ${JSON.stringify(category.description)},`,
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
  console.log(`${definition.name}`);
  const category = await buildCategory(definition);
  console.log(`  -> ${category.tracks.length} titres retenus`);
  categories.push(category);
}

writeFileSync(OUTPUT, render(categories));
console.log(`\n${categories.length} catégories écrites dans ${OUTPUT}`);
