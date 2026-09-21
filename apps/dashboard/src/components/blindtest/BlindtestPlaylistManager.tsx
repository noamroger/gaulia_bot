"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { SettingsSection } from "@/components/settings/SettingsSection";
import { useLocale, useTranslation, type Translator } from "@/i18n";
import { api, ApiError } from "@/lib/api";
import { BLINDTEST_MAX_PLAYLISTS, BLINDTEST_PLAYLIST_NAME_MAX } from "@/lib/blindtest";
import { formatNumber } from "@/lib/format";
import type { BlindtestPlaylist, BlindtestPlaylistSummary } from "@/lib/types";

function errorMessage(error: unknown, t: Translator): string {
  return error instanceof ApiError && error.status < 500 && !error.generic
    ? error.message
    : t("common.state.error");
}

/** Custom lists of a server: creating and deleting are saved right away. */
export function BlindtestPlaylistManager({ guildId }: { guildId: string }) {
  const t = useTranslation();
  const locale = useLocale();
  const router = useRouter();
  const [playlists, setPlaylists] = useState<BlindtestPlaylistSummary[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<BlindtestPlaylistSummary[]>(`/guilds/${guildId}/blindtest/playlists`)
      .then((value) => {
        if (!cancelled) setPlaylists(value);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [guildId]);

  async function create(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    setError(null);
    try {
      const created = await api.post<BlindtestPlaylist>(`/guilds/${guildId}/blindtest/playlists`, {
        name: trimmed,
      });
      router.push(`/dashboard/${guildId}/music/playlists/${created.id}`);
    } catch (createError) {
      setError(errorMessage(createError, t));
      setCreating(false);
    }
  }

  async function remove(id: string): Promise<void> {
    setDeletingId(id);
    setError(null);
    try {
      await api.delete(`/guilds/${guildId}/blindtest/playlists/${id}`);
      setPlaylists((current) => current?.filter((playlist) => playlist.id !== id) ?? current);
      setConfirmingId(null);
    } catch (deleteError) {
      setError(errorMessage(deleteError, t));
    } finally {
      setDeletingId(null);
    }
  }

  const limitReached = (playlists?.length ?? 0) >= BLINDTEST_MAX_PLAYLISTS;

  return (
    <SettingsSection
      title={t("music.playlists.title")}
      description={t("music.playlists.description")}
    >
      {loadFailed && <p className="notice notice-error">{t("music.playlists.loadError")}</p>}
      {!loadFailed && !playlists && <p className="text-muted">{t("common.state.loading")}</p>}

      {playlists && (
        <>
          {playlists.length === 0 ? (
            <p className="setting-hint">{t("music.playlists.empty")}</p>
          ) : (
            <ul className="playlist-list">
              {playlists.map((playlist) => (
                <li key={playlist.id} className="playlist-row">
                  <span className="playlist-row-name">
                    <Link href={`/dashboard/${guildId}/music/playlists/${playlist.id}`}>
                      {playlist.name}
                    </Link>
                    <span className="setting-hint">
                      {t("music.playlists.tracks", {
                        count: playlist.trackCount,
                        value: formatNumber(playlist.trackCount, locale),
                      })}
                    </span>
                  </span>
                  <span className="playlist-row-actions">
                    {confirmingId === playlist.id ? (
                      <>
                        <button
                          type="button"
                          className="button-danger button-small"
                          disabled={deletingId === playlist.id}
                          onClick={() => void remove(playlist.id)}
                        >
                          {deletingId === playlist.id
                            ? t("music.playlists.deleting")
                            : t("common.action.confirm")}
                        </button>
                        <button
                          type="button"
                          className="button-secondary button-small"
                          disabled={deletingId === playlist.id}
                          onClick={() => setConfirmingId(null)}
                        >
                          {t("common.action.cancel")}
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href={`/dashboard/${guildId}/music/playlists/${playlist.id}`}
                          className="button-secondary button-small"
                        >
                          {t("music.playlists.edit")}
                        </Link>
                        <button
                          type="button"
                          className="button-secondary button-small"
                          onClick={() => setConfirmingId(playlist.id)}
                        >
                          {t("common.action.delete")}
                        </button>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <form className="inline-form" onSubmit={(event) => void create(event)}>
            <input
              type="text"
              className="input input-grow"
              placeholder={t("music.playlists.namePlaceholder")}
              aria-label={t("music.playlists.nameAria")}
              maxLength={BLINDTEST_PLAYLIST_NAME_MAX}
              value={name}
              disabled={creating || limitReached}
              onChange={(event) => setName(event.target.value)}
            />
            <button
              type="submit"
              className="button-primary"
              disabled={creating || limitReached || !name.trim()}
            >
              {creating ? t("music.playlists.creating") : t("music.playlists.create")}
            </button>
          </form>
          {limitReached && (
            <p className="field-hint inline-hint">
              {t("music.playlists.limit", { count: BLINDTEST_MAX_PLAYLISTS })}
            </p>
          )}
        </>
      )}

      {error && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}
    </SettingsSection>
  );
}
