"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { TopNav } from "@/components/TopNav";
import { useSession } from "@/lib/useSession";

const TABS = [
  { href: "/admin", label: "Statistiques" },
  { href: "/admin/servers", label: "Serveurs" },
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
    <div>
      <TopNav session={session} />
      <div className="container container-wide">
        {session?.isOwner ? (
          <>
            <h1>Panel admin</h1>
            <nav className="tabs">
              {TABS.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`tab${pathname === tab.href ? " active" : ""}`}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
            {children}
          </>
        ) : (
          <p className="text-muted">Chargement…</p>
        )}
      </div>
    </div>
  );
}
