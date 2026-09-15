import type { AdventureClass } from "@gaulia/database";
import {
  getAdventureRank,
  listAdventureAchievements,
  listAdventureLogs,
  listTopAdventurers,
  updateAdventureCharacter,
} from "@gaulia/database";
import type { ChatInputCommandInteraction } from "discord.js";

import { GauliaError } from "../../../core/errors";
import { successPayload } from "../../../core/ui/containers";
import { ACHIEVEMENTS } from "../data/achievements";
import { CLASSES, classDefinition } from "../data/classes";
import { startAdventure } from "../services/character/characterService";
import { checkAchievements, currentTitle } from "../services/progress/achievementService";
import { chapterStatus } from "../services/progress/storyService";
import {
  achievementsView,
  leaderboardView,
  mapView,
  profileView,
  statsView,
} from "../ui/characterViews";
import { journalView } from "../ui/progressViews";
import { playerContext } from "./context";
import { zonesForAct } from "../data/zones";

const LEADERBOARD_SIZE = 10;
const JOURNAL_SIZE = 15;

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
      `Tu commences ${definition.name.toLowerCase()} : *${definition.passive}*\n\nPars avec \`/aventure explorer\`, suis ton histoire avec \`/aventure histoire\`, et consulte tes quêtes du jour avec \`/aventure quetes\`.`,
    ),
  );
}

export async function handleProfile(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const { character, items } = await playerContext(interaction);

  await interaction.editReply(
    profileView(character, items, {
      title: await currentTitle(character.userId),
      rank: await getAdventureRank(character),
      chapter: chapterStatus(character),
    }),
  );
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

export async function handleLeaderboard(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const { character } = await playerContext(interaction);

  await interaction.editReply(
    leaderboardView(await listTopAdventurers(LEADERBOARD_SIZE), {
      userId: character.userId,
      rank: await getAdventureRank(character),
    }),
  );
}

export async function handleAchievements(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const { character } = await playerContext(interaction);

  const unlockedIds = new Set(
    (await listAdventureAchievements(character.userId)).map((entry) => entry.achievementId),
  );

  await interaction.editReply(
    achievementsView(
      ACHIEVEMENTS.filter((entry) => unlockedIds.has(entry.id)).map(
        ({ id, emoji, name, description }) => ({ id, emoji, name, description }),
      ),
      ACHIEVEMENTS.filter((entry) => !unlockedIds.has(entry.id)).map(
        ({ emoji, name, description }) => ({ emoji, name, description }),
      ),
    ),
  );
}

export async function handleJournal(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const { character } = await playerContext(interaction);
  await interaction.editReply(
    journalView(character, await listAdventureLogs(character.userId, JOURNAL_SIZE)),
  );
}

export async function handleMap(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const { character } = await playerContext(interaction);
  await interaction.editReply(mapView(character, zonesForAct(character.actIndex)));
}

/** Choix de classe proposés par la commande `/aventure commencer`. */
export const CLASS_CHOICES = CLASSES.map((definition) => ({
  name: `${definition.emoji} ${definition.name} — ${definition.description}`.slice(0, 100),
  value: definition.id,
}));
