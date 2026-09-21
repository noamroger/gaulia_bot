import { updateGuild } from "@gaulia/database";
import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

import { PermissionLevel } from "../../../core/permissions/permissionLevel";
import { successPayload } from "../../../core/ui/containers";
import { localizeOption, localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";

const KEY = "moderation.commands.modlogsConfig";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,
  permissionLevel: PermissionLevel.Administrator,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      localizeOption(option, `${KEY}.options.channel`)
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
    ),

  async execute(interaction, _client, t) {
    const channel = interaction.options.getChannel("channel", true);
    await updateGuild(interaction.guildId!, { modLogChannelId: channel.id });

    await interaction.reply(
      successPayload(
        false,
        t("moderation.modlogs.title"),
        t("moderation.modlogs.description", { channel: channel.id }),
      ),
    );
  },
};

export default command;
