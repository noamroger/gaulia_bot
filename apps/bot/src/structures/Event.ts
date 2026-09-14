import type { ClientEvents } from "discord.js";

import type { GauliaClient } from "../client/GauliaClient";

export interface GauliaEvent<K extends keyof ClientEvents = keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute(client: GauliaClient, ...args: ClientEvents[K]): Promise<void> | void;
}
