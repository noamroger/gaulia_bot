import { getMusicSettings, updateMusicSettings } from "@gaulia/database";
import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import { localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { clearIdleTimer } from "../services/idleTimers";
import { musicActionPayload } from "../services/musicUi";

const KEY = "music.commands.stay247";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,
  premiumOnly: true,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY),

  async execute(interaction, _client, t) {
    const guildId = interaction.guildId!;
    const settings = await getMusicSettings(guildId);
    const enabled = !settings.stay247;

    await updateMusicSettings(guildId, { stay247: enabled });

    if (!enabled) {
      clearIdleTimer(guildId);
    }

    await interaction.reply(
      musicActionPayload(
        interaction.user,
        Emojis.Music,
        t("music.actions.stay247.title"),
        t(enabled ? "music.actions.stay247.enabled" : "music.actions.stay247.disabled", {
          user: interaction.user.id,
        }),
      ),
    );
  },
};

export default command;
