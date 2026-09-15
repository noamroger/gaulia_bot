import { getAdventureCharacter } from "@gaulia/database";
import type { ChatInputCommandInteraction } from "discord.js";

import { findTutorialPage } from "../data/tutorial";
import { tutorialView } from "../ui/tutorialViews";

/**
 * Le tutoriel est la seule commande du module qui ne demande pas d'aventurier : c'est justement
 * celle qu'on lance avant d'en avoir un.
 */
export async function handleTutorial(interaction: ChatInputCommandInteraction): Promise<void> {
  const subject = interaction.options.getString("sujet");

  await interaction.deferReply();
  const character = await getAdventureCharacter(interaction.user.id);

  await interaction.editReply(
    tutorialView(interaction.user.id, subject ? findTutorialPage(subject) : 0, character !== null),
  );
}
