import { Events, type VoiceState } from "discord.js";

import type { GauliaClient } from "../../../client/GauliaClient";
import type { GauliaEvent } from "../../../structures/Event";
import { getMusicSettings } from "@gaulia/database";
import { isPremiumGuild } from "../../premium/services/entitlementService";

const ALONE_DISCONNECT_DELAY_MS = 60_000;
const aloneTimers = new Map<string, NodeJS.Timeout>();

/** Disconnects the bot when it is left alone in a voice channel, unless the 24/7 mode is on. */
const event: GauliaEvent<typeof Events.VoiceStateUpdate> = {
  name: Events.VoiceStateUpdate,
  async execute(client: GauliaClient, _oldState: VoiceState, newState: VoiceState) {
    const guildId = newState.guild.id;
    const player = client.lavalink.getPlayer(guildId);
    if (!player?.voiceChannelId) return;

    const voiceChannel = newState.guild.channels.cache.get(player.voiceChannelId);
    if (!voiceChannel || !voiceChannel.isVoiceBased()) return;

    const humanMembers = voiceChannel.members.filter((member) => !member.user.bot);

    const existingTimer = aloneTimers.get(guildId);

    if (humanMembers.size > 0) {
      if (existingTimer) {
        clearTimeout(existingTimer);
        aloneTimers.delete(guildId);
      }
      return;
    }

    if (existingTimer) return;

    const timer = setTimeout(() => {
      void (async () => {
        aloneTimers.delete(guildId);
        const currentPlayer = client.lavalink.getPlayer(guildId);
        if (!currentPlayer) return;

        const settings = await getMusicSettings(guildId);
        if (settings.stay247 && isPremiumGuild(guildId)) return;

        await currentPlayer.destroy();
      })();
    }, ALONE_DISCONNECT_DELAY_MS);

    aloneTimers.set(guildId, timer);
  },
};

export default event;
