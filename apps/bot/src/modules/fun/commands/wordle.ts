import { SlashCommandBuilder } from "discord.js";

import { localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { startWordle, wordleGames } from "../services/wordle";

const KEY = "fun.commands.wordle";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  cooldownSeconds: 3,
  data: localizeSlashCommand(new SlashCommandBuilder(), KEY),

  async execute(interaction, _client, t) {
    const { gameId, payload } = startWordle(interaction.user.id, t);
    await interaction.reply(payload);
    wordleGames.attach(gameId, interaction);
  },
};

export default command;
