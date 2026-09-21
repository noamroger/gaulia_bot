import {
  ActionRowBuilder,
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

import { PermissionLevel } from "../../../core/permissions/permissionLevel";
import { localizeContextMenu } from "../../../i18n";
import type { UserContextMenuCommand } from "../../../structures/Command";

const KEY = "moderation.commands.warnUser";

const command: UserContextMenuCommand = {
  type: "userContextMenu",
  i18nKey: KEY,
  permissionLevel: PermissionLevel.Moderator,

  data: localizeContextMenu(new ContextMenuCommandBuilder(), KEY)
    .setType(ApplicationCommandType.User)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, _client, t) {
    const modal = new ModalBuilder()
      .setCustomId(`moderation:warnModal:${interaction.targetUser.id}`)
      .setTitle(t("moderation.warnModal.title", { user: interaction.targetUser.username }));

    const reasonInput = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel(t("moderation.warnModal.reasonLabel"))
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(500);

    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput));

    await interaction.showModal(modal);
  },
};

export default command;
