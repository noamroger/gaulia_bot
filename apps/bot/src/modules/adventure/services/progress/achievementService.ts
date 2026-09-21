import {
  addAdventureLog,
  listAdventureAchievements,
  unlockAdventureAchievement,
  type AdventureCharacter,
} from "@gaulia/database";

import type { Translator } from "../../../../i18n";
import {
  achievementName,
  achievementTitle,
  ACHIEVEMENTS,
  findAchievement,
} from "../../data/achievements";

/** Unlocks the achievements whose condition just became true and returns the announcements. */
export async function checkAchievements(
  character: AdventureCharacter,
  t: Translator,
): Promise<string[]> {
  const notices: string[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (!achievement.unlocked(character)) continue;
    if (!(await unlockAdventureAchievement(character.userId, achievement.id))) continue;

    notices.push(
      t("adventure.notices.achievement", {
        emoji: achievement.emoji,
        name: achievementName(t, achievement.id),
      }),
    );
    // Journal entries are stored and read by the admin panel too: they are written in English.
    await addAdventureLog({
      userId: character.userId,
      type: "LEVEL_UP",
      message: t("adventure.logs.achievement", { name: achievementName(t, achievement.id) }),
    });
  }

  return notices;
}

/** Most recently granted title, shown under the character's name. */
export async function currentTitle(userId: string, t: Translator): Promise<string | null> {
  const unlocked = await listAdventureAchievements(userId);
  const titles = unlocked
    .map((entry) => findAchievement(entry.achievementId))
    .filter((entry) => entry?.grantsTitle);

  const last = titles[titles.length - 1];
  return last ? achievementTitle(t, last.id) : null;
}
