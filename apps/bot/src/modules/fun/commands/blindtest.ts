import { SlashCommandBuilder } from "discord.js";

import { Colors } from "../../../client/Constants";
import { GauliaError } from "../../../core/errors";
import { buildContainer, toV2Payload } from "../../../core/ui/containers";
import type { ChatInputCommand } from "../../../structures/Command";
import { BLINDTEST_CATEGORIES } from "../data/blindtestCategories";
import {
  BLINDTEST_DEFAULT_ROUNDS,
  BLINDTEST_DEFAULT_SECONDS,
  requireBlindtestControl,
  skipBlindtestRound,
  startBlindtest,
  stopBlindtest,
} from "../services/blindtest";

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
            .setDescription("Catégorie de musiques")
            .setRequired(true)
            .addChoices(
              ...BLINDTEST_CATEGORIES.map((category) => ({
                name: category.name,
                value: category.id,
              })),
            ),
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
      subcommand.setName("categories").setDescription("Liste les catégories disponibles"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("passer").setDescription("Passe la manche en cours"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("arreter").setDescription("Arrête le blindtest en cours"),
    ),

  help: {
    details:
      "Gaulia joue des extraits de 30 secondes dans ton salon vocal. Écris le titre ou l'artiste dans le salon de la partie : le premier qui trouve marque 1 point pour chacun, les fautes de frappe légères sont tolérées. Seuls les membres présents dans le salon vocal peuvent répondre. Les commandes musique sont indisponibles pendant la partie. Le lanceur et les membres ayant « Gérer le serveur » peuvent passer une manche ou arrêter la partie.",
    examples: [
      "blindtest lancer categorie:Années 80",
      "blindtest lancer categorie:Chanson française manches:15 duree:20",
      "blindtest categories",
    ],
  },

  async execute(interaction, client) {
    if (!interaction.inCachedGuild()) {
      throw new GauliaError("Cette commande n'est utilisable qu'en serveur.");
    }

    switch (interaction.options.getSubcommand()) {
      case "categories": {
        const lines = BLINDTEST_CATEGORIES.map(
          (category) =>
            `**${category.name}** · ${category.tracks.length} titres\n-# ${category.description}`,
        );
        await interaction.reply(
          toV2Payload(
            true,
            buildContainer(Colors.Primary, ["### Catégories de blindtest", ...lines]),
          ),
        );
        return;
      }

      case "passer": {
        const session = requireBlindtestControl(interaction.guildId, interaction.member);
        await skipBlindtestRound(session);
        await interaction.reply(
          toV2Payload(true, buildContainer(Colors.Primary, ["Manche passée."])),
        );
        return;
      }

      case "arreter": {
        const session = requireBlindtestControl(interaction.guildId, interaction.member);
        await interaction.reply(
          toV2Payload(true, buildContainer(Colors.Primary, ["Blindtest arrêté."])),
        );
        await stopBlindtest(session, interaction.user.id);
        return;
      }

      default: {
        if (!interaction.channel) {
          throw new GauliaError("Impossible de lancer un blindtest dans ce salon.");
        }
        await interaction.deferReply();
        const payload = await startBlindtest(client, {
          member: interaction.member,
          channel: interaction.channel,
          categoryId: interaction.options.getString("categorie", true),
          rounds: interaction.options.getInteger("manches") ?? BLINDTEST_DEFAULT_ROUNDS,
          roundSeconds: interaction.options.getInteger("duree") ?? BLINDTEST_DEFAULT_SECONDS,
        });
        await interaction.editReply(payload);
      }
    }
  },
};

export default command;
