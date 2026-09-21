import {
  getAdventureRank,
  listAdventureAchievements,
  listAdventureLogs,
  listTopAdventurers,
} from "@gaulia/database";

import type { V2MessagePayload } from "../../../core/ui/containers";
import type { Translator } from "../../../i18n";
import { achievementDescription, achievementName, ACHIEVEMENTS } from "../data/achievements";
import { zonesForAct } from "../data/zones";
import { requireCharacter, touchPlayed } from "../services/character/characterService";
import { dungeonStatus } from "../services/dungeon/dungeonService";
import { listTrades } from "../services/economy/tradeService";
import { describeInventory } from "../services/inventory/inventoryService";
import { currentTitle } from "../services/progress/achievementService";
import { ensureQuestSets } from "../services/progress/questService";
import { chapterStatus } from "../services/progress/storyService";
import { achievementsView, leaderboardView, mapView, profileView } from "./characterViews";
import { forgeView, inventoryView, shopView } from "./economyViews";
import { dungeonStatusView } from "./exploreViews";
import type { AdventureView } from "./navigation";
import { journalView, questsView, storyView } from "./progressViews";
import { tradeListView } from "./tradeViews";

const LEADERBOARD_SIZE = 10;
const JOURNAL_SIZE = 15;

/**
 * Renders any browsable view of the module. Subcommands and navigation buttons all go through
 * here: a view exists only once, whether it is reached by typing `/adventure profile` or by
 * clicking "Profile" from the map.
 */
export async function renderAdventureView(
  user: { id: string; username: string },
  view: AdventureView,
  t: Translator,
): Promise<V2MessagePayload> {
  const context = await requireCharacter(user.id);
  const { character } = await touchPlayed(context.character, user.username);
  const items = context.items;

  switch (view) {
    case "profile":
      return profileView(character, items, t, {
        title: await currentTitle(character.userId, t),
        rank: await getAdventureRank(character),
        chapter: chapterStatus(character, t),
      });

    case "bag":
      return inventoryView(character, describeInventory(items), t);

    case "map":
      return mapView(character, zonesForAct(character.actIndex), t);

    case "story":
      return storyView(character, chapterStatus(character, t), t);

    case "quests":
      return questsView(character, await ensureQuestSets(character, t), t);

    case "shop":
      return shopView(character, t);

    case "forge":
      return forgeView(character, items, t);

    case "dungeon":
      return dungeonStatusView(character, dungeonStatus(character), t);

    case "trades":
      return tradeListView(character.userId, await listTrades(character.userId), t);

    case "leaderboard":
      return leaderboardView(await listTopAdventurers(LEADERBOARD_SIZE), t, {
        userId: character.userId,
        rank: await getAdventureRank(character),
      });

    case "achievements": {
      const unlockedIds = new Set(
        (await listAdventureAchievements(character.userId)).map((entry) => entry.achievementId),
      );
      const row = (id: string, emoji: string) => ({
        emoji,
        name: achievementName(t, id),
        description: achievementDescription(t, id),
      });
      return achievementsView(
        character.userId,
        t,
        ACHIEVEMENTS.filter((entry) => unlockedIds.has(entry.id)).map((entry) =>
          row(entry.id, entry.emoji),
        ),
        ACHIEVEMENTS.filter((entry) => !unlockedIds.has(entry.id)).map((entry) =>
          row(entry.id, entry.emoji),
        ),
      );
    }

    case "journal":
      return journalView(character, await listAdventureLogs(character.userId, JOURNAL_SIZE), t);
  }
}
