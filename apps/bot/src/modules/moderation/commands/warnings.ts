import { SlashCommandBuilder } from "discord.js";

import { Colors, Emojis } from "../../../client/Constants";
import { PermissionLevel } from "../../../core/permissions/permissionLevel";
import { buildContainer, toV2Payload } from "../../../core/ui/containers";
import type { ChatInputCommand } from "../../../structures/Command";
import { listActiveWarns } from "@gaulia/database";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  permissionLevel: PermissionLevel.Moderator,
  data: new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("Liste les avertissements actifs d'un membre")
    .addUserOption((option) =>
      option.setName("utilisateur").setDescription("Membre concerné").setRequired(true),
    ),

  help: {
    details:
      "Liste les avertissements actifs d'un membre avec leur numéro, leur raison et leur date. La réponse n'est visible que par toi.",
    examples: ["warnings utilisateur:@Pseudo"],
  },

  async execute(interaction) {
    const targetUser = interaction.options.getUser("utilisateur", true);
    const warns = await listActiveWarns(interaction.guildId!, targetUser.id);

    const lines = [`### ${Emojis.Warning} Avertissements de ${targetUser.tag}`];

    if (warns.length === 0) {
      lines.push("Aucun avertissement actif.");
    } else {
      lines.push(
        warns
          .map(
            (warn) =>
              `**#${warn.id}** - ${warn.reason ?? "Sans raison"} (<t:${Math.floor(warn.createdAt.getTime() / 1000)}:R>)`,
          )
          .join("\n"),
      );
    }

    await interaction.reply(toV2Payload(true, buildContainer(Colors.Warning, lines)));
  },
};

export default command;
