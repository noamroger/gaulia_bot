import { getAdventureSettings } from "@gaulia/database";
import type { ChatInputCommandInteraction, Interaction } from "discord.js";

import { GauliaError } from "../../../../core/errors";

const MAX_LISTED_CHANNELS = 5;

/**
 * Où l'aventure peut se jouer. Les messages privés sont toujours ouverts ; sur un serveur, tout
 * dépend du réglage du dashboard :
 *
 * - liste blanche (par défaut, vide) : l'aventure n'est jouable que dans les salons autorisés,
 *   donc nulle part tant que le serveur n'en a choisi aucun ;
 * - liste noire : jouable partout sauf dans les salons listés.
 *
 * Contrairement aux autres modules, les administrateurs ne contournent pas la règle : le but du
 * réglage est justement de cantonner le jeu à des salons précis, quel que soit le membre.
 */
export async function assertAdventureAccess(
  interaction: ChatInputCommandInteraction | Interaction,
): Promise<void> {
  if (!interaction.inGuild()) return;

  const settings = await getAdventureSettings(interaction.guildId);
  if (!settings.enabled) {
    throw new GauliaError(
      "Le module aventure est désactivé sur ce serveur. Tu peux toujours jouer en message privé avec Gaulia.",
    );
  }

  const channel = interaction.channel;
  const channelId =
    channel && "isThread" in channel && channel.isThread()
      ? (channel.parentId ?? interaction.channelId)
      : interaction.channelId;

  // `channelId` peut être absent sur certaines interactions : on considère alors le salon comme
  // non listé, ce qui applique le réglage par défaut du serveur.
  const listed = channelId !== null && settings.channelIds.includes(channelId);

  if (settings.channelMode === "BLOCKLIST") {
    if (!listed) return;
    throw new GauliaError("L'aventure n'est pas autorisée dans ce salon.");
  }

  if (listed) return;

  if (settings.channelIds.length === 0) {
    throw new GauliaError(
      "Aucun salon d'aventure n'est autorisé sur ce serveur. Demande à un administrateur d'en ouvrir un depuis le tableau de bord - ou joue en message privé avec Gaulia.",
    );
  }

  const shown = settings.channelIds
    .slice(0, MAX_LISTED_CHANNELS)
    .map((id) => `<#${id}>`)
    .join(", ");
  const more = settings.channelIds.length > MAX_LISTED_CHANNELS ? "…" : "";
  throw new GauliaError(`L'aventure se joue dans : ${shown}${more} - ou en message privé.`);
}
