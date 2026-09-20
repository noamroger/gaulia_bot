import { ButtonBuilder, ButtonStyle } from "discord.js";
import type { AdventureCharacter, AdventureLog } from "@gaulia/database";

import { Colors } from "../../../client/Constants";
import {
  addActionRow,
  buildContainer,
  toV2Payload,
  type V2MessagePayload,
} from "../../../core/ui/containers";
import { TOTAL_CHAPTERS } from "../data/story";
import type { QuestSets } from "../services/progress/questService";
import type { ChapterStatus, SealResult } from "../services/progress/storyService";
import { checkbox, counter, formatNumber, progressBar } from "./format";
import { appendRow, exploreButton, navigationRow, viewButton } from "./navigation";

function questLines(title: string, views: QuestSets["daily"], resetLabel: string): string {
  const rows = views
    .map((view) => {
      const done = view.row.claimedAt !== null;
      return `${checkbox(done)} ${view.label} - ${counter(Math.min(view.row.progress, view.row.target), view.row.target)} · +${formatNumber(view.reward.xp)} XP · +${formatNumber(view.reward.gold)} 🪙`;
    })
    .join("\n");
  return `**${title}** *(${resetLabel})*\n${rows}`;
}

export function questsView(character: AdventureCharacter, sets: QuestSets): V2MessagePayload {
  const dailyDone = sets.daily.every((view) => view.row.claimedAt !== null);
  const weeklyDone = sets.weekly.every((view) => view.row.claimedAt !== null);

  const payload = toV2Payload(
    false,
    buildContainer(Colors.Primary, [
      "## 📜 Carnet de quêtes",
      questLines("Quotidiennes", sets.daily, "renouvelées chaque jour à minuit UTC"),
      questLines("Hebdomadaires", sets.weekly, "renouvelées chaque lundi"),
      [
        `Lot du jour : ${dailyDone ? "✅ complété (+1 🔷)" : "en cours"}`,
        `Lot de la semaine : ${weeklyDone ? "✅ complété (+2 🔷)" : "en cours"}`,
        `Tu possèdes **${formatNumber(character.echoes)}** fragments d'écho.`,
      ].join("\n"),
      "Les quêtes se valident toutes seules : joue, elles se cochent.",
    ]),
  );

  appendRow(payload, [
    exploreButton(character.userId),
    viewButton(character.userId, "donjon"),
    viewButton(character.userId, "histoire"),
  ]);
  return navigationRow(payload, character.userId, ["profil", "sac", "carte"]);
}

export function storyView(
  character: AdventureCharacter,
  status: ChapterStatus | null,
): V2MessagePayload {
  if (!status) {
    const ending = toV2Payload(
      false,
      buildContainer(Colors.Premium, [
        "## 🏆 Ton histoire est écrite",
        "Tu as entendu la dernière voix des Terres. Les gardiens restent affrontables, et les Terres se souviendront de ton nom.",
      ]),
    );
    return navigationRow(ending, character.userId, ["profil", "donjon", "classement"]);
  }

  const objectives = status.objectives
    .map(
      (entry) =>
        `${checkbox(entry.done)} ${entry.label} - ${counter(entry.progress, entry.objective.target)}`,
    )
    .join("\n");

  const requirements = [
    `${checkbox(status.levelReached)} Niveau ${status.chapter.levelRequirement} requis (tu es niveau ${character.level})`,
    `${checkbox(status.echoesReached)} ${status.chapter.echoCost} fragments d'écho (tu en as ${formatNumber(character.echoes)})`,
  ].join("\n");

  const payload = toV2Payload(
    false,
    buildContainer(Colors.Premium, [
      `## ${status.actEmoji} ${status.actTitle}`,
      `**Chapitre ${status.overallIndex}/${TOTAL_CHAPTERS} - ${status.chapter.title}**\n*${status.chapter.narration}*`,
      `**Objectifs**\n${objectives}`,
      `**Pour sceller le chapitre**\n${requirements}`,
      `Avancement du scénario ${progressBar((status.overallIndex - 1) / TOTAL_CHAPTERS)} ${Math.round(((status.overallIndex - 1) / TOTAL_CHAPTERS) * 100)} %`,
      status.ready
        ? "Tout est prêt : scelle le chapitre pour ouvrir la suite."
        : "Continue d'explorer : les objectifs se remplissent en jouant.",
    ]),
  );

  const [container] = payload.components;
  if (status.ready && container && "addActionRowComponents" in container) {
    addActionRow(container, [
      new ButtonBuilder()
        .setCustomId(`adventure:seal:${character.userId}`)
        .setLabel("Sceller le chapitre")
        .setEmoji("🔷")
        .setStyle(ButtonStyle.Success),
    ]);
  }

  appendRow(payload, [
    exploreButton(character.userId),
    viewButton(character.userId, "carte"),
    viewButton(character.userId, "donjon"),
    viewButton(character.userId, "quetes"),
  ]);
  return payload;
}

export function sealView(result: SealResult): V2MessagePayload {
  const lines = [
    `## 🔷 ${result.chapter.title} - chapitre scellé`,
    `*${result.chapter.narration}*`,
    `✨ +${formatNumber(result.chapter.reward.xp)} XP · 🪙 +${formatNumber(result.chapter.reward.gold)}`,
  ];

  if (result.notices.length > 0) lines.push(result.notices.join("\n"));
  if (result.next) {
    lines.push(`**Suite : ${result.next.chapter.title}**\n*${result.next.chapter.narration}*`);
  }

  return toV2Payload(false, buildContainer(Colors.Premium, lines));
}

export function journalView(character: AdventureCharacter, logs: AdventureLog[]): V2MessagePayload {
  const rows = logs
    .map((log) => {
      const date = log.createdAt.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });
      const prefix = log.actorId
        ? "🛠️"
        : log.type === "STORY"
          ? "📖"
          : log.type === "DUNGEON"
            ? "🚪"
            : "🏅";
      return `\`${date}\` ${prefix} ${log.message}`;
    })
    .join("\n");

  const payload = toV2Payload(
    false,
    buildContainer(Colors.Neutral, [
      `## 📓 Journal de ${character.username ?? "l'aventurier"}`,
      rows || "Ton journal est encore vierge.",
    ]),
  );
  return navigationRow(payload, character.userId, ["profil", "histoire", "hauts-faits"]);
}
