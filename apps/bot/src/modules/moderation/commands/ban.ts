import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

import { GauliaError } from "../../../core/errors";
import { canBotModerate, canModerate } from "../../../core/permissions/hierarchy";
import { PermissionLevel } from "../../../core/permissions/permissionLevel";
import { successPayload } from "../../../core/ui/containers";
import type { ChatInputCommand } from "../../../structures/Command";
import { notifyTarget, recordCase } from "../services/moderationService";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  permissionLevel: PermissionLevel.Moderator,
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bannit un membre du serveur")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((option) =>
      option.setName("utilisateur").setDescription("Membre à bannir").setRequired(true),
    )
    .addStringOption((option) => option.setName("raison").setDescription("Raison du bannissement"))
    .addIntegerOption((option) =>
      option
        .setName("supprimer_messages_jours")
        .setDescription("Supprimer les messages des N derniers jours (0-7)")
        .setMinValue(0)
        .setMaxValue(7),
    ),

  help: {
    details:
      "Bannit un membre, ou un utilisateur qui a déjà quitté le serveur. Un cas de modération est créé et publié dans le salon des logs, et le membre est prévenu en message privé si l'option est activée dans les réglages de modération. Le rôle le plus haut du membre doit être inférieur au tien et à celui de Gaulia.",
    examples: [
      "ban utilisateur:@Pseudo raison:Spam",
      "ban utilisateur:@Pseudo supprimer_messages_jours:7",
    ],
  },

  async execute(interaction) {
    const guild = interaction.guild!;
    const targetUser = interaction.options.getUser("utilisateur", true);
    const reason = interaction.options.getString("raison") ?? undefined;
    const deleteDays = interaction.options.getInteger("supprimer_messages_jours") ?? 0;

    const moderatorMember = await guild.members.fetch(interaction.user.id);
    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

    if (targetMember) {
      const modCheck = canModerate(moderatorMember, targetMember);
      if (!modCheck.allowed) throw new GauliaError(modCheck.reason!);

      const botMember = await guild.members.fetchMe();
      const botCheck = canBotModerate(botMember, targetMember);
      if (!botCheck.allowed) throw new GauliaError(botCheck.reason!);
    }

    if (targetMember) {
      await notifyTarget(guild, targetUser, "BAN", reason);
    }

    await guild.bans.create(targetUser.id, {
      reason: reason ?? `Modérateur : ${interaction.user.tag}`,
      deleteMessageSeconds: deleteDays * 86_400,
    });

    const moderationCase = await recordCase({
      guild,
      type: "BAN",
      target: { id: targetUser.id, tag: targetUser.tag },
      moderator: { id: interaction.user.id, tag: interaction.user.tag },
      reason,
    });

    await interaction.reply(
      successPayload(
        false,
        `Membre banni (cas #${moderationCase.caseNumber})`,
        `**${targetUser.tag}** a été banni.${reason ? `\n**Raison :** ${reason}` : ""}`,
      ),
    );
  },
};

export default command;
