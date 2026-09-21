"use client";

import { useCallback, useEffect, useState } from "react";

import { useTranslation } from "@/i18n";

import { api, ApiError } from "./api";

const SAVED_NOTICE_MS = 3000;

export interface EditableResource<T> {
  draft: T | null;
  loadFailed: boolean;
  dirty: boolean;
  saving: boolean;
  justSaved: boolean;
  error: string | null;
  update: (patch: Partial<T>) => void;
  reset: () => void;
  save: () => Promise<void>;
}

/** Loads an API resource, keeps an editable local draft and saves it back with PATCH. */
export function useEditableResource<T extends object>(path: string): EditableResource<T> {
  const [saved, setSaved] = useState<T | null>(null);
  const [draft, setDraft] = useState<T | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslation();

  useEffect(() => {
    let cancelled = false;
    api
      .get<T>(path)
      .then((value) => {
        if (cancelled) return;
        setSaved(value);
        setDraft(value);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  const dirty = saved !== null && draft !== null && JSON.stringify(saved) !== JSON.stringify(draft);

  const update = useCallback((patch: Partial<T>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    setJustSaved(false);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setDraft(saved);
    setError(null);
  }, [saved]);

  const save = useCallback(async () => {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const value = await api.patch<T>(path, draft);
      setSaved(value);
      setDraft(value);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), SAVED_NOTICE_MS);
    } catch (saveError) {
      setError(
        saveError instanceof ApiError && !saveError.generic && saveError.status < 500
          ? saveError.message
          : t("common.state.error"),
      );
    } finally {
      setSaving(false);
    }
  }, [draft, path, t]);

  return { draft, loadFailed, dirty, saving, justSaved, error, update, reset, save };
}
