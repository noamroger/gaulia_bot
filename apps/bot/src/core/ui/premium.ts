import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { MessageActionRowComponentBuilder } from "discord.js";

import { Colors, Emojis } from "../../client/Constants";
import { env } from "../../config/env";
import type { Translator } from "../../i18n";
import { buildContainer, toV2Payload, type V2MessagePayload } from "./containers";

/** Premium coloured container, with the purchase button only when a SKU is configured. */
export function premiumPayload(ephemeral: boolean, lines: string[]): V2MessagePayload {
  const container = buildContainer(Colors.Premium, lines);

  if (!env.PREMIUM_SKU_ID) {
    return toV2Payload(ephemeral, container);
  }

  const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder().setStyle(ButtonStyle.Premium).setSKUId(env.PREMIUM_SKU_ID),
  );

  return toV2Payload(ephemeral, container, row);
}

/** Upsell shown when a premium command is used on a server without the subscription. */
export function premiumRequiredPayload(
  ephemeral: boolean,
  featureName: string,
  t: Translator,
): V2MessagePayload {
  return premiumPayload(ephemeral, [
    `### ${Emojis.Premium} ${t("common.premium.featureTitle")}`,
    t("common.premium.featureDescription", { feature: featureName }),
  ]);
}

/** Invitation shown by `/premium upgrade`. */
export function premiumInvitationPayload(ephemeral: boolean, t: Translator): V2MessagePayload {
  return premiumPayload(ephemeral, [
    `### ${Emojis.Premium} ${t("common.premium.invitationTitle")}`,
    t("common.premium.invitationDescription"),
  ]);
}
