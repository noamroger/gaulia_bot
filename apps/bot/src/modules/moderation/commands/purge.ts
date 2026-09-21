import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

import { GauliaError } from "../../../core/errors";
import { PermissionLevel } from "../../../core/permissions/permissionLevel";
import { successPayload } from "../../../core/ui/containers";
import { guildTranslatorFor, localizeOption, localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { recordCase } from "../services/moderationService";

const KEY = "moderation.commands.purge";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,
  permissionLevel: PermissionLevel.Moderator,
  cooldownSeconds: 3,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((option) =>
      localizeOption(option, `${KEY}.options.amount`)
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100),
    )
    .addUserOption((option) => localizeOption(option, `${KEY}.options.user`)),

  async execute(interaction, _client, t) {
    const channel = interaction.channel;
    if (!channel || channel.type !== ChannelType.GuildText) {
      throw new GauliaError("moderation.errors.textChannelOnly");
    }

    const guild = interaction.guild!;
    const amount = interaction.options.getInteger("amount", true);
    const filterUser = interaction.options.getUser("user");

    await interaction.deferReply({ ephemeral: true });

    const messages = await channel.messages.fetch({ limit: amount });
    const toDelete = filterUser
      ? messages.filter((message) => message.author.id === filterUser.id)
      : messages;

    const deleted = await channel.bulkDelete(toDelete, true);

    // The case reason is stored and read back by the guild staff, so it follows the guild language.
    const guildText = await guildTranslatorFor(guild.id, guild.preferredLocale);
    const caseReason = filterUser
      ? guildText("moderation.purge.caseReasonFrom", {
          count: deleted.size,
          target: filterUser.tag,
        })
      : guildText("moderation.purge.caseReason", { count: deleted.size });

    const moderationCase = await recordCase({
      guild,
      type: "PURGE",
      target: { id: channel.id, tag: `#${channel.name}` },
      moderator: { id: interaction.user.id, tag: interaction.user.tag },
      reason: caseReason,
    });

    await interaction.editReply(
      successPayload(
        false,
        t("moderation.purge.title", { case: moderationCase.caseNumber }),
        t("moderation.purge.description", { count: deleted.size }),
      ),
    );
  },
};

export default command;
