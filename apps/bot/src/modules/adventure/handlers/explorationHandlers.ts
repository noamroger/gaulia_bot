import type { ChatInputCommandInteraction } from "discord.js";

import { ZONES } from "../data/zones";
import { dungeonStatus, runDungeon } from "../services/dungeon/dungeonService";
import { explore } from "../services/exploration/exploreService";
import { travelTo } from "../services/exploration/travelService";
import { dungeonResultView, dungeonStatusView, exploreView, travelView } from "../ui/exploreViews";
import { playerContext } from "./context";

export async function handleExplore(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const { character, items } = await playerContext(interaction);
  await interaction.editReply(exploreView(await explore(character, items)));
}

export async function handleTravel(interaction: ChatInputCommandInteraction): Promise<void> {
  const zoneId = interaction.options.getString("region", true);

  await interaction.deferReply();
  const { character, items } = await playerContext(interaction);
  const result = await travelTo(character, items, zoneId);

  await interaction.editReply(travelView(result.character, result.zone, result.notices));
}

export async function handleDungeon(interaction: ChatInputCommandInteraction): Promise<void> {
  const launch = interaction.options.getBoolean("lancer") ?? false;

  await interaction.deferReply();
  const { character, items } = await playerContext(interaction);

  if (!launch) {
    await interaction.editReply(dungeonStatusView(character, dungeonStatus(character)));
    return;
  }

  await interaction.editReply(dungeonResultView(await runDungeon(character, items)));
}

/** Régions proposées par `/aventure voyager` ; les zones verrouillées sont refusées au voyage. */
export const ZONE_CHOICES = ZONES.map((zone) => ({
  name: `${zone.emoji} ${zone.name} (niveau ${zone.minLevel}+)`.slice(0, 100),
  value: zone.id,
}));
