import {
  getAdventureRank,
  listAdventureAchievements,
  listAdventureLogs,
  listTopAdventurers,
} from "@gaulia/database";

import { ACHIEVEMENTS } from "../data/achievements";
import { zonesForAct } from "../data/zones";
import type { V2MessagePayload } from "../../../core/ui/containers";
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
 * Rend n'importe quelle vue « consultable » du module. Les sous-commandes et les boutons de
 * navigation passent tous par ici : une vue n'existe qu'une fois, qu'on y arrive en tapant
 * `/aventure profil` ou en cliquant sur « Profil » depuis la carte.
 */
export async function renderAdventureView(
  user: { id: string; username: string },
  view: AdventureView,
): Promise<V2MessagePayload> {
  const context = await requireCharacter(user.id);
  const { character } = await touchPlayed(context.character, user.username);
  const items = context.items;

  switch (view) {
    case "profil":
      return profileView(character, items, {
        title: await currentTitle(character.userId),
        rank: await getAdventureRank(character),
        chapter: chapterStatus(character),
      });

    case "sac":
      return inventoryView(character, describeInventory(items));

    case "carte":
      return mapView(character, zonesForAct(character.actIndex));

    case "histoire":
      return storyView(character, chapterStatus(character));

    case "quetes":
      return questsView(character, await ensureQuestSets(character));

    case "boutique":
      return shopView(character);

    case "forge":
      return forgeView(character, items);

    case "donjon":
      return dungeonStatusView(character, dungeonStatus(character));

    case "echanges":
      return tradeListView(character.userId, await listTrades(character.userId));

    case "classement":
      return leaderboardView(await listTopAdventurers(LEADERBOARD_SIZE), {
        userId: character.userId,
        rank: await getAdventureRank(character),
      });

    case "hauts-faits": {
      const unlockedIds = new Set(
        (await listAdventureAchievements(character.userId)).map((entry) => entry.achievementId),
      );
      return achievementsView(
        character.userId,
        ACHIEVEMENTS.filter((entry) => unlockedIds.has(entry.id)).map(
          ({ id, emoji, name, description }) => ({ id, emoji, name, description }),
        ),
        ACHIEVEMENTS.filter((entry) => !unlockedIds.has(entry.id)).map(
          ({ emoji, name, description }) => ({ emoji, name, description }),
        ),
      );
    }

    case "journal":
      return journalView(character, await listAdventureLogs(character.userId, JOURNAL_SIZE));
  }
}
