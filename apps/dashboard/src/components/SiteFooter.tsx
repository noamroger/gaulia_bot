import Link from "next/link";

import { ThemeToggle } from "@/components/ThemeToggle";
import { APP_VERSION, AUTHOR_NAME, AUTHOR_URL, SUPPORT_INVITE } from "@/lib/config";

interface FooterLink {
  label: string;
  href: string;
  /** Vrai pour une destination hors du dashboard (redirections /invite, /vote, /app-directory). */
  external?: boolean;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

/**
 * `/invite`, `/vote` et `/app-directory` sont des redirections du dashboard construites au build à
 * partir de DISCORD_CLIENT_ID (voir next.config.js) : aucun identifiant n'est écrit en dur ici, et
 * les liens restent valides même sans cette variable - la redirection est alors simplement absente.
 */
const COLUMNS: FooterColumn[] = [
  {
    title: "Le bot",
    links: [
      { label: "Ajouter Gaulia", href: "/invite", external: true },
      { label: "Voter sur top.gg", href: "/vote", external: true },
      { label: "App Directory Discord", href: "/app-directory", external: true },
      ...(SUPPORT_INVITE
        ? [{ label: "Serveur de support", href: "/support", external: true }]
        : []),
    ],
  },
  {
    title: "Tableau de bord",
    links: [
      { label: "Accueil", href: "/" },
      { label: "Mes serveurs", href: "/dashboard" },
    ],
  },
];

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

/** Pied de page commun à toutes les pages : identité du bot, liens utiles et mentions légales. */
export function SiteFooter() {
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
          <p>
            Bot Discord français : modération, automod, musique, blindtest, jeux et aventure au long
            cours, le tout réglable serveur par serveur depuis ce tableau de bord.
          </p>
          <p className="footer-meta">
            Version {APP_VERSION} · créé et maintenu par{" "}
            <a href={AUTHOR_URL} target="_blank" rel="noopener noreferrer">
              {AUTHOR_NAME}
            </a>
          </p>
        </div>

        {COLUMNS.map((column) => (
          <FooterNav key={column.title} column={column} />
        ))}

        <nav className="footer-column" aria-label="Ressources">
          <p className="footer-heading">Ressources</p>
          <ul>
            <li>
              <Link href="/contact">Nous contacter</Link>
            </li>
            <li>
              <Link href="/my-data">Mes données</Link>
            </li>
            <li>
              <Link href="/privacy">Politique de confidentialité</Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="site-footer-bottom">
        <span>© {year} Gaulia · non affilié à Discord Inc.</span>
        <ThemeToggle />
      </div>
    </footer>
  );
}
