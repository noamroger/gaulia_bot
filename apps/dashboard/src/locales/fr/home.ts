import type { HomeStrings } from "../en/home";

const home: HomeStrings = {
  meta: {
    title: "Gaulia - Bot Discord de modération, musique et jeux",
    description:
      "Gaulia modère, protège et anime ton serveur Discord : modération, automod, musique, blindtest et jeux, configurables depuis un tableau de bord.",
  },

  nav: {
    ariaLabel: "Navigation principale",
    features: "Fonctionnalités",
    dashboard: "Tableau de bord",
  },

  hero: {
    eyebrow: "Bot Discord francophone",
    titleStart: "Modère, protège et",
    titleAccent: "anime",
    titleEnd: "ton serveur Discord",
    tagline:
      "Modération, automod, musique, blindtest et jeux dans un seul bot, configurable en quelques clics depuis ton navigateur.",
    addBot: "Ajouter Gaulia à mon serveur",
    manage: "Gérer mes serveurs",
  },

  preview: {
    channel: "blindtest",
    app: "APP",
    time: "Aujourd'hui à 21:04",
    player: "Tom",
    round: "Manche 3 / 10",
    hint: "Écoute bien ! Fin de la manche dans 18 secondes.",
    trackFound: "Titre : trouvé par",
    mention: "@Léa",
    artistPending: "Artiste : à trouver",
    skip: "Passer la manche",
    stop: "Arrêter",
    guess: "c'est Daft Punk !",
  },

  stats: {
    ariaLabel: "Statistiques en direct",
    guilds: "serveurs",
    members: "membres",
    commands: "commandes sur 30 jours",
    online: "Gaulia est en ligne",
    offline: "Gaulia est hors ligne",
    status: "{state} · chiffres actualisés chaque minute",
    unavailable: "Statistiques indisponibles pour le moment.",
    loading: "Chargement des statistiques...",
  },

  features: {
    eyebrow: "Fonctionnalités",
    title: "Tout ce qu'il faut pour ton serveur",
    subtitle: "Chaque module s'active et se règle depuis le tableau de bord.",

    moderation: {
      title: "Modération",
      description:
        "Bannissements, expulsions, sourdines et avertissements, avec l'historique des sanctions, des logs dans le salon de ton choix et des sanctions automatiques au-delà d'un nombre d'avertissements.",
    },
    automod: {
      title: "Automod",
      description:
        "Sept règles pour bloquer liens, invitations, mots interdits, mentions de masse, majuscules, messages en double et flood, chacune avec sa sanction, en plus de l'AutoMod natif de Discord.",
    },
    music: {
      title: "Musique",
      description:
        "Lecture depuis SoundCloud et les liens Spotify, file d'attente, filtres audio, salon dédié et rôle DJ pour garder la main sur la lecture.",
    },
    blindtest: {
      title: "Blindtest",
      description:
        "Des extraits de 30 secondes à deviner dans ton salon vocal, des catégories prêtes à jouer et tes propres listes de musiques.",
    },
    games: {
      title: "Jeux",
      description:
        "Puissance 4, morpion, pendu, Wordle, blackjack et démineur pour animer le serveur entre deux discussions.",
    },
    premium: {
      title: "Premium",
      description:
        "Musique en continu 24/7 et file d'attente étendue, avec un abonnement Discord ou grâce aux crédits gagnés en votant pour Gaulia sur top.gg.",
    },
  },

  steps: {
    eyebrow: "Démarrage",
    title: "Prêt en trois étapes",

    add: {
      title: "Ajoute Gaulia",
      description:
        "Invite le bot sur ton serveur en un clic, avec uniquement les permissions dont il a besoin.",
    },
    signIn: {
      title: "Connecte-toi",
      description:
        "Ouvre le tableau de bord avec ton compte Discord : tu y retrouves les serveurs que tu gères.",
    },
    configure: {
      title: "Configure",
      description:
        "Choisis tes salons de logs, tes règles d'automod, la musique et le blindtest, puis enregistre.",
    },
  },

  cta: {
    title: "Prêt à essayer Gaulia ?",
    description:
      "Ajoute le bot à ton serveur, puis configure-le depuis le tableau de bord avec ton compte Discord.",
    addBot: "Ajouter Gaulia",
    vote: "Voter sur top.gg",
  },
};

export default home;
