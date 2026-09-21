import type { PremiumStrings } from "../en/premium";

const premium: PremiumStrings = {
  loadError: "Impossible de charger le statut premium.",

  status: {
    title: "Statut premium",
    active: "Actif",
    inactive: "Inactif",
    fromSubscription: "Abonnement Discord",
    fromCredits: "Crédits",

    offerBefore: "Utilise",
    offerCommand: "/premium souscrire",
    offerAfter: "sur Discord pour souscrire l'abonnement, ou échange tes crédits ci-dessous.",

    subscriptionSource: "Payé directement sur Discord, sur ton moyen de paiement habituel.",
    renewsAt: "Prochain renouvellement le {date}.",
    renewsUnknown: "Renouvellement automatique : Discord n'annonce pas encore de date.",
    creditsSource: "Offert en échange de crédits gagnés en votant pour Gaulia sur top.gg.",
    expiresAt: "Expire le {date}, sans renouvellement automatique.",
    noExpiry: "Aucune échéance enregistrée.",
    bothSources:
      "Du premium offert court aussi jusqu'au {date}. C'est l'abonnement qui prime : tu ne paies pas deux fois.",
  },

  offer: {
    week: { label: "Une semaine de premium", duration: "7 jours" },
    month: { label: "Un mois de premium", duration: "30 jours" },
  },

  redeem: {
    title: "Premium offert contre des crédits",
    balanceBefore: "Tu disposes de",
    balanceValue: {
      one: "{value} crédit",
      other: "{value} crédits",
    },
    balanceAfter:
      "Chaque vote pour Gaulia sur top.gg en rapporte 10, et un vote est possible toutes les 12 heures. Les durées échangées s'ajoutent à un premium offert déjà en cours.",
    subscribed:
      "Ce serveur a déjà un abonnement payant : inutile d'échanger des crédits, ils seraient consommés en parallèle sans rien ajouter.",
    cost: {
      one: "{value} crédit",
      other: "{value} crédits",
    },
    action: "Échanger",
    missing: "Il manque {value} crédits",
  },

  confirm: {
    aria: "Confirmer l'échange",
    before: "Échanger",
    credits: {
      one: "{value} crédit",
      other: "{value} crédits",
    },
    middle: "contre",
    after:
      "de premium sur ce serveur ? Si le serveur souscrit l'abonnement payant avant la fin de cette période, la part non consommée te sera recréditée.",
    submit: "Confirmer l'échange",
    pending: "Échange...",
  },

  success: {
    one: "Premium activé jusqu'au {date}. Il reste {value} crédit sur ton compte.",
    other: "Premium activé jusqu'au {date}. Il reste {value} crédits sur ton compte.",
  },
  userCredits: {
    loading: "Chargement des crédits...",
    label: "Mes crédits",
    noVote: "Aucun vote enregistré pour l'instant.",
    votes: { one: "{value} vote", other: "{value} votes" },
    earned: {
      one: "{value} crédit gagné au total",
      other: "{value} crédits gagnés au total",
    },
    vote: "Voter",
    explainerBefore:
      "Chaque vote sur top.gg rapporte {credits} crédits (un vote possible toutes les 12 h). Échange-les dans l'onglet",
    premiumTab: "Premium",
    explainerAfter: "d'un serveur :",
    offer: "{cost} crédits pour {duration}",
    history: "Historique des crédits",

    table: {
      date: "Date",
      operation: "Opération",
      amount: "Montant",
      balance: "Solde",
    },

    transaction: {
      VOTE: "Vote top.gg",
      PREMIUM_REDEEM: "Échange premium",
      ADMIN_ADJUST: "Ajustement administrateur",
      PREMIUM_REFUND: "Remboursement premium",
    },
  },
};

export default premium;
