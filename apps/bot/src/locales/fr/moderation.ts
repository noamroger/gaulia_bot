import type { ModerationStrings } from "../en/moderation";

const moderation: ModerationStrings = {
  commands: {
    ban: {
      name: "bannir",
      description: "Bannit un membre du serveur",
      help: {
        details:
          "Bannit un membre, ou un utilisateur qui a déjà quitté le serveur. Un cas de modération est créé et publié dans le salon des logs, et le membre est prévenu en message privé si l'option est activée dans les réglages de modération. Le rôle le plus haut du membre doit être inférieur au tien et à celui de Gaulia.",
        examples: [
          "bannir utilisateur:@Pseudo raison:Spam",
          "bannir utilisateur:@Pseudo supprimer_messages_jours:7",
        ],
      },
      options: {
        user: { name: "utilisateur", description: "Membre à bannir" },
        reason: { name: "raison", description: "Raison du bannissement" },
        deleteMessageDays: {
          name: "supprimer_messages_jours",
          description: "Supprimer les messages des N derniers jours (0-7)",
        },
      },
    },

    kick: {
      name: "expulser",
      description: "Expulse un membre du serveur",
      help: {
        details:
          "Expulse un membre du serveur : il pourra revenir avec une nouvelle invitation. Un cas de modération est créé et le membre est prévenu en message privé si l'option est activée dans les réglages de modération. Le rôle le plus haut du membre doit être inférieur au tien et à celui de Gaulia.",
        examples: ["expulser utilisateur:@Pseudo raison:Comportement toxique"],
      },
      options: {
        user: { name: "utilisateur", description: "Membre à expulser" },
        reason: { name: "raison", description: "Raison de l'expulsion" },
      },
    },

    timeout: {
      name: "sourdine",
      description: "Met un membre en sourdine temporairement",
      help: {
        details:
          "Empêche un membre d'écrire, de réagir et de parler en vocal pendant la durée indiquée, de 1 seconde à 28 jours. Formats acceptés : un nombre de secondes (`90`) ou une valeur suivie de `s`, `m`, `h` ou `d` (`30s`, `10m`, `2h`, `1d`). Un cas de modération est créé et le membre est prévenu en message privé si l'option est activée.",
        examples: [
          "sourdine utilisateur:@Pseudo durée:10m raison:Flood",
          "sourdine utilisateur:@Pseudo durée:1d",
        ],
      },
      options: {
        user: { name: "utilisateur", description: "Membre à mettre en sourdine" },
        duration: { name: "durée", description: "Ex : 10m, 2h, 1d (28j max)" },
        reason: { name: "raison", description: "Raison" },
      },
    },

    untimeout: {
      name: "retirer-sourdine",
      description: "Retire la mise en sourdine d'un membre",
      help: {
        details:
          "Retire immédiatement la sourdine d'un membre. Un cas de modération est créé et le membre est prévenu en message privé si l'option est activée.",
        examples: ["retirer-sourdine utilisateur:@Pseudo"],
      },
      options: {
        user: { name: "utilisateur", description: "Membre concerné" },
        reason: { name: "raison", description: "Raison" },
      },
    },

    unban: {
      name: "débannir",
      description: "Débannit un utilisateur",
      help: {
        details:
          "Lève le bannissement d'un utilisateur à partir de son identifiant Discord, visible dans Paramètres du serveur > Bannissements ou avec « Copier l'identifiant » en mode développeur. Un cas de modération est créé.",
        examples: ["débannir id_utilisateur:123456789012345678 raison:Appel accepté"],
      },
      options: {
        userId: { name: "id_utilisateur", description: "ID Discord de l'utilisateur" },
        reason: { name: "raison", description: "Raison du débannissement" },
      },
    },

    warn: {
      name: "avertir",
      description: "Avertit un membre",
      help: {
        details:
          "Ajoute un avertissement au membre, crée un cas de modération et le prévient en message privé si l'option est activée. Si des paliers sont configurés sur le dashboard, une sourdine, une expulsion ou un bannissement est appliqué automatiquement quand le membre atteint le nombre d'avertissements d'un palier.",
        examples: ["avertir utilisateur:@Pseudo raison:Insultes"],
      },
      options: {
        user: { name: "utilisateur", description: "Membre à avertir" },
        reason: { name: "raison", description: "Raison de l'avertissement" },
      },
    },

    warnings: {
      name: "avertissements",
      description: "Liste les avertissements actifs d'un membre",
      help: {
        details:
          "Liste les avertissements actifs d'un membre avec leur numéro, leur raison et leur date. La réponse n'est visible que par toi.",
        examples: ["avertissements utilisateur:@Pseudo"],
      },
      options: {
        user: { name: "utilisateur", description: "Membre concerné" },
      },
    },

    purge: {
      name: "purger",
      description: "Supprime en masse des messages récents de ce salon",
      help: {
        details:
          "Supprime jusqu'à 100 messages parmi les plus récents du salon. Avec l'option utilisateur, seuls ses messages parmi ces derniers messages sont supprimés. Les messages de plus de 14 jours sont ignorés (limite de Discord). L'opération est enregistrée comme cas de modération.",
        examples: ["purger nombre:50", "purger nombre:100 utilisateur:@Pseudo"],
      },
      options: {
        amount: { name: "nombre", description: "Nombre de messages à supprimer (1-100)" },
        user: { name: "utilisateur", description: "Ne supprimer que les messages de ce membre" },
      },
    },

    case: {
      name: "cas",
      description: "Affiche le détail d'un cas de modération",
      help: {
        details:
          "Affiche la cible, le modérateur, la date, la raison et, pour une sourdine, la durée d'un cas de modération. Le numéro du cas est indiqué à chaque sanction et dans le salon des logs.",
        examples: ["cas numéro:12"],
      },
      options: {
        number: { name: "numéro", description: "Numéro du cas" },
      },
    },

    modlogsConfig: {
      name: "config-modlogs",
      description: "Configure le salon des logs de modération",
      help: {
        details:
          "Définit le salon textuel où Gaulia publie chaque cas de modération : bannissements, expulsions, sourdines, avertissements et purges. Gaulia doit pouvoir envoyer des messages dans ce salon.",
        examples: ["config-modlogs salon:#logs-moderation"],
      },
      options: {
        channel: { name: "salon", description: "Salon où envoyer les logs de modération" },
      },
    },

    warnUser: {
      name: "Avertir l'utilisateur",
      help: {
        details:
          "Ouvre un formulaire pour saisir la raison, puis avertit le membre comme `/avertir` : cas de modération, message privé si l'option est activée et paliers automatiques.",
        examples: [],
      },
    },
  },

  caseType: {
    BAN: "Bannissement",
    UNBAN: "Débannissement",
    KICK: "Expulsion",
    TIMEOUT: "Mise en sourdine",
    UNTIMEOUT: "Fin de sourdine",
    WARN: "Avertissement",
    UNWARN: "Révocation d'avertissement",
    PURGE: "Purge de messages",
  },

  case: {
    header: "Cas #{case} - {type}",
    target: "**Cible :** {tag} (`{id}`)",
    moderator: "**Modérateur :** {tag}",
    deletedModerator: "compte supprimé",
    date: "**Date :** {date}",
    reason: "**Raison :** {reason}",
    duration: "**Durée :** {duration}",
  },

  auditReason: "Modérateur : {moderator}",

  dm: {
    header: "Action de modération - {guild}",
    action: "**Action :** {action}",
  },

  sanction: {
    delete: "Suppression du message",
    warn: "Avertissement",
    timeout: "Sourdine de {duration}",
    kick: "Expulsion",
    ban: "Bannissement",
  },

  escalation: {
    line: "**Sanction automatique :** {sanction} ({warnings})",
    reason: "Sanction automatique : {warnings}",
    warnCount: { one: "{count} avertissement", other: "{count} avertissements" },
  },

  ban: {
    title: "Membre banni (cas #{case})",
    description: "**{target}** a été banni.",
  },

  kick: {
    title: "Membre expulsé (cas #{case})",
    description: "**{target}** a été expulsé.",
  },

  timeout: {
    title: "Membre mis en sourdine (cas #{case})",
    description: "**{target}** est en sourdine pour **{duration}**.",
  },

  untimeout: {
    title: "Sourdine retirée (cas #{case})",
    description: "**{target}** n'est plus en sourdine.",
  },

  unban: {
    title: "Utilisateur débanni (cas #{case})",
    description: "**{target}** a été débanni.",
  },

  warn: {
    title: "Membre averti (cas #{case})",
    description: "**{target}** a été averti.",
  },

  warnings: {
    title: "Avertissements de {target}",
    empty: "Aucun avertissement actif.",
    entry: "**#{id}** - {reason} ({date})",
    noReason: "Sans raison",
  },

  purge: {
    title: "Messages supprimés (cas #{case})",
    description: {
      one: "**{count}** message supprimé.",
      other: "**{count}** messages supprimés.",
    },
    caseReason: {
      one: "{count} message supprimé",
      other: "{count} messages supprimés",
    },
    caseReasonFrom: {
      one: "{count} message de {target} supprimé",
      other: "{count} messages de {target} supprimés",
    },
  },

  modlogs: {
    title: "Configuration mise à jour",
    description: "Les logs de modération seront envoyés dans <#{channel}>.",
  },

  warnModal: {
    title: "Avertir {user}",
    reasonLabel: "Raison de l'avertissement",
  },

  errors: {
    memberNotInGuild: "Ce membre n'est pas sur le serveur.",
    timeoutRange: "La durée doit être comprise entre 1 seconde et 28 jours.",
    notTimedOut: "Ce membre n'est pas actuellement en sourdine.",
    notBanned: "Cet utilisateur n'est pas banni sur ce serveur.",
    textChannelOnly: "Cette commande n'est utilisable que dans un salon textuel de serveur.",
    caseNotFound: "Aucun cas #{case} sur ce serveur.",
    guildOnly: "Cette action n'est utilisable qu'en serveur.",
    unknownTarget: "Impossible de déterminer la cible de cet avertissement.",
    userNotFound: "Utilisateur introuvable.",
  },
};

export default moderation;
