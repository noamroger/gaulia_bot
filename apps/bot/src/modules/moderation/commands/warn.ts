import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

import { PermissionLevel } from "../../../core/permissions/permissionLevel";
import { canModerate } from "../../../core/permissions/hierarchy";
import { GauliaError } from "../../../core/errors";
import { successPayload } from "../../../core/ui/containers";
import type { ChatInputCommand } from "../../../structures/Command";
import { escalationLine, performWarn } from "../services/moderationService";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  permissionLevel: PermissionLevel.Moderator,
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Avertit un membre")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option.setName("utilisateur").setDescription("Membre à avertir").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("raison").setDescription("Raison de l'avertissement").setRequired(true),
    ),

  help: {
    details:
      "Ajoute un avertissement au membre, crée un cas de modération et le prévient en message privé si l'option est activée. Si des paliers sont configurés sur le dashboard, une sourdine, une expulsion ou un bannissement est appliqué automatiquement quand le membre atteint le nombre d'avertissements d'un palier.",
    examples: ["warn utilisateur:@Pseudo raison:Insultes"],
  },

  async execute(interaction) {
    const guild = interaction.guild!;
    const targetUser = interaction.options.getUser("utilisateur", true);
    const reason = interaction.options.getString("raison", true);

    const moderatorMember = await guild.members.fetch(interaction.user.id);
    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

    if (targetMember) {
      const modCheck = canModerate(moderatorMember, targetMember);
      if (!modCheck.allowed) throw new GauliaError(modCheck.reason!);
    }

    const { moderationCase, escalation } = await performWarn(
      guild,
      targetUser,
      { id: interaction.user.id, tag: interaction.user.tag },
      reason,
    );

    await interaction.reply(
      successPayload(
        false,
        `Membre averti (cas #${moderationCase.caseNumber})`,
        `**${targetUser.tag}** a été averti.\n**Raison :** ${reason}${escalationLine(escalation)}`,
      ),
    );
  },
};

export default command;
