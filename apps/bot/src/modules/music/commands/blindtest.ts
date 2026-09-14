import { SlashCommandBuilder } from "discord.js";

import { Colors } from "../../../client/Constants";
import { GauliaError } from "../../../core/errors";
import { buildContainer, toV2Payload } from "../../../core/ui/containers";
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

function ephemeralText(lines: string[]) {
  return toV2Payload(true, buildContainer(Colors.Primary, lines));
}

const command: ChatInputCommand = {
  type: "chatInput",
  cooldownSeconds: 3,
  data: new SlashCommandBuilder()
    .setName("blindtest")
    .setDescription("Blindtest musical dans ton salon vocal")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("lancer")
        .setDescription("Lance un blindtest dans ton salon vocal")
        .addStringOption((option) =>
          option
            .setName("categorie")
            .setDescription("Catégorie ou liste de musiques du serveur")
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("manches")
            .setDescription(`Nombre de manches (${BLINDTEST_DEFAULT_ROUNDS} par défaut)`)
            .setMinValue(3)
            .setMaxValue(30),
        )
        .addIntegerOption((option) =>
          option
            .setName("duree")
            .setDescription(
              `Durée d'une manche en secondes (${BLINDTEST_DEFAULT_SECONDS} par défaut)`,
            )
            .setMinValue(10)
            .setMaxValue(30),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("categories")
        .setDescription("Liste les catégories et listes disponibles sur ce serveur"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("passer").setDescription("Passe la manche en cours"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("arreter").setDescription("Arrête le blindtest en cours"),
    ),

  help: {
    details:
      "Gaulia joue des extraits de 30 secondes dans ton salon vocal. Écris le titre ou l'artiste dans le salon de la partie : le premier qui trouve marque 1 point pour chacun, les fautes de frappe légères sont tolérées. Seuls les membres présents dans le salon vocal peuvent répondre. Les catégories proposées, les listes personnalisées et les salons autorisés se règlent dans l'onglet Musique du dashboard. Les commandes musique sont indisponibles pendant la partie. Le lanceur et les membres ayant « Gérer le serveur » peuvent passer une manche ou arrêter la partie.",
    examples: [
      "blindtest lancer categorie:Années 80",
      "blindtest lancer categorie:Chanson française manches:15 duree:20",
      "blindtest categories",
    ],
  },

  async autocomplete(interaction) {
    if (!interaction.inCachedGuild()) {
      await interaction.respond([]);
      return;
    }
    await interaction.respond(
      await blindtestCategoryChoices(interaction.guildId, interaction.options.getFocused()),
    );
  },

  async execute(interaction, client) {
    if (!interaction.inCachedGuild()) {
      throw new GauliaError("Cette commande n'est utilisable qu'en serveur.");
    }

    switch (interaction.options.getSubcommand()) {
      case "categories": {
        const lines = await listBlindtestCategoryLines(interaction.guildId);
        await interaction.reply(ephemeralText(["### Blindtest", ...lines]));
        return;
      }

      case "passer": {
        const session = requireBlindtestControl(interaction.guildId, interaction.member);
        await skipBlindtestRound(session);
        await interaction.reply(ephemeralText(["Manche passée."]));
        return;
      }

      case "arreter": {
        const session = requireBlindtestControl(interaction.guildId, interaction.member);
        await interaction.reply(ephemeralText(["Blindtest arrêté."]));
        await stopBlindtest(session, interaction.user.id);
        return;
      }

      default: {
        if (!interaction.channel) {
          throw new GauliaError("Impossible de lancer un blindtest dans ce salon.");
        }
        await assertBlindtestChannel(
          interaction.member,
          interaction.channel,
          interaction.channelId,
        );
        const category = await resolveBlindtestCategory(
          interaction.guildId,
          interaction.options.getString("categorie", true),
        );

        await interaction.deferReply();
        const payload = await startBlindtest(client, {
          member: interaction.member,
          channel: interaction.channel,
          category,
          rounds: interaction.options.getInteger("manches") ?? BLINDTEST_DEFAULT_ROUNDS,
          roundSeconds: interaction.options.getInteger("duree") ?? BLINDTEST_DEFAULT_SECONDS,
        });
        await interaction.editReply(payload);
      }
    }
  },
};

export default command;
