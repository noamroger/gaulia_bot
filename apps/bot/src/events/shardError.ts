import { Events } from "discord.js";

import type { GauliaClient } from "../client/GauliaClient";
import type { GauliaEvent } from "../structures/Event";

const event: GauliaEvent<typeof Events.ShardError> = {
  name: Events.ShardError,
  execute(client: GauliaClient, error: Error, shardId: number) {
    client.logger.error({ err: error, shardId }, "Shard error");
  },
};

export default event;
