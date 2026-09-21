"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslation } from "@/i18n";
import { api } from "@/lib/api";
import { userAvatarUrl } from "@/lib/discordCdn";
import { formatNumber } from "@/lib/format";
import type { Session } from "@/lib/types";
import { useCredits } from "@/lib/useCredits";
import { useDismiss } from "@/lib/useDismiss";

export function TopNav({ session }: { session: Session | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const { credits } = useCredits();
  const t = useTranslation();

  async function logout(): Promise<void> {
    await api.post("/auth/logout");
    router.replace("/login");
  }

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const close = useCallback((reason: "outside" | "escape") => {
    setMenuOpen(false);
    if (reason === "escape") triggerRef.current?.focus();
  }, []);

  useDismiss(menuOpen, menuRef, close);

  return (
    <nav className="top-nav">
      <Link href="/dashboard" className="brand">
        <span className="brand-mark" aria-hidden="true">
          G
        </span>
        Gaulia
      </Link>
      {session && (
        <>
          <div className="top-nav-actions">
            {session.isOwner && (
              <Link href="/admin" className="text-muted">
                {t("nav.top.admin")}
              </Link>
            )}
            <LanguageToggle />
            <ThemeToggle />
            {credits && (
              <Link href="/dashboard" className="credits-chip" title={t("nav.top.creditsTitle")}>
                {t("nav.top.credits", { count: formatNumber(credits.balance) })}
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
              {t("nav.top.logout")}
            </button>
          </div>

          <div ref={menuRef} className="account-menu">
            <button
              ref={triggerRef}
              type="button"
              className="account-trigger"
              aria-label={t("nav.top.accountMenu")}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((value) => !value)}
            >
              <img
                className="user-avatar"
                src={userAvatarUrl(session.userId, session.avatar)}
                alt=""
                width={28}
                height={28}
              />
              <svg
                className="chevron"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                aria-hidden="true"
              >
                <path
                  d="M3 4.5 6 7.5l3-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {menuOpen && (
              <ul id={menuId} className="menu-list">
                <li className="menu-header">{session.username}</li>
                {credits && (
                  <li className="menu-header menu-header-muted">
                    {t("nav.top.creditsMenu", { count: formatNumber(credits.balance) })}
                  </li>
                )}
                <li>
                  <Link
                    href="/dashboard"
                    className={`menu-item${pathname === "/dashboard" ? " active" : ""}`}
                  >
                    {t("nav.top.myServers")}
                  </Link>
                </li>
                {session.isOwner && (
                  <li>
                    <Link
                      href="/admin"
                      className={`menu-item${pathname?.startsWith("/admin") ? " active" : ""}`}
                    >
                      {t("nav.top.admin")}
                    </Link>
                  </li>
                )}
                <li className="menu-separator" role="separator" />
                <li>
                  <LanguageToggle variant="menu" />
                </li>
                <li>
                  <ThemeToggle variant="menu" />
                </li>
                <li>
                  <button type="button" className="menu-item danger" onClick={() => void logout()}>
                    {t("nav.top.logout")}
                  </button>
                </li>
              </ul>
            )}
          </div>
        </>
      )}
    </nav>
  );
}
