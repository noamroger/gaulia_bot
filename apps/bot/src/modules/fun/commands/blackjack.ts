import { SlashCommandBuilder } from "discord.js";

import { localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { blackjackGames, startBlackjack } from "../services/blackjack";

const KEY = "fun.commands.blackjack";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  cooldownSeconds: 3,
  data: localizeSlashCommand(new SlashCommandBuilder(), KEY),

  async execute(interaction, _client, t) {
    const { gameId, payload } = startBlackjack(interaction.user.id, t);
    await interaction.reply(payload);
    blackjackGames.attach(gameId, interaction);
  },
};

export default command;
