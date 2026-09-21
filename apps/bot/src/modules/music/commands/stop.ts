import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import { localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { musicActionPayload } from "../services/musicUi";
import { getPlayerOrThrow, requireSameVoiceChannel, resolveMember } from "../services/playerUtils";

const KEY = "music.commands.stop";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY),

  async execute(interaction, client, t) {
    const member = await resolveMember(interaction);
    const player = getPlayerOrThrow(client, interaction.guildId!);
    requireSameVoiceChannel(member, player);

    await player.destroy();

    await interaction.reply(
      musicActionPayload(
        interaction.user,
        Emojis.Stop,
        t("music.actions.stop.title"),
        t("music.actions.stop.stopped", { user: interaction.user.id }),
      ),
    );
  },
};

export default command;
