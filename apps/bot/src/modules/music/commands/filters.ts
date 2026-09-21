import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import { GauliaError } from "../../../core/errors";
import { localizeChoices, localizeOption, localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { musicActionPayload } from "../services/musicUi";
import { getPlayerOrThrow, requireSameVoiceChannel, resolveMember } from "../services/playerUtils";

const KEY = "music.commands.filters";
const FILTERS = ["bassboost", "nightcore", "vaporwave", "8d", "clear"] as const;

type FilterName = (typeof FILTERS)[number];

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,
  premiumOnly: true,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY).addStringOption((option) =>
    localizeOption(option, `${KEY}.options.filter`)
      .setRequired(true)
      .addChoices(...localizeChoices(`${KEY}.options.filter`, FILTERS)),
  ),

  async execute(interaction, client, t) {
    const member = await resolveMember(interaction);
    const player = getPlayerOrThrow(client, interaction.guildId!);
    requireSameVoiceChannel(member, player);

    const filter = interaction.options.getString("filter", true) as FilterName;

    switch (filter) {
      case "bassboost":
        await player.filterManager.setEQPreset("BassboostMedium");
        break;
      case "nightcore":
        await player.filterManager.toggleNightcore();
        break;
      case "vaporwave":
        await player.filterManager.toggleVaporwave();
        break;
      case "8d":
        await player.filterManager.toggleRotation();
        break;
      case "clear":
        await player.filterManager.resetFilters();
        break;
      default:
        throw new GauliaError("music.error.unknownFilter");
    }

    await interaction.reply(
      musicActionPayload(
        interaction.user,
        Emojis.Filters,
        t("music.actions.filters.title"),
        filter === "clear"
          ? t("music.actions.filters.cleared", { user: interaction.user.id })
          : t("music.actions.filters.applied", {
              filter: t(`${KEY}.options.filter.choices.${filter}`),
              user: interaction.user.id,
            }),
      ),
    );
  },
};

export default command;
