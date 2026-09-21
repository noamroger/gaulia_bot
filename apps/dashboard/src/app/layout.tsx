import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/SiteFooter";
import { I18nProvider } from "@/i18n";
import { getLocale, getTranslator } from "@/i18n/server";
import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/theme";

import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return {
    title: t("common.meta.title"),
    description: t("common.meta.description"),
  };
}

/** Applies the remembered theme before the first paint, to avoid a flash of the wrong palette. */
const THEME_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale} data-theme={DEFAULT_THEME} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <I18nProvider locale={locale}>
          {children}
          <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  );
}
