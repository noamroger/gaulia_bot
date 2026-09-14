import { LavalinkManager } from "lavalink-client";

import type { GauliaClient } from "../../../client/GauliaClient";
import { env } from "../../../config/env";
import { errorPayload, warningPayload, type V2MessagePayload } from "../../../core/ui/containers";
import { getMusicSettings } from "@gaulia/database";
import { isPremiumGuild } from "../../premium/services/entitlementService";
import { abortBlindtest, BLINDTEST_PLAYER_FLAG, failBlindtestRound } from "./blindtest";
import { clearIdleTimer, scheduleIdleDestroy } from "./idleTimers";
import { deleteNowPlayingCard, postOrUpdateNowPlayingCard } from "./nowPlayingCardService";

/**
 * Crée et attache l'instance lavalink-client à ce process de shard. Chaque process de
 * ShardingManager appelle cette fonction une seule fois : voir la note d'architecture dans
 * le plan sur pourquoi une instance par process est correcte (les guildes sont naturellement
 * partitionnées par shard, donc chaque session Lavalink ne gère que ses propres guildes).
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
      // Sinon l'objet User discord.js complet est sérialisé dans chaque requête envoyée à Lavalink.
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
    // Pendant un blindtest, la carte révélerait le titre à deviner.
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

  // autoSkip passe déjà au titre suivant ; on prévient juste le salon pour ne pas rester silencieux.
  manager.on("trackError", (player, track, payload) => {
    client.logger.error(
      { guildId: player.guildId, track: track?.info.title, exception: payload.exception },
      "Erreur de lecture Lavalink",
    );
    if (player.get<boolean | undefined>(BLINDTEST_PLAYER_FLAG)) {
      void failBlindtestRound(player.guildId);
      return;
    }
    void notifyTextChannel(
      client,
      player.textChannelId,
      errorPayload(false, "Lecture impossible", "Une erreur interne est survenue."),
    );
  });

  manager.on("trackStuck", (player, track) => {
    client.logger.warn({ guildId: player.guildId, track: track?.info.title }, "Titre bloqué");
    if (player.get<boolean | undefined>(BLINDTEST_PLAYER_FLAG)) {
      void failBlindtestRound(player.guildId);
      return;
    }
    void notifyTextChannel(
      client,
      player.textChannelId,
      warningPayload(false, "Titre bloqué", `**${track?.info.title ?? "Ce titre"}** a été passé.`),
    );
  });

  manager.on("playerDestroy", (player) => {
    clearIdleTimer(player.guildId);
    void deleteNowPlayingCard(client, player.guildId);
    void abortBlindtest(player.guildId);
  });

  manager.nodeManager.on("connect", (node) => {
    client.logger.info({ nodeId: node.id }, "Node Lavalink connecté");
  });

  manager.nodeManager.on("disconnect", (node, reason) => {
    client.logger.warn({ nodeId: node.id, reason }, "Node Lavalink déconnecté");
  });

  manager.nodeManager.on("error", (node, error) => {
    client.logger.error({ nodeId: node.id, err: error }, "Erreur du node Lavalink");
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
