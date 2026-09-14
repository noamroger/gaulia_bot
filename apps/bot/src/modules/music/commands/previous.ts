import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import { GauliaError } from "../../../core/errors";
import type { ChatInputCommand } from "../../../structures/Command";
import { interventionOf, musicActionPayload, trackLink } from "../services/musicUi";
import { getPlayerOrThrow, requireSameVoiceChannel, resolveMember } from "../services/playerUtils";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  data: new SlashCommandBuilder().setName("previous").setDescription("Rejoue le morceau précédent"),

  help: {
    details: "Relance le dernier morceau joué. Tu dois être dans le même salon vocal que Gaulia.",
    examples: ["previous"],
  },

  async execute(interaction, client) {
    const member = await resolveMember(interaction);
    const player = getPlayerOrThrow(client, interaction.guildId!);
    requireSameVoiceChannel(member, player);

    const previous = player.queue.previous.at(0);
    if (!previous) {
      throw new GauliaError("Aucun morceau précédent.");
    }

    await player.play({ track: previous });
    await interaction.reply(
      musicActionPayload(
        interaction.user,
        Emojis.Back,
        "Retour en arrière",
        `${trackLink(previous)} est rejouée ${interventionOf(interaction.user)}.`,
      ),
    );
  },
};

export default command;
