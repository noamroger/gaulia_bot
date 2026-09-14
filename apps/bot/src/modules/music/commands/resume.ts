import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import { GauliaError } from "../../../core/errors";
import type { ChatInputCommand } from "../../../structures/Command";
import { interventionOf, musicActionPayload } from "../services/musicUi";
import { getPlayerOrThrow, requireSameVoiceChannel, resolveMember } from "../services/playerUtils";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  data: new SlashCommandBuilder().setName("resume").setDescription("Reprend la lecture"),

  help: {
    details:
      "Reprend la lecture mise en pause avec `/pause`. Tu dois être dans le même salon vocal que Gaulia.",
    examples: ["resume"],
  },

  async execute(interaction, client) {
    const member = await resolveMember(interaction);
    const player = getPlayerOrThrow(client, interaction.guildId!);
    requireSameVoiceChannel(member, player);

    if (!player.paused) {
      throw new GauliaError("La lecture n'est pas en pause.");
    }

    await player.resume();
    await interaction.reply(
      musicActionPayload(
        interaction.user,
        Emojis.Resume,
        "Reprise de la musique",
        `La musique a repris ${interventionOf(interaction.user)}.`,
      ),
    );
  },
};

export default command;
