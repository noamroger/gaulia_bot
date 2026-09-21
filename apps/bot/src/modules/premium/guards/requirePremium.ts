import type { RepliableInteraction } from "discord.js";

import { premiumRequiredPayload } from "../../../core/ui/premium";
import type { Translator } from "../../../i18n";
import { isPremiumGuild } from "../services/entitlementService";

/**
 * Checks a guild's premium subscription. When it has none, answers the interaction with the upsell
 * and returns false. Used either at the top of a fully premium command, or midway through a mixed
 * one (a premium sub mode of `/loop`, for instance).
 */
export async function requirePremium(
  interaction: RepliableInteraction,
  guildId: string,
  featureName: string,
  t: Translator,
): Promise<boolean> {
  if (isPremiumGuild(guildId)) return true;

  const payload = premiumRequiredPayload(true, featureName, t);
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply(payload);
  } else {
    await interaction.reply(payload);
  }

  return false;
}
