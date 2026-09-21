import { setUserLanguage, updateGuild } from "@gaulia/database";
import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

import { GauliaError } from "../../../core/errors";
import { infoPayload, successPayload } from "../../../core/ui/containers";
import {
  AUTO_LOCALE,
  createTranslator,
  describeUserLocale,
  forgetGuildLanguage,
  forgetUserLanguage,
  guildLanguageOverride,
  isStoredLocale,
  localizeChoices,
  localizeOption,
  localizeSlashCommand,
  matchDiscordLocale,
  resolveUserLocale,
  type StoredLocale,
} from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";

const KEY = "settings.commands.language";
const CHOICES = [AUTO_LOCALE, "en", "fr"] as const;

/** Reads the option, whose value is one of the codes the catalog lists as choices. */
function readLanguageOption(value: string): StoredLocale {
  if (!isStoredLocale(value)) throw new GauliaError("common.error.internal");
  return value;
}

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: false,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY)
    .addSubcommand((subcommand) => localizeSlashCommand(subcommand, `${KEY}.subcommands.show`))
    .addSubcommand((subcommand) =>
      localizeSlashCommand(subcommand, `${KEY}.subcommands.me`).addStringOption((option) =>
        localizeOption(option, `${KEY}.subcommands.me.options.language`)
          .setRequired(true)
          .addChoices(...localizeChoices(`${KEY}.subcommands.me.options.language`, CHOICES)),
      ),
    )
    .addSubcommand((subcommand) =>
      localizeSlashCommand(subcommand, `${KEY}.subcommands.server`).addStringOption((option) =>
        localizeOption(option, `${KEY}.subcommands.server.options.language`)
          .setRequired(true)
          .addChoices(...localizeChoices(`${KEY}.subcommands.server.options.language`, CHOICES)),
      ),
    ),

  async execute(interaction, _client, t) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "show") {
      const { locale, source } = await describeUserLocale(interaction);
      const lines = [
        t("settings.language.yours", { language: t(`common.language.${locale}`) }),
        t(`settings.language.source${source[0]!.toUpperCase()}${source.slice(1)}`),
      ];

      if (interaction.guildId) {
        const override = await guildLanguageOverride(interaction.guildId);
        lines.push(
          override
            ? t("settings.language.guildLine", { language: t(`common.language.${override}`) })
            : t("settings.language.guildLineAuto"),
        );
      }

      await interaction.reply(
        infoPayload(true, t("settings.language.showTitle"), lines.join("\n")),
      );
      return;
    }

    if (subcommand === "me") {
      const choice = readLanguageOption(interaction.options.getString("language", true));
      await setUserLanguage(interaction.user.id, choice);
      forgetUserLanguage(interaction.user.id);

      // Confirm in the language that is now in force, not the one the member had a second ago.
      const next = createTranslator(await resolveUserLocale(interaction));
      await interaction.reply(
        successPayload(
          true,
          next("settings.language.showTitle"),
          choice === AUTO_LOCALE
            ? next("settings.language.userUpdatedAuto")
            : next("settings.language.userUpdated", {
                language: next(`common.language.${choice}`),
              }),
        ),
      );
      return;
    }

    if (!interaction.inCachedGuild()) {
      throw new GauliaError("settings.language.guildOnly");
    }
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      throw new GauliaError("settings.language.needsManageGuild");
    }

    const choice = readLanguageOption(interaction.options.getString("language", true));
    await updateGuild(interaction.guildId, { language: choice });
    forgetGuildLanguage(interaction.guildId);

    const effective = choice === AUTO_LOCALE ? matchDiscordLocale(interaction.guildLocale) : choice;
    const next = effective ? createTranslator(effective) : t;

    await interaction.reply(
      successPayload(
        true,
        next("settings.language.showTitle"),
        choice === AUTO_LOCALE
          ? next("settings.language.guildUpdatedAuto")
          : next("settings.language.guildUpdated", { language: next(`common.language.${choice}`) }),
      ),
    );
  },
};

export default command;
