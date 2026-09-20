import {
  addAdventureLog,
  listAdventureAchievements,
  unlockAdventureAchievement,
  type AdventureCharacter,
} from "@gaulia/database";

import { ACHIEVEMENTS, findAchievement } from "../../data/achievements";

/** Débloque les hauts faits dont la condition vient d'être remplie et retourne les annonces. */
export async function checkAchievements(character: AdventureCharacter): Promise<string[]> {
  const notices: string[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (!achievement.unlocked(character)) continue;
    if (!(await unlockAdventureAchievement(character.userId, achievement.id))) continue;

    notices.push(`${achievement.emoji} Haut fait débloqué - **${achievement.name}**`);
    await addAdventureLog({
      userId: character.userId,
      type: "LEVEL_UP",
      message: `Haut fait : ${achievement.name}`,
    });
  }

  return notices;
}

/** Titre le plus récemment décerné, affiché sous le nom du personnage. */
export async function currentTitle(userId: string): Promise<string | null> {
  const unlocked = await listAdventureAchievements(userId);
  const titles = unlocked
    .map((entry) => findAchievement(entry.achievementId))
    .filter((entry) => entry?.title);
  return titles.length > 0 ? (titles[titles.length - 1]?.title ?? null) : null;
}
