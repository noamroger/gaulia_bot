import type { BlindtestPlaylist, Prisma } from "@prisma/client";

import { prisma } from "../client";
import { parseBlindtestTracks, type BlindtestTrack } from "../schemas/blindtest";
import { getOrCreateGuild } from "./guild.repo";

export interface BlindtestPlaylistSummary {
  id: string;
  name: string;
  trackCount: number;
  updatedAt: Date;
}

export interface BlindtestPlaylistDetail extends BlindtestPlaylistSummary {
  tracks: BlindtestTrack[];
}

const SUMMARY_SELECT = { id: true, name: true, trackCount: true, updatedAt: true } as const;

function toDetail(playlist: BlindtestPlaylist): BlindtestPlaylistDetail {
  return {
    id: playlist.id,
    name: playlist.name,
    trackCount: playlist.trackCount,
    updatedAt: playlist.updatedAt,
    tracks: parseBlindtestTracks(playlist.tracks),
  };
}

export async function listBlindtestPlaylists(guildId: string): Promise<BlindtestPlaylistSummary[]> {
  return prisma.blindtestPlaylist.findMany({
    where: { guildId },
    select: SUMMARY_SELECT,
    orderBy: { name: "asc" },
  });
}

export async function countBlindtestPlaylists(guildId: string): Promise<number> {
  return prisma.blindtestPlaylist.count({ where: { guildId } });
}

export async function getBlindtestPlaylist(
  guildId: string,
  id: string,
): Promise<BlindtestPlaylistDetail | null> {
  const playlist = await prisma.blindtestPlaylist.findFirst({ where: { id, guildId } });
  return playlist && toDetail(playlist);
}

/** Comparaison insensible à la casse, pour éviter « Rock » et « rock » sur le même serveur. */
export async function isBlindtestPlaylistNameTaken(
  guildId: string,
  name: string,
  exceptId?: string,
): Promise<boolean> {
  const existing = await prisma.blindtestPlaylist.findFirst({
    where: {
      guildId,
      name: { equals: name, mode: "insensitive" },
      ...(exceptId ? { NOT: { id: exceptId } } : {}),
    },
    select: { id: true },
  });
  return existing !== null;
}

export async function createBlindtestPlaylist(
  guildId: string,
  name: string,
): Promise<BlindtestPlaylistDetail> {
  await getOrCreateGuild(guildId);
  return toDetail(await prisma.blindtestPlaylist.create({ data: { guildId, name } }));
}

export async function updateBlindtestPlaylist(
  guildId: string,
  id: string,
  data: { name?: string; tracks?: BlindtestTrack[] },
): Promise<BlindtestPlaylistDetail | null> {
  const result = await prisma.blindtestPlaylist.updateMany({
    where: { id, guildId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.tracks !== undefined
        ? { tracks: data.tracks as Prisma.InputJsonValue, trackCount: data.tracks.length }
        : {}),
    },
  });
  if (result.count === 0) return null;
  return getBlindtestPlaylist(guildId, id);
}

export async function deleteBlindtestPlaylist(guildId: string, id: string): Promise<boolean> {
  const result = await prisma.blindtestPlaylist.deleteMany({ where: { id, guildId } });
  return result.count > 0;
}
