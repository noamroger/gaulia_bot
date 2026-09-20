/** Suffixes de version à ignorer dans un titre : « - Remastered 2011 », « (feat. X) »… */
const IGNORED_SEGMENT =
  /remaster|version|\bedit\b|\blive\b|feat|\bwith\b|\bavec\b|\bmix\b|single|g[ée]n[ée]rique|original|score|soundtrack|bande originale|instrumental|acoustic|radio|extended|mono|st[ée]r[ée]o|deluxe|bonus|reprise|cover|motion picture|^\s*\d{4}\s*$/i;
const SOURCE_PREFIX = /^\s*(from|tir[ée]e? de|extrait de|du film)\s+/i;
const GENERIC_WORDS =
  /\b(main |title )?theme\b|\bth[eè]me\b|\bg[ée]n[ée]rique\b|\bopening\b|\bending\b|\bost\b/gi;
const CONNECTORS = /\b(and|et)\b/g;
const LEADING_ARTICLE = /^(the|le|la|les|l|a|an|un|une) /;

export function normalizeAnswer(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(CONNECTORS, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function addCandidate(candidates: Set<string>, value: string): void {
  const normalized = normalizeAnswer(value);
  if (!normalized) return;
  candidates.add(normalized);
  const withoutArticle = normalized.replace(LEADING_ARTICLE, "");
  if (withoutArticle.length >= 2) candidates.add(withoutArticle);
}

/** Réponses acceptées pour un titre : titre principal, et nom de l'œuvre cité entre parenthèses. */
export function titleAnswers(title: string): string[] {
  const candidates = new Set<string>();
  const main = title.split(/\s[-–\u2014]\s|[([]/)[0] ?? title;
  addCandidate(candidates, main);
  addCandidate(candidates, main.replace(GENERIC_WORDS, " "));
  const work = main.match(/\b(?:from|du film)\s+(.{2,})$/i)?.[1];
  if (work) addCandidate(candidates, work);

  const segments = [
    ...[...title.matchAll(/[([]([^)\]]+)[)\]]/g)].map((match) => match[1] ?? ""),
    ...title.split(/\s[-–\u2014]\s/).slice(1),
  ];
  for (const segment of segments) {
    if (IGNORED_SEGMENT.test(segment)) continue;
    const cleaned = segment.replace(SOURCE_PREFIX, "").replace(/["“”«»]/g, "");
    addCandidate(candidates, cleaned);
    addCandidate(candidates, cleaned.replace(GENERIC_WORDS, " "));
  }

  return [...candidates];
}

/** Chaque artiste crédité est une réponse valable, ainsi que le crédit complet. */
export function artistAnswers(artist: string): string[] {
  const candidates = new Set<string>();
  addCandidate(candidates, artist);
  for (const name of artist.split(/,\s*/)) addCandidate(candidates, name);
  return [...candidates];
}

function tolerance(length: number): number {
  if (length <= 4) return 0;
  if (length <= 8) return 1;
  if (length <= 14) return 2;
  return 3;
}

function levenshtein(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j]! + 1, current[j - 1]! + 1, previous[j - 1]! + cost);
    }
    previous = current;
  }
  return previous[b.length]!;
}

function isMatch(guess: string, answer: string): boolean {
  if (guess === answer) return true;
  if (answer.length < 2) return false;

  const words = guess.split(" ");
  const size = answer.split(" ").length;
  const shortGuess = words.length <= size + 2;

  if ((answer.length >= 4 || shortGuess) && ` ${guess} `.includes(` ${answer} `)) return true;

  const maxDistance = tolerance(answer.length);
  if (maxDistance === 0) return false;

  for (let length = Math.max(1, size - 1); length <= size + 1; length++) {
    for (let start = 0; start + length <= words.length; start++) {
      const window = words.slice(start, start + length).join(" ");
      if (levenshtein(window, answer) <= maxDistance) return true;
    }
  }
  return false;
}

/** Vrai si le message contient l'une des réponses, avec une tolérance aux fautes de frappe. */
export function matchesAny(message: string, answers: readonly string[]): boolean {
  const guess = normalizeAnswer(message);
  if (!guess) return false;
  return answers.some((answer) => isMatch(guess, answer));
}
