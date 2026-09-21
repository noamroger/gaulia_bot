import type { AdminStrings } from "../en/admin";

const admin: AdminStrings = {
  layout: {
    title: "Panel admin",
    tabsLabel: "Sections du panel admin",
    tabs: {
      stats: "Statistiques",
      servers: "Serveurs",
      credits: "Crédits",
      adventure: "Aventure",
      data: "Données",
    },
  },

  stats: {
    rangeLabel: "Période",
    rangeOption: "{days} jours",
    autoRefresh: "Actualisation automatique toutes les {seconds} s",
    loadFailed: "Impossible de charger les statistiques.",

    tiles: {
      guilds: "Serveurs",
      members: "Membres",
      commands: "Commandes",
      commandsHint: "sur {days} jours · {total} au total",
      shards: "Shards en ligne",
      shardsValue: "{online} / {total}",
      ping: "Ping moyen",
      players: "Lecteurs musique actifs",
    },

    scope: {
      all: "toutes catégories",
      none: "aucune catégorie sélectionnée",
    },

    daily: {
      title: "Commandes par jour",
      subtitle: "{days} derniers jours, {scope}",
      day: "Jour",
      count: "Commandes",
    },

    top: {
      title: "Commandes les plus utilisées",
      subtitle: "Top 10 sur {days} jours, {scope}",
      empty: "Aucune commande utilisée sur cette période.",
    },

    categories: {
      groupLabel: "Catégories de commandes",
      label: "Catégories",
      showAll: "Tout afficher",
      names: {
        general: "Général",
        moderation: "Modération",
        automod: "Automod",
        music: "Musique",
        fun: "Fun",
        premium: "Premium",
        other: "Autre",
      },
    },

    shards: {
      title: "Shards",
      empty: "Aucun shard n'a encore envoyé de heartbeat.",
      name: "Shard #{id}",
      online: "En ligne",
      offline: "Hors ligne",
      guilds: "Serveurs",
      members: "Membres",
      ping: "Ping",
      memory: "Mémoire",
      players: "Lecteurs actifs",
      uptime: "Uptime",
      lastHeartbeat: "Dernier heartbeat {when}",
    },
  },

  units: {
    milliseconds: "{value} ms",
    megabytes: "{value} Mo",
  },

  charts: {
    showData: "Voir les données",

    daily: {
      ariaLabel: "Commandes utilisées par jour sur {days} jours",
      tooltip: "commandes · {day}",
    },

    topCommands: {
      uses: {
        one: "{value} utilisation · {share} % du total",
        other: "{value} utilisations · {share} % du total",
      },
      row: "{command} : {summary}",
    },

    history: {
      ariaLabel: "{title} sur {days} jours",
      subtitle: "{scope} · {days} jours · pas de {step}",
      stepMinutes: "{value} min",
      stepHours: "{value} h",
      period: "Période",
      noValue: "Aucune donnée",
      empty: "Pas encore d'historique : il se remplit à chaque heartbeat des shards.",

      guilds: {
        title: "Serveurs",
        subtitle: "Total des shards",
        column: "Serveurs",
        value: { one: "{value} serveur", other: "{value} serveurs" },
      },
      members: {
        title: "Utilisateurs",
        subtitle: "Membres cumulés des serveurs",
        column: "Membres",
        value: { one: "{value} membre", other: "{value} membres" },
      },
      ping: {
        title: "Ping",
        subtitle: "Moyenne des shards",
        column: "Ping",
      },
    },
  },

  servers: {
    searchPlaceholder: "Rechercher par nom ou ID...",
    searchLabel: "Rechercher un serveur par nom ou ID",
    filtersButton: "Filtres",
    filtersButtonCount: "Filtres ({count})",
    sortBy: "Trier par",
    orderLabel: "Sens du tri",
    ascending: "Croissant",
    descending: "Décroissant",
    clearAll: "Tout effacer",
    count: {
      one: "{shown} sur {total} serveur",
      other: "{shown} sur {total} serveurs",
    },

    sort: {
      createdAt: "Arrivée du bot",
      updatedAt: "Dernière modification",
      name: "Nom",
      id: "Identifiant",
      members: "Membres",
      language: "Langue",
      premium: "Abonnement premium",
      subscriptionEnd: "Fin d'abonnement",
      creditsEnd: "Fin du premium offert",
      cases: "Sanctions",
      warns: "Avertissements",
      playlists: "Playlists blindtest",
    },

    language: {
      auto: "Automatique (Discord)",
      en: "Anglais",
      fr: "Français",
    },

    premiumFilter: {
      all: "Tous",
      active: "Premium actif",
      none: "Sans premium",
      subscription: "Abonnement Discord",
      credits: "Offert contre des crédits",
      expiring: "Se termine sous 7 jours",
    },

    filter: {
      premium: "Premium",
      language: "Langue",
      languageAll: "Toutes",
      members: "Membres",
      membersMin: "Nombre de membres minimum",
      membersMax: "Nombre de membres maximum",
      minPlaceholder: "min",
      maxPlaceholder: "max",
      created: "Arrivée du bot",
      createdFrom: "Arrivée du bot à partir du",
      createdTo: "Arrivée du bot jusqu'au",
      updated: "Dernière modification",
      updatedFrom: "Dernière modification à partir du",
      updatedTo: "Dernière modification jusqu'au",
      adventure: "Module aventure",
      automod: "Réglages automod",
      moderation: "Réglages modération",
      music: "Réglages musique",
      modLog: "Salon de logs modération",
      automodLog: "Salon de logs automod",
      djRole: "Rôle DJ",
      musicChannel: "Salon musique",
      funChannels: "Salons du module fun",
      playlists: "Playlists blindtest",
      cases: "Sanctions",
      warns: "Avertissements",
      icon: "Icône du serveur",

      options: {
        all: "Tous",
        adventureEnabled: "Ouvert",
        adventureDisabled: "Fermé",
        adventureNever: "Jamais réglé",
        configured: "Configurés",
        untouched: "Jamais touchés",
        channelSet: "Défini",
        channelUnset: "Non défini",
        funRestricted: "Restreints",
        funEveryChannel: "Tous les salons",
        playlistsSome: "Au moins une",
        playlistsNone: "Aucune",
        casesSome: "Au moins une",
        casesNone: "Aucune",
        warnsSome: "Au moins un",
        warnsNone: "Aucun",
        iconCustom: "Personnalisée",
        iconDefault: "Par défaut",
      },
    },

    badges: {
      automod: "Automod",
      moderation: "Modération",
      music: "Musique",
      adventure: "Aventure",
      modLog: "Logs mod",
      automodLog: "Logs automod",
      djRole: "Rôle DJ",
      musicChannel: "Salon musique",
      fun: "Fun ({count})",
      more: "+{count}",
    },

    premiumCell: {
      active: "Actif",
      inactive: "Inactif",
      gifted: "Offert",
      subscription: "Abonnement",
      until: "jusqu'au {date}",
    },

    loadFailed: "La liste des serveurs n'a pas pu être chargée.",
    empty: "Aucun serveur.",
    noMatch: "Aucun serveur ne correspond à ces filtres.",

    table: {
      server: "Serveur",
      id: "ID",
      members: "Membres",
      language: "Langue",
      premium: "Premium",
      settings: "Réglages",
      cases: "Sanctions",
      warns: "Avert.",
      joined: "Arrivée",
      unnamed: "Sans nom",
      openSettings: "Paramètres",
      grantPremium: "Offrir premium",
      revokePremium: "Retirer premium",
    },

    pagination: {
      perPage: "Par page",
      page: "Page {page} sur {pageCount}",
      previous: "Précédent",
      next: "Suivant",
    },
  },

  credits: {
    searchPlaceholder: "Rechercher par pseudo ou ID...",
    searchLabel: "Rechercher un utilisateur par pseudo ou ID",
    adjust: "Ajouter / retirer des crédits",
    accounts: {
      one: "{shown} / {total} compte",
      other: "{shown} / {total} comptes",
    },
    circulation: "{credits} crédits en circulation",

    dialog: {
      title: "Ajouter ou retirer des crédits",
      description:
        "Saisis l'identifiant Discord de l'utilisateur et la variation à appliquer : un nombre positif ajoute des crédits, un nombre négatif en retire. Le compte est créé s'il n'existe pas encore.",
      userId: "Identifiant Discord",
      userIdPlaceholder: "123456789012345678",
      amount: "Crédits (+ / -)",
      amountPlaceholder: "150",
      reason: "Motif (facultatif)",
      reasonPlaceholder: "Compensation, concours...",
      submit: "Continuer",
    },

    invalidId: "Un identifiant Discord contient 17 à 20 chiffres.",
    empty: "Aucun utilisateur ne possède de crédits pour l'instant.",
    noMatch: "Aucun compte ne correspond à « {query} ».",

    table: {
      user: "Utilisateur",
      id: "ID",
      credits: "Crédits",
      votes: "Votes",
      lastVote: "Dernier vote",
    },

    edit: "Modifier",
    saving: "Enregistrement...",
    confirm: "Confirmer {amount}",
    balanceSet: {
      one: "Solde de {userId} fixé à {amount} crédit.",
      other: "Solde de {userId} fixé à {amount} crédits.",
    },
    deltaApplied: {
      one: "{amount} crédit pour {userId} - nouveau solde : {balance}.",
      other: "{amount} crédits pour {userId} - nouveau solde : {balance}.",
    },
    pendingEdit: {
      one: "Le solde de {userId} passera à {amount} crédit. La variation est enregistrée dans l'historique du compte.",
      other:
        "Le solde de {userId} passera à {amount} crédits. La variation est enregistrée dans l'historique du compte.",
    },
  },

  adventure: {
    tiles: {
      players: "Aventuriers",
      playersHint: "personnages créés",
      finished: "Histoires terminées",
      finishedHint: "sur {chapters} chapitres",
      topLevel: "Niveau le plus élevé",
      topLevelHint: "maximum : {level}",
    },

    searchPlaceholder: "Chercher un joueur (pseudo ou identifiant)",
    searchLabel: "Chercher un joueur par pseudo ou identifiant",
    empty: "Aucun aventurier pour l'instant.",

    table: {
      player: "Joueur",
      level: "Niveau",
      story: "Scénario",
      gold: "Pièces",
      echoes: "Fragments",
      lastPlayed: "Dernière partie",
    },

    finished: "Terminé",
    progress: "Acte {act} · chapitre {chapter}",
    open: "Ouvrir",
    close: "Fermer",
    sheetTitle: "Partie de {name}",
    sheetLoading: "Chargement de la fiche...",
    interventionApplied: "Intervention appliquée et inscrite dans le journal du joueur.",
  },

  data: {
    title: "Suppression de données",
    description:
      "Pour traiter une demande de suppression : saisis l'identifiant Discord du serveur ou de l'utilisateur, vérifie ce qui sera supprimé, puis confirme. L'opération est définitive.",

    targetLabel: "Type d'identifiant",
    guild: "Serveur",
    user: "Utilisateur",
    guildId: "ID du serveur",
    userId: "ID de l'utilisateur",
    searching: "Recherche...",
    search: "Rechercher",
    invalidId: "Un identifiant Discord contient 17 à 20 chiffres.",

    yes: "Oui",
    no: "Non",

    guildSummary: {
      configured: "Configuration du serveur",
      none: "Aucune",
      moderationCases: "Cas de modération",
      warns: "Avertissements",
      automodConfig: "Configuration automod",
      musicSettings: "Réglages musique",
      blindtestPlaylists: "Listes de blindtest",
      adventureSettings: "Réglages de l'aventure",
      premiumEntitlements: "Droits premium en cache",
    },

    userSummary: {
      casesAsTarget: "Sanctions reçues (supprimées)",
      warnsAsTarget: "Avertissements reçus (supprimés)",
      casesAsModerator: "Sanctions données en tant que modérateur (anonymisées)",
      warnsAsModerator: "Avertissements donnés en tant que modérateur (anonymisés)",
      premiumEntitlements: "Droits premium en cache (supprimés)",
      creditBalance: "Crédits (supprimés avec le compte)",
      topggVotes: "Votes top.gg enregistrés (supprimés)",
      adventureCharacter: "Personnage d'aventure (supprimé avec sa progression)",
      adventureNone: "Aucun",
      adventureLevel: "Niveau {level}",
    },

    guildWarning:
      "Toutes les données de ce serveur seront supprimées. Si Gaulia est encore dessus, une configuration vierge sera recréée automatiquement.",
    userWarning:
      "Les sanctions et avertissements reçus seront supprimés ; ceux donnés en tant que modérateur resteront dans l'historique des serveurs, sans son identité.",
    premiumNote:
      "Un abonnement premium encore actif chez Discord sera resynchronisé au prochain redémarrage du bot.",

    deleting: "Suppression...",
    confirmDelete: "Confirmer la suppression définitive",
    delete: "Supprimer ces données",
    done: "Données supprimées pour l'identifiant {id}.",
  },
};

export default admin;
