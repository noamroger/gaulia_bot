import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { LiveStats } from "@/components/home/LiveStats";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Translator } from "@/i18n";
import { getTranslator } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return { title: t("home.meta.title"), description: t("home.meta.description") };
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Only the drawing lives here: each card reads its title and text from `home.features.<id>`. */
const FEATURES: { id: string; icon: ReactNode }[] = [
  {
    id: "moderation",
    icon: <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3Z" />,
  },
  {
    id: "automod",
    icon: <path d="M4 5h16l-6 7.5V19l-4 2v-8.5L4 5Z" />,
  },
  {
    id: "music",
    icon: (
      <>
        <path d="M9 18V6l11-2v12" />
        <circle cx="6.5" cy="18" r="2.5" />
        <circle cx="17.5" cy="16" r="2.5" />
      </>
    ),
  },
  {
    id: "blindtest",
    icon: <path d="M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4" />,
  },
  {
    id: "games",
    icon: (
      <>
        <rect x="2.5" y="7" width="19" height="10" rx="5" />
        <path d="M7 12h4M9 10v4" />
        <path d="M15.5 11h.01M18 13h.01" />
      </>
    ),
  },
  {
    id: "premium",
    icon: (
      <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />
    ),
  },
];

const STEPS = ["add", "signIn", "configure"] as const;

/** Decorative preview of a blindtest round, faithful to the message the bot posts. */
function DiscordPreview({ t }: { t: Translator }) {
  return (
    <div className="landing-preview" aria-hidden="true">
      <div className="preview-header">
        <span className="preview-hash">#</span>
        {t("home.preview.channel")}
      </div>
      <div className="preview-messages">
        <div className="preview-message">
          <span className="preview-avatar">G</span>
          <div>
            <div className="preview-author">
              Gaulia <span className="preview-badge">{t("home.preview.app")}</span>
              <span className="preview-time">{t("home.preview.time")}</span>
            </div>
            <div className="preview-container">
              <strong>{t("home.preview.round")}</strong>
              <p>{t("home.preview.hint")}</p>
              <p>
                {t("home.preview.trackFound")}{" "}
                <span className="preview-mention">{t("home.preview.mention")}</span>
                <br />
                {t("home.preview.artistPending")}
              </p>
              <div className="preview-buttons">
                <span className="preview-button">{t("home.preview.skip")}</span>
                <span className="preview-button is-danger">{t("home.preview.stop")}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="preview-message">
          <span className="preview-avatar is-user">T</span>
          <div>
            <div className="preview-author">
              {t("home.preview.player")}{" "}
              <span className="preview-time">{t("home.preview.time")}</span>
            </div>
            <p className="preview-text">{t("home.preview.guess")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const t = await getTranslator();

  return (
    <div className="landing">
      <div className="landing-backdrop" aria-hidden="true" />

      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Link href="/" className="landing-brand">
            <span className="landing-logo" aria-hidden="true">
              G
            </span>
            Gaulia
          </Link>
          <nav className="landing-nav-links" aria-label={t("home.nav.ariaLabel")}>
            <a href="#features" className="landing-nav-link">
              {t("home.nav.features")}
            </a>
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/dashboard" className="button-secondary">
              {t("home.nav.dashboard")}
            </Link>
          </nav>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div>
            <span className="landing-eyebrow">{t("home.hero.eyebrow")}</span>
            <h1>
              {t("home.hero.titleStart")}{" "}
              <span className="landing-gradient">{t("home.hero.titleAccent")}</span>{" "}
              {t("home.hero.titleEnd")}
            </h1>
            <p className="landing-tagline">{t("home.hero.tagline")}</p>
            <div className="landing-actions">
              <a className="button-primary" href="/invite">
                {t("home.hero.addBot")}
              </a>
              <Link className="button-secondary" href="/dashboard">
                {t("home.hero.manage")}
              </Link>
            </div>
          </div>
          <DiscordPreview t={t} />
        </section>

        <LiveStats />

        <section id="features" className="landing-section" aria-labelledby="features-title">
          <div className="landing-section-head">
            <span className="landing-eyebrow">{t("home.features.eyebrow")}</span>
            <h2 id="features-title">{t("home.features.title")}</h2>
            <p>{t("home.features.subtitle")}</p>
          </div>
          <div className="feature-grid">
            {FEATURES.map((feature) => (
              <article key={feature.id} className="landing-card">
                <span className="feature-icon">
                  <Icon>{feature.icon}</Icon>
                </span>
                <h3>{t(`home.features.${feature.id}.title`)}</h3>
                <p>{t(`home.features.${feature.id}.description`)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section" aria-labelledby="steps-title">
          <div className="landing-section-head">
            <span className="landing-eyebrow">{t("home.steps.eyebrow")}</span>
            <h2 id="steps-title">{t("home.steps.title")}</h2>
          </div>
          <ol className="steps-grid">
            {STEPS.map((step, index) => (
              <li key={step} className="landing-card">
                <span className="step-number">{index + 1}</span>
                <h3>{t(`home.steps.${step}.title`)}</h3>
                <p>{t(`home.steps.${step}.description`)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-cta">
          <h2>{t("home.cta.title")}</h2>
          <p>{t("home.cta.description")}</p>
          <div className="landing-actions">
            <a className="button-primary" href="/invite">
              {t("home.cta.addBot")}
            </a>
            <a className="button-secondary" href="/vote">
              {t("home.cta.vote")}
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
