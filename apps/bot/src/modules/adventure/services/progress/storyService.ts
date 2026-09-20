import {
  addAdventureLog,
  parseChapterProgress,
  updateAdventureCharacter,
  type AdventureCharacter,
  type AdventureItem,
  type ChapterProgress,
} from "@gaulia/database";

import { GauliaError } from "../../../../core/errors";
import { itemLabel } from "../../data/items";
import { MONSTER_FAMILY_LABELS } from "../../data/monsters";
import {
  ACTS,
  findChapter,
  objectiveKey,
  requireAct,
  TOTAL_CHAPTERS,
  type ChapterDefinition,
  type ChapterObjective,
} from "../../data/story";
import { findZone } from "../../data/zones";
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
  /** Vrai quand il ne reste plus qu'à sceller le chapitre. */
  ready: boolean;
  /** Numéro du chapitre dans l'ensemble du scénario (1 → TOTAL_CHAPTERS). */
  overallIndex: number;
}

/** Libellé par défaut d'un objectif, quand le chapitre n'en impose pas un plus scénarisé. */
export function objectiveLabel(objective: ChapterObjective): string {
  if (objective.label) return objective.label;

  switch (objective.type) {
    case "EXPLORE": {
      const zone = objective.zoneId ? findZone(objective.zoneId) : undefined;
      return `Explorer ${objective.target} fois${zone ? ` - ${zone.emoji} ${zone.name}` : ""}`;
    }
    case "DEFEAT_FAMILY":
      return `Vaincre ${objective.target} ${objective.family ? MONSTER_FAMILY_LABELS[objective.family] : "créatures"}`;
    case "COLLECT":
      return `Rapporter ${objective.target} × ${itemLabel(objective.itemId ?? "")}`;
    case "CRAFT":
      return `Forger ${objective.target} objet(s)`;
    case "DUNGEON":
      return `Terminer ${objective.target} donjon(s)`;
    case "DAILY_SET":
      return `Compléter ${objective.target} lot(s) de quêtes quotidiennes`;
    case "SPEND_GOLD":
      return `Dépenser ${objective.target} pièces`;
  }
}

function overallIndex(actIndex: number, chapterIndex: number): number {
  return (
    ACTS.slice(0, actIndex).reduce((total, act) => total + act.chapters.length, 0) +
    chapterIndex +
    1
  );
}

/** État du chapitre courant, ou null quand le scénario est terminé. */
export function chapterStatus(character: AdventureCharacter): ChapterStatus | null {
  const chapter = findChapter(character.actIndex, character.chapterIndex);
  if (!chapter) return null;

  const act = requireAct(character.actIndex);
  const progress = parseChapterProgress(character.chapterProgress);

  const objectives = chapter.objectives.map((objective) => {
    const value = progress[objectiveKey(objective)] ?? 0;
    return {
      objective,
      label: objectiveLabel(objective),
      progress: Math.min(value, objective.target),
      done: value >= objective.target,
    };
  });

  const levelReached = character.level >= chapter.levelRequirement;
  const echoesReached = character.echoes >= chapter.echoCost;

  return {
    chapter,
    actTitle: act.title,
    actEmoji: act.emoji,
    objectives,
    levelReached,
    echoesReached,
    ready: objectives.every((entry) => entry.done) && levelReached && echoesReached,
    overallIndex: overallIndex(character.actIndex, character.chapterIndex),
  };
}

/** Vrai si l'évènement fait avancer l'objectif (mêmes filtres que les libellés). */
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

/** Reporte les évènements sur les compteurs du chapitre courant (et sur lui seul). */
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
  /** Chapitre suivant, null si le scénario vient de se terminer. */
  next: ChapterStatus | null;
  /** Zone ouverte par le passage à l'acte suivant, le cas échéant. */
  unlockedZone: string | null;
  notices: string[];
}

/**
 * Scelle le chapitre courant : vérifie objectifs, niveau et fragments d'écho, paie le coût, verse
 * les récompenses et fait avancer l'histoire (d'un chapitre, ou d'un acte avec sa nouvelle zone).
 */
export async function sealChapter(
  character: AdventureCharacter,
  items: AdventureItem[],
): Promise<SealResult> {
  const status = chapterStatus(character);
  if (!status) throw new GauliaError("Ton histoire est déjà terminée. Les Terres se reposent.");

  const pending = status.objectives.filter((entry) => !entry.done);
  if (pending.length > 0) {
    throw new GauliaError(
      `Il te reste à accomplir : ${pending.map((entry) => entry.label).join(", ")}.`,
    );
  }
  if (!status.levelReached) {
    throw new GauliaError(
      `Ce chapitre demande le niveau ${status.chapter.levelRequirement} (tu es niveau ${character.level}).`,
    );
  }
  if (!status.echoesReached) {
    throw new GauliaError(
      `Il te faut ${status.chapter.echoCost} fragments d'écho pour sceller ce chapitre (tu en as ${character.echoes}).`,
    );
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

  await addAdventureLog({
    userId: character.userId,
    type: "STORY",
    message: `Chapitre scellé : ${chapter.title} (${status.overallIndex}/${TOTAL_CHAPTERS})`,
  });

  let unlockedZone: string | null = null;
  if (lastChapter && !lastAct) {
    const nextAct = requireAct(updated.actIndex);
    unlockedZone = nextAct.zoneId;
    notices.push(`${nextAct.emoji} **${nextAct.title}** commence. ${nextAct.intro}`);
    const zone = findZone(nextAct.zoneId);
    if (zone) notices.push(`🗺️ Nouvelle région ouverte : ${zone.emoji} **${zone.name}**.`);
  }
  if (lastChapter && lastAct) {
    notices.push(
      "🏆 **Les Terres se taisent.** Tu as entendu la dernière voix : ton histoire est complète.",
    );
  }

  return { character: updated, chapter, next: chapterStatus(updated), unlockedZone, notices };
}

/** Avancement global, pour la fiche de personnage et le panel admin. */
export function storyProgressRatio(character: AdventureCharacter): number {
  if (character.storyEndedAt) return 1;
  return (overallIndex(character.actIndex, character.chapterIndex) - 1) / TOTAL_CHAPTERS;
}
