import { ButtonBuilder, ButtonStyle } from "discord.js";
import {
  ADVENTURE_ECHOES_PER_DAILY_SET,
  ADVENTURE_ECHOES_PER_WEEKLY_SET,
  type AdventureCharacter,
  type AdventureLog,
} from "@gaulia/database";

import { Colors } from "../../../client/Constants";
import {
  addActionRow,
  buildContainer,
  toV2Payload,
  type V2MessagePayload,
} from "../../../core/ui/containers";
import type { Translator } from "../../../i18n";
import { chapterNarration, chapterTitle, TOTAL_CHAPTERS } from "../data/story";
import type { QuestSets } from "../services/progress/questService";
import type { ChapterStatus, SealResult } from "../services/progress/storyService";
import { checkbox, counter, formatNumber, progressBar } from "./format";
import { appendRow, exploreButton, navigationRow, viewButton } from "./navigation";

function questLines(
  title: string,
  views: QuestSets["daily"],
  reset: string,
  t: Translator,
): string {
  const rows = views
    .map((view) =>
      t("adventure.views.quests.row", {
        check: checkbox(view.row.claimedAt !== null),
        label: view.label,
        progress: counter(t, Math.min(view.row.progress, view.row.target), view.row.target),
        xp: formatNumber(t, view.reward.xp),
        gold: formatNumber(t, view.reward.gold),
      }),
    )
    .join("\n");
  return `${t("adventure.views.quests.group", { title, reset })}\n${rows}`;
}

export function questsView(
  character: AdventureCharacter,
  sets: QuestSets,
  t: Translator,
): V2MessagePayload {
  const dailyDone = sets.daily.every((view) => view.row.claimedAt !== null);
  const weeklyDone = sets.weekly.every((view) => view.row.claimedAt !== null);

  const payload = toV2Payload(
    false,
    buildContainer(Colors.Primary, [
      t("adventure.views.quests.title"),
      questLines(
        t("adventure.views.quests.daily"),
        sets.daily,
        t("adventure.views.quests.dailyReset"),
        t,
      ),
      questLines(
        t("adventure.views.quests.weekly"),
        sets.weekly,
        t("adventure.views.quests.weeklyReset"),
        t,
      ),
      [
        t("adventure.views.quests.dailySet", {
          state: dailyDone
            ? t("adventure.views.quests.setDone", { echoes: ADVENTURE_ECHOES_PER_DAILY_SET })
            : t("adventure.views.quests.setPending"),
        }),
        t("adventure.views.quests.weeklySet", {
          state: weeklyDone
            ? t("adventure.views.quests.setDone", { echoes: ADVENTURE_ECHOES_PER_WEEKLY_SET })
            : t("adventure.views.quests.setPending"),
        }),
        t("adventure.views.quests.echoes", { count: formatNumber(t, character.echoes) }),
      ].join("\n"),
      t("adventure.views.quests.hint"),
    ]),
  );

  appendRow(payload, [
    exploreButton(t, character.userId),
    viewButton(t, character.userId, "dungeon"),
    viewButton(t, character.userId, "story"),
  ]);
  return navigationRow(payload, t, character.userId, ["profile", "bag", "map"]);
}

export function storyView(
  character: AdventureCharacter,
  status: ChapterStatus | null,
  t: Translator,
): V2MessagePayload {
  if (!status) {
    const ending = toV2Payload(
      false,
      buildContainer(Colors.Premium, [
        t("adventure.views.story.doneTitle"),
        t("adventure.views.story.doneBody"),
      ]),
    );
    return navigationRow(ending, t, character.userId, ["profile", "dungeon", "leaderboard"]);
  }

  const objectives = status.objectives
    .map((entry) =>
      t("adventure.views.story.objectiveRow", {
        check: checkbox(entry.done),
        label: entry.label,
        progress: counter(t, entry.progress, entry.objective.target),
      }),
    )
    .join("\n");

  const requirements = [
    t("adventure.views.story.levelRequirement", {
      check: checkbox(status.levelReached),
      required: status.chapter.levelRequirement,
      current: character.level,
    }),
    t("adventure.views.story.echoRequirement", {
      check: checkbox(status.echoesReached),
      required: status.chapter.echoCost,
      current: formatNumber(t, character.echoes),
    }),
  ].join("\n");

  const ratio = (status.overallIndex - 1) / TOTAL_CHAPTERS;

  const payload = toV2Payload(
    false,
    buildContainer(Colors.Premium, [
      t("adventure.views.story.act", { emoji: status.actEmoji, act: status.actTitle }),
      t("adventure.views.story.chapter", {
        index: status.overallIndex,
        total: TOTAL_CHAPTERS,
        title: chapterTitle(t, status.chapter),
        narration: chapterNarration(t, status.chapter),
      }),
      t("adventure.views.story.objectives", { list: objectives }),
      t("adventure.views.story.requirements", { list: requirements }),
      t("adventure.views.story.progress", {
        bar: progressBar(ratio),
        percent: Math.round(ratio * 100),
      }),
      status.ready ? t("adventure.views.story.ready") : t("adventure.views.story.keepGoing"),
    ]),
  );

  const [container] = payload.components;
  if (status.ready && container && "addActionRowComponents" in container) {
    addActionRow(container, [
      new ButtonBuilder()
        .setCustomId(`adventure:seal:${character.userId}`)
        .setLabel(t("adventure.buttons.sealChapter"))
        .setEmoji("🔷")
        .setStyle(ButtonStyle.Success),
    ]);
  }

  appendRow(payload, [
    exploreButton(t, character.userId),
    viewButton(t, character.userId, "map"),
    viewButton(t, character.userId, "dungeon"),
    viewButton(t, character.userId, "quests"),
  ]);
  return payload;
}

export function sealView(result: SealResult, t: Translator): V2MessagePayload {
  const lines = [
    t("adventure.views.seal.title", { title: chapterTitle(t, result.chapter) }),
    t("adventure.views.seal.narration", { narration: chapterNarration(t, result.chapter) }),
    t("adventure.views.seal.reward", {
      xp: formatNumber(t, result.chapter.reward.xp),
      gold: formatNumber(t, result.chapter.reward.gold),
    }),
  ];

  if (result.notices.length > 0) lines.push(result.notices.join("\n"));
  if (result.next) {
    lines.push(
      t("adventure.views.seal.next", {
        title: chapterTitle(t, result.next.chapter),
        narration: chapterNarration(t, result.next.chapter),
      }),
    );
  }

  return toV2Payload(false, buildContainer(Colors.Premium, lines));
}

export function journalView(
  character: AdventureCharacter,
  logs: AdventureLog[],
  t: Translator,
): V2MessagePayload {
  const rows = logs
    .map((log) => {
      const icon = log.actorId
        ? "🛠️"
        : log.type === "STORY"
          ? "📖"
          : log.type === "DUNGEON"
            ? "🚪"
            : "🏅";
      // Discord renders the timestamp in the reader's own locale and time zone.
      return t("adventure.views.journal.row", {
        timestamp: Math.floor(log.createdAt.getTime() / 1000),
        icon,
        message: log.message,
      });
    })
    .join("\n");

  const payload = toV2Payload(
    false,
    buildContainer(Colors.Neutral, [
      t("adventure.views.journal.title", {
        name: character.username ?? t("adventure.views.unnamed"),
      }),
      rows || t("adventure.views.journal.empty"),
    ]),
  );
  return navigationRow(payload, t, character.userId, ["profile", "story", "achievements"]);
}
