import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import { GauliaError } from "../../../core/errors";
import type { ChatInputCommand } from "../../../structures/Command";
import { interventionOf, musicActionPayload } from "../services/musicUi";
import { getPlayerOrThrow, requireSameVoiceChannel, resolveMember } from "../services/playerUtils";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  data: new SlashCommandBuilder().setName("pause").setDescription("Met la lecture en pause"),

  help: {
    details:
      "Met en pause le morceau en cours sans vider la file. Utilise `/resume` pour reprendre. Tu dois être dans le même salon vocal que Gaulia.",
    examples: ["pause"],
  },

  async execute(interaction, client) {
    const member = await resolveMember(interaction);
    const player = getPlayerOrThrow(client, interaction.guildId!);
    requireSameVoiceChannel(member, player);

    if (player.paused) {
      throw new GauliaError("La lecture est déjà en pause. Utilise `/resume` pour reprendre.");
    }

    await player.pause();
    await interaction.reply(
      musicActionPayload(
        interaction.user,
        Emojis.Pause,
        "Musique en pause",
        `La musique a été mise en pause ${interventionOf(interaction.user)}.`,
      ),
    );
  },
};

export default command;
