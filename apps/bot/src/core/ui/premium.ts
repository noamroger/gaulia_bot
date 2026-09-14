import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { MessageActionRowComponentBuilder } from "discord.js";

import { env } from "../../config/env";
import { Colors, Emojis } from "../../client/Constants";
import { buildContainer, toV2Payload, type V2MessagePayload } from "./containers";

/**
 * Helper pour construire un message Components V2 de type "premium" (couleur, titre, bouton d'achat).
 * Si l'ID de SKU premium n'est pas défini dans la config, le bouton d'achat n'est pas affiché.
 * @param ephemeral si le message doit être éphémère ou non
 * @param lines lignes de texte à afficher dans le container
 * @returns payload Components V2 prêt à être envoyé en réponse à une interaction
 */
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

/**
 * Payload d'upsell Components V2 affiché quand une commande premium est utilisée sans abonnement.
 * Utilise le helper `premiumPayload` pour construire le message, avec un titre et un message par défaut.
 */
export function premiumRequiredPayload(ephemeral: boolean, featureName: string): V2MessagePayload {
  return premiumPayload(ephemeral, [
    `### ${Emojis.Premium} Fonctionnalité premium`,
    `**${featureName}** est réservée aux serveurs disposant de **Gaulia Premium**.`,
  ]);
}

/**
 * Message Components V2 affiché par la commande `/premium upgrade` pour inviter l'utilisateur à passer le serveur en premium.
 * Utilise le helper `premiumPayload` pour construire le message, avec un titre et un message par défaut. 
 */
export function premiumInvitationPayload(ephemeral: boolean): V2MessagePayload {
  return premiumPayload(ephemeral, [
    `### ${Emojis.Premium} Profitez de Gaulia Premium !`,
    "Ce serveur ne dispose pas de **Gaulia Premium**. Passe en premium pour profiter de : 24/7, filtres audio, file d'attente étendue et règles automod avancées.",
  ]);
}