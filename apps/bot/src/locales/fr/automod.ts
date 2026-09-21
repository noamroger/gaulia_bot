import type { AutomodStrings } from "../en/automod";

const automod: AutomodStrings = {
  commands: {
    automod: {
      name: "automod",
      description: "Configure la modération automatique de ce serveur",
      help: {
        details:
          "Gère l'AutoMod natif de Discord. `installer` crée des règles de base qui bloquent le spam, les messages de plus de 5 mentions et les mots interdits des listes prédéfinies de Discord. `règles` liste les règles natives avec leur identifiant, à utiliser avec `supprimer-règle`. `config` choisit le salon des logs automod. Les règles propres à Gaulia (liens, invitations, mots interdits, majuscules, doublons, flood) et leurs sanctions se configurent sur le dashboard.",
        examples: [
          "automod installer",
          "automod supprimer-règle id:123456789012345678",
          "automod config salon_logs:#logs-automod",
        ],
      },
      subcommands: {
        setup: {
          name: "installer",
          description: "Crée les règles AutoMod natives de base (spam, mentions, mots interdits)",
        },
        rules: {
          name: "règles",
          description: "Liste les règles AutoMod natives actives",
        },
        ruleDelete: {
          name: "supprimer-règle",
          description: "Supprime une règle AutoMod native",
          options: {
            id: { name: "id", description: "ID de la règle" },
          },
        },
        config: {
          name: "config",
          description: "Choisit le salon des logs automod (règles et sanctions : dashboard)",
          options: {
            logChannel: { name: "salon_logs", description: "Salon où envoyer les logs automod" },
          },
        },
      },
    },
  },

  setup: {
    title: "Règles AutoMod créées",
    description: {
      one: "{count} règle native créée.",
      other: "{count} règles natives créées.",
    },
    auditReason: "Configuré par {moderator} via /automod installer",
  },

  rules: {
    title: "Règles AutoMod natives",
    empty: "Aucune règle configurée.",
    entry: "**{name}** - `{id}` ({state})",
    enabled: "activée",
    disabled: "désactivée",
    deleted: "Règle supprimée",
    names: {
      spam: "Anti-spam",
      mentionSpam: "Anti mention-spam",
      badWords: "Mots interdits",
    },
  },

  config: {
    title: "Configuration automod mise à jour",
    description:
      "Les logs automod seront envoyés dans <#{channel}>. Les règles (liens, invitations, mots interdits, flood…) et leurs sanctions se configurent depuis le dashboard Gaulia.",
  },

  violations: {
    invites: {
      title: "Invitation Discord interdite",
      detail: "a posté une invitation non autorisée",
    },
    linkBlocked: {
      title: "Lien interdit",
      detail: "a posté un lien vers un domaine bloqué",
    },
    linkNotAllowed: {
      title: "Lien interdit",
      detail: "a posté un lien vers un domaine non autorisé",
    },
    badWords: {
      title: "Mot interdit",
      detail: "a utilisé un mot interdit",
    },
    mentions: {
      title: "Mentions de masse",
      detail: "a mentionné {count} membres ou rôles",
    },
    caps: {
      title: "Abus de majuscules",
      detail: "a écrit en majuscules",
    },
    duplicates: {
      title: "Message répété",
      detail: "a répété le même message {count} fois",
    },
    flood: {
      title: "Flood",
      detail: "a envoyé {count} messages en moins de {seconds} s",
    },
  },

  reason: "Automod : {rule}",

  log: {
    line: "**{target}** {detail} dans <#{channel}>.",
    sanction: "**Sanction :** {outcome}",
  },

  outcome: {
    escalated: "Avertissement, puis {sanction} ({warnings})",
    memberNotFound: "Message supprimé (membre introuvable)",
    botRoleTooLow: "Message supprimé (rôle du bot trop bas pour sanctionner ce membre)",
    failed: "Message supprimé (la sanction n'a pas pu être appliquée)",
  },

  native: {
    title: "AutoMod natif déclenché",
    member: "**Membre :** <@{id}>",
    rule: "**Règle :** `{id}`",
    keyword: "**Mot détecté :** {keyword}",
    channel: "**Salon :** <#{id}>",
  },

  errors: {
    alreadyConfigured:
      "Des règles Gaulia existent déjà sur ce serveur. Utilise `/automod règles` pour les consulter.",
    ruleNotFound: "Règle introuvable.",
    unknownSubcommand: "Sous-commande inconnue.",
  },
};

export default automod;
