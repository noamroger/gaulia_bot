import { listActiveWarns } from "@gaulia/database";
import { SlashCommandBuilder } from "discord.js";

import { Colors, Emojis } from "../../../client/Constants";
import { PermissionLevel } from "../../../core/permissions/permissionLevel";
import { buildContainer, toV2Payload } from "../../../core/ui/containers";
import { localizeOption, localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";

const KEY = "moderation.commands.warnings";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,
  permissionLevel: PermissionLevel.Moderator,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY).addUserOption((option) =>
    localizeOption(option, `${KEY}.options.user`).setRequired(true),
  ),

  async execute(interaction, _client, t) {
    const targetUser = interaction.options.getUser("user", true);
    const warns = await listActiveWarns(interaction.guildId!, targetUser.id);

    const lines = [
      `### ${Emojis.Warning} ${t("moderation.warnings.title", { target: targetUser.tag })}`,
    ];

    if (warns.length === 0) {
      lines.push(t("moderation.warnings.empty"));
    } else {
      lines.push(
        warns
          .map((warn) =>
            t("moderation.warnings.entry", {
              id: warn.id,
              reason: warn.reason ?? t("moderation.warnings.noReason"),
              date: `<t:${Math.floor(warn.createdAt.getTime() / 1000)}:R>`,
            }),
          )
          .join("\n"),
      );
    }

    await interaction.reply(toV2Payload(true, buildContainer(Colors.Warning, lines)));
  },
};

export default command;
