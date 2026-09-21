import {
  addAdventureLog,
  parseChapterProgress,
  updateAdventureCharacter,
  type AdventureCharacter,
  type AdventureItem,
  type ChapterProgress,
} from "@gaulia/database";

import { GauliaError } from "../../../../core/errors";
import type { Translator } from "../../../../i18n";
import { itemLabel } from "../../data/items";
import { familyLabel } from "../../data/monsters";
import {
  ACTS,
  actIntro,
  actTitle,
  chapterTitle,
  findChapter,
  objectiveKey,
  requireAct,
  TOTAL_CHAPTERS,
  type ChapterDefinition,
  type ChapterObjective,
} from "../../data/story";
import { findZone, zoneName } from "../../data/zones";
import { grantXp } from "../character/progressionService";
import type { GameEvent } from "../events/gameEvents";
import { grantItems } from "../inventory/inventoryService";

export interface ObjectiveStatus {
  objective: ChapterObjective;
  label: string;
  progress: number;
  done: boolean;
}

export interface ChapterStatus {
  chapter: ChapterDefinition;
  actTitle: string;
  actEmoji: string;
  objectives: ObjectiveStatus[];
  levelReached: boolean;
  echoesReached: boolean;
  /** True when all that is left is sealing the chapter. */
  ready: boolean;
  /** Number of the chapter across the whole story (1 to TOTAL_CHAPTERS). */
  overallIndex: number;
}

/**
 * Label of an objective. A chapter may carry its own wording, which the catalog holds under the
 * chapter id; otherwise a generic label is built from the objective type.
 */
export function objectiveLabel(
  objective: ChapterObjective,
  chapterId: string,
  t: Translator,
): string {
  const custom = `adventure.story.chapters.${chapterId}.objectives.${objectiveKey(objective)}`;
  if (t.has(custom)) return t(custom);
  if (objective.label) return objective.label;

  const target = objective.target;

  switch (objective.type) {
    case "EXPLORE": {
      const zone = objective.zoneId ? findZone(objective.zoneId) : undefined;
      return zone
        ? t("adventure.story.objectives.exploreZone", {
            target,
            zone: `${zone.emoji} ${zoneName(t, zone)}`,
          })
        : t("adventure.story.objectives.explore", { target });
    }
    case "DEFEAT_FAMILY":
      return objective.family
        ? t("adventure.story.objectives.defeatFamily", {
            target,
            family: familyLabel(t, objective.family),
          })
        : t("adventure.story.objectives.defeatCreatures", { target });
    case "COLLECT":
      return t("adventure.story.objectives.collect", {
        target,
        item: itemLabel(t, objective.itemId ?? ""),
      });
    case "CRAFT":
      return t("adventure.story.objectives.craft", { target });
    case "DUNGEON":
      return t("adventure.story.objectives.dungeon", { target });
    case "DAILY_SET":
      return t("adventure.story.objectives.dailySet", { target });
    case "SPEND_GOLD":
      return t("adventure.story.objectives.spendGold", { target });
  }
}

function overallIndex(actIndex: number, chapterIndex: number): number {
  return (
    ACTS.slice(0, actIndex).reduce((total, act) => total + act.chapters.length, 0) +
    chapterIndex +
    1
  );
}

/** State of the current chapter, or null when the story is over. */
export function chapterStatus(character: AdventureCharacter, t: Translator): ChapterStatus | null {
  const chapter = findChapter(character.actIndex, character.chapterIndex);
  if (!chapter) return null;

  const act = requireAct(character.actIndex);
  const progress = parseChapterProgress(character.chapterProgress);

  const objectives = chapter.objectives.map((objective) => {
    const value = progress[objectiveKey(objective)] ?? 0;
    return {
      objective,
      label: objectiveLabel(objective, chapter.id, t),
      progress: Math.min(value, objective.target),
      done: value >= objective.target,
    };
  });

  const levelReached = character.level >= chapter.levelRequirement;
  const echoesReached = character.echoes >= chapter.echoCost;

  return {
    chapter,
    actTitle: actTitle(t, act),
    actEmoji: act.emoji,
    objectives,
    levelReached,
    echoesReached,
    ready: objectives.every((entry) => entry.done) && levelReached && echoesReached,
    overallIndex: overallIndex(character.actIndex, character.chapterIndex),
  };
}

/** True when the event moves the objective forward (same filters as the labels). */
function matchesObjective(objective: ChapterObjective, event: GameEvent): boolean {
  switch (objective.type) {
    case "EXPLORE":
      return event.type === "EXPLORE" && (!objective.zoneId || objective.zoneId === event.zoneId);
    case "DEFEAT_FAMILY":
      return event.type === "DEFEAT" && (!objective.family || objective.family === event.family);
    case "COLLECT":
      return event.type === "COLLECT" && objective.itemId === event.itemId;
    case "CRAFT":
      return event.type === "CRAFT";
    case "DUNGEON":
      return event.type === "DUNGEON";
    case "DAILY_SET":
      return event.type === "DAILY_SET";
    case "SPEND_GOLD":
      return event.type === "GOLD_SPENT";
  }
}

/** Reports the events onto the counters of the current chapter, and of that one only. */
export async function applyStoryProgress(
  character: AdventureCharacter,
  events: GameEvent[],
): Promise<AdventureCharacter> {
  const chapter = findChapter(character.actIndex, character.chapterIndex);
  if (!chapter || events.length === 0) return character;

  const progress: ChapterProgress = { ...parseChapterProgress(character.chapterProgress) };
  let changed = false;

  for (const objective of chapter.objectives) {
    const key = objectiveKey(objective);
    const gained = events
      .filter((event) => matchesObjective(objective, event))
      .reduce((total, event) => total + ("amount" in event ? event.amount : 1), 0);

    if (gained > 0) {
      progress[key] = Math.min(objective.target, (progress[key] ?? 0) + gained);
      changed = true;
    }
  }

  return changed
    ? updateAdventureCharacter(character.userId, { chapterProgress: progress })
    : character;
}

export interface SealResult {
  character: AdventureCharacter;
  chapter: ChapterDefinition;
  /** Next chapter, null when the story has just ended. */
  next: ChapterStatus | null;
  /** Zone opened by moving to the next act, when there is one. */
  unlockedZone: string | null;
  notices: string[];
}

/**
 * Seals the current chapter: checks objectives, level and echo shards, pays the cost, hands out
 * the rewards and moves the story on (by one chapter, or one act with its new zone).
 */
export async function sealChapter(
  character: AdventureCharacter,
  items: AdventureItem[],
  t: Translator,
): Promise<SealResult> {
  const status = chapterStatus(character, t);
  if (!status) throw new GauliaError("adventure.error.storyOver");

  const pending = status.objectives.filter((entry) => !entry.done);
  if (pending.length > 0) {
    throw new GauliaError("adventure.error.objectivesLeft", {
      objectives: pending.map((entry) => entry.label).join(", "),
    });
  }
  if (!status.levelReached) {
    throw new GauliaError("adventure.error.chapterLevel", {
      required: status.chapter.levelRequirement,
      current: character.level,
    });
  }
  if (!status.echoesReached) {
    throw new GauliaError("adventure.error.chapterEchoes", {
      required: status.chapter.echoCost,
      current: character.echoes,
    });
  }

  const { chapter } = status;
  const act = requireAct(character.actIndex);
  const lastChapter = character.chapterIndex + 1 >= act.chapters.length;
  const lastAct = character.actIndex + 1 >= ACTS.length;
  const notices: string[] = [];

  if (chapter.reward.items?.length) await grantItems(character.userId, chapter.reward.items);

  let updated = await updateAdventureCharacter(character.userId, {
    echoes: character.echoes - chapter.echoCost,
    gold: character.gold + chapter.reward.gold,
    chapterProgress: {},
    actIndex: lastChapter && !lastAct ? character.actIndex + 1 : character.actIndex,
    chapterIndex: lastChapter ? (lastAct ? character.chapterIndex : 0) : character.chapterIndex + 1,
    storyEndedAt: lastChapter && lastAct ? new Date() : character.storyEndedAt,
  });

  updated = (await grantXp(updated, items, chapter.reward.xp)).character;

  // The journal is read by the player first, so it is written in their language.
  await addAdventureLog({
    userId: character.userId,
    type: "STORY",
    message: t("adventure.logs.chapter", {
      title: chapterTitle(t, chapter),
      index: status.overallIndex,
      total: TOTAL_CHAPTERS,
    }),
  });

  let unlockedZone: string | null = null;
  if (lastChapter && !lastAct) {
    const nextAct = requireAct(updated.actIndex);
    unlockedZone = nextAct.zoneId;
    notices.push(
      t("adventure.notices.newAct", {
        emoji: nextAct.emoji,
        act: actTitle(t, nextAct),
        intro: actIntro(t, nextAct),
      }),
    );
    const zone = findZone(nextAct.zoneId);
    if (zone) {
      notices.push(t("adventure.notices.newZone", { emoji: zone.emoji, zone: zoneName(t, zone) }));
    }
  }
  if (lastChapter && lastAct) {
    notices.push(t("adventure.notices.storyEnd"));
  }

  return {
    character: updated,
    chapter,
    next: chapterStatus(updated, t),
    unlockedZone,
    notices,
  };
}

/** Overall progress, for the character sheet and the admin panel. */
export function storyProgressRatio(character: AdventureCharacter): number {
  if (character.storyEndedAt) return 1;
  return (overallIndex(character.actIndex, character.chapterIndex) - 1) / TOTAL_CHAPTERS;
}
