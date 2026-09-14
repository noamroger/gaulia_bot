import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import { GauliaError } from "../../../core/errors";
import type { ChatInputCommand } from "../../../structures/Command";
import { interventionOf, musicActionPayload } from "../services/musicUi";
import { getPlayerOrThrow, requireSameVoiceChannel, resolveMember } from "../services/playerUtils";

const FILTER_CHOICES = [
  { name: "Bassboost", value: "bassboost" },
  { name: "Nightcore", value: "nightcore" },
  { name: "Vaporwave", value: "vaporwave" },
  { name: "8D", value: "8d" },
  { name: "Réinitialiser", value: "clear" },
] as const;

type FilterName = (typeof FILTER_CHOICES)[number]["value"];

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  premiumOnly: true,
  data: new SlashCommandBuilder()
    .setName("filters")
    .setDescription("[Premium] Applique un filtre audio à la lecture en cours")
    .addStringOption((option) =>
      option
        .setName("filtre")
        .setDescription("Filtre à appliquer")
        .setRequired(true)
        .addChoices(...FILTER_CHOICES),
    ),

  help: {
    details:
      "Applique un effet audio à la lecture en cours. Nightcore, Vaporwave et 8D s'activent ou se désactivent à chaque utilisation, Bassboost renforce les basses et Réinitialiser retire tous les filtres. Tu dois être dans le même salon vocal que Gaulia.",
    examples: ["filters filtre:Nightcore", "filters filtre:Réinitialiser"],
  },

  async execute(interaction, client) {
    const member = await resolveMember(interaction);
    const player = getPlayerOrThrow(client, interaction.guildId!);
    requireSameVoiceChannel(member, player);

    const filter = interaction.options.getString("filtre", true) as FilterName;

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
        throw new GauliaError("Filtre inconnu.");
    }

    const label = FILTER_CHOICES.find((choice) => choice.value === filter)!.name;
    const intervention = interventionOf(interaction.user);

    await interaction.reply(
      musicActionPayload(
        interaction.user,
        Emojis.Filters,
        "Filtre audio",
        filter === "clear"
          ? `Les filtres ont été réinitialisés ${intervention}.`
          : `Le filtre \`${label}\` a été appliqué ${intervention}.`,
      ),
    );
  },
};

export default command;
