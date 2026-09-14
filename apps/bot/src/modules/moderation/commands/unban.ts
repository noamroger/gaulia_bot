import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

import { GauliaError } from "../../../core/errors";
import { PermissionLevel } from "../../../core/permissions/permissionLevel";
import { successPayload } from "../../../core/ui/containers";
import type { ChatInputCommand } from "../../../structures/Command";
import { recordCase } from "../services/moderationService";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  permissionLevel: PermissionLevel.Moderator,
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Débannit un utilisateur")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((option) =>
      option
        .setName("id_utilisateur")
        .setDescription("ID Discord de l'utilisateur")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("raison").setDescription("Raison du débannissement"),
    ),

  help: {
    details:
      "Lève le bannissement d'un utilisateur à partir de son identifiant Discord, visible dans Paramètres du serveur > Bannissements ou avec « Copier l'identifiant » en mode développeur. Un cas de modération est créé.",
    examples: ["unban id_utilisateur:123456789012345678 raison:Appel accepté"],
  },

  async execute(interaction) {
    const guild = interaction.guild!;
    const userId = interaction.options.getString("id_utilisateur", true);
    const reason = interaction.options.getString("raison") ?? undefined;

    const ban = await guild.bans.fetch(userId).catch(() => null);
    if (!ban) {
      throw new GauliaError("Cet utilisateur n'est pas banni sur ce serveur.");
    }

    await guild.bans.remove(userId, reason ?? `Modérateur : ${interaction.user.tag}`);

    const moderationCase = await recordCase({
      guild,
      type: "UNBAN",
      target: { id: userId, tag: ban.user.tag },
      moderator: { id: interaction.user.id, tag: interaction.user.tag },
      reason,
    });

    await interaction.reply(
      successPayload(
        false,
        `Utilisateur débanni (cas #${moderationCase.caseNumber})`,
        `**${ban.user.tag}** a été débanni.`,
      ),
    );
  },
};

export default command;
