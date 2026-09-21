/**
 * Quest templates live in `@gaulia/database`, so the admin panel can spell out a player's quests.
 * This file re-exposes them under the short names the module uses, and picks the reader's language.
 */
import { adventureQuestLabel, localized } from "@gaulia/database";

import type { Translator } from "../../../i18n";

export {
  ADVENTURE_DAILY_QUEST_COUNT as DAILY_QUEST_COUNT,
  ADVENTURE_QUEST_TEMPLATES as QUEST_TEMPLATES,
  ADVENTURE_WEEKLY_QUEST_COUNT as WEEKLY_QUEST_COUNT,
  type AdventureQuestEventType as QuestEventType,
  type AdventureQuestTemplate as QuestTemplate,
} from "@gaulia/database";

/** Label of a running quest, objective included ("Explore 12 times"). */
export function questLabel(t: Translator, questId: string, target: number): string {
  return localized(adventureQuestLabel(questId, target), t.locale);
}
