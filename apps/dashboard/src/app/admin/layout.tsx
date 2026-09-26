"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { TabNav } from "@/components/TabNav";
import { TopNav } from "@/components/TopNav";
import { useTranslation } from "@/i18n";
import { useSession } from "@/lib/useSession";

const TABS = [
  { href: "/admin", key: "stats" },
  { href: "/admin/servers", key: "servers" },
  { href: "/admin/credits", key: "credits" },
  { href: "/admin/adventure", key: "adventure" },
  { href: "/admin/data", key: "data" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { session, loading, failed } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslation();

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
            <h1>{t("admin.layout.title")}</h1>
            <TabNav
              items={TABS.map((tab) => ({
                href: tab.href,
                label: t(`admin.layout.tabs.${tab.key}`),
                active: pathname === tab.href,
              }))}
              label={t("admin.layout.tabsLabel")}
            />
            {children}
          </>
        ) : (
          <p className="text-muted">{t(failed ? "common.state.error" : "common.state.loading")}</p>
        )}
      </div>
    </div>
  );
}
