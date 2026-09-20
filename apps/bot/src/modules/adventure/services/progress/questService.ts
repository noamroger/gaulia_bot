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

import {
  baseExploreGold,
  baseExploreXp,
  ECHOES_PER_DAILY_SET,
  ECHOES_PER_WEEKLY_SET,
} from "../../data/pacing";
import {
  DAILY_QUEST_COUNT,
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

/** Début du jour UTC : c'est l'heure de renouvellement des quêtes quotidiennes. */
export function dailyPeriodStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Début de la semaine UTC (lundi), pour les quêtes hebdomadaires et le donjon. */
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

function toView(row: AdventureQuest, level: number): QuestView | null {
  const template = QUEST_TEMPLATES.find((entry) => entry.id === row.questId);
  if (!template) return null;
  return {
    row,
    template,
    label: template.label(row.target),
    done: row.claimedAt !== null || row.progress >= row.target,
    reward: questReward(template, level),
  };
}

async function ensureSet(
  character: AdventureCharacter,
  kind: AdventureQuestKind,
  periodStart: Date,
  count: number,
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
    const view = toView(row, character.level);
    return view ? [view] : [];
  });
}

/** Lots du jour et de la semaine, tirés à la volée s'ils n'existent pas encore. */
export async function ensureQuestSets(
  character: AdventureCharacter,
  now = new Date(),
): Promise<QuestSets> {
  const dailyPeriod = dailyPeriodStart(now);
  const weeklyPeriod = weeklyPeriodStart(now);

  const [daily, weekly] = await Promise.all([
    ensureSet(character, "DAILY", dailyPeriod, DAILY_QUEST_COUNT),
    ensureSet(character, "WEEKLY", weeklyPeriod, WEEKLY_QUEST_COUNT),
  ]);

  return { daily, weekly, dailyPeriod, weeklyPeriod };
}

/** Quêtes que l'évènement fait avancer, et de combien. */
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
  /** Évènements produits par les quêtes elles-mêmes (lot quotidien terminé). */
  events: GameEvent[];
}

/**
 * Fait avancer les quêtes touchées par les évènements, puis termine et récompense automatiquement
 * celles qui atteignent leur objectif : aucune commande de récolte à ne pas oublier. Terminer un
 * lot entier accorde en plus des fragments d'écho, qui font avancer le scénario.
 */
export async function applyQuestProgress(
  character: AdventureCharacter,
  items: AdventureItem[],
  events: GameEvent[],
  now = new Date(),
): Promise<QuestOutcome> {
  const sets = await ensureQuestSets(character, now);
  const periods: { kind: AdventureQuestKind; periodStart: Date }[] = [
    { kind: "DAILY", periodStart: sets.dailyPeriod },
    { kind: "WEEKLY", periodStart: sets.weeklyPeriod },
  ];

  for (const event of events) {
    const { questIds, amount } = matchingQuestIds(event);
    await advanceAdventureQuests(character.userId, periods, questIds, amount);
  }

  const refreshed = await ensureQuestSets(character, now);
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
      `✅ Quête terminée - ${view.label} · +${view.reward.xp} XP · +${view.reward.gold} 🪙`,
    );
  }

  const completedSets = await ensureQuestSets(current, now);
  const dailyDone = completedSets.daily.every((view) => view.row.claimedAt !== null);
  const weeklyDone = completedSets.weekly.every((view) => view.row.claimedAt !== null);
  // Les fragments ne sont accordés qu'au moment exact où le lot bascule : l'état d'avant la
  // boucle sert de témoin, ce qui évite un compteur dédié en base.
  let echoes = 0;
  const dailyWasDone = isSetComplete(sets.daily);
  const weeklyWasDone = isSetComplete(sets.weekly);

  if (dailyDone && !dailyWasDone) {
    echoes += ECHOES_PER_DAILY_SET;
    produced.push({ type: "DAILY_SET", amount: 1 });
    notices.push(`🔷 Lot quotidien complété - +${ECHOES_PER_DAILY_SET} fragment d'écho.`);
  }
  if (weeklyDone && !weeklyWasDone) {
    echoes += ECHOES_PER_WEEKLY_SET;
    notices.push(`🔷 Lot hebdomadaire complété - +${ECHOES_PER_WEEKLY_SET} fragments d'écho.`);
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
