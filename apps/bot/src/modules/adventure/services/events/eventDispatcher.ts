import type { AdventureCharacter, AdventureItem } from "@gaulia/database";

import { checkAchievements } from "../progress/achievementService";
import { applyQuestProgress } from "../progress/questService";
import { applyStoryProgress } from "../progress/storyService";
import type { GameEvent } from "./gameEvents";

export interface DispatchResult {
  character: AdventureCharacter;
  /** Lignes à afficher sous le résultat de l'action (quêtes, hauts faits). */
  notices: string[];
}

/**
 * Point de passage unique après une action : les évènements alimentent le chapitre en cours, les
 * quêtes, puis les hauts faits. Une nouvelle action n'a donc qu'à produire ses évènements et
 * appeler cette fonction - elle n'a rien à connaître du scénario ni des quêtes.
 */
export async function dispatchGameEvents(
  character: AdventureCharacter,
  items: AdventureItem[],
  events: GameEvent[],
): Promise<DispatchResult> {
  let current = await applyStoryProgress(character, events);

  const quests = await applyQuestProgress(current, items, events);
  current = quests.character;

  // Un lot de quêtes terminé est lui-même un évènement de scénario (objectif « DAILY_SET »).
  if (quests.events.length > 0) {
    current = await applyStoryProgress(current, quests.events);
  }

  const achievements = await checkAchievements(current);
  return { character: current, notices: [...quests.notices, ...achievements] };
}
