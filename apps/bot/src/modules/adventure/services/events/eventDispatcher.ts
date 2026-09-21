import type { AdventureCharacter, AdventureItem } from "@gaulia/database";

import type { Translator } from "../../../../i18n";
import { checkAchievements } from "../progress/achievementService";
import { applyQuestProgress } from "../progress/questService";
import { applyStoryProgress } from "../progress/storyService";
import type { GameEvent } from "./gameEvents";

export interface DispatchResult {
  character: AdventureCharacter;
  /** Lines to show under the result of the action (quests, achievements). */
  notices: string[];
}

/**
 * Single hop after an action: the events feed the current chapter, then the quests, then the
 * achievements. A new action only has to produce its events and call this, knowing nothing about
 * the story or the quests.
 */
export async function dispatchGameEvents(
  character: AdventureCharacter,
  items: AdventureItem[],
  events: GameEvent[],
  t: Translator,
): Promise<DispatchResult> {
  let current = await applyStoryProgress(character, events);

  const quests = await applyQuestProgress(current, items, events, t);
  current = quests.character;

  // A completed quest set is itself a story event (the "DAILY_SET" objective).
  if (quests.events.length > 0) {
    current = await applyStoryProgress(current, quests.events);
  }

  const achievements = await checkAchievements(current, t);
  return { character: current, notices: [...quests.notices, ...achievements] };
}
