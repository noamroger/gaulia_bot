import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import { GauliaError } from "../../../core/errors";
import type { ChatInputCommand } from "../../../structures/Command";
import { interventionOf, musicActionPayload, trackLink } from "../services/musicUi";
import { getPlayerOrThrow, requireSameVoiceChannel, resolveMember } from "../services/playerUtils";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  data: new SlashCommandBuilder().setName("skip").setDescription("Passe au morceau suivant"),

  help: {
    details:
      "Arrête le morceau en cours et passe au titre suivant de la file. Tu dois être dans le même salon vocal que Gaulia.",
    examples: ["skip"],
  },

  async execute(interaction, client) {
    const member = await resolveMember(interaction);
    const player = getPlayerOrThrow(client, interaction.guildId!);
    requireSameVoiceChannel(member, player);

    if (player.queue.tracks.length === 0) {
      throw new GauliaError("Aucune musique suivante dans la file d'attente.");
    }

    const skipped = player.queue.current;
    await player.skip();

    await interaction.reply(
      musicActionPayload(
        interaction.user,
        Emojis.Skip,
        "Musique passée",
        `${skipped ? trackLink(skipped) : "La musique"} a été passée ${interventionOf(interaction.user)}.`,
      ),
    );
  },
};

export default command;
