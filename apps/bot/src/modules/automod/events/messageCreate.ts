import { Events, type Message } from "discord.js";

import type { GauliaClient } from "../../../client/GauliaClient";
import type { GauliaEvent } from "../../../structures/Event";
import { runCustomAutoMod } from "../services/customAutoModService";

const event: GauliaEvent<typeof Events.MessageCreate> = {
  name: Events.MessageCreate,
  async execute(client: GauliaClient, message: Message) {
    try {
      await runCustomAutoMod(message);
    } catch (error) {
      client.logger.error({ err: error }, "Custom automod layer failed");
    }
  },
};

export default event;
