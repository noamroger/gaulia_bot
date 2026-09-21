"use client";

import { useParams, usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { TabNav } from "@/components/TabNav";
import { useTranslation } from "@/i18n";

const TAB_SLUGS = ["settings", "automod", "music", "fun", "adventure", "premium"] as const;

export default function GuildLayout({ children }: { children: ReactNode }) {
  const t = useTranslation();
  const pathname = usePathname();
  const params = useParams<{ guildId: string }>();

  const items = TAB_SLUGS.map((slug) => {
    const href = `/dashboard/${params.guildId}/${slug}`;
    return {
      href,
      label: t(`dashboard.tabs.${slug}`),
      active: pathname?.startsWith(href) ?? false,
    };
  });

  return (
    <div className="container">
      <TabNav items={items} label={t("dashboard.tabs.label")} />
      {children}
    </div>
  );
}
