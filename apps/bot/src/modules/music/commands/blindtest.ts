import { SlashCommandBuilder } from "discord.js";

import { Colors } from "../../../client/Constants";
import { GauliaError } from "../../../core/errors";
import { buildContainer, toV2Payload } from "../../../core/ui/containers";
import { localizeOption, localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import {
  assertBlindtestChannel,
  BLINDTEST_DEFAULT_ROUNDS,
  BLINDTEST_DEFAULT_SECONDS,
  blindtestCategoryChoices,
  listBlindtestCategoryLines,
  requireBlindtestControl,
  resolveBlindtestCategory,
  skipBlindtestRound,
  startBlindtest,
  stopBlindtest,
} from "../services/blindtest";

const KEY = "music.commands.blindtest";
const MIN_ROUNDS = 3;
const MAX_ROUNDS = 30;
const MIN_ROUND_SECONDS = 10;
const MAX_ROUND_SECONDS = 30;

function ephemeralText(lines: string[]) {
  return toV2Payload(true, buildContainer(Colors.Primary, lines));
}

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  cooldownSeconds: 3,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY)
    .addSubcommand((subcommand) =>
      localizeSlashCommand(subcommand, `${KEY}.subcommands.start`)
        .addStringOption((option) =>
          localizeOption(option, `${KEY}.subcommands.start.options.category`)
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addIntegerOption((option) =>
          localizeOption(option, `${KEY}.subcommands.start.options.rounds`)
            .setMinValue(MIN_ROUNDS)
            .setMaxValue(MAX_ROUNDS),
        )
        .addIntegerOption((option) =>
          localizeOption(option, `${KEY}.subcommands.start.options.duration`)
            .setMinValue(MIN_ROUND_SECONDS)
            .setMaxValue(MAX_ROUND_SECONDS),
        ),
    )
    .addSubcommand((subcommand) =>
      localizeSlashCommand(subcommand, `${KEY}.subcommands.categories`),
    )
    .addSubcommand((subcommand) => localizeSlashCommand(subcommand, `${KEY}.subcommands.skip`))
    .addSubcommand((subcommand) => localizeSlashCommand(subcommand, `${KEY}.subcommands.stop`)),

  async autocomplete(interaction, _client, t) {
    if (!interaction.inCachedGuild()) {
      await interaction.respond([]);
      return;
    }
    await interaction.respond(
      await blindtestCategoryChoices(interaction.guildId, interaction.options.getFocused(), t),
    );
  },

  async execute(interaction, client, t) {
    if (!interaction.inCachedGuild()) {
      throw new GauliaError("common.guard.guildOnly.description");
    }

    switch (interaction.options.getSubcommand()) {
      case "categories": {
        const lines = await listBlindtestCategoryLines(interaction.guildId, t);
        await interaction.reply(
          ephemeralText([`### ${t("music.blindtest.categoriesTitle")}`, ...lines]),
        );
        return;
      }

      case "skip": {
        const session = requireBlindtestControl(interaction.guildId, interaction.member);
        await skipBlindtestRound(session);
        await interaction.reply(ephemeralText([t("music.blindtest.round.skipped")]));
        return;
      }

      case "stop": {
        const session = requireBlindtestControl(interaction.guildId, interaction.member);
        await interaction.reply(ephemeralText([t("music.blindtest.stopReply")]));
        await stopBlindtest(session, interaction.user.id);
        return;
      }

      default: {
        if (!interaction.channel) {
          throw new GauliaError("music.blindtest.error.unsupportedChannel");
        }
        await assertBlindtestChannel(
          interaction.member,
          interaction.channel,
          interaction.channelId,
        );
        const category = await resolveBlindtestCategory(
          interaction.guildId,
          interaction.options.getString("category", true),
        );

        await interaction.deferReply();
        const payload = await startBlindtest(client, {
          member: interaction.member,
          channel: interaction.channel,
          category,
          rounds: interaction.options.getInteger("rounds") ?? BLINDTEST_DEFAULT_ROUNDS,
          roundSeconds: interaction.options.getInteger("duration") ?? BLINDTEST_DEFAULT_SECONDS,
        });
        await interaction.editReply(payload);
      }
    }
  },
};

export default command;
