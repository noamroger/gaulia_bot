import Link from "next/link";

import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getTranslator } from "@/i18n/server";
import type { Translator } from "@/i18n";
import { APP_VERSION, AUTHOR_NAME, AUTHOR_URL, SUPPORT_INVITE } from "@/lib/config";

interface FooterLink {
  label: string;
  href: string;
  /** True for a destination outside the dashboard (the /invite, /vote, /app-directory redirects). */
  external?: boolean;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

/**
 * `/invite`, `/vote` and `/app-directory` are dashboard redirects built at build time from
 * DISCORD_CLIENT_ID (see next.config.js): no id is hardcoded here, and the links stay valid
 * without that variable, the redirect simply does not exist then.
 */
function columns(t: Translator): FooterColumn[] {
  return [
    {
      title: t("nav.footer.bot"),
      links: [
        { label: t("nav.footer.addBot"), href: "/invite", external: true },
        { label: t("nav.footer.vote"), href: "/vote", external: true },
        { label: t("nav.footer.appDirectory"), href: "/app-directory", external: true },
        ...(SUPPORT_INVITE
          ? [{ label: t("nav.footer.support"), href: "/support", external: true }]
          : []),
      ],
    },
    {
      title: t("nav.footer.dashboard"),
      links: [
        { label: t("nav.footer.home"), href: "/" },
        { label: t("nav.footer.myServers"), href: "/dashboard" },
      ],
    },
  ];
}

function FooterNav({ column }: { column: FooterColumn }) {
  return (
    <nav className="footer-column" aria-label={column.title}>
      <p className="footer-heading">{column.title}</p>
      <ul>
        {column.links.map((link) => (
          <li key={link.href}>
            {link.external ? (
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            ) : (
              <Link href={link.href}>{link.label}</Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Footer shared by every page: bot identity, useful links and legal notices. */
export async function SiteFooter() {
  const t = await getTranslator();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand">
          <Link href="/" className="footer-logo">
            <span className="brand-mark" aria-hidden="true">
              G
            </span>
            Gaulia
          </Link>
          <p>{t("nav.footer.tagline")}</p>
          <p className="footer-meta">
            {t("nav.footer.version", { version: APP_VERSION })} · {t("nav.footer.maintainedBy")}{" "}
            <a href={AUTHOR_URL} target="_blank" rel="noopener noreferrer">
              {AUTHOR_NAME}
            </a>
          </p>
        </div>

        {columns(t).map((column) => (
          <FooterNav key={column.title} column={column} />
        ))}

        <nav className="footer-column" aria-label={t("nav.footer.resources")}>
          <p className="footer-heading">{t("nav.footer.resources")}</p>
          <ul>
            <li>
              <Link href="/contact">{t("nav.footer.contact")}</Link>
            </li>
            <li>
              <Link href="/my-data">{t("nav.footer.myData")}</Link>
            </li>
            <li>
              <Link href="/privacy">{t("nav.footer.privacy")}</Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="site-footer-bottom">
        <span>{t("nav.footer.rights", { year })}</span>
        <div className="site-footer-toggles">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
