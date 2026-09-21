import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import { localizeOption, localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { musicActionPayload } from "../services/musicUi";
import { MAX_VOLUME, setClampedVolume } from "../services/playbackControls";
import { getPlayerOrThrow, requireSameVoiceChannel, resolveMember } from "../services/playerUtils";

const KEY = "music.commands.volume";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY).addIntegerOption((option) =>
    localizeOption(option, `${KEY}.options.level`)
      .setRequired(true)
      .setMinValue(0)
      .setMaxValue(MAX_VOLUME),
  ),

  async execute(interaction, client, t) {
    const member = await resolveMember(interaction);
    const player = getPlayerOrThrow(client, interaction.guildId!);
    requireSameVoiceChannel(member, player);

    const { from, to } = await setClampedVolume(
      player,
      interaction.options.getInteger("level", true),
    );

    await interaction.reply(
      musicActionPayload(
        interaction.user,
        Emojis.VolumeDown,
        t("music.actions.volume.title"),
        t("music.actions.volume.changed", { from, to, user: interaction.user.id }),
      ),
    );
  },
};

export default command;
