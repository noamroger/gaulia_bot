import type { ChatInputCommandInteraction } from "discord.js";

import { sealChapter } from "../services/progress/storyService";
import { sealView } from "../ui/progressViews";
import { renderAdventureView } from "../ui/renderView";
import { playerContext } from "./context";

export async function handleQuests(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  await interaction.editReply(await renderAdventureView(interaction.user, "quetes"));
}

export async function handleStory(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  await interaction.editReply(await renderAdventureView(interaction.user, "histoire"));
}

export async function handleSeal(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const { character, items } = await playerContext(interaction);
  await interaction.editReply(sealView(await sealChapter(character, items)));
}
