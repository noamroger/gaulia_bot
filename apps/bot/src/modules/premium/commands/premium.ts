import { SlashCommandBuilder } from "discord.js";

import { env } from "../../../config/env";
import { buildContainer, toV2Payload } from "../../../core/ui/containers";
import { premiumInvitationPayload } from "../../../core/ui/premium";
import { Colors, Emojis } from "../../../client/Constants";
import { GauliaError } from "../../../core/errors";
import type { ChatInputCommand } from "../../../structures/Command";
import { isPremiumGuild } from "../services/entitlementService";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("premium")
    .setDescription("Gère l'abonnement Gaulia Premium de ce serveur")
    .addSubcommand((sub) =>
      sub.setName("status").setDescription("Affiche le statut premium de ce serveur"),
    )
    .addSubcommand((sub) =>
      sub.setName("upgrade").setDescription("Affiche le lien pour passer ce serveur en premium"),
    ),

  help: {
    details:
      "Gaulia Premium débloque le mode 24/7, les filtres audio, une file d'attente étendue et les règles automod avancées. `status` indique si ce serveur en profite, `upgrade` affiche les options d'abonnement.",
    examples: ["premium status", "premium upgrade"],
  },

  async execute(interaction) {
    if (!interaction.guildId) {
      throw new GauliaError("Cette commande n'est utilisable qu'en serveur.");
    }

    const subcommand = interaction.options.getSubcommand(true);
    const premium = isPremiumGuild(interaction.guildId);

    if (subcommand === "upgrade") {
      if (premium) {
        await interaction.reply(
          toV2Payload(
            false,
            buildContainer(Colors.Premium, [
              `### ${Emojis.Premium} Déjà premium`,
              "Ce serveur profite déjà de Gaulia Premium, merci pour ton soutien !",
            ]),
          ),
        );
        return;
      }

      await interaction.reply(premiumInvitationPayload(true));
      return;
    }

    // status
    const lines = premium
      ? [
          `### ${Emojis.Premium} Gaulia Premium actif`,
          "Ce serveur profite de : 24/7, filtres audio, file d'attente étendue et règles automod avancées.",
        ]
      : [
          "### Statut premium",
          "Ce serveur n'a pas Gaulia Premium.",
          env.PREMIUM_SKU_ID
            ? "Utilise `/premium upgrade` pour voir les options d'abonnement."
            : "Le SKU premium n'est pas encore configuré côté bot.",
        ];

    await interaction.reply(
      toV2Payload(true, buildContainer(premium ? Colors.Premium : Colors.Neutral, lines)),
    );
  },
};

export default command;
