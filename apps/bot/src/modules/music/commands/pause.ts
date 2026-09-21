import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import { GauliaError } from "../../../core/errors";
import { localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { musicActionPayload } from "../services/musicUi";
import { getPlayerOrThrow, requireSameVoiceChannel, resolveMember } from "../services/playerUtils";

const KEY = "music.commands.pause";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY),

  async execute(interaction, client, t) {
    const member = await resolveMember(interaction);
    const player = getPlayerOrThrow(client, interaction.guildId!);
    requireSameVoiceChannel(member, player);

    if (player.paused) {
      throw new GauliaError("music.error.alreadyPaused");
    }

    await player.pause();
    await interaction.reply(
      musicActionPayload(
        interaction.user,
        Emojis.Pause,
        t("music.actions.pause.title"),
        t("music.actions.pause.paused", { user: interaction.user.id }),
      ),
    );
  },
};

export default command;
