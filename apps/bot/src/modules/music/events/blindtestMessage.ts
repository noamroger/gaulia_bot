import { Events, type Message } from "discord.js";

import type { GauliaClient } from "../../../client/GauliaClient";
import type { GauliaEvent } from "../../../structures/Event";
import { handleBlindtestMessage } from "../services/blindtest";

/** Matches the messages of a running blindtest channel against the expected answers. */
const event: GauliaEvent<typeof Events.MessageCreate> = {
  name: Events.MessageCreate,
  async execute(client: GauliaClient, message: Message) {
    try {
      await handleBlindtestMessage(message);
    } catch (error) {
      client.logger.error({ err: error }, "Could not check a blindtest answer");
    }
  },
};

export default event;
