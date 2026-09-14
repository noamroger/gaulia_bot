import { SlashCommandBuilder } from "discord.js";

import { Colors, Emojis } from "../../../client/Constants";
import { GauliaError } from "../../../core/errors";
import { PermissionLevel } from "../../../core/permissions/permissionLevel";
import { buildContainer, toV2Payload } from "../../../core/ui/containers";
import type { ChatInputCommand } from "../../../structures/Command";
import { getModerationCase } from "@gaulia/database";
import { formatDurationMs } from "../../../core/utils/duration";
import { caseTypeLabel } from "../services/moderationService";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  permissionLevel: PermissionLevel.Moderator,
  data: new SlashCommandBuilder()
    .setName("case")
    .setDescription("Affiche le détail d'un cas de modération")
    .addIntegerOption((option) =>
      option.setName("numero").setDescription("Numéro du cas").setRequired(true).setMinValue(1),
    ),

  help: {
    details:
      "Affiche la cible, le modérateur, la date, la raison et, pour une sourdine, la durée d'un cas de modération. Le numéro du cas est indiqué à chaque sanction et dans le salon des logs.",
    examples: ["case numero:12"],
  },

  async execute(interaction) {
    const caseNumber = interaction.options.getInteger("numero", true);
    const moderationCase = await getModerationCase(interaction.guildId!, caseNumber);

    if (!moderationCase) {
      throw new GauliaError(`Aucun cas #${caseNumber} sur ce serveur.`);
    }

    const lines = [
      `### ${Emojis.Moderation} Cas #${moderationCase.caseNumber} — ${caseTypeLabel(moderationCase.type)}`,
      `**Cible :** ${moderationCase.targetTag} (\`${moderationCase.targetId}\`)`,
      `**Modérateur :** ${moderationCase.moderatorTag}`,
      `**Date :** <t:${Math.floor(moderationCase.createdAt.getTime() / 1000)}:F>`,
    ];

    if (moderationCase.reason) lines.push(`**Raison :** ${moderationCase.reason}`);
    if (moderationCase.durationSecs) {
      lines.push(`**Durée :** ${formatDurationMs(moderationCase.durationSecs * 1000)}`);
    }

    await interaction.reply(toV2Payload(false, buildContainer(Colors.Primary, lines)));
  },
};

export default command;
