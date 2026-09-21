import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getTranslator } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return {
    title: t("account.myData.meta.title"),
    description: t("account.myData.meta.description"),
  };
}

export default function MyDataLayout({ children }: { children: ReactNode }) {
  return children;
}
