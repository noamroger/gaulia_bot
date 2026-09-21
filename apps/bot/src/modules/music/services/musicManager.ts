import { LavalinkManager } from "lavalink-client";

import type { GauliaClient } from "../../../client/GauliaClient";
import { env } from "../../../config/env";
import { errorPayload, warningPayload, type V2MessagePayload } from "../../../core/ui/containers";
import { getMusicSettings } from "@gaulia/database";
import { isPremiumGuild } from "../../premium/services/entitlementService";
import { abortBlindtest, BLINDTEST_PLAYER_FLAG, failBlindtestRound } from "./blindtest";
import { clearIdleTimer, scheduleIdleDestroy } from "./idleTimers";
import { deleteNowPlayingCard, postOrUpdateNowPlayingCard } from "./nowPlayingCardService";
import { guildTranslator } from "./playerUtils";

/**
 * Creates and attaches the lavalink-client instance of this shard process. Every ShardingManager
 * process calls this once: guilds are partitioned by shard, so each Lavalink session only ever
 * handles its own guilds.
 */
export function createMusicManager(client: GauliaClient): LavalinkManager {
  const manager = new LavalinkManager({
    nodes: [
      {
        id: "main",
        host: env.LAVALINK_HOST,
        port: env.LAVALINK_PORT,
        authorization: env.LAVALINK_PASSWORD,
        secure: env.LAVALINK_SECURE,
      },
    ],
    sendToShard: (guildId, payload) => client.guilds.cache.get(guildId)?.shard?.send(payload),
    client: {
      id: env.DISCORD_CLIENT_ID,
      username: "Gaulia",
    },
    autoSkip: true,
    playerOptions: {
      defaultSearchPlatform: "scsearch",
      onDisconnect: { autoReconnect: true, destroyPlayer: false },
      // Otherwise the whole discord.js User object is serialized into every Lavalink request.
      requesterTransformer: (requester) => {
        const user = requester as { id?: string; username?: string } | null;
        return user ? { id: user.id, username: user.username } : null;
      },
    },
    queueOptions: {
      maxPreviousTracks: 25,
    },
  });

  manager.on("trackStart", (player, track) => {
    clearIdleTimer(player.guildId);
    // During a blindtest the card would give the track away.
    if (player.get<boolean | undefined>(BLINDTEST_PLAYER_FLAG)) return;
    void postOrUpdateNowPlayingCard(client, player, track ?? undefined);
  });

  manager.on("queueEnd", (player) => {
    void deleteNowPlayingCard(client, player.guildId);
    void (async () => {
      const settings = await getMusicSettings(player.guildId);
      scheduleIdleDestroy(player, settings.stay247 && isPremiumGuild(player.guildId));
    })();
  });

  // autoSkip already moves on; the channel is only warned so the silence is not unexplained.
  manager.on("trackError", (player, track, payload) => {
    client.logger.error(
      { guildId: player.guildId, track: track?.info.title, exception: payload.exception },
      "Lavalink playback error",
    );
    if (player.get<boolean | undefined>(BLINDTEST_PLAYER_FLAG)) {
      void failBlindtestRound(player.guildId);
      return;
    }
    void (async () => {
      const t = await guildTranslator(client, player.guildId);
      await notifyTextChannel(
        client,
        player.textChannelId,
        errorPayload(false, t("music.player.errorTitle"), t("common.error.internal")),
      );
    })();
  });

  manager.on("trackStuck", (player, track) => {
    client.logger.warn({ guildId: player.guildId, track: track?.info.title }, "Track stuck");
    if (player.get<boolean | undefined>(BLINDTEST_PLAYER_FLAG)) {
      void failBlindtestRound(player.guildId);
      return;
    }
    void (async () => {
      const t = await guildTranslator(client, player.guildId);
      await notifyTextChannel(
        client,
        player.textChannelId,
        warningPayload(
          false,
          t("music.player.stuckTitle"),
          t("music.player.stuckDescription", {
            track: track?.info.title ?? t("music.player.unnamedTrack"),
          }),
        ),
      );
    })();
  });

  manager.on("playerDestroy", (player) => {
    clearIdleTimer(player.guildId);
    void deleteNowPlayingCard(client, player.guildId);
    void abortBlindtest(player.guildId);
  });

  manager.nodeManager.on("connect", (node) => {
    client.logger.info({ nodeId: node.id }, "Lavalink node connected");
  });

  manager.nodeManager.on("disconnect", (node, reason) => {
    client.logger.warn({ nodeId: node.id, reason }, "Lavalink node disconnected");
  });

  manager.nodeManager.on("error", (node, error) => {
    client.logger.error({ nodeId: node.id, err: error }, "Lavalink node error");
  });

  return manager;
}

async function notifyTextChannel(
  client: GauliaClient,
  channelId: string | null | undefined,
  payload: V2MessagePayload,
): Promise<void> {
  if (!channelId) return;
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased() || !("send" in channel)) return;
  await channel.send(payload).catch(() => null);
}
