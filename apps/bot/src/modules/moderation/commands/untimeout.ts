import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

import { GauliaError } from "../../../core/errors";
import { PermissionLevel } from "../../../core/permissions/permissionLevel";
import { successPayload } from "../../../core/ui/containers";
import type { ChatInputCommand } from "../../../structures/Command";
import { notifyTarget, recordCase } from "../services/moderationService";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  permissionLevel: PermissionLevel.Moderator,
  data: new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("Retire la mise en sourdine d'un membre")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option.setName("utilisateur").setDescription("Membre concerné").setRequired(true),
    )
    .addStringOption((option) => option.setName("raison").setDescription("Raison")),

  help: {
    details:
      "Retire immédiatement la sourdine d'un membre. Un cas de modération est créé et le membre est prévenu en message privé si l'option est activée.",
    examples: ["untimeout utilisateur:@Pseudo"],
  },

  async execute(interaction) {
    const guild = interaction.guild!;
    const targetUser = interaction.options.getUser("utilisateur", true);
    const reason = interaction.options.getString("raison") ?? undefined;

    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
      throw new GauliaError("Ce membre n'est pas sur le serveur.");
    }

    if (!targetMember.isCommunicationDisabled()) {
      throw new GauliaError("Ce membre n'est pas actuellement en sourdine.");
    }

    await targetMember.timeout(null, reason ?? `Modérateur : ${interaction.user.tag}`);
    await notifyTarget(guild, targetUser, "UNTIMEOUT", reason);

    const moderationCase = await recordCase({
      guild,
      type: "UNTIMEOUT",
      target: { id: targetUser.id, tag: targetUser.tag },
      moderator: { id: interaction.user.id, tag: interaction.user.tag },
      reason,
    });

    await interaction.reply(
      successPayload(
        false,
        `Sourdine retirée (cas #${moderationCase.caseNumber})`,
        `**${targetUser.tag}** n'est plus en sourdine.`,
      ),
    );
  },
};

export default command;
