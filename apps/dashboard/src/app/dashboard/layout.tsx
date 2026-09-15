"use client";

import type { ReactNode } from "react";

import { TopNav } from "@/components/TopNav";
import { useSession } from "@/lib/useSession";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { session } = useSession();

  return (
    <div className="app-shell">
      <TopNav session={session} />
      {children}
    </div>
  );
}
