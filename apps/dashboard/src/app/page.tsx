import type { Metadata } from "next";
import Link from "next/link";

import { LiveStats } from "@/components/home/LiveStats";

export const metadata: Metadata = {
  title: "Gaulia — Bot Discord de modération, musique et jeux",
  description:
    "Gaulia modère, protège et anime ton serveur Discord : modération, automod, musique, blindtest et jeux, configurables depuis un tableau de bord.",
};

const FEATURES = [
  {
    title: "Modération",
    description:
      "Bannissements, expulsions, sourdines et avertissements, avec l'historique des sanctions, des logs dans le salon de ton choix et des sanctions automatiques au-delà d'un nombre d'avertissements.",
  },
  {
    title: "Automod",
    description:
      "Sept règles pour bloquer liens, invitations, mots interdits, mentions de masse, majuscules, messages en double et flood, chacune avec sa sanction, en plus de l'AutoMod natif de Discord.",
  },
  {
    title: "Musique",
    description:
      "Lecture depuis SoundCloud et les liens Spotify, file d'attente, filtres audio, salon dédié et rôle DJ pour garder la main sur la lecture.",
  },
  {
    title: "Blindtest",
    description:
      "Des extraits de 30 secondes à deviner dans ton salon vocal, des catégories prêtes à jouer et tes propres listes de musiques.",
  },
  {
    title: "Jeux",
    description:
      "Puissance 4, morpion, pendu, Wordle, blackjack et démineur pour animer le serveur entre deux discussions.",
  },
  {
    title: "Premium",
    description:
      "Musique en continu 24/7 et file d'attente étendue, avec un abonnement Discord ou grâce aux crédits gagnés en votant pour Gaulia sur top.gg.",
  },
];

export default function HomePage() {
  return (
    <div>
      <nav className="top-nav">
        <Link href="/" className="brand">
          Gaulia
        </Link>
        <Link href="/dashboard" className="button-secondary">
          Tableau de bord
        </Link>
      </nav>

      <main className="container container-wide landing">
        <section className="landing-hero">
          <h1>Gaulia</h1>
          <p className="landing-tagline">
            Le bot Discord qui modère, protège et anime ton serveur, et se configure en quelques
            clics depuis ton navigateur.
          </p>
          <div className="landing-actions">
            <a className="button-primary" href="/invite">
              Ajouter Gaulia à mon serveur
            </a>
            <Link className="button-secondary" href="/dashboard">
              Gérer mes serveurs
            </Link>
          </div>
        </section>

        <LiveStats />

        <section aria-labelledby="features-title">
          <h2 id="features-title" className="landing-section-title">
            Tout ce qu&apos;il faut pour ton serveur
          </h2>
          <div className="feature-grid">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="card feature-card">
                <h3 className="card-title">{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="card landing-cta">
          <h2 className="card-title">Prêt à essayer ?</h2>
          <p className="card-subtitle">
            Ajoute Gaulia à ton serveur, puis connecte-toi au tableau de bord avec ton compte
            Discord pour le configurer.
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
