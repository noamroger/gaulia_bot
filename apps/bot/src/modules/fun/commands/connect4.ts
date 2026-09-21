import { SlashCommandBuilder } from "discord.js";

import { localizeChoices, localizeOption, localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { startDuelCommand } from "../services/duel";
import { DIFFICULTIES } from "../services/funUi";

const KEY = "fun.commands.connect4";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  cooldownSeconds: 3,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY)
    .addUserOption((option) => localizeOption(option, `${KEY}.options.opponent`))
    .addStringOption((option) =>
      localizeOption(option, `${KEY}.options.difficulty`).addChoices(
        ...localizeChoices(`${KEY}.options.difficulty`, DIFFICULTIES),
      ),
    ),

  async execute(interaction, _client, t) {
    await startDuelCommand(interaction, "connect4", t);
  },
};

export default command;
