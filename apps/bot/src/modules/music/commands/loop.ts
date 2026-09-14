import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import type { ChatInputCommand } from "../../../structures/Command";
import { interventionOf, musicActionPayload } from "../services/musicUi";
import { refreshNowPlayingCard } from "../services/nowPlayingCardService";
import { getPlayerOrThrow, requireSameVoiceChannel, resolveMember } from "../services/playerUtils";

const CHOICES = [
  { name: "Aucune", value: "off" },
  { name: "Titre en cours", value: "track" },
  { name: "File d'attente", value: "queue" },
] as const;

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Règle le mode de répétition")
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("Mode de répétition")
        .setRequired(true)
        .addChoices(...CHOICES),
    ),

  help: {
    details:
      "Choisit ce qui est rejoué à la fin d'un titre : rien, le titre en cours ou toute la file d'attente. Le bouton de répétition du lecteur alterne entre aucune répétition et la répétition de la file. Tu dois être dans le même salon vocal que Gaulia.",
    examples: ["loop mode:File d'attente"],
  },

  async execute(interaction, client) {
    const member = await resolveMember(interaction);
    const player = getPlayerOrThrow(client, interaction.guildId!);
    requireSameVoiceChannel(member, player);

    const mode = interaction.options.getString("mode", true) as "off" | "track" | "queue";
    await player.setRepeatMode(mode);

    const label = CHOICES.find((choice) => choice.value === mode)!.name;
    await interaction.reply(
      musicActionPayload(
        interaction.user,
        Emojis.Loop,
        "Répétition de la musique",
        `La répétition est passée à \`${label}\` ${interventionOf(interaction.user)}.`,
      ),
    );
    await refreshNowPlayingCard(client, player);
  },
};

export default command;
