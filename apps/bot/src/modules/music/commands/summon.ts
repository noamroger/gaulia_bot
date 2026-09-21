import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import { localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { musicActionPayload } from "../services/musicUi";
import {
  getOrCreateConfiguredPlayer,
  requireVoiceChannelId,
  resolveMember,
} from "../services/playerUtils";

const KEY = "music.commands.summon";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY),

  async execute(interaction, client, t) {
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
        t("music.actions.summon.title"),
        t("music.actions.summon.joined", {
          channel: voiceChannelId,
          user: interaction.user.id,
        }),
      ),
    );
  },
};

export default command;
