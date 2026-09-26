"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { api, ApiError } from "./api";
import type { Session } from "./types";

/**
 * `failed` is set when the API could not be reached at all (network, CORS, 5xx): without it the
 * page would wait on a session that never comes.
 */
export function useSession(): { session: Session | null; loading: boolean; failed: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    api
      .get<Session>("/auth/me")
      .then((data) => {
        if (!cancelled) setSession(data);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          router.replace("/login");
        } else {
          setFailed(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return { session, loading, failed };
}
