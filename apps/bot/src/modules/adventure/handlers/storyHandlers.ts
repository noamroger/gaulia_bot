import type { ChatInputCommandInteraction } from "discord.js";

import { ensureQuestSets } from "../services/progress/questService";
import { chapterStatus, sealChapter } from "../services/progress/storyService";
import { questsView, sealView, storyView } from "../ui/progressViews";
import { playerContext } from "./context";

export async function handleQuests(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const { character } = await playerContext(interaction);
  await interaction.editReply(questsView(character, await ensureQuestSets(character)));
}

export async function handleStory(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const { character } = await playerContext(interaction);
  await interaction.editReply(storyView(character, chapterStatus(character)));
}

export async function handleSeal(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const { character, items } = await playerContext(interaction);
  await interaction.editReply(sealView(await sealChapter(character, items)));
}
