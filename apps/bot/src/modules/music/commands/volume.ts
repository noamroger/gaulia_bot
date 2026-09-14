import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import type { ChatInputCommand } from "../../../structures/Command";
import { interventionOf, musicActionPayload } from "../services/musicUi";
import { MAX_VOLUME, VOLUME_STEP, setClampedVolume } from "../services/playbackControls";
import { getPlayerOrThrow, requireSameVoiceChannel, resolveMember } from "../services/playerUtils";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Règle le volume de lecture")
    .addIntegerOption((option) =>
      option
        .setName("niveau")
        .setDescription(`Volume entre 0 et ${MAX_VOLUME}`)
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(MAX_VOLUME),
    ),

  help: {
    details: `Règle le volume de la lecture en cours, de 0 à ${MAX_VOLUME} %. Les boutons du lecteur l'ajustent aussi de ${VOLUME_STEP} % en ${VOLUME_STEP} %. Le volume par défaut du serveur se règle sur le dashboard. Tu dois être dans le même salon vocal que Gaulia.`,
    examples: ["volume niveau:80"],
  },

  async execute(interaction, client) {
    const member = await resolveMember(interaction);
    const player = getPlayerOrThrow(client, interaction.guildId!);
    requireSameVoiceChannel(member, player);

    const { from, to } = await setClampedVolume(
      player,
      interaction.options.getInteger("niveau", true),
    );

    await interaction.reply(
      musicActionPayload(
        interaction.user,
        Emojis.VolumeDown,
        "Volume de la musique",
        `Le volume est passé de \`${from}%\` à \`${to}%\` ${interventionOf(interaction.user)}.`,
      ),
    );
  },
};

export default command;
