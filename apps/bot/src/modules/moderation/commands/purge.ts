import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

import { GauliaError } from "../../../core/errors";
import { PermissionLevel } from "../../../core/permissions/permissionLevel";
import { successPayload } from "../../../core/ui/containers";
import type { ChatInputCommand } from "../../../structures/Command";
import { recordCase } from "../services/moderationService";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  permissionLevel: PermissionLevel.Moderator,
  cooldownSeconds: 3,
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Supprime en masse des messages récents de ce salon")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((option) =>
      option
        .setName("nombre")
        .setDescription("Nombre de messages à supprimer (1-100)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100),
    )
    .addUserOption((option) =>
      option.setName("utilisateur").setDescription("Ne supprimer que les messages de ce membre"),
    ),

  help: {
    details:
      "Supprime jusqu'à 100 messages parmi les plus récents du salon. Avec l'option utilisateur, seuls ses messages parmi ces derniers messages sont supprimés. Les messages de plus de 14 jours sont ignorés (limite de Discord). L'opération est enregistrée comme cas de modération.",
    examples: ["purge nombre:50", "purge nombre:100 utilisateur:@Pseudo"],
  },

  async execute(interaction) {
    const channel = interaction.channel;
    if (!channel || channel.type !== ChannelType.GuildText) {
      throw new GauliaError(
        "Cette commande n'est utilisable que dans un salon textuel de serveur.",
      );
    }

    const amount = interaction.options.getInteger("nombre", true);
    const filterUser = interaction.options.getUser("utilisateur");

    await interaction.deferReply({ ephemeral: true });

    const messages = await channel.messages.fetch({ limit: amount });
    const toDelete = filterUser
      ? messages.filter((message) => message.author.id === filterUser.id)
      : messages;

    const deleted = await channel.bulkDelete(toDelete, true);

    const moderationCase = await recordCase({
      guild: interaction.guild!,
      type: "PURGE",
      target: { id: channel.id, tag: `#${channel.name}` },
      moderator: { id: interaction.user.id, tag: interaction.user.tag },
      reason: `${deleted.size} message(s) supprimé(s)${filterUser ? ` de ${filterUser.tag}` : ""}`,
    });

    await interaction.editReply(
      successPayload(
        false,
        `Messages supprimés (cas #${moderationCase.caseNumber})`,
        `**${deleted.size}** message(s) supprimé(s).`,
      ),
    );
  },
};

export default command;
