import type { ErrorsStrings } from "../en/errors";

const errors: ErrorsStrings = {
  common: {
    internal: "Une erreur interne est survenue.",
    badRequest: "Requête invalide.",
    notFound: "Ressource introuvable.",
  },
  auth: {
    required: "Tu n'es pas connecté.",
  },
  validation: {
    settings: "Paramètres invalides.",
    parameters: "Paramètres invalides.",
    body: "Corps de requête invalide.",
    id: "Identifiant invalide.",
  },
  guild: {
    notManaged: "Tu ne gères pas ce serveur.",
    botMissing: "Gaulia n'a pas accès à ce serveur.",
    unknownChannelOrRole: "Salon ou rôle introuvable sur ce serveur.",
    invalid: "Serveur invalide.",
  },
  blindtest: {
    invalidName: "Nom de liste invalide.",
    tooManyLists: "Un serveur peut avoir au maximum {max} listes.",
    nameTaken: "Une liste porte déjà ce nom.",
    listNotFound: "Liste introuvable.",
    invalidList: "Liste invalide.",
    spotifyLink: "Colle le lien d'une playlist, d'un album ou d'un titre Spotify.",
    importRateLimited: "Trop d'imports, réessaie dans une minute.",
    spotifyUnreadable: "Impossible de lire ce lien Spotify. Vérifie qu'il est public.",
  },
  premium: {
    unknownOffer: "Offre inconnue.",
    subscriptionActive:
      "Ce serveur a déjà un abonnement Gaulia Premium actif : tes crédits seraient dépensés pour rien. Réessaie à la fin de l'abonnement.",
    notEnoughCredits: "Crédits insuffisants : {cost} requis, {balance} disponible(s).",
  },
  contact: {
    unavailable: "L'envoi de messages est momentanément indisponible.",
    missingEmail:
      "Ton adresse Discord n'est pas disponible. Reconnecte-toi pour autoriser son partage, ou vérifie l'adresse de ton compte Discord.",
    invalidForm: "Formulaire invalide.",
    invalidSubject: "Sujet inconnu.",
    invalidGuildId: "Identifiant de serveur invalide.",
    messageTooShort: "Message trop court.",
    messageTooLong: "Message trop long.",
    rateLimited: "Trop de messages envoyés. Réessaie dans quelques minutes.",
  },
  data: {
    confirmationMissing: "Confirmation manquante : renvoie le mot SUPPRIMER.",
  },
  admin: {
    ownersOnly: "Accès réservé aux propriétaires du bot.",
  },
  adventure: {
    noCharacter: "Ce joueur n'a pas d'aventurier.",
    unknownItem: "Objet inconnu au catalogue.",
  },
};

export default errors;
