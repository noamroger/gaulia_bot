"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { GuildAvatar } from "@/components/GuildAvatar";
import { Icon } from "@/components/Icon";
import { TabNav } from "@/components/TabNav";
import { useTranslation } from "@/i18n";
import { api } from "@/lib/api";
import type { ManageableGuild } from "@/lib/types";

const TAB_SLUGS = ["settings", "automod", "music", "fun", "adventure", "premium"] as const;

export default function GuildLayout({ children }: { children: ReactNode }) {
  const t = useTranslation();
  const pathname = usePathname();
  const params = useParams<{ guildId: string }>();
  const [guild, setGuild] = useState<ManageableGuild | null>(null);

  // Name and icon for the sidebar. The layout survives navigation between sections, so this runs
  // once per server; a failure only leaves the header empty.
  useEffect(() => {
    let cancelled = false;
    api
      .get<ManageableGuild[]>("/guilds")
      .then((guilds) => {
        if (!cancelled) setGuild(guilds.find((entry) => entry.id === params.guildId) ?? null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [params.guildId]);

  const items = TAB_SLUGS.map((slug) => {
    const href = `/dashboard/${params.guildId}/${slug}`;
    return {
      slug,
      href,
      label: t(`dashboard.tabs.${slug}`),
      active: pathname?.startsWith(href) ?? false,
    };
  });
  const activeItem = items.find((item) => item.active);

  return (
    <div className="container container-wide">
      <div className="panel">
        <aside className="panel-sidebar">
          <Link href="/dashboard" className="back-link">
            <Icon name="back" size={16} />
            {t("dashboard.panel.back")}
          </Link>

          <div className="panel-guild">
            {guild ? (
              <>
                <GuildAvatar guild={guild} className="guild-avatar-md" />
                <span className="panel-guild-name">{guild.name}</span>
              </>
            ) : (
              <>
                <span className="guild-avatar guild-avatar-md skeleton" aria-hidden="true" />
                <span className="skeleton skeleton-text" aria-hidden="true" />
              </>
            )}
          </div>

          <nav className="panel-nav" aria-label={t("dashboard.panel.sectionsLabel")}>
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`panel-nav-item${item.active ? " active" : ""}`}
                aria-current={item.active ? "page" : undefined}
              >
                <Icon name={item.slug} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="panel-tabs">
            <TabNav items={items} label={t("dashboard.tabs.label")} />
          </div>
        </aside>

        <main className="panel-main">
          {activeItem && (
            <header className="page-header">
              <h1>{activeItem.label}</h1>
              <p>{t(`dashboard.sections.${activeItem.slug}`)}</p>
            </header>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
