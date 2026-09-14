"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { userAvatarUrl } from "@/lib/discordCdn";
import type { Session } from "@/lib/types";

export function TopNav({ session }: { session: Session | null }) {
  const router = useRouter();

  async function logout(): Promise<void> {
    await api.post("/auth/logout");
    router.replace("/login");
  }

  return (
    <nav className="top-nav">
      <Link href="/dashboard" className="brand">
        Gaulia
      </Link>
      {session && (
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {session.isOwner && (
            <Link href="/admin" className="text-muted">
              Admin
            </Link>
          )}
          <span className="user-chip">
            <img
              className="user-avatar"
              src={userAvatarUrl(session.userId, session.avatar)}
              alt=""
              width={28}
              height={28}
            />
            <span className="text-muted">{session.username}</span>
          </span>
          <button className="button-secondary" onClick={() => void logout()}>
            Déconnexion
          </button>
        </div>
      )}
    </nav>
  );
}
