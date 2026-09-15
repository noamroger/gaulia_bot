"use client";

import { useParams, usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { TabNav } from "@/components/TabNav";

const TABS = [
  { slug: "settings", label: "Paramètres" },
  { slug: "automod", label: "Automod" },
  { slug: "music", label: "Musique" },
  { slug: "fun", label: "Fun" },
  { slug: "aventure", label: "Aventure" },
  { slug: "premium", label: "Premium" },
];

export default function GuildLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const params = useParams<{ guildId: string }>();

  const items = TABS.map((tab) => {
    const href = `/dashboard/${params.guildId}/${tab.slug}`;
    return { href, label: tab.label, active: pathname?.startsWith(href) ?? false };
  });

  return (
    <div className="container">
      <TabNav items={items} label="Sections du serveur" />
      {children}
    </div>
  );
}
