"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { TabNav } from "@/components/TabNav";
import { TopNav } from "@/components/TopNav";
import { useSession } from "@/lib/useSession";

const TABS = [
  { href: "/admin", label: "Statistiques" },
  { href: "/admin/servers", label: "Serveurs" },
  { href: "/admin/credits", label: "Crédits" },
  { href: "/admin/aventure", label: "Aventure" },
  { href: "/admin/data", label: "Données" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && session && !session.isOwner) {
      router.replace("/dashboard");
    }
  }, [loading, session, router]);

  return (
    <div className="app-shell">
      <TopNav session={session} />
      <div className="container container-wide">
        {session?.isOwner ? (
          <>
            <h1>Panel admin</h1>
            <TabNav
              items={TABS.map((tab) => ({ ...tab, active: pathname === tab.href }))}
              label="Sections du panel admin"
            />
            {children}
          </>
        ) : (
          <p className="text-muted">Chargement…</p>
        )}
      </div>
    </div>
  );
}
