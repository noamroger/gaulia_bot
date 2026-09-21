import { getModerationCase } from "@gaulia/database";
import { SlashCommandBuilder } from "discord.js";

import { Colors } from "../../../client/Constants";
import { GauliaError } from "../../../core/errors";
import { PermissionLevel } from "../../../core/permissions/permissionLevel";
import { buildContainer, toV2Payload } from "../../../core/ui/containers";
import { localizeOption, localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { caseLines } from "../services/moderationService";

const KEY = "moderation.commands.case";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,
  permissionLevel: PermissionLevel.Moderator,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY).addIntegerOption((option) =>
    localizeOption(option, `${KEY}.options.number`).setRequired(true).setMinValue(1),
  ),

  async execute(interaction, _client, t) {
    const caseNumber = interaction.options.getInteger("number", true);
    const moderationCase = await getModerationCase(interaction.guildId!, caseNumber);

    if (!moderationCase) {
      throw new GauliaError("moderation.errors.caseNotFound", { case: caseNumber });
    }

    await interaction.reply(
      toV2Payload(false, buildContainer(Colors.Primary, caseLines(moderationCase, t, true))),
    );
  },
};

export default command;
