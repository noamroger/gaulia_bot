import { SlashCommandBuilder } from "discord.js";

import { GauliaError } from "../../../core/errors";
import { localizeOption, localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import {
  buildCommandHelp,
  buildHelpOverview,
  findCommand,
  helpAutocompleteChoices,
} from "../services/helpService";

const KEY = "general.commands.help";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: false,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY).addStringOption((option) =>
    localizeOption(option, `${KEY}.options.command`).setMaxLength(100).setAutocomplete(true),
  ),

  async autocomplete(interaction, client, t) {
    await interaction.respond(
      helpAutocompleteChoices(client.commands, interaction.options.getFocused(), t),
    );
  },

  async execute(interaction, client, t) {
    const query = interaction.options.getString("command");

    if (!query) {
      await interaction.reply(buildHelpOverview(client.commands, t));
      return;
    }

    const target = findCommand(client.commands, query, t);
    if (!target) {
      throw new GauliaError("general.help.notFound", { query });
    }

    await interaction.reply(buildCommandHelp(target, t));
  },
};

export default command;
