import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

import { PermissionLevel } from "../../../core/permissions/permissionLevel";
import { successPayload } from "../../../core/ui/containers";
import type { ChatInputCommand } from "../../../structures/Command";
import { updateGuild } from "@gaulia/database";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  permissionLevel: PermissionLevel.Administrator,
  data: new SlashCommandBuilder()
    .setName("modlogs-config")
    .setDescription("Configure le salon des logs de modération")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      option
        .setName("salon")
        .setDescription("Salon où envoyer les logs de modération")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
    ),

  help: {
    details:
      "Définit le salon textuel où Gaulia publie chaque cas de modération : bannissements, expulsions, sourdines, avertissements et purges. Gaulia doit pouvoir envoyer des messages dans ce salon.",
    examples: ["modlogs-config salon:#logs-moderation"],
  },

  async execute(interaction) {
    const channel = interaction.options.getChannel("salon", true);
    await updateGuild(interaction.guildId!, { modLogChannelId: channel.id });

    await interaction.reply(
      successPayload(
        false,
        "Configuration mise à jour",
        `Les logs de modération seront envoyés dans <#${channel.id}>.`,
      ),
    );
  },
};

export default command;
