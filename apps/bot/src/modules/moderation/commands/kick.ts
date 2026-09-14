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
    .setName("kick")
    .setDescription("Expulse un membre du serveur")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((option) =>
      option.setName("utilisateur").setDescription("Membre à expulser").setRequired(true),
    )
    .addStringOption((option) => option.setName("raison").setDescription("Raison de l'expulsion")),

  help: {
    details:
      "Expulse un membre du serveur : il pourra revenir avec une nouvelle invitation. Un cas de modération est créé et le membre est prévenu en message privé si l'option est activée dans les réglages de modération. Le rôle le plus haut du membre doit être inférieur au tien et à celui de Gaulia.",
    examples: ["kick utilisateur:@Pseudo raison:Comportement toxique"],
  },

  async execute(interaction) {
    const guild = interaction.guild!;
    const targetUser = interaction.options.getUser("utilisateur", true);
    const reason = interaction.options.getString("raison") ?? undefined;

    const moderatorMember = await guild.members.fetch(interaction.user.id);
    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      throw new GauliaError("Ce membre n'est pas sur le serveur.");
    }

    const modCheck = canModerate(moderatorMember, targetMember);
    if (!modCheck.allowed) throw new GauliaError(modCheck.reason!);

    const botMember = await guild.members.fetchMe();
    const botCheck = canBotModerate(botMember, targetMember);
    if (!botCheck.allowed) throw new GauliaError(botCheck.reason!);

    await notifyTarget(guild, targetUser, "KICK", reason);
    await targetMember.kick(reason ?? `Modérateur : ${interaction.user.tag}`);

    const moderationCase = await recordCase({
      guild,
      type: "KICK",
      target: { id: targetUser.id, tag: targetUser.tag },
      moderator: { id: interaction.user.id, tag: interaction.user.tag },
      reason,
    });

    await interaction.reply(
      successPayload(
        false,
        `Membre expulsé (cas #${moderationCase.caseNumber})`,
        `**${targetUser.tag}** a été expulsé.${reason ? `\n**Raison :** ${reason}` : ""}`,
      ),
    );
  },
};

export default command;
