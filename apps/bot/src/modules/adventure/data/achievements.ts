import type { AdventureCharacter } from "@gaulia/database";

/**
 * Hauts faits. Chaque entrée est évaluée après une action de jeu sur l'état du personnage, ce qui
 * évite tout compteur dédié : ajouter un haut fait ne demande qu'une condition ici.
 */
export interface AchievementDefinition {
  id: string;
  name: string;
  emoji: string;
  description: string;
  /** Titre décerné avec le haut fait, affiché sur la fiche du personnage. */
  title?: string;
  unlocked: (character: AdventureCharacter) => boolean;
}

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  {
    id: "premier-pas",
    name: "Premiers pas",
    emoji: "👣",
    description: "Explorer pour la première fois.",
    unlocked: (c) => c.explorations >= 1,
  },
  {
    id: "marcheur",
    name: "Marcheur",
    emoji: "🥾",
    description: "Explorer 100 fois.",
    unlocked: (c) => c.explorations >= 100,
  },
  {
    id: "arpenteur",
    name: "Arpenteur",
    emoji: "🗺️",
    description: "Explorer 1 000 fois.",
    title: "l'Arpenteur",
    unlocked: (c) => c.explorations >= 1_000,
  },
  {
    id: "infatigable",
    name: "Infatigable",
    emoji: "♾️",
    description: "Explorer 5 000 fois.",
    title: "l'Infatigable",
    unlocked: (c) => c.explorations >= 5_000,
  },
  {
    id: "premier-sang",
    name: "Premier sang",
    emoji: "🩸",
    description: "Remporter un premier combat.",
    unlocked: (c) => c.victories >= 1,
  },
  {
    id: "chasseur",
    name: "Chasseur",
    emoji: "🏹",
    description: "Remporter 250 combats.",
    unlocked: (c) => c.victories >= 250,
  },
  {
    id: "fleau",
    name: "Fléau des Terres",
    emoji: "⚔️",
    description: "Remporter 2 500 combats.",
    title: "le Fléau",
    unlocked: (c) => c.victories >= 2_500,
  },
  {
    id: "tombe-debout",
    name: "Tombé, relevé",
    emoji: "🤕",
    description: "Perdre un combat et repartir quand même.",
    unlocked: (c) => c.defeats >= 1,
  },
  {
    id: "niveau-10",
    name: "Aguerri",
    emoji: "🔟",
    description: "Atteindre le niveau 10.",
    unlocked: (c) => c.level >= 10,
  },
  {
    id: "niveau-25",
    name: "Vétéran",
    emoji: "🎖️",
    description: "Atteindre le niveau 25.",
    unlocked: (c) => c.level >= 25,
  },
  {
    id: "niveau-50",
    name: "Héros des Terres",
    emoji: "🏅",
    description: "Atteindre le niveau 50.",
    title: "le Héros",
    unlocked: (c) => c.level >= 50,
  },
  {
    id: "niveau-75",
    name: "Légende vivante",
    emoji: "🌟",
    description: "Atteindre le niveau 75.",
    unlocked: (c) => c.level >= 75,
  },
  {
    id: "niveau-100",
    name: "Au sommet",
    emoji: "👑",
    description: "Atteindre le niveau 100.",
    title: "le Souverain",
    unlocked: (c) => c.level >= 100,
  },
  {
    id: "premier-donjon",
    name: "Briseur de portes",
    emoji: "🚪",
    description: "Terminer un premier donjon.",
    unlocked: (c) => c.dungeonClears >= 1,
  },
  {
    id: "donjons-10",
    name: "Habitué des profondeurs",
    emoji: "🕯️",
    description: "Terminer 10 donjons.",
    unlocked: (c) => c.dungeonClears >= 10,
  },
  {
    id: "donjons-30",
    name: "Gardien des gardiens",
    emoji: "🗝️",
    description: "Terminer 30 donjons.",
    title: "le Briseur",
    unlocked: (c) => c.dungeonClears >= 30,
  },
  {
    id: "serie-7",
    name: "Une semaine entière",
    emoji: "📅",
    description: "Tenir une série de 7 jours.",
    unlocked: (c) => c.bestStreak >= 7,
  },
  {
    id: "serie-30",
    name: "Un mois sans faillir",
    emoji: "🗓️",
    description: "Tenir une série de 30 jours.",
    unlocked: (c) => c.bestStreak >= 30,
  },
  {
    id: "serie-180",
    name: "Une demi-année",
    emoji: "🔥",
    description: "Tenir une série de 180 jours.",
    title: "le Constant",
    unlocked: (c) => c.bestStreak >= 180,
  },
  {
    id: "riche",
    name: "Petite fortune",
    emoji: "💰",
    description: "Posséder 100 000 pièces.",
    unlocked: (c) => c.gold >= 100_000,
  },
  {
    id: "acte-3",
    name: "Sous la nécropole",
    emoji: "⚒️",
    description: "Atteindre l'acte III.",
    unlocked: (c) => c.actIndex >= 2,
  },
  {
    id: "acte-5",
    name: "Au bord du monde",
    emoji: "🌊",
    description: "Atteindre l'acte V.",
    unlocked: (c) => c.actIndex >= 4,
  },
  {
    id: "acte-7",
    name: "Le cœur des Terres",
    emoji: "✨",
    description: "Atteindre l'acte VII.",
    title: "l'Écouteur",
    unlocked: (c) => c.actIndex >= 6,
  },
  {
    id: "forgeron",
    name: "Main de forgeron",
    emoji: "🔨",
    description: "Renforcer une pièce d'équipement.",
    unlocked: (c) => c.upgrades >= 1,
  },
  {
    id: "maitre-forge",
    name: "Maître de forge",
    emoji: "⚒️",
    description: "Mener 25 renforcements à terme.",
    title: "le Forgeron",
    unlocked: (c) => c.upgrades >= 25,
  },
  {
    id: "marchand",
    name: "Premier marché",
    emoji: "🤝",
    description: "Conclure un échange avec un autre aventurier.",
    unlocked: (c) => c.trades >= 1,
  },
  {
    id: "caravanier",
    name: "Caravanier",
    emoji: "🐪",
    description: "Conclure 50 échanges.",
    title: "le Caravanier",
    unlocked: (c) => c.trades >= 50,
  },
  {
    id: "fin",
    name: "La dernière voix",
    emoji: "🏆",
    description: "Terminer le scénario.",
    title: "l'Écho",
    unlocked: (c) => c.storyEndedAt !== null,
  },
] as const;

export function findAchievement(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((achievement) => achievement.id === id);
}
