import { join } from "node:path";

import { REST, Routes } from "discord.js";

import { logger } from "../client/logger";
import { env } from "../config/env";
import type { Command } from "../structures/Command";
import { filterBySubfolder, loadDefaultExport, walk } from "./walk";

const MODULES_DIR = join(__dirname, "..", "modules");
const CHAT_INPUT_COMMAND_TYPE = 1;

type CommandBody = ReturnType<Command["data"]["toJSON"]>;

/** Définitions JSON de toutes les commandes du code ; refuse deux commandes du même nom et du même type. */
export function loadCommandBodies(): CommandBody[] {
  const bodies: CommandBody[] = [];
  const seen = new Set<string>();

  for (const file of filterBySubfolder(walk(MODULES_DIR), "commands")) {
    const command = loadDefaultExport<Command>(file);
    if (!command || !("data" in command)) continue;

    const body = command.data.toJSON();
    const key = `${body.type ?? CHAT_INPUT_COMMAND_TYPE}:${body.name}`;
    if (seen.has(key)) {
      throw new Error(`La commande « ${body.name} » est définie plusieurs fois (${file}).`);
    }
    seen.add(key);
    bodies.push(body);
  }

  return bodies;
}

function createRest(): REST {
  return new REST().setToken(env.DISCORD_TOKEN);
}

/**
 * Remplace toutes les commandes globales par celles du code (les anciennes disparaissent), puis vide
 * les commandes propres au serveur de dev : un ancien `deploy:guild` y laisse sinon des doublons
 * (deux `/ban` aux options différentes, par exemple).
 */
export async function syncApplicationCommands(): Promise<void> {
  const body = loadCommandBodies();
  const rest = createRest();

  await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body });
  logger.info(`${body.length} commande(s) slash synchronisée(s) globalement`);

  if (env.DEV_GUILD_ID) {
    await rest.put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DEV_GUILD_ID), {
      body: [],
    });
    logger.info(`Commandes propres au serveur ${env.DEV_GUILD_ID} supprimées (évite les doublons)`);
  }
}

/** Déploiement instantané sur un seul serveur, pour tester en développement. */
export async function deployGuildCommands(guildId: string): Promise<number> {
  const body = loadCommandBodies();
  await createRest().put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, guildId), { body });
  return body.length;
}
