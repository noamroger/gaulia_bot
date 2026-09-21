import type { GeneralStrings } from "../en/general";

const general: GeneralStrings = {
  commands: {
    ping: {
      name: "ping",
      description: "Affiche la latence du bot",
      help: {
        details:
          "Mesure le temps de réponse de Gaulia : la latence API (aller-retour de la commande) et la latence WebSocket du shard qui gère ce serveur.",
        examples: ["ping"],
      },
    },

    help: {
      name: "aide",
      description: "Affiche les commandes de Gaulia ou l'aide détaillée d'une commande",
      options: {
        command: {
          name: "commande",
          description: "Commande dont afficher l'aide détaillée",
        },
      },
      help: {
        details:
          "Sans option, liste toutes les commandes par catégorie. Avec le nom d'une commande, affiche son aide détaillée : utilisation, options, conditions d'accès et exemples. Le nom se complète automatiquement pendant la saisie.",
        examples: ["aide", "aide commande:ban"],
      },
    },

    botinfo: {
      name: "botinfo",
      description: "Affiche les informations et les statistiques de Gaulia",
      options: {
        view: {
          name: "vue",
          description: "Onglet à ouvrir directement",
          choices: {
            overview: "Aperçu",
            technical: "Technique",
            shards: "Shards",
            commands: "Commandes",
          },
        },
      },
      help: {
        details:
          "Tout ce qu'il y a à savoir sur Gaulia, en quatre onglets navigables aux boutons : l'aperçu (identité, serveurs, membres, état), la fiche technique (versions, mémoire, base de données, Lavalink), le détail des shards et les statistiques d'utilisation des commandes sur 30 jours. Les totaux proviennent des heartbeats envoyés par tous les shards, pas seulement de celui qui te répond.",
        examples: ["botinfo", "botinfo vue:shards"],
      },
    },
  },

  ping: {
    calculating: "Calcul en cours...",
    title: "Pong !",
    latency: "**Latence API :** {api}ms\n**Latence WebSocket :** {gateway}ms",
  },

  help: {
    title: "Aide de Gaulia",
    footer: "`/aide commande:<nom>` affiche l'aide détaillée d'une commande.",
    notFound: "Aucune commande ne s'appelle « {query} ». Utilise `/aide` pour voir la liste.",

    usage: "Utilisation",
    examples: "Exemples",
    access: "Accès",
    required: ", obligatoire",
    choices: " (choix : {list})",

    categories: {
      general: "Général",
      moderation: "Modération",
      automod: "Automod",
      music: "Musique",
      fun: "Fun",
      adventure: "Aventure",
      premium: "Premium",
      settings: "Réglages",
    },

    optionTypes: {
      string: "texte",
      integer: "nombre entier",
      number: "nombre",
      boolean: "oui/non",
      user: "membre",
      channel: "salon",
      role: "rôle",
      mentionable: "membre ou rôle",
      attachment: "fichier",
      fallback: "valeur",
    },

    contextMenu: {
      onMessage: "un message",
      onUser: "un membre",
      summary: "Menu contextuel sur {target}",
      usage: "Clic droit sur {target} > Applications > {name}",
    },

    accessLevel: "Niveau requis : {level}",
    guildOnly: "Utilisable uniquement sur un serveur",
    alsoInDm: "Utilisable aussi en message privé",
    premiumOnly: "Réservée aux serveurs Gaulia Premium",
    cooldown: "Délai entre deux utilisations : {seconds} s",
    musicControl: "Limitée au salon musique et au rôle DJ s'ils sont configurés",
    musicListen: "Limitée au salon musique s'il est configuré",
  },

  botinfo: {
    views: {
      overview: "Aperçu",
      technical: "Technique",
      shards: "Shards",
      commands: "Commandes",
    },

    units: {
      megabyte: "{value} Mo",
      percent: "{value} %",
    },

    refresh: "Actualiser",
    addBot: "Ajouter Gaulia",
    dashboard: "Dashboard",
    notYours: {
      title: "Ce panneau appartient à quelqu'un d'autre",
      description: "Lance `/botinfo` pour naviguer dans ta propre fiche.",
    },

    tagline: "Bot Discord : modération, automod, musique, jeux et aventure au long cours.",
    unknownVersion: "inconnue",

    overview: {
      identity: "Identité",
      id: "Identifiant : `{id}`",
      version: "Version : `{version}`",
      createdAt: "Créé le {date} ({relative})",
      owner: "Propriétaire : [{owner}]({url})",

      numbers: "En chiffres",
      guildsAndMembers: "🌍 {guilds} · 👥 {members}",
      commandsAndUsage: "🧩 {commands} · ⚡ {usage} sur {days} jours",
      playersAndAdventurers: "🎵 {players} en cours · ⚔️ {adventurers}",
      premiumGuilds: "✨ {count} serveur(s) premium",

      state: "État",
      noHeartbeat: "aucun heartbeat enregistré",
      shardsOnline: "{online}/{total} shard(s) en ligne",
      averagePing: "📡 Latence moyenne : {ping} ms",
      averagePingUnknown: "Latence moyenne : inconnue",
      uptime: "⏱️ En ligne depuis {duration} (shard {shard})",
      footer: "Totaux calculés à partir des heartbeats des shards · {timestamp}",
    },

    technical: {
      title: "Technique",
      runtime: "Exécution",
      versions: "Node.js {node} · discord.js {discordJs}",
      platform: "Plateforme : {platform} · {cores} · charge {load}",
      systemMemory: "RAM machine : {memory}",

      process: "Process du shard {shard}",
      memory: "Mémoire : {rss} (dont {heap} de tas)",
      cache: "Cache : {guilds} · {users}",
      wsPing: "Latence WebSocket : {ping}",
      wsPingMeasuring: "en cours de mesure",
      uptime: "En ligne depuis {duration}",

      database: "Base de données",
      databaseDown: "🔴 PostgreSQL injoignable à l'instant.",
      databaseUp: "🟢 PostgreSQL · ping {ping}",

      lavalink: "Lavalink",
      lavalinkNone: "Aucun nœud configuré.",
      lavalinkNode: "{state} `{id}` · {playing} en lecture sur {players}",
      lavalinkDetail:
        "-# RAM {memory} · CPU {botLoad} du bot, {systemLoad} système ({cores} cœurs) · démarré depuis {uptime}",
      footer: "{count} lecteur(s) audio actif(s) sur l'ensemble des shards.",
    },

    shards: {
      title: "Shards",
      none: "Aucun shard n'a encore envoyé de heartbeat. Les totaux globaux seront disponibles d'ici une minute.",
      header: "{online}/{total} en ligne · tu es servi par le shard **{shard}** (➤).",
      line: "{marker} {state} **Shard {shard}** : {guilds} · {members}",
      lineDetail: "-# {ping} · {memory} · {players} · démarré {relative}",
      more: "-# ... et {count} shard(s) supplémentaire(s).",

      totals: "Cumul des shards en ligne",
      guildsAndMembers: "🌍 {guilds} · 👥 {members}",
      averagePing: "📡 Latence moyenne : {ping}",
      averagePingUnknown: "📡 Latence moyenne : inconnue",
      declaredGuilds: "📋 Serveurs déclarés par Discord : {count}",
      footer: "Un shard est considéré hors ligne après 90 secondes sans heartbeat.",
    },

    commands: {
      title: "Commandes",
      header: "{commands} et {components}.",
      usage: "Utilisation",
      today: "Aujourd'hui : {count}",
      window: "{days} derniers jours : {count}",
      history: "{days} derniers jours : {count}",
      top: "Top {count}",
      topNone: "Aucune commande utilisée sur la période.",
      topLine: "{rank}. `/{command}` - {count}",
      footer:
        "-# Seuls des compteurs par commande sont conservés, {days} jours au maximum, jamais qui a lancé quoi.",
    },

    counts: {
      server: { one: "{value} serveur", other: "{value} serveurs" },
      member: { one: "{value} membre", other: "{value} membres" },
      command: { one: "{value} commande", other: "{value} commandes" },
      component: { one: "{value} bouton ou menu", other: "{value} boutons ou menus" },
      player: { one: "{value} lecteur", other: "{value} lecteurs" },
      adventurer: { one: "{value} aventurier", other: "{value} aventuriers" },
      usage: { one: "{value} utilisation", other: "{value} utilisations" },
      core: { one: "{value} cœur", other: "{value} cœurs" },
      user: { one: "{value} utilisateur", other: "{value} utilisateurs" },
    },
  },
};

export default general;
