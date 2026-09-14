import type { RepliableInteraction } from "discord.js";

import { logger } from "../../client/logger";
import { errorPayload } from "../ui/containers";
import { GauliaError } from "./GauliaError";

/**
 * Point d'entrée unique pour transformer une erreur levée pendant l'exécution d'une commande
 * ou d'un composant en réponse utilisateur Components V2, tout en loggant les erreurs inattendues.
 */
export async function handleInteractionError(
  interaction: RepliableInteraction,
  error: unknown,
): Promise<void> {
  const userMessage =
    error instanceof GauliaError ? error.userMessage : "Une erreur interne est survenue.";

  if (!(error instanceof GauliaError)) {
    logger.error(
      { err: error, interactionId: interaction.id },
      "Erreur non gérée dans une interaction",
    );
  }

  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(errorPayload(true, "Oups", userMessage));
    } else {
      await interaction.reply(errorPayload(true, "Oups", userMessage));
    }
  } catch (replyError) {
    logger.error({ err: replyError }, "Impossible d'envoyer la réponse d'erreur");
  }
}
