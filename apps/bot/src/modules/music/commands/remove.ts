import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import { GauliaError } from "../../../core/errors";
import type { ChatInputCommand } from "../../../structures/Command";
import { interventionOf, musicActionPayload, trackLink } from "../services/musicUi";
import { getPlayerOrThrow, requireSameVoiceChannel, resolveMember } from "../services/playerUtils";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Retire un titre de la file d'attente")
    .addIntegerOption((option) =>
      option
        .setName("position")
        .setDescription("Position dans la file (voir /queue)")
        .setRequired(true)
        .setMinValue(1),
    ),

  help: {
    details:
      "Retire de la file le titre à la position indiquée par `/queue`. Tu dois être dans le même salon vocal que Gaulia.",
    examples: ["remove position:3"],
  },

  async execute(interaction, client) {
    const member = await resolveMember(interaction);
    const player = getPlayerOrThrow(client, interaction.guildId!);
    requireSameVoiceChannel(member, player);

    const position = interaction.options.getInteger("position", true);
    const index = position - 1;
    const track = player.queue.tracks[index];

    if (!track) {
      throw new GauliaError("Aucun titre à cette position.");
    }

    await player.queue.remove(index);
    await interaction.reply(
      musicActionPayload(
        interaction.user,
        Emojis.Music,
        "Musique retirée",
        `${trackLink(track)} a été retirée de la file ${interventionOf(interaction.user)}.`,
      ),
    );
  },
};

export default command;
