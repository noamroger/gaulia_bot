import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import type { ChatInputCommand } from "../../../structures/Command";
import { interventionOf, musicActionPayload } from "../services/musicUi";
import {
  getOrCreateConfiguredPlayer,
  requireVoiceChannelId,
  resolveMember,
} from "../services/playerUtils";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("summon")
    .setDescription("Fait rejoindre le bot dans ton salon vocal"),

  help: {
    details:
      "Fait rejoindre ton salon vocal à Gaulia sans lancer de musique. Tu dois être connecté à un salon vocal.",
    examples: ["summon"],
  },

  async execute(interaction, client) {
    const member = await resolveMember(interaction);
    const voiceChannelId = requireVoiceChannelId(member);

    const player = await getOrCreateConfiguredPlayer(client, {
      guildId: interaction.guildId!,
      voiceChannelId,
      textChannelId: interaction.channelId,
    });

    if (!player.connected) {
      await player.connect();
    }

    await interaction.reply(
      musicActionPayload(
        interaction.user,
        Emojis.Music,
        "Salon vocal rejoint",
        `Gaulia a rejoint <#${voiceChannelId}> ${interventionOf(interaction.user)}.`,
      ),
    );
  },
};

export default command;
