import {
  BLINDTEST_MAX_PLAYLISTS,
  BLINDTEST_PLAYLIST_NAME_MAX,
  BLINDTEST_PRESET_CATEGORIES,
  blindtestTracksSchema,
  countBlindtestPlaylists,
  createBlindtestPlaylist,
  deleteBlindtestPlaylist,
  getBlindtestPlaylist,
  isBlindtestPlaylistNameTaken,
  listBlindtestPlaylists,
  updateBlindtestPlaylist,
} from "@gaulia/database";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { authenticate } from "../plugins/authenticate";
import { requireGuildAccess } from "../plugins/requireGuildAccess";
import { fetchSpotifyImport, parseSpotifyLink } from "../spotify/spotifyEmbed";

const nameSchema = z.string().trim().min(1).max(BLINDTEST_PLAYLIST_NAME_MAX);
const createSchema = z.object({ name: nameSchema });
const updateSchema = z.object({
  name: nameSchema.optional(),
  tracks: blindtestTracksSchema.optional(),
});
const importSchema = z.object({ url: z.string().max(300) });
const playlistIdSchema = z.string().regex(/^[a-z0-9]{20,40}$/);

const IMPORT_WINDOW_MS = 60_000;
const IMPORT_LIMIT = 10;
const importAttempts = new Map<string, number[]>();

const PRESETS = BLINDTEST_PRESET_CATEGORIES.map(({ id, name, description, tracks }) => ({
  id,
  name,
  description,
  trackCount: tracks.length,
}));

type GuildParams = { guildId: string };
type PlaylistParams = { guildId: string; playlistId: string };

/** Limite les imports Spotify par utilisateur, chacun déclenchant une requête vers Spotify. */
function allowImport(userId: string): boolean {
  const now = Date.now();
  const recent = (importAttempts.get(userId) ?? []).filter((at) => now - at < IMPORT_WINDOW_MS);
  if (recent.length >= IMPORT_LIMIT) {
    importAttempts.set(userId, recent);
    return false;
  }
  importAttempts.set(userId, [...recent, now]);
  return true;
}

export default async function blindtestRoutes(app: FastifyInstance): Promise<void> {
  const guildGuard = { preHandler: [authenticate, requireGuildAccess] };

  app.get("/blindtest/presets", { preHandler: [authenticate] }, async () => PRESETS);

  app.get<{ Params: GuildParams }>(
    "/guilds/:guildId/blindtest/playlists",
    guildGuard,
    async (request) => listBlindtestPlaylists(request.params.guildId),
  );

  app.post<{ Params: GuildParams }>(
    "/guilds/:guildId/blindtest/playlists",
    guildGuard,
    async (request, reply) => {
      const parsed = createSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Nom de liste invalide." });
      }
      const { guildId } = request.params;

      if ((await countBlindtestPlaylists(guildId)) >= BLINDTEST_MAX_PLAYLISTS) {
        return reply
          .status(400)
          .send({ error: `Un serveur peut avoir au maximum ${BLINDTEST_MAX_PLAYLISTS} listes.` });
      }
      if (await isBlindtestPlaylistNameTaken(guildId, parsed.data.name)) {
        return reply.status(409).send({ error: "Une liste porte déjà ce nom." });
      }

      return reply.status(201).send(await createBlindtestPlaylist(guildId, parsed.data.name));
    },
  );

  app.get<{ Params: PlaylistParams }>(
    "/guilds/:guildId/blindtest/playlists/:playlistId",
    guildGuard,
    async (request, reply) => {
      const { guildId, playlistId } = request.params;
      const playlist = playlistIdSchema.safeParse(playlistId).success
        ? await getBlindtestPlaylist(guildId, playlistId)
        : null;
      if (!playlist) return reply.status(404).send({ error: "Liste introuvable." });
      return playlist;
    },
  );

  app.patch<{ Params: PlaylistParams }>(
    "/guilds/:guildId/blindtest/playlists/:playlistId",
    guildGuard,
    async (request, reply) => {
      const { guildId, playlistId } = request.params;
      if (!playlistIdSchema.safeParse(playlistId).success) {
        return reply.status(404).send({ error: "Liste introuvable." });
      }

      const parsed = updateSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Liste invalide." });
      }
      const { name, tracks } = parsed.data;

      if (name !== undefined && (await isBlindtestPlaylistNameTaken(guildId, name, playlistId))) {
        return reply.status(409).send({ error: "Une liste porte déjà ce nom." });
      }

      const updated = await updateBlindtestPlaylist(guildId, playlistId, {
        ...(name !== undefined ? { name } : {}),
        ...(tracks !== undefined ? { tracks } : {}),
      });
      if (!updated) return reply.status(404).send({ error: "Liste introuvable." });
      return updated;
    },
  );

  app.delete<{ Params: PlaylistParams }>(
    "/guilds/:guildId/blindtest/playlists/:playlistId",
    guildGuard,
    async (request, reply) => {
      const { guildId, playlistId } = request.params;
      const deleted =
        playlistIdSchema.safeParse(playlistId).success &&
        (await deleteBlindtestPlaylist(guildId, playlistId));
      if (!deleted) return reply.status(404).send({ error: "Liste introuvable." });
      return reply.status(204).send();
    },
  );

  app.post<{ Params: GuildParams }>(
    "/guilds/:guildId/blindtest/spotify-import",
    guildGuard,
    async (request, reply) => {
      const parsed = importSchema.safeParse(request.body);
      const link = parsed.success ? parseSpotifyLink(parsed.data.url) : null;
      if (!link) {
        return reply
          .status(400)
          .send({ error: "Colle le lien d'une playlist, d'un album ou d'un titre Spotify." });
      }
      if (!allowImport(request.user.userId)) {
        return reply.status(429).send({ error: "Trop d'imports, réessaie dans une minute." });
      }

      const result = await fetchSpotifyImport(link).catch((error: unknown) => {
        request.log.warn({ err: error }, "Import Spotify impossible");
        return null;
      });
      if (!result || result.tracks.length === 0) {
        return reply
          .status(422)
          .send({ error: "Impossible de lire ce lien Spotify. Vérifie qu'il est public." });
      }
      return result;
    },
  );
}
