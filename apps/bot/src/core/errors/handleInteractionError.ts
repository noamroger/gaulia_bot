import type { RepliableInteraction } from "discord.js";

import { logger } from "../../client/logger";
import { defaultTranslator, translatorFor, type Translator } from "../../i18n";
import { errorPayload } from "../ui/containers";
import { GauliaError } from "./GauliaError";

/** Falls back to English rather than losing the reply when the language lookup itself fails. */
async function safeTranslator(interaction: RepliableInteraction): Promise<Translator> {
  try {
    return await translatorFor(interaction);
  } catch (error) {
    logger.error({ err: error }, "Could not resolve the locale of an interaction");
    return defaultTranslator();
  }
}

/**
 * Single entry point turning an error raised by a command or a component into a Components V2
 * reply, while logging the ones that were not expected.
 */
export async function handleInteractionError(
  interaction: RepliableInteraction,
  error: unknown,
): Promise<void> {
  const t = await safeTranslator(interaction);
  const userMessage =
    error instanceof GauliaError ? t(error.key, error.vars) : t("common.error.internal");

  if (!(error instanceof GauliaError)) {
    logger.error(
      { err: error, interactionId: interaction.id },
      "Unhandled error in an interaction",
    );
  }

  const payload = errorPayload(true, t("common.error.title"), userMessage);

  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(payload);
    } else {
      await interaction.reply(payload);
    }
  } catch (replyError) {
    logger.error({ err: replyError }, "Could not send the error reply");
  }
}
