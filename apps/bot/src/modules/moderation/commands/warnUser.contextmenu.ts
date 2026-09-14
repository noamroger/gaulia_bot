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
import type { UserContextMenuCommand } from "../../../structures/Command";

const command: UserContextMenuCommand = {
  type: "userContextMenu",
  permissionLevel: PermissionLevel.Moderator,
  data: new ContextMenuCommandBuilder()
    .setName("Avertir l'utilisateur")
    .setType(ApplicationCommandType.User)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  help: {
    details:
      "Ouvre un formulaire pour saisir la raison, puis avertit le membre comme `/warn` : cas de modération, message privé si l'option est activée et paliers automatiques.",
  },

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId(`moderation:warnModal:${interaction.targetUser.id}`)
      .setTitle(`Avertir ${interaction.targetUser.username}`);

    const reasonInput = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("Raison de l'avertissement")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(500);

    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput));

    await interaction.showModal(modal);
  },
};

export default command;
