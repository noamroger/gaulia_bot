import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { LiveStats } from "@/components/home/LiveStats";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Gaulia — Bot Discord de modération, musique et jeux",
  description:
    "Gaulia modère, protège et anime ton serveur Discord : modération, automod, musique, blindtest et jeux, configurables depuis un tableau de bord.",
};

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

const FEATURES: { title: string; description: string; icon: ReactNode }[] = [
  {
    title: "Modération",
    description:
      "Bannissements, expulsions, sourdines et avertissements, avec l'historique des sanctions, des logs dans le salon de ton choix et des sanctions automatiques au-delà d'un nombre d'avertissements.",
    icon: <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3Z" />,
  },
  {
    title: "Automod",
    description:
      "Sept règles pour bloquer liens, invitations, mots interdits, mentions de masse, majuscules, messages en double et flood, chacune avec sa sanction, en plus de l'AutoMod natif de Discord.",
    icon: <path d="M4 5h16l-6 7.5V19l-4 2v-8.5L4 5Z" />,
  },
  {
    title: "Musique",
    description:
      "Lecture depuis SoundCloud et les liens Spotify, file d'attente, filtres audio, salon dédié et rôle DJ pour garder la main sur la lecture.",
    icon: (
      <>
        <path d="M9 18V6l11-2v12" />
        <circle cx="6.5" cy="18" r="2.5" />
        <circle cx="17.5" cy="16" r="2.5" />
      </>
    ),
  },
  {
    title: "Blindtest",
    description:
      "Des extraits de 30 secondes à deviner dans ton salon vocal, des catégories prêtes à jouer et tes propres listes de musiques.",
    icon: <path d="M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4" />,
  },
  {
    title: "Jeux",
    description:
      "Puissance 4, morpion, pendu, Wordle, blackjack et démineur pour animer le serveur entre deux discussions.",
    icon: (
      <>
        <rect x="2.5" y="7" width="19" height="10" rx="5" />
        <path d="M7 12h4M9 10v4" />
        <path d="M15.5 11h.01M18 13h.01" />
      </>
    ),
  },
  {
    title: "Premium",
    description:
      "Musique en continu 24/7 et file d'attente étendue, avec un abonnement Discord ou grâce aux crédits gagnés en votant pour Gaulia sur top.gg.",
    icon: (
      <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />
    ),
  },
];

const STEPS = [
  {
    title: "Ajoute Gaulia",
    description:
      "Invite le bot sur ton serveur en un clic, avec uniquement les permissions dont il a besoin.",
  },
  {
    title: "Connecte-toi",
    description:
      "Ouvre le tableau de bord avec ton compte Discord : tu y retrouves les serveurs que tu gères.",
  },
  {
    title: "Configure",
    description:
      "Choisis tes salons de logs, tes règles d'automod, la musique et le blindtest, puis enregistre.",
  },
];

/** Aperçu décoratif d'une manche de blindtest, fidèle au message envoyé par le bot. */
function DiscordPreview() {
  return (
    <div className="landing-preview" aria-hidden="true">
      <div className="preview-header">
        <span className="preview-hash">#</span>
        blindtest
      </div>
      <div className="preview-messages">
        <div className="preview-message">
          <span className="preview-avatar">G</span>
          <div>
            <div className="preview-author">
              Gaulia <span className="preview-badge">APP</span>
              <span className="preview-time">Aujourd&apos;hui à 21:04</span>
            </div>
            <div className="preview-container">
              <strong>Manche 3 / 10</strong>
              <p>Écoute bien ! Fin de la manche dans 18 secondes.</p>
              <p>
                Titre : trouvé par <span className="preview-mention">@Léa</span>
                <br />
                Artiste : à trouver
              </p>
              <div className="preview-buttons">
                <span className="preview-button">Passer la manche</span>
                <span className="preview-button is-danger">Arrêter</span>
              </div>
            </div>
          </div>
        </div>
        <div className="preview-message">
          <span className="preview-avatar is-user">T</span>
          <div>
            <div className="preview-author">
              Tom <span className="preview-time">Aujourd&apos;hui à 21:04</span>
            </div>
            <p className="preview-text">c&apos;est Daft Punk !</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
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
          <nav className="landing-nav-links" aria-label="Navigation principale">
            <a href="#fonctionnalites" className="landing-nav-link">
              Fonctionnalités
            </a>
            <ThemeToggle />
            <Link href="/dashboard" className="button-secondary">
              Tableau de bord
            </Link>
          </nav>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div>
            <span className="landing-eyebrow">Bot Discord francophone</span>
            <h1>
              Modère, protège et <span className="landing-gradient">anime</span> ton serveur Discord
            </h1>
            <p className="landing-tagline">
              Modération, automod, musique, blindtest et jeux dans un seul bot, configurable en
              quelques clics depuis ton navigateur.
            </p>
            <div className="landing-actions">
              <a className="button-primary" href="/invite">
                Ajouter Gaulia à mon serveur
              </a>
              <Link className="button-secondary" href="/dashboard">
                Gérer mes serveurs
              </Link>
            </div>
          </div>
          <DiscordPreview />
        </section>

        <LiveStats />

        <section id="fonctionnalites" className="landing-section" aria-labelledby="features-title">
          <div className="landing-section-head">
            <span className="landing-eyebrow">Fonctionnalités</span>
            <h2 id="features-title">Tout ce qu&apos;il faut pour ton serveur</h2>
            <p>Chaque module s&apos;active et se règle depuis le tableau de bord.</p>
          </div>
          <div className="feature-grid">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="landing-card">
                <span className="feature-icon">
                  <Icon>{feature.icon}</Icon>
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section" aria-labelledby="steps-title">
          <div className="landing-section-head">
            <span className="landing-eyebrow">Démarrage</span>
            <h2 id="steps-title">Prêt en trois étapes</h2>
          </div>
          <ol className="steps-grid">
            {STEPS.map((step, index) => (
              <li key={step.title} className="landing-card">
                <span className="step-number">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-cta">
          <h2>Prêt à essayer Gaulia ?</h2>
          <p>
            Ajoute le bot à ton serveur, puis configure-le depuis le tableau de bord avec ton compte
            Discord.
          </p>
          <div className="landing-actions">
            <a className="button-primary" href="/invite">
              Ajouter Gaulia
            </a>
            <a className="button-secondary" href="/vote">
              Voter sur top.gg
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
