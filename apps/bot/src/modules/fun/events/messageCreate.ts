import { Events, type Message } from "discord.js";

import type { GauliaClient } from "../../../client/GauliaClient";
import type { GauliaEvent } from "../../../structures/Event";
import { handleBlindtestMessage } from "../services/blindtest";

/** Compare les messages du salon d'un blindtest en cours aux réponses attendues. */
const event: GauliaEvent<typeof Events.MessageCreate> = {
  name: Events.MessageCreate,
  async execute(client: GauliaClient, message: Message) {
    try {
      await handleBlindtestMessage(message);
    } catch (error) {
      client.logger.error(
        { err: error },
        "Erreur lors de la vérification d'une réponse de blindtest",
      );
    }
  },
};

export default event;
