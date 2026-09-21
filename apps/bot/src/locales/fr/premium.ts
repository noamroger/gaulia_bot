import type { PremiumStrings } from "../en/premium";

const premium: PremiumStrings = {
  commands: {
    premium: {
      name: "premium",
      description: "Gère l'abonnement Gaulia Premium de ce serveur",
      subcommands: {
        status: {
          name: "statut",
          description: "Affiche le statut premium de ce serveur",
        },
        upgrade: {
          name: "souscrire",
          description: "Affiche comment passer ce serveur en premium",
        },
      },
      help: {
        details:
          "Gaulia Premium débloque le mode 24/7, les filtres audio, une file d'attente étendue et les règles automod avancées. `statut` indique si ce serveur en profite, `souscrire` affiche les options d'abonnement, dont la semaine ou le mois offerts contre des crédits gagnés en votant.",
        examples: ["premium statut", "premium souscrire"],
      },
    },
  },

  status: {
    activeTitle: "Gaulia Premium actif",
    activeDescription:
      "Ce serveur profite de : 24/7, filtres audio, file d'attente étendue et règles automod avancées.",
    grantedUntil: "Premium offert (crédits) jusqu'au {date} ({relative}).",

    inactiveTitle: "Statut premium",
    inactiveDescription: "Ce serveur n'a pas Gaulia Premium.",
    upgradeHint: "Utilise `/premium souscrire` pour voir les options d'abonnement.",
    skuMissing: "Le SKU premium n'est pas encore configuré côté bot.",

    creditsHint:
      "**Gratuit :** [vote pour Gaulia]({voteUrl}) pour gagner 10 crédits par vote{dashboardHint} : 150 crédits pour une semaine de premium, 500 pour un mois.",
    creditsDashboardLink:
      " puis échange-les dans l'onglet premium de ton serveur sur [le dashboard]({dashboardUrl}/dashboard)",
    creditsDashboardPlain:
      " puis échange-les dans l'onglet premium de ton serveur sur le dashboard",
  },

  upgrade: {
    alreadyTitle: "Déjà premium",
    alreadyDescription: "Ce serveur profite déjà de Gaulia Premium, merci pour ton soutien !",
  },
};

export default premium;
