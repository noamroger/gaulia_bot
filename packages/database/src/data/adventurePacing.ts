/**
 * Équilibrage central de l'aventure. Tout ce qui décide du rythme de la partie est ici, pour que
 * régler la durée de vie du jeu ne demande jamais de toucher aux services.
 *
 * Objectif de rythme : terminer le scénario demande **au moins un an** sans être une corvée.
 * Deux verrous indépendants s'en chargent :
 *
 * 1. L'énergie borne le nombre d'explorations par jour (32 au maximum absolu, ≈ 24 pour un joueur
 *    qui passe deux ou trois fois par jour). Avec la courbe ci-dessous, le niveau 100 demande
 *    ≈ 3,4 M d'XP : ≈ 8 mois pour un acharné, ≈ 10 mois en rythme régulier.
 * 2. Les fragments d'écho, qui scellent les chapitres, ne s'obtiennent qu'en temps réel : un lot
 *    de quêtes quotidiennes (1/jour), un lot hebdomadaire (2/semaine), un donjon (3/semaine) et
 *    quelques trouvailles rares — soit ≈ 14 échos/semaine au mieux, pour un scénario qui en coûte
 *    755. Impossible de descendre sous ≈ 12 mois, même en jouant parfaitement.
 *
 * Le second verrou est celui qui garantit la durée : il ne récompense pas le bourrinage, seulement
 * la régularité, et laisse le joueur libre de jouer beaucoup ou peu un jour donné. Le premier
 * garde la montée en niveau utile pendant presque toute la traversée du scénario.
 */

/** Énergie : une exploration en coûte une, un donjon davantage. */
export const ADVENTURE_ENERGY_MAX = 20;
export const ADVENTURE_ENERGY_REGEN_MS = 45 * 60_000;
export const ADVENTURE_ENERGY_PER_EXPLORE = 1;
export const ADVENTURE_ENERGY_PER_DUNGEON = 6;

/** Points de vie : régénération hors combat, en part du maximum (soit ≈ 2 h 15 pour tout récupérer). */
export const ADVENTURE_HP_REGEN_MS = 4 * 60_000;
export const ADVENTURE_HP_REGEN_RATIO = 0.03;
/** En dessous de ce seuil de vie, il faut se soigner avant de repartir explorer. */
export const ADVENTURE_HP_EXPLORE_THRESHOLD = 0.15;

export const ADVENTURE_MAX_LEVEL = 100;
/** Points de caractéristique offerts à chaque niveau, à répartir avec `/aventure ameliorer`. */
export const ADVENTURE_STAT_POINTS_PER_LEVEL = 3;

/**
 * Expérience nécessaire pour passer du niveau `level` au suivant. Courbe volontairement douce au
 * début (les premiers niveaux tombent en quelques explorations) et longue à la fin (≈ 5 jours de
 * jeu régulier pour le niveau 100), sans jamais devenir un mur.
 */
export function adventureXpToNextLevel(level: number): number {
  if (level >= ADVENTURE_MAX_LEVEL) return 0;
  return Math.round(63 * level ** 1.45 + 30);
}

/** Expérience d'une exploration réussie, avant bonus de zone et aléa. */
export function adventureBaseExploreXp(level: number): number {
  return Math.round(14 + 2.6 * level);
}

/** Or de base d'une exploration réussie, avant bonus de zone et aléa. */
export function adventureBaseExploreGold(level: number): number {
  return Math.round(8 + 1.6 * level);
}

/** Fragments d'écho accordés par les jalons temporels du jeu. */
export const ADVENTURE_ECHOES_PER_DAILY_SET = 1;
export const ADVENTURE_ECHOES_PER_WEEKLY_SET = 2;
export const ADVENTURE_ECHOES_PER_DUNGEON = 3;
/** Chance qu'une exploration révèle un écho perdu : ≈ 1,8 par semaine en jouant beaucoup. */
export const ADVENTURE_ECHO_FIND_CHANCE = 0.008;

/** Un donjon par semaine : c'est le rendez-vous qui cadence la progression du scénario. */
export const ADVENTURE_DUNGEON_COOLDOWN_MS = 7 * 24 * 3_600_000;

/** Bonus de butin accordé par la série de jours consécutifs, plafonné pour rester accessible. */
export const ADVENTURE_STREAK_BONUS_PER_DAY = 0.02;
export const ADVENTURE_STREAK_BONUS_MAX = 0.3;

/** Cooldown court entre deux explorations : rythme la lecture, sans jamais bloquer une session. */
export const ADVENTURE_EXPLORE_COOLDOWN_SECONDS = 8;

/** Progression après un gain d'expérience, sans effet de bord : partagée par le bot et l'API. */
export interface AdventureXpResult {
  level: number;
  xp: number;
  totalXp: number;
  statPoints: number;
  levelsGained: number;
}

/**
 * Applique un gain d'expérience et enchaîne les passages de niveau. Le panel admin s'en sert pour
 * offrir de l'expérience exactement comme le jeu la distribue.
 */
export function applyAdventureXp(
  current: { level: number; xp: number; totalXp: number; statPoints: number },
  amount: number,
): AdventureXpResult {
  let { level, xp, statPoints } = current;
  let levelsGained = 0;

  xp += Math.max(0, amount);

  while (level < ADVENTURE_MAX_LEVEL) {
    const needed = adventureXpToNextLevel(level);
    if (xp < needed) break;
    xp -= needed;
    level += 1;
    statPoints += ADVENTURE_STAT_POINTS_PER_LEVEL;
    levelsGained += 1;
  }

  // Niveau maximum : l'expérience excédentaire n'est plus accumulée dans la barre.
  if (level >= ADVENTURE_MAX_LEVEL) xp = 0;

  return { level, xp, totalXp: current.totalXp + Math.max(0, amount), statPoints, levelsGained };
}
