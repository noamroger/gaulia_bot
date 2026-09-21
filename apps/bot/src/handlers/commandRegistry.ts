import { join } from "node:path";

import { REST, Routes } from "discord.js";

import { logger } from "../client/logger";
import { env } from "../config/env";
import type { Command } from "../structures/Command";
import { filterBySubfolder, loadDefaultExport, walk } from "./walk";

const MODULES_DIR = join(__dirname, "..", "modules");
const CHAT_INPUT_COMMAND_TYPE = 1;

type CommandBody = ReturnType<Command["data"]["toJSON"]>;

/** JSON definitions of every command in the code; refuses two commands of the same name and type. */
export function loadCommandBodies(): CommandBody[] {
  const bodies: CommandBody[] = [];
  const seen = new Set<string>();

  for (const file of filterBySubfolder(walk(MODULES_DIR), "commands")) {
    const command = loadDefaultExport<Command>(file);
    if (!command || !("data" in command)) continue;

    const body = command.data.toJSON();
    const key = `${body.type ?? CHAT_INPUT_COMMAND_TYPE}:${body.name}`;
    if (seen.has(key)) {
      throw new Error(`Command "${body.name}" is defined more than once (${file}).`);
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
 * Replaces every global command with the ones in the code, dropping the old ones, then clears the
 * dev server's own commands: an earlier `deploy:guild` would otherwise leave duplicates there, for
 * instance two `/ban` with different options.
 */
export async function syncApplicationCommands(): Promise<void> {
  const body = loadCommandBodies();
  const rest = createRest();

  await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body });
  logger.info(`${body.length} slash command(s) synced globally`);

  if (env.DEV_GUILD_ID) {
    await rest.put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DEV_GUILD_ID), {
      body: [],
    });
    logger.info(`Guild commands of ${env.DEV_GUILD_ID} cleared, which avoids duplicates`);
  }
}

/** Instant deployment to a single server, for local testing. */
export async function deployGuildCommands(guildId: string): Promise<number> {
  const body = loadCommandBodies();
  await createRest().put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, guildId), { body });
  return body.length;
}
