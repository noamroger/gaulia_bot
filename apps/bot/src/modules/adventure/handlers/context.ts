import type { ChatInputCommandInteraction } from "discord.js";

import {
  requireCharacter,
  touchPlayed,
  type CharacterContext,
} from "../services/character/characterService";

/**
 * Preamble shared by every adventure command: the character exists, its gauges are up to date and
 * the visit of the day is recorded (streak of consecutive days, username shown in the admin panel).
 */
export async function playerContext(
  interaction: ChatInputCommandInteraction,
): Promise<CharacterContext> {
  const context = await requireCharacter(interaction.user.id);
  const { character } = await touchPlayed(context.character, interaction.user.username);
  return { character, items: context.items };
}
