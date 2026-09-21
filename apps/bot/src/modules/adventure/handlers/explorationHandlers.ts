import type { ChatInputCommandInteraction } from "discord.js";

import type { Translator } from "../../../i18n";
import { runDungeon } from "../services/dungeon/dungeonService";
import { explore } from "../services/exploration/exploreService";
import { travelTo } from "../services/exploration/travelService";
import { dungeonResultView, exploreView, travelView } from "../ui/exploreViews";
import { renderAdventureView } from "../ui/renderView";
import { playerContext } from "./context";

export async function handleExplore(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  await interaction.deferReply();
  const { character, items } = await playerContext(interaction);
  await interaction.editReply(exploreView(await explore(character, items, t), t));
}

export async function handleTravel(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  const zoneId = interaction.options.getString("region", true);

  await interaction.deferReply();
  const { character, items } = await playerContext(interaction);
  const result = await travelTo(character, items, zoneId, t);

  await interaction.editReply(travelView(result.character, result.zone, result.notices, t));
}

export async function handleDungeon(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  const launch = interaction.options.getBoolean("fight") ?? false;

  await interaction.deferReply();
  const { character, items } = await playerContext(interaction);

  if (!launch) {
    await interaction.editReply(await renderAdventureView(interaction.user, "dungeon", t));
    return;
  }

  await interaction.editReply(dungeonResultView(await runDungeon(character, items, t), t));
}
