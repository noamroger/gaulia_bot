import { SlashCommandBuilder } from "discord.js";

import { localizeChoices, localizeOption, localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { collectBotInfo } from "../services/botinfo/botStatsService";
import { BOT_INFO_VIEWS, botInfoView, isBotInfoView } from "../services/botinfo/botinfoUi";

const KEY = "general.commands.botinfo";
const VIEW_OPTION = `${KEY}.options.view`;

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: false,
  cooldownSeconds: 10,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY).addStringOption((option) =>
    localizeOption(option, VIEW_OPTION).addChoices(...localizeChoices(VIEW_OPTION, BOT_INFO_VIEWS)),
  ),

  async execute(interaction, client, t) {
    await interaction.deferReply();

    const requested = interaction.options.getString("view") ?? "overview";
    const view = isBotInfoView(requested) ? requested : "overview";
    const snapshot = await collectBotInfo(client);

    await interaction.editReply(botInfoView(snapshot, view, interaction.user.id, t));
  },
};

export default command;
