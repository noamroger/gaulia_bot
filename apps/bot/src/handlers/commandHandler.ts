import { join, relative, sep } from "node:path";

import type { GauliaClient } from "../client/GauliaClient";
import type { Command } from "../structures/Command";
import { filterBySubfolder, loadDefaultExport, walk } from "./walk";

const MODULES_DIR = join(__dirname, "..", "modules");

export async function loadCommands(client: GauliaClient): Promise<void> {
  client.commands.clear();

  const allFiles = walk(MODULES_DIR);
  const commandFiles = filterBySubfolder(allFiles, "commands");

  for (const file of commandFiles) {
    const command = loadDefaultExport<Command>(file);

    if (!command || !("data" in command)) {
      client.logger.warn({ file }, "Fichier de commande ignoré : pas d'export par défaut valide");
      continue;
    }

    command.category = relative(MODULES_DIR, file).split(sep)[0]!;
    client.commands.set(command.data.name, command);
  }

  client.logger.info(`${client.commands.size} commande(s) chargée(s)`);
}
