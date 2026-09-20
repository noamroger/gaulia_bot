import type { AdventureClass } from "@gaulia/database";
import { getAdventureRank, updateAdventureCharacter } from "@gaulia/database";
import type { ChatInputCommandInteraction } from "discord.js";

import { GauliaError } from "../../../core/errors";
import { successPayload } from "../../../core/ui/containers";
import { CLASSES, classDefinition } from "../data/classes";
import { startAdventure } from "../services/character/characterService";
import { checkAchievements } from "../services/progress/achievementService";
import { chapterStatus } from "../services/progress/storyService";
import { profileView, statsView } from "../ui/characterViews";
import { renderAdventureView } from "../ui/renderView";
import { playerContext } from "./context";

export async function handleStart(interaction: ChatInputCommandInteraction): Promise<void> {
  const chosen = interaction.options.getString("classe", true) as AdventureClass;
  const definition = classDefinition(chosen);

  await interaction.deferReply();
  const { character, items } = await startAdventure(
    interaction.user.id,
    interaction.user.username,
    chosen,
  );
  await checkAchievements(character);

  await interaction.editReply(
    profileView(character, items, {
      title: null,
      rank: await getAdventureRank(character),
      chapter: chapterStatus(character),
    }),
  );
  await interaction.followUp(
    successPayload(
      true,
      `${definition.emoji} Bienvenue dans les Terres de Gaulia`,
      `Tu commences ${definition.name.toLowerCase()} : *${definition.passive}*\n\nTout se pilote aux boutons sous tes messages - ou à la commande, si tu préfères : \`/aventure explorer\`, \`/aventure histoire\`, \`/aventure quetes\`.`,
    ),
  );
}

export async function handleProfile(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  await interaction.editReply(await renderAdventureView(interaction.user, "profil"));
}

export async function handleMap(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  await interaction.editReply(await renderAdventureView(interaction.user, "carte"));
}

export async function handleLeaderboard(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  await interaction.editReply(await renderAdventureView(interaction.user, "classement"));
}

export async function handleAchievements(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  await interaction.editReply(await renderAdventureView(interaction.user, "hauts-faits"));
}

export async function handleJournal(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  await interaction.editReply(await renderAdventureView(interaction.user, "journal"));
}

export async function handleImprove(interaction: ChatInputCommandInteraction): Promise<void> {
  const stat = interaction.options.getString("caracteristique");
  const points = interaction.options.getInteger("points") ?? 1;

  await interaction.deferReply({ ephemeral: true });
  const { character, items } = await playerContext(interaction);

  if (!stat) {
    await interaction.editReply(statsView(character, items));
    return;
  }
  if (points > character.statPoints) {
    throw new GauliaError(
      `Tu n'as que ${character.statPoints} point(s) à répartir (tu en demandes ${points}).`,
    );
  }

  const patch =
    stat === "force"
      ? { might: character.might + points }
      : stat === "agilite"
        ? { agility: character.agility + points }
        : { spirit: character.spirit + points };

  const updated = await updateAdventureCharacter(character.userId, {
    ...patch,
    statPoints: character.statPoints - points,
  });

  await interaction.editReply(statsView(updated, items));
}

/** Choix de classe proposés par la commande `/aventure commencer`. */
export const CLASS_CHOICES = CLASSES.map((definition) => ({
  name: `${definition.emoji} ${definition.name} - ${definition.description}`.slice(0, 100),
  value: definition.id,
}));
