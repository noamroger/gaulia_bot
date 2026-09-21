import { Client, Collection } from "discord.js";
import type { LavalinkManager } from "lavalink-client";

import { CooldownManager } from "../core/cooldowns/CooldownManager";
import type { Command } from "../structures/Command";
import type { GauliaComponent } from "../structures/Component";
import { GAULIA_INTENTS, GAULIA_PARTIALS } from "./Constants";
import { logger } from "./logger";

export class GauliaClient extends Client {
  public readonly commands = new Collection<string, Command>();
  public readonly components = new Collection<string, GauliaComponent>();
  public readonly cooldowns = new CooldownManager();
  public readonly logger = logger;

  /** lavalink-client instance of this shard process, created in bot.ts after ready. */
  public lavalink!: LavalinkManager;

  constructor() {
    super({
      intents: GAULIA_INTENTS,
      partials: GAULIA_PARTIALS,
    });
  }
}
