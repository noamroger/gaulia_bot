import { getOrCreateGuild } from "@gaulia/database";
import { SlashCommandBuilder, time, TimestampStyles } from "discord.js";

import { env } from "../../../config/env";
import { buildContainer, toV2Payload } from "../../../core/ui/containers";
import { premiumInvitationPayload } from "../../../core/ui/premium";
import { Colors, Emojis } from "../../../client/Constants";
import { GauliaError } from "../../../core/errors";
import type { ChatInputCommand } from "../../../structures/Command";
import { isPremiumGuild } from "../services/entitlementService";

/** Rappel des offres gratuites du dashboard, affiché quand le serveur n'a pas (encore) le premium. */
function creditsHint(): string[] {
  const voteUrl = `https://top.gg/bot/${env.DISCORD_CLIENT_ID}/vote`;
  const dashboardHint = env.DASHBOARD_URL
    ? ` puis échange-les dans l'onglet premium de ton serveur sur [le dashboard](${env.DASHBOARD_URL}/dashboard)`
    : " puis échange-les dans l'onglet premium de ton serveur sur le dashboard";

  return [
    "",
    `**Gratuit :** [vote pour Gaulia](${voteUrl}) pour gagner 10 crédits par vote${dashboardHint} : 150 crédits pour une semaine de premium, 500 pour un mois.`,
  ];
}

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
      "Gaulia Premium débloque le mode 24/7, les filtres audio, une file d'attente étendue et les règles automod avancées. `status` indique si ce serveur en profite, `upgrade` affiche les options d'abonnement — dont la semaine ou le mois offerts contre des crédits gagnés en votant.",
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
    const guild = await getOrCreateGuild(interaction.guildId);
    const grantedUntil =
      guild.premiumGrantedUntil && guild.premiumGrantedUntil.getTime() > Date.now()
        ? guild.premiumGrantedUntil
        : null;

    const lines = premium
      ? [
          `### ${Emojis.Premium} Gaulia Premium actif`,
          "Ce serveur profite de : 24/7, filtres audio, file d'attente étendue et règles automod avancées.",
          ...(grantedUntil
            ? [
                `Premium offert (crédits) jusqu'au ${time(grantedUntil, TimestampStyles.LongDate)} (${time(grantedUntil, TimestampStyles.RelativeTime)}).`,
              ]
            : []),
        ]
      : [
          "### Statut premium",
          "Ce serveur n'a pas Gaulia Premium.",
          env.PREMIUM_SKU_ID
            ? "Utilise `/premium upgrade` pour voir les options d'abonnement."
            : "Le SKU premium n'est pas encore configuré côté bot.",
          ...creditsHint(),
        ];

    await interaction.reply(
      toV2Payload(true, buildContainer(premium ? Colors.Premium : Colors.Neutral, lines)),
    );
  },
};

export default command;
