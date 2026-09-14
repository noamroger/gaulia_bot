import type { RepliableInteraction } from "discord.js";

import { premiumRequiredPayload } from "../../../core/ui/premium";
import { isPremiumGuild } from "../services/entitlementService";

/**
 * Vérifie qu'une guilde a l'abonnement premium. Si non, répond directement à l'interaction avec
 * l'upsell Components V2 et retourne false — à utiliser en garde en tête d'exécution (commande
 * entièrement premium) ou au milieu d'une commande mixte (ex: un sous-mode premium de `/loop`).
 */
export async function requirePremium(
  interaction: RepliableInteraction,
  guildId: string,
  featureName: string,
): Promise<boolean> {
  if (isPremiumGuild(guildId)) return true;

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply(premiumRequiredPayload(true, featureName));
  } else {
    await interaction.reply(premiumRequiredPayload(true, featureName));
  }

  return false;
}
