"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import type { ReactNode } from "react";

const TABS = [
  { slug: "settings", label: "Paramètres" },
  { slug: "automod", label: "Automod" },
  { slug: "music", label: "Musique" },
  { slug: "fun", label: "Fun" },
  { slug: "premium", label: "Premium" },
];

export default function GuildLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const params = useParams<{ guildId: string }>();

  return (
    <div className="container">
      <div className="tabs">
        {TABS.map((tab) => {
          const href = `/dashboard/${params.guildId}/${tab.slug}`;
          const active = pathname?.startsWith(href) ?? false;
          return (
            <Link key={tab.slug} href={href} className={`tab${active ? " active" : ""}`}>
              {tab.label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
