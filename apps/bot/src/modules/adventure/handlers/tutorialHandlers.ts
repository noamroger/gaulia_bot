import { getAdventureCharacter } from "@gaulia/database";
import type { ChatInputCommandInteraction } from "discord.js";

import type { Translator } from "../../../i18n";
import { findTutorialPage } from "../data/tutorial";
import { tutorialView } from "../ui/tutorialViews";

/**
 * The tutorial is the only command of the module that needs no adventurer: it is precisely the one
 * you run before having one.
 */
export async function handleTutorial(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  const topic = interaction.options.getString("topic");

  await interaction.deferReply();
  const character = await getAdventureCharacter(interaction.user.id);

  await interaction.editReply(
    tutorialView(interaction.user.id, topic ? findTutorialPage(topic) : 0, character !== null, t),
  );
}
