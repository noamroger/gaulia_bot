import type { AdventureClass } from "@gaulia/database";
import { getAdventureRank, updateAdventureCharacter } from "@gaulia/database";
import type { ChatInputCommandInteraction } from "discord.js";

import { GauliaError } from "../../../core/errors";
import { successPayload } from "../../../core/ui/containers";
import type { Translator } from "../../../i18n";
import { classDefinition, className, classPassive } from "../data/classes";
import { startAdventure } from "../services/character/characterService";
import { checkAchievements } from "../services/progress/achievementService";
import { chapterStatus } from "../services/progress/storyService";
import { profileView, statsView } from "../ui/characterViews";
import { renderAdventureView } from "../ui/renderView";
import { playerContext } from "./context";

export async function handleStart(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  const chosen = interaction.options.getString("class", true) as AdventureClass;
  const definition = classDefinition(chosen);

  await interaction.deferReply();
  const { character, items } = await startAdventure(
    interaction.user.id,
    interaction.user.username,
    chosen,
  );
  await checkAchievements(character, t);

  await interaction.editReply(
    profileView(character, items, t, {
      title: null,
      rank: await getAdventureRank(character),
      chapter: chapterStatus(character, t),
    }),
  );
  await interaction.followUp(
    successPayload(
      true,
      t("adventure.replies.welcomeTitle", { emoji: definition.emoji }),
      t("adventure.replies.welcomeBody", {
        class: className(t, chosen).toLowerCase(),
        passive: classPassive(t, chosen),
      }),
    ),
  );
}

export async function handleProfile(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  await interaction.deferReply();
  await interaction.editReply(await renderAdventureView(interaction.user, "profile", t));
}

export async function handleMap(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  await interaction.deferReply();
  await interaction.editReply(await renderAdventureView(interaction.user, "map", t));
}

export async function handleLeaderboard(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  await interaction.deferReply();
  await interaction.editReply(await renderAdventureView(interaction.user, "leaderboard", t));
}

export async function handleAchievements(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  await interaction.deferReply();
  await interaction.editReply(await renderAdventureView(interaction.user, "achievements", t));
}

export async function handleJournal(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  await interaction.deferReply();
  await interaction.editReply(await renderAdventureView(interaction.user, "journal", t));
}

export async function handleImprove(
  interaction: ChatInputCommandInteraction,
  t: Translator,
): Promise<void> {
  const stat = interaction.options.getString("stat");
  const points = interaction.options.getInteger("points") ?? 1;

  await interaction.deferReply({ ephemeral: true });
  const { character, items } = await playerContext(interaction);

  if (!stat) {
    await interaction.editReply(statsView(character, items, t));
    return;
  }
  if (points > character.statPoints) {
    throw new GauliaError("adventure.error.notEnoughPoints", {
      available: character.statPoints,
      requested: points,
    });
  }

  const patch =
    stat === "might"
      ? { might: character.might + points }
      : stat === "agility"
        ? { agility: character.agility + points }
        : { spirit: character.spirit + points };

  const updated = await updateAdventureCharacter(character.userId, {
    ...patch,
    statPoints: character.statPoints - points,
  });

  await interaction.editReply(statsView(updated, items, t));
}
