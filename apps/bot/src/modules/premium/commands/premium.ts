import { getOrCreateGuild } from "@gaulia/database";
import { SlashCommandBuilder, time, TimestampStyles } from "discord.js";

import { Colors, Emojis } from "../../../client/Constants";
import { env } from "../../../config/env";
import { GauliaError } from "../../../core/errors";
import { buildContainer, toV2Payload } from "../../../core/ui/containers";
import { premiumInvitationPayload } from "../../../core/ui/premium";
import { localizeSlashCommand, type Translator } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { isPremiumGuild } from "../services/entitlementService";

const KEY = "premium.commands.premium";

/** Reminder of the dashboard's free offers, shown when the server is not premium yet. */
function creditsHint(t: Translator): string[] {
  const voteUrl = `https://top.gg/bot/${env.DISCORD_CLIENT_ID}/vote`;
  const dashboardHint = env.DASHBOARD_URL
    ? t("premium.status.creditsDashboardLink", { dashboardUrl: env.DASHBOARD_URL })
    : t("premium.status.creditsDashboardPlain");

  return ["", t("premium.status.creditsHint", { voteUrl, dashboardHint })];
}

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY)
    .addSubcommand((subcommand) => localizeSlashCommand(subcommand, `${KEY}.subcommands.status`))
    .addSubcommand((subcommand) => localizeSlashCommand(subcommand, `${KEY}.subcommands.upgrade`)),

  async execute(interaction, _client, t) {
    if (!interaction.guildId) {
      throw new GauliaError("common.guard.guildOnly.description");
    }

    const subcommand = interaction.options.getSubcommand(true);
    const premium = isPremiumGuild(interaction.guildId);

    if (subcommand === "upgrade") {
      if (premium) {
        await interaction.reply(
          toV2Payload(
            false,
            buildContainer(Colors.Premium, [
              `### ${Emojis.Premium} ${t("premium.upgrade.alreadyTitle")}`,
              t("premium.upgrade.alreadyDescription"),
            ]),
          ),
        );
        return;
      }

      await interaction.reply(premiumInvitationPayload(true, t));
      return;
    }

    const guild = await getOrCreateGuild(interaction.guildId);
    const grantedUntil =
      guild.premiumGrantedUntil && guild.premiumGrantedUntil.getTime() > Date.now()
        ? guild.premiumGrantedUntil
        : null;

    const lines = premium
      ? [
          `### ${Emojis.Premium} ${t("premium.status.activeTitle")}`,
          t("premium.status.activeDescription"),
          ...(grantedUntil
            ? [
                t("premium.status.grantedUntil", {
                  date: time(grantedUntil, TimestampStyles.LongDate),
                  relative: time(grantedUntil, TimestampStyles.RelativeTime),
                }),
              ]
            : []),
        ]
      : [
          `### ${t("premium.status.inactiveTitle")}`,
          t("premium.status.inactiveDescription"),
          env.PREMIUM_SKU_ID ? t("premium.status.upgradeHint") : t("premium.status.skuMissing"),
          ...creditsHint(t),
        ];

    await interaction.reply(
      toV2Payload(true, buildContainer(premium ? Colors.Premium : Colors.Neutral, lines)),
    );
  },
};

export default command;
