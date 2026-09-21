import type { ChatInputCommandInteraction } from "discord.js";

import type { Translator } from "../../../i18n";
import { sealChapter } from "../services/progress/storyService";
import { sealView } from "../ui/progressViews";
import { renderAdventureView } from "../ui/renderView";
import { playerContext } from "./context";

export async function handleQuests(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  await interaction.deferReply();
  await interaction.editReply(await renderAdventureView(interaction.user, "quests", t));
}

export async function handleStory(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  await interaction.deferReply();
  await interaction.editReply(await renderAdventureView(interaction.user, "story", t));
}

export async function handleSeal(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  await interaction.deferReply();
  const { character, items } = await playerContext(interaction);
  await interaction.editReply(sealView(await sealChapter(character, items, t), t));
}
