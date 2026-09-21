import type { SettingsStrings } from "../en/settings";

const settings: SettingsStrings = {
  loadError: "Impossible de charger les paramètres de ce serveur.",

  logs: {
    title: "Salons de logs",
    description: "Où Gaulia publie ses rapports. Choisis « Désactivé » pour ne rien publier.",
    disabled: "Désactivé",
    moderation: {
      label: "Logs de modération",
      hint: "Chaque sanction (bannissement, expulsion, sourdine, avertissement) avec sa raison et son auteur.",
      aria: "Salon des logs de modération",
    },
    automod: {
      label: "Logs automod",
      hint: "Messages supprimés par l'automod et sanctions appliquées.",
      aria: "Salon des logs automod",
    },
  },

  sanctions: {
    title: "Sanctions",
    dm: {
      label: "Prévenir le membre en message privé",
      hint: "Le membre sanctionné reçoit l'action et sa raison en MP, si ses MP sont ouverts.",
    },
  },

  escalation: {
    title: "Sanctions automatiques des avertissements",
    description:
      "Quand un membre atteint un nombre d'avertissements actifs, Gaulia applique automatiquement la sanction du palier.",
    empty: "Aucun palier : les avertissements n'entraînent pas de sanction automatique.",
    at: "À",
    warnings: "avertissements :",
    warnCountAria: "Nombre d'avertissements",
    stepActionAria: "Sanction du palier",
    remove: "Retirer",
    add: "Ajouter un palier",
    duplicate: "Deux paliers ont le même nombre d'avertissements.",
    action: {
      timeout: "Sourdine",
      kick: "Expulsion",
      ban: "Bannissement",
    },
  },

  sanction: {
    label: "Sanction",
    timeout: "Durée de la sourdine",
    type: {
      delete: "Supprimer le message",
      warn: "Supprimer et avertir",
      timeout: "Supprimer et mettre en sourdine",
      kick: "Supprimer et expulser",
      ban: "Supprimer et bannir",
    },
  },

  duration: {
    unitAria: "Unité de durée",
    minutes: "minutes",
    hours: "heures",
    days: "jours",
  },

  channel: {
    missing: "Salon introuvable",
  },

  role: {
    missing: "Rôle introuvable",
  },

  picker: {
    unknown: "Introuvable",
    remove: "Retirer {label}",
  },

  tags: {
    remove: "Retirer {value}",
    full: "Limite atteinte",
    add: "Ajouter",
  },

  saveBar: {
    unsaved: "Modifications non enregistrées.",
    saved: "Modifications enregistrées.",
    saving: "Enregistrement...",
  },
};

export default settings;
