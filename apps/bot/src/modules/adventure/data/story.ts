/**
 * The story is defined in `@gaulia/database`, so the admin panel can show the act and chapter each
 * player reached. It holds both languages, so this file only re-exposes it under the short names
 * the module uses and picks the reader's language.
 */
import {
  localized,
  type AdventureActDefinition,
  type AdventureChapterDefinition,
} from "@gaulia/database";

import type { Translator } from "../../../i18n";

export {
  ADVENTURE_ACTS as ACTS,
  ADVENTURE_TOTAL_CHAPTERS as TOTAL_CHAPTERS,
  adventureObjectiveKey as objectiveKey,
  findAdventureChapter as findChapter,
  requireAdventureAct as requireAct,
  type AdventureActDefinition as ActDefinition,
  type AdventureChapterDefinition as ChapterDefinition,
  type AdventureChapterObjective as ChapterObjective,
  type AdventureChapterReward as ChapterReward,
  type AdventureObjectiveType as ObjectiveType,
} from "@gaulia/database";

export function actTitle(t: Translator, act: AdventureActDefinition): string {
  return localized(act.title, t.locale);
}

export function actIntro(t: Translator, act: AdventureActDefinition): string {
  return localized(act.intro, t.locale);
}

export function chapterTitle(t: Translator, chapter: AdventureChapterDefinition): string {
  return localized(chapter.title, t.locale);
}

export function chapterNarration(t: Translator, chapter: AdventureChapterDefinition): string {
  return localized(chapter.narration, t.locale);
}
