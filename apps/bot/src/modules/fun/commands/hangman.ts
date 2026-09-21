import { SlashCommandBuilder } from "discord.js";

import { localizeOption, localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { hangmanGames, startHangman } from "../services/hangman";

const KEY = "fun.commands.hangman";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  cooldownSeconds: 3,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY).addBooleanOption((option) =>
    localizeOption(option, `${KEY}.options.open`),
  ),

  async execute(interaction, _client, t) {
    const { gameId, payload } = startHangman(
      interaction.user.id,
      interaction.options.getBoolean("open") ?? false,
      t,
    );
    await interaction.reply(payload);
    hangmanGames.attach(gameId, interaction);
  },
};

export default command;
