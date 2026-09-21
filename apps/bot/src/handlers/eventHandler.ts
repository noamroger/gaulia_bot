import { join } from "node:path";

import type { GauliaClient } from "../client/GauliaClient";
import type { GauliaEvent } from "../structures/Event";
import { filterBySubfolder, loadDefaultExport, walk } from "./walk";

const EVENTS_DIR = join(__dirname, "..", "events");
const MODULES_DIR = join(__dirname, "..", "modules");

export async function loadEvents(client: GauliaClient): Promise<void> {
  const files = [...walk(EVENTS_DIR), ...filterBySubfolder(walk(MODULES_DIR), "events")];

  let count = 0;

  for (const file of files) {
    const event = loadDefaultExport<GauliaEvent>(file);

    if (!event || !event.name || typeof event.execute !== "function") {
      client.logger.warn({ file }, "Event file skipped: invalid default export");
      continue;
    }

    client[event.once ? "once" : "on"](
      event.name,
      (...args) => void event.execute(client, ...args),
    );

    count += 1;
  }

  client.logger.info(`${count} event(s) registered`);
}
