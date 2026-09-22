import { DEFAULT_LOCALE, LOCALE_COOKIE, matchLocale, type AppLocale } from "@/i18n/locales";

import { API_URL } from "./config";

export class ApiError extends Error {
  public readonly status: number;
  /** True when the server sent no message, so the caller shows its own generic wording. */
  public readonly generic: boolean;

  constructor(status: number, message: string, generic = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.generic = generic;
  }
}

/**
 * The API answers in the reader's language, so every call carries it. This module only ever runs
 * in the browser (it sends credentials), hence reading the document rather than taking a
 * parameter. Same order as the server: the explicit choice, then the language the page was
 * actually rendered in, which the server wrote on `<html>` after reading `Accept-Language`.
 */
function currentLocale(): AppLocale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const match = new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`).exec(document.cookie);
  const chosen = matchLocale(match?.[1] ? decodeURIComponent(match[1]) : null);
  return chosen ?? matchLocale(document.documentElement.lang) ?? DEFAULT_LOCALE;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    // Fastify rejects an empty body announced as JSON, so the header only goes out with one.
    headers: {
      "Accept-Language": currentLocale(),
      ...(init?.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(response.status, body.error ?? `HTTP ${response.status}`, !body.error);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string): Promise<T> => request<T>(path),
  patch: <T>(path: string, data: unknown): Promise<T> =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
  post: <T>(path: string, data?: unknown): Promise<T> =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  // A DELETE may carry a body: the personal data erasure puts its confirmation there.
  delete: <T>(path: string, data?: unknown): Promise<T> =>
    request<T>(path, {
      method: "DELETE",
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
};
