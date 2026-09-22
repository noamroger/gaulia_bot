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
import { resilientTranslator, type Translator } from "../i18n";
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
 * Applies the guards every command shares (server required, permission, cooldown, premium) before
 * running it. Returns `true` when the command may proceed.
 */
async function passesCommandGuards(
  client: GauliaClient,
  interaction: CommandInteraction,
  command: Command,
  t: Translator,
): Promise<boolean> {
  if ((command.guildOnly ?? true) && !interaction.inGuild()) {
    await interaction.reply(
      warningPayload(
        true,
        t("common.guard.guildOnly.title"),
        t("common.guard.guildOnly.description"),
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
          t("common.guard.permission.title"),
          t("common.guard.permission.description"),
        ),
      );
      return false;
    }
  }

  if (command.premiumOnly && interaction.guildId) {
    const allowed = await requirePremium(interaction, interaction.guildId, command.data.name, t);
    if (!allowed) return false;
  }

  if (command.cooldownSeconds) {
    const remaining = client.cooldowns.consume(
      interaction.commandName,
      interaction.user.id,
      command.cooldownSeconds,
    );
    if (remaining > 0) {
      await interaction.reply(
        warningPayload(
          true,
          t("common.guard.cooldown.title"),
          t("common.guard.cooldown.description", { seconds: remaining }),
        ),
      );
      return false;
    }
  }

  const musicAccess = MUSIC_COMMAND_ACCESS[interaction.commandName];
  if (musicAccess && interaction.inCachedGuild()) {
    if (isBlindtestRunning(interaction.guildId)) {
      throw new GauliaError("common.guard.blindtestRunning");
    }
    await assertMusicAccess(interaction.member, musicAccess, interaction.channelId);
  }

  if (command.category === "fun" && interaction.inCachedGuild()) {
    await assertFunChannel(interaction.member, interaction.channel, interaction.channelId);
  }

  // The adventure is playable in DM, or in the channels the server allows.
  if (command.category === "adventure") {
    await assertAdventureAccess(interaction);
  }

  void recordCommandUsage(interaction.commandName, command.category ?? "other").catch(
    (error: unknown) => {
      client.logger.error({ err: error }, "Could not record a command usage");
    },
  );

  return true;
}

const event: GauliaEvent<typeof Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  async execute(client: GauliaClient, interaction: Interaction) {
    try {
      // Resolved once per interaction, then handed to every guard, command and component.
      const t = await resilientTranslator(interaction);

      if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (command?.type !== "chatInput" || !command.autocomplete) return;
        await command.autocomplete(interaction, client, t);
        return;
      }

      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command?.type !== "chatInput") return;
        if (!(await passesCommandGuards(client, interaction, command, t))) return;
        await command.execute(interaction, client, t);
        return;
      }

      if (interaction.isUserContextMenuCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command?.type !== "userContextMenu") return;
        if (!(await passesCommandGuards(client, interaction, command, t))) return;
        await command.execute(interaction, client, t);
        return;
      }

      if (interaction.isMessageContextMenuCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command?.type !== "messageContextMenu") return;
        if (!(await passesCommandGuards(client, interaction, command, t))) return;
        await command.execute(interaction, client, t);
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
          await component.execute(interaction, client, t);
        } else if (interaction.isStringSelectMenu() && component.type === "stringSelect") {
          await component.execute(interaction, client, t);
        } else if (interaction.isModalSubmit() && component.type === "modal") {
          await component.execute(interaction, client, t);
        }
      }
    } catch (error) {
      if (interaction.isRepliable()) {
        await handleInteractionError(interaction, error);
      } else {
        client.logger.error({ err: error }, "Unhandled error on a non repliable interaction");
      }
    }
  },
};

export default event;
