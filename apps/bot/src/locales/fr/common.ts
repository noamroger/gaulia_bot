import type { CommonStrings } from "../en/common";

const common: CommonStrings = {
  error: {
    title: "Oups",
    internal: "Une erreur interne est survenue.",
  },

  guard: {
    guildOnly: {
      title: "Serveur requis",
      description: "Cette commande n'est utilisable qu'au sein d'un serveur.",
    },
    permission: {
      title: "Permission manquante",
      description: "Tu n'as pas la permission d'utiliser cette commande.",
    },
    cooldown: {
      title: "Doucement",
      description: "Réessaie dans {seconds}s.",
    },
    blindtestRunning:
      "Un blindtest est en cours sur ce serveur : les commandes musique reviennent à la fin de la partie.",
  },

  hierarchy: {
    self: "Tu ne peux pas effectuer cette action sur toi-même.",
    targetOwner: "Impossible d'agir sur le propriétaire du serveur.",
    targetHigher: "Ce membre a un rôle égal ou supérieur au tien.",
    botTargetOwner: "Je ne peux pas agir sur le propriétaire du serveur.",
    botRoleTooLow: "Mon rôle est trop bas dans la hiérarchie pour agir sur ce membre.",
  },

  permissionLevel: {
    owner: "Propriétaire du bot",
    administrator: "Administrateur",
    moderator: "Modérateur",
    everyone: "Tout le monde",
  },

  premium: {
    featureTitle: "Fonctionnalité premium",
    featureDescription: "**{feature}** est réservée aux serveurs disposant de **Gaulia Premium**.",
    invitationTitle: "Profitez de Gaulia Premium !",
    invitationDescription:
      "Ce serveur ne dispose pas de **Gaulia Premium**. Passe en premium pour profiter de : 24/7, filtres audio, file d'attente étendue et règles automod avancées.",
  },

  duration: {
    invalid: "Format de durée invalide. Exemples valides : `30s`, `10m`, `2h`, `1d`.",
    day: "{count}j",
    hour: "{count}h",
    minute: "{count}m",
    second: "{count}s",
    zero: "0s",
  },

  language: {
    auto: "Automatique (langue Discord)",
    en: "Anglais",
    fr: "Français",
  },
};

export default common;
