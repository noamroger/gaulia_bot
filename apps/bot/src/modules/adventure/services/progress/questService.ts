import {
  advanceAdventureQuests,
  claimAdventureQuest,
  createAdventureQuests,
  listAdventureQuests,
  updateAdventureCharacter,
  type AdventureCharacter,
  type AdventureItem,
  type AdventureQuest,
  type AdventureQuestKind,
} from "@gaulia/database";

import type { Translator } from "../../../../i18n";
import {
  baseExploreGold,
  baseExploreXp,
  ECHOES_PER_DAILY_SET,
  ECHOES_PER_WEEKLY_SET,
} from "../../data/pacing";
import {
  DAILY_QUEST_COUNT,
  questLabel,
  QUEST_TEMPLATES,
  WEEKLY_QUEST_COUNT,
  type QuestTemplate,
} from "../../data/quests";
import { grantXp } from "../character/progressionService";
import type { GameEvent } from "../events/gameEvents";

const DAY_MS = 24 * 3_600_000;

export interface QuestView {
  row: AdventureQuest;
  template: QuestTemplate;
  label: string;
  done: boolean;
  reward: { xp: number; gold: number };
}

export interface QuestSets {
  daily: QuestView[];
  weekly: QuestView[];
  dailyPeriod: Date;
  weeklyPeriod: Date;
}

/** Start of the UTC day, when the daily quests are renewed. */
export function dailyPeriodStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Start of the UTC week (Monday), for the weekly quests and the dungeon. */
export function weeklyPeriodStart(now: Date): Date {
  const day = dailyPeriodStart(now);
  const weekday = (day.getUTCDay() + 6) % 7;
  return new Date(day.getTime() - weekday * DAY_MS);
}

function roundTarget(template: QuestTemplate): number {
  const span = Math.max(0, template.max - template.min);
  const steps = Math.floor(Math.random() * (span / template.step + 1));
  return template.min + steps * template.step;
}

function drawTemplates(kind: AdventureQuestKind, count: number): QuestTemplate[] {
  const pool = QUEST_TEMPLATES.filter((template) => template.kind === kind);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function questReward(template: QuestTemplate, level: number): { xp: number; gold: number } {
  return {
    xp: Math.round(baseExploreXp(level) * template.xpFactor),
    gold: Math.round(baseExploreGold(level) * template.goldFactor),
  };
}

function toView(row: AdventureQuest, level: number, t: Translator): QuestView | null {
  const template = QUEST_TEMPLATES.find((entry) => entry.id === row.questId);
  if (!template) return null;
  return {
    row,
    template,
    label: questLabel(t, template.id, row.target),
    done: row.claimedAt !== null || row.progress >= row.target,
    reward: questReward(template, level),
  };
}

async function ensureSet(
  character: AdventureCharacter,
  kind: AdventureQuestKind,
  periodStart: Date,
  count: number,
  t: Translator,
): Promise<QuestView[]> {
  let rows = await listAdventureQuests(character.userId, kind, periodStart);

  if (rows.length === 0) {
    await createAdventureQuests(
      character.userId,
      kind,
      periodStart,
      drawTemplates(kind, count).map((template) => ({
        questId: template.id,
        target: roundTarget(template),
      })),
    );
    rows = await listAdventureQuests(character.userId, kind, periodStart);
  }

  return rows.flatMap((row) => {
    const view = toView(row, character.level, t);
    return view ? [view] : [];
  });
}

/** Sets of the day and of the week, drawn on the fly when they do not exist yet. */
export async function ensureQuestSets(
  character: AdventureCharacter,
  t: Translator,
  now = new Date(),
): Promise<QuestSets> {
  const dailyPeriod = dailyPeriodStart(now);
  const weeklyPeriod = weeklyPeriodStart(now);

  const [daily, weekly] = await Promise.all([
    ensureSet(character, "DAILY", dailyPeriod, DAILY_QUEST_COUNT, t),
    ensureSet(character, "WEEKLY", weeklyPeriod, WEEKLY_QUEST_COUNT, t),
  ]);

  return { daily, weekly, dailyPeriod, weeklyPeriod };
}

/** Quests the event moves forward, and by how much. */
function matchingQuestIds(event: GameEvent): { questIds: string[]; amount: number } {
  const questIds = QUEST_TEMPLATES.filter((template) => {
    if (template.match.type !== event.type) return false;
    if (
      template.match.family &&
      (event.type !== "DEFEAT" || event.family !== template.match.family)
    ) {
      return false;
    }
    return true;
  }).map((template) => template.id);

  return { questIds, amount: "amount" in event ? event.amount : 1 };
}

export interface QuestOutcome {
  character: AdventureCharacter;
  notices: string[];
  /** Events produced by the quests themselves (daily set completed). */
  events: GameEvent[];
}

/**
 * Moves the quests the events touch, then closes and rewards the ones that reach their objective,
 * so there is no claim command to forget. Completing a whole set also grants echo shards, which
 * move the story forward.
 */
export async function applyQuestProgress(
  character: AdventureCharacter,
  items: AdventureItem[],
  events: GameEvent[],
  t: Translator,
  now = new Date(),
): Promise<QuestOutcome> {
  const sets = await ensureQuestSets(character, t, now);
  const periods: { kind: AdventureQuestKind; periodStart: Date }[] = [
    { kind: "DAILY", periodStart: sets.dailyPeriod },
    { kind: "WEEKLY", periodStart: sets.weeklyPeriod },
  ];

  for (const event of events) {
    const { questIds, amount } = matchingQuestIds(event);
    await advanceAdventureQuests(character.userId, periods, questIds, amount);
  }

  const refreshed = await ensureQuestSets(character, t, now);
  const notices: string[] = [];
  const produced: GameEvent[] = [];
  let current = character;
  let goldReward = 0;

  for (const view of [...refreshed.daily, ...refreshed.weekly]) {
    if (view.row.claimedAt !== null || view.row.progress < view.row.target) continue;

    await claimAdventureQuest(view.row.id);
    goldReward += view.reward.gold;
    current = (await grantXp(current, items, view.reward.xp)).character;
    notices.push(
      t("adventure.notices.questDone", {
        label: view.label,
        xp: view.reward.xp,
        gold: view.reward.gold,
      }),
    );
  }

  const completedSets = await ensureQuestSets(current, t, now);
  const dailyDone = completedSets.daily.every((view) => view.row.claimedAt !== null);
  const weeklyDone = completedSets.weekly.every((view) => view.row.claimedAt !== null);
  // Shards are only granted at the exact moment a set flips: the state from before the loop acts
  // as the witness, which avoids a dedicated counter in the database.
  let echoes = 0;
  const dailyWasDone = isSetComplete(sets.daily);
  const weeklyWasDone = isSetComplete(sets.weekly);

  if (dailyDone && !dailyWasDone) {
    echoes += ECHOES_PER_DAILY_SET;
    produced.push({ type: "DAILY_SET", amount: 1 });
    notices.push(t("adventure.notices.dailySetDone", { count: ECHOES_PER_DAILY_SET }));
  }
  if (weeklyDone && !weeklyWasDone) {
    echoes += ECHOES_PER_WEEKLY_SET;
    notices.push(t("adventure.notices.weeklySetDone", { count: ECHOES_PER_WEEKLY_SET }));
  }

  if (goldReward > 0 || echoes > 0) {
    current = await updateAdventureCharacter(current.userId, {
      gold: current.gold + goldReward,
      echoes: current.echoes + echoes,
    });
  }

  return { character: current, notices, events: produced };
}

function isSetComplete(views: QuestView[]): boolean {
  return views.length > 0 && views.every((view) => view.row.claimedAt !== null);
}
