import { recordCommandUsage } from "@gaulia/database";
import {
  Events,
  type ChatInputCommandInteraction,
  type Interaction,
  type MessageContextMenuCommandInteraction,
  type UserContextMenuCommandInteraction,
} from "discord.js";

import type { GauliaClient } from "../client/GauliaClient";
import { GauliaError, handleInteractionError } from "../core/errors";
import { hasPermissionLevel, PermissionLevel } from "../core/permissions/permissionLevel";
import { warningPayload } from "../core/ui/containers";
import { resolveComponent } from "../handlers/componentHandler";
import { assertAdventureAccess } from "../modules/adventure/services/access/adventureAccess";
import { assertFunChannel } from "../modules/fun/services/funAccess";
import { isBlindtestRunning } from "../modules/music/services/blindtest";
import { assertMusicAccess, MUSIC_COMMAND_ACCESS } from "../modules/music/services/musicAccess";
import { requirePremium } from "../modules/premium/guards/requirePremium";
import type { Command } from "../structures/Command";
import type { GauliaEvent } from "../structures/Event";

type CommandInteraction =
  | ChatInputCommandInteraction
  | UserContextMenuCommandInteraction
  | MessageContextMenuCommandInteraction;

/**
 * Applique les gardes communes à toute commande (serveur requis, permission, cooldown, premium)
 * avant exécution. Retourne `true` si la commande peut s'exécuter.
 */
async function passesCommandGuards(
  client: GauliaClient,
  interaction: CommandInteraction,
  command: Command,
): Promise<boolean> {
  if ((command.guildOnly ?? true) && !interaction.inGuild()) {
    await interaction.reply(
      warningPayload(
        true,
        "Serveur requis",
        "Cette commande n'est utilisable qu'au sein d'un serveur.",
      ),
    );
    return false;
  }

  if (command.permissionLevel !== undefined && command.permissionLevel > PermissionLevel.Everyone) {
    const guildMember = interaction.guild?.members.cache.get(interaction.user.id);
    if (guildMember && !hasPermissionLevel(guildMember, command.permissionLevel)) {
      await interaction.reply(
        warningPayload(
          true,
          "Permission manquante",
          "Tu n'as pas la permission d'utiliser cette commande.",
        ),
      );
      return false;
    }
  }

  if (command.premiumOnly && interaction.guildId) {
    const allowed = await requirePremium(interaction, interaction.guildId, command.data.name);
    if (!allowed) return false;
  }

  if (command.cooldownSeconds) {
    const remaining = client.cooldowns.consume(
      interaction.commandName,
      interaction.user.id,
      command.cooldownSeconds,
    );
    if (remaining > 0) {
      await interaction.reply(warningPayload(true, "Doucement", `Réessaie dans ${remaining}s.`));
      return false;
    }
  }

  const musicAccess = MUSIC_COMMAND_ACCESS[interaction.commandName];
  if (musicAccess && interaction.inCachedGuild()) {
    if (isBlindtestRunning(interaction.guildId)) {
      throw new GauliaError(
        "Un blindtest est en cours sur ce serveur : les commandes musique reviennent à la fin de la partie.",
      );
    }
    await assertMusicAccess(interaction.member, musicAccess, interaction.channelId);
  }

  if (command.category === "fun" && interaction.inCachedGuild()) {
    await assertFunChannel(interaction.member, interaction.channel, interaction.channelId);
  }

  // L'aventure n'est jouable qu'en message privé ou dans les salons autorisés par le serveur.
  if (command.category === "adventure") {
    await assertAdventureAccess(interaction);
  }

  void recordCommandUsage(interaction.commandName, command.category ?? "other").catch(
    (error: unknown) => {
      client.logger.error(
        { err: error },
        "Échec de l'enregistrement de l'utilisation d'une commande",
      );
    },
  );

  return true;
}

const event: GauliaEvent<typeof Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  async execute(client: GauliaClient, interaction: Interaction) {
    try {
      if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (command?.type !== "chatInput" || !command.autocomplete) return;
        await command.autocomplete(interaction, client);
        return;
      }

      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command?.type !== "chatInput") return;
        if (!(await passesCommandGuards(client, interaction, command))) return;
        await command.execute(interaction, client);
        return;
      }

      if (interaction.isUserContextMenuCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command?.type !== "userContextMenu") return;
        if (!(await passesCommandGuards(client, interaction, command))) return;
        await command.execute(interaction, client);
        return;
      }

      if (interaction.isMessageContextMenuCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command?.type !== "messageContextMenu") return;
        if (!(await passesCommandGuards(client, interaction, command))) return;
        await command.execute(interaction, client);
        return;
      }

      if (
        interaction.isButton() ||
        interaction.isStringSelectMenu() ||
        interaction.isModalSubmit()
      ) {
        const component = resolveComponent(client, interaction.customId);
        if (!component) return;

        if (interaction.isButton() && component.type === "button") {
          await component.execute(interaction, client);
        } else if (interaction.isStringSelectMenu() && component.type === "stringSelect") {
          await component.execute(interaction, client);
        } else if (interaction.isModalSubmit() && component.type === "modal") {
          await component.execute(interaction, client);
        }
      }
    } catch (error) {
      if (interaction.isRepliable()) {
        await handleInteractionError(interaction, error);
      } else {
        client.logger.error({ err: error }, "Erreur non gérée sur une interaction non-répliable");
      }
    }
  },
};

export default event;
