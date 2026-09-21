import { join } from "node:path";

import type { GauliaClient } from "../client/GauliaClient";
import type { GauliaComponent } from "../structures/Component";
import { filterBySubfolder, loadDefaultExport, walk } from "./walk";

const MODULES_DIR = join(__dirname, "..", "modules");

export async function loadComponents(client: GauliaClient): Promise<void> {
  client.components.clear();

  const files = filterBySubfolder(walk(MODULES_DIR), "components");

  for (const file of files) {
    const exported = loadDefaultExport<GauliaComponent | GauliaComponent[]>(file);
    if (!exported) continue;

    const components = Array.isArray(exported) ? exported : [exported];
    for (const component of components) {
      client.components.set(component.customIdPrefix, component);
    }
  }

  client.logger.info(`${client.components.size} component(s) loaded`);
}

/** Finds the registered component whose prefix matches the start of the received custom_id. */
export function resolveComponent(
  client: GauliaClient,
  customId: string,
): GauliaComponent | undefined {
  for (const component of client.components.values()) {
    if (customId.startsWith(component.customIdPrefix)) {
      return component;
    }
    if (component.legacyCustomIdPrefixes?.some((prefix) => customId.startsWith(prefix))) {
      return component;
    }
  }
  return undefined;
}
