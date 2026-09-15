import type { ChatInputCommandInteraction } from "discord.js";

import {
  requireCharacter,
  touchPlayed,
  type CharacterContext,
} from "../services/character/characterService";

/**
 * Préambule commun à toutes les commandes d'aventure : le personnage existe, ses jauges sont à
 * jour et son passage du jour est enregistré (série de jours consécutifs, pseudo affiché au panel
 * admin).
 */
export async function playerContext(
  interaction: ChatInputCommandInteraction,
): Promise<CharacterContext> {
  const context = await requireCharacter(interaction.user.id);
  const { character } = await touchPlayed(context.character, interaction.user.username);
  return { character, items: context.items };
}
