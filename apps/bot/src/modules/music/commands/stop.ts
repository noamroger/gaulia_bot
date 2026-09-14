import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import type { ChatInputCommand } from "../../../structures/Command";
import { interventionOf, musicActionPayload } from "../services/musicUi";
import { getPlayerOrThrow, requireSameVoiceChannel, resolveMember } from "../services/playerUtils";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Arrête la musique, vide la file et quitte le salon vocal"),

  help: {
    details:
      "Arrête la lecture, vide la file d'attente et fait quitter le salon vocal à Gaulia. Tu dois être dans le même salon vocal que Gaulia.",
    examples: ["stop"],
  },

  async execute(interaction, client) {
    const member = await resolveMember(interaction);
    const player = getPlayerOrThrow(client, interaction.guildId!);
    requireSameVoiceChannel(member, player);

    await player.destroy();

    await interaction.reply(
      musicActionPayload(
        interaction.user,
        Emojis.Stop,
        "Musique arrêtée",
        `La musique a été arrêtée et la file vidée ${interventionOf(interaction.user)}.`,
      ),
    );
  },
};

export default command;
