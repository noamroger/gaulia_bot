/**
 * Vérifie le rythme du module aventure : combien de temps il faut à différents profils de joueurs
 * pour atteindre le niveau maximum et pour réunir les fragments d'écho de tout le scénario.
 *
 *   npm run adventure:pacing -w packages/database
 *
 * À relancer après chaque retouche de `src/data/adventurePacing.ts` ou des coûts de chapitre :
 * l'objectif de design est qu'aucun profil ne termine l'histoire en moins d'un an.
 */
import {
  ADVENTURE_ACTS,
  ADVENTURE_ECHOES_PER_DAILY_SET,
  ADVENTURE_ECHOES_PER_DUNGEON,
  ADVENTURE_ECHOES_PER_WEEKLY_SET,
  ADVENTURE_ECHO_FIND_CHANCE,
  ADVENTURE_ENERGY_MAX,
  ADVENTURE_ENERGY_REGEN_MS,
  ADVENTURE_MAX_LEVEL,
  ADVENTURE_TOTAL_CHAPTERS,
  adventureBaseExploreXp,
  adventureXpToNextLevel,
} from "../src/index";

// Gain moyen d'une exploration : 60 % combat (zone ×1.4, monstre ×1.5), 28 % trouvaille, 12 % calme.
const AVG_FACTOR = 0.6 * 1.4 * 1.5 + 0.28 * 1.4 * 0.6 + 0.12 * 0.35;

function daysToMaxLevel(exploresPerDay: number): number {
  let days = 0;
  let level = 1;
  let xp = 0;
  while (level < ADVENTURE_MAX_LEVEL && days < 5000) {
    xp += exploresPerDay * adventureBaseExploreXp(level) * AVG_FACTOR;
    days += 1;
    let needed = adventureXpToNextLevel(level);
    while (xp >= needed && level < ADVENTURE_MAX_LEVEL) {
      xp -= needed;
      level += 1;
      needed = adventureXpToNextLevel(level);
    }
  }
  return days;
}

const totalEchoes = ADVENTURE_ACTS.reduce(
  (sum, act) => sum + act.chapters.reduce((inner, chapter) => inner + chapter.echoCost, 0),
  0,
);

function weeksOfEchoes(exploresPerDay: number, dailyRate: number, weeklyDone: boolean): number {
  const perWeek =
    ADVENTURE_ECHOES_PER_DAILY_SET * 7 * dailyRate +
    (weeklyDone ? ADVENTURE_ECHOES_PER_WEEKLY_SET + ADVENTURE_ECHOES_PER_DUNGEON : 0) +
    exploresPerDay * 7 * ADVENTURE_ECHO_FIND_CHANCE;
  return totalEchoes / perWeek;
}

const maxPerDay = (24 * 3_600_000) / ADVENTURE_ENERGY_REGEN_MS;
console.log(
  `Énergie : ${ADVENTURE_ENERGY_MAX} max stockée, ${maxPerDay.toFixed(0)} points régénérés par jour`,
);
console.log(
  `Scénario : ${ADVENTURE_TOTAL_CHAPTERS} chapitres, ${totalEchoes} fragments d'écho au total\n`,
);

for (const [label, explores, dailyRate, weekly] of [
  ["acharné   (32 explorations/j, tout fait)", 32, 1, true],
  ["régulier  (24 explorations/j, tout fait)", 24, 1, true],
  ["tranquille (12 explorations/j, 5 lots/7)", 12, 5 / 7, true],
  ["sans donjon (24/j, pas de donjon)", 24, 1, false],
] as const) {
  const levelDays = daysToMaxLevel(explores);
  const echoWeeks = weeksOfEchoes(explores, dailyRate, weekly);
  const total = Math.max(levelDays, echoWeeks * 7);
  console.log(
    `${label} → niveau 100 en ${(levelDays / 30.4).toFixed(1)} mois · échos en ${(echoWeeks / 4.35).toFixed(1)} mois · fin ≈ ${(total / 30.4).toFixed(1)} mois`,
  );
}
