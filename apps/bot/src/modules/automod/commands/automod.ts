import { updateGuild } from "@gaulia/database";
import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

import { Colors, Emojis } from "../../../client/Constants";
import { GauliaError } from "../../../core/errors";
import { PermissionLevel } from "../../../core/permissions/permissionLevel";
import { buildContainer, successPayload, toV2Payload } from "../../../core/ui/containers";
import { localizeOption, localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { deleteRule, listRules, setupBaselineRules } from "../services/nativeAutoModService";

const KEY = "automod.commands.automod";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,
  permissionLevel: PermissionLevel.Administrator,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) => localizeSlashCommand(subcommand, `${KEY}.subcommands.setup`))
    .addSubcommand((subcommand) => localizeSlashCommand(subcommand, `${KEY}.subcommands.rules`))
    .addSubcommand((subcommand) =>
      localizeSlashCommand(subcommand, `${KEY}.subcommands.ruleDelete`).addStringOption((option) =>
        localizeOption(option, `${KEY}.subcommands.ruleDelete.options.id`).setRequired(true),
      ),
    )
    .addSubcommand((subcommand) =>
      localizeSlashCommand(subcommand, `${KEY}.subcommands.config`).addChannelOption((option) =>
        localizeOption(option, `${KEY}.subcommands.config.options.logChannel`)
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true),
      ),
    ),

  async execute(interaction, _client, t) {
    const guild = interaction.guild!;
    const subcommand = interaction.options.getSubcommand(true);

    if (subcommand === "setup") {
      const rules = await setupBaselineRules(guild, interaction.user.tag);
      await interaction.reply(
        successPayload(
          false,
          t("automod.setup.title"),
          t("automod.setup.description", { count: rules.length }),
        ),
      );
      return;
    }

    if (subcommand === "rules") {
      const rules = await listRules(guild);
      const lines = [`### ${Emojis.Automod} ${t("automod.rules.title")}`];
      lines.push(
        rules.length === 0
          ? t("automod.rules.empty")
          : rules
              .map((rule) =>
                t("automod.rules.entry", {
                  name: rule.name,
                  id: rule.id,
                  state: t(rule.enabled ? "automod.rules.enabled" : "automod.rules.disabled"),
                }),
              )
              .join("\n"),
      );
      await interaction.reply(toV2Payload(false, buildContainer(Colors.Primary, lines)));
      return;
    }

    if (subcommand === "rule-delete") {
      const ruleId = interaction.options.getString("id", true);
      await deleteRule(guild, ruleId);
      await interaction.reply(successPayload(false, t("automod.rules.deleted")));
      return;
    }

    if (subcommand === "config") {
      const logChannel = interaction.options.getChannel("log_channel", true);
      await updateGuild(guild.id, { automodLogChannelId: logChannel.id });
      await interaction.reply(
        successPayload(
          false,
          t("automod.config.title"),
          t("automod.config.description", { channel: logChannel.id }),
        ),
      );
      return;
    }

    throw new GauliaError("automod.errors.unknownSubcommand");
  },
};

export default command;
