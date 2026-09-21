import type { MusicStrings } from "../en/music";

const music: MusicStrings = {
  commands: {
    play: {
      name: "jouer",
      description: "Joue une musique ou l'ajoute à la file d'attente",
      help: {
        details:
          "Recherche un titre sur SoundCloud à partir d'un nom ou d'un artiste, ou charge directement un lien (titre ou playlist), puis l'ajoute à la file d'attente. Gaulia rejoint ton salon vocal et lance la lecture si rien n'est en cours. La file est limitée à 100 titres, 1000 avec Premium.",
        examples: [
          "jouer recherche:Daft Punk One More Time",
          "jouer recherche:https://soundcloud.com/artiste/titre",
        ],
      },
      options: {
        query: { name: "recherche", description: "Titre, artiste ou lien" },
      },
    },

    queue: {
      name: "file",
      description: "Affiche la file d'attente",
      help: {
        details:
          "Affiche le morceau en cours et les 10 prochains titres avec leur position, à utiliser avec `/retirer`.",
        examples: ["file"],
      },
    },

    nowplaying: {
      name: "en-cours",
      description: "Affiche le morceau en cours",
      help: {
        details:
          "Affiche la musique en cours : titre, source, durée, membre qui l'a ajoutée, pochette et position de lecture.",
        examples: ["en-cours"],
      },
    },

    summon: {
      name: "rejoindre",
      description: "Fait rejoindre ton salon vocal à Gaulia",
      help: {
        details:
          "Fait rejoindre ton salon vocal à Gaulia sans lancer de musique. Tu dois être connecté à un salon vocal.",
        examples: ["rejoindre"],
      },
    },

    skip: {
      name: "passer",
      description: "Passe au morceau suivant",
      help: {
        details:
          "Arrête le morceau en cours et passe au titre suivant de la file. Tu dois être dans le même salon vocal que Gaulia.",
        examples: ["passer"],
      },
    },

    pause: {
      name: "pause",
      description: "Met la lecture en pause",
      help: {
        details:
          "Met en pause le morceau en cours sans vider la file. Utilise `/reprendre` pour reprendre. Tu dois être dans le même salon vocal que Gaulia.",
        examples: ["pause"],
      },
    },

    resume: {
      name: "reprendre",
      description: "Reprend la lecture",
      help: {
        details:
          "Reprend la lecture mise en pause avec `/pause`. Tu dois être dans le même salon vocal que Gaulia.",
        examples: ["reprendre"],
      },
    },

    stop: {
      name: "arrêter",
      description: "Arrête la musique, vide la file et quitte le salon vocal",
      help: {
        details:
          "Arrête la lecture, vide la file d'attente et fait quitter le salon vocal à Gaulia. Tu dois être dans le même salon vocal que Gaulia.",
        examples: ["arrêter"],
      },
    },

    volume: {
      name: "volume",
      description: "Règle le volume de lecture",
      help: {
        details:
          "Règle le volume de la lecture en cours, de 0 à 150 %. Les boutons du lecteur l'ajustent aussi de 10 % en 10 %. Le volume par défaut du serveur se règle sur le dashboard. Tu dois être dans le même salon vocal que Gaulia.",
        examples: ["volume niveau:80"],
      },
      options: {
        level: { name: "niveau", description: "Volume entre 0 et 150" },
      },
    },

    shuffle: {
      name: "aléatoire",
      description: "Active ou désactive la lecture aléatoire",
      help: {
        details:
          "Active ou désactive la lecture aléatoire, comme le bouton du lecteur. À l'activation, la file d'attente est mélangée sans interrompre le morceau en cours, puis de nouveau à chaque ajout tant que le mode reste actif. Tu dois être dans le même salon vocal que Gaulia.",
        examples: ["aléatoire"],
      },
    },

    seek: {
      name: "position",
      description: "Avance ou recule dans le morceau en cours",
      help: {
        details:
          "Déplace la lecture du morceau en cours à la position indiquée. Formats acceptés : secondes (`90`), `mm:ss` (`1:30`) ou `hh:mm:ss`. Tu dois être dans le même salon vocal que Gaulia.",
        examples: ["position position:1:30", "position position:90"],
      },
      options: {
        position: { name: "position", description: "Ex : 1:30 ou 90" },
      },
    },

    previous: {
      name: "précédent",
      description: "Rejoue le morceau précédent",
      help: {
        details:
          "Relance le dernier morceau joué. Tu dois être dans le même salon vocal que Gaulia.",
        examples: ["précédent"],
      },
    },

    loop: {
      name: "répétition",
      description: "Règle le mode de répétition",
      help: {
        details:
          "Choisit ce qui est rejoué à la fin d'un titre : rien, le titre en cours ou toute la file d'attente. Le bouton de répétition du lecteur alterne entre aucune répétition et la répétition de la file. Tu dois être dans le même salon vocal que Gaulia.",
        examples: ["répétition mode:File d'attente"],
      },
      options: {
        mode: {
          name: "mode",
          description: "Mode de répétition",
          choices: {
            off: "Aucune",
            track: "Titre en cours",
            queue: "File d'attente",
          },
        },
      },
    },

    filters: {
      name: "filtres",
      description: "[Premium] Applique un filtre audio à la lecture en cours",
      help: {
        details:
          "Applique un effet audio à la lecture en cours. Nightcore, Vaporwave et 8D s'activent ou se désactivent à chaque utilisation, Bassboost renforce les basses et Réinitialiser retire tous les filtres. Tu dois être dans le même salon vocal que Gaulia.",
        examples: ["filtres filtre:Nightcore", "filtres filtre:Réinitialiser"],
      },
      options: {
        filter: {
          name: "filtre",
          description: "Filtre à appliquer",
          choices: {
            bassboost: "Bassboost",
            nightcore: "Nightcore",
            vaporwave: "Vaporwave",
            "8d": "8D",
            clear: "Réinitialiser",
          },
        },
      },
    },

    remove: {
      name: "retirer",
      description: "Retire un titre de la file d'attente",
      help: {
        details:
          "Retire de la file le titre à la position indiquée par `/file`. Tu dois être dans le même salon vocal que Gaulia.",
        examples: ["retirer position:3"],
      },
      options: {
        position: { name: "position", description: "Position dans la file (voir /file)" },
      },
    },

    stay247: {
      name: "247",
      description: "[Premium] Active ou désactive le mode 24/7 (Gaulia reste en vocal)",
      help: {
        details:
          "Active ou désactive le mode 24/7 à chaque utilisation. Quand il est actif, Gaulia reste dans le salon vocal même lorsque la file est vide, au lieu de se déconnecter après une période d'inactivité. Le réglage est conservé pour le serveur.",
        examples: ["247"],
      },
    },

    blindtest: {
      name: "blindtest",
      description: "Blindtest musical dans ton salon vocal",
      help: {
        details:
          "Gaulia joue des extraits de 30 secondes dans ton salon vocal. Écris le titre ou l'artiste dans le salon de la partie : le premier qui trouve marque 1 point pour chacun, les fautes de frappe légères sont tolérées. Seuls les membres présents dans le salon vocal peuvent répondre. Les catégories proposées, les listes personnalisées et les salons autorisés se règlent dans l'onglet Musique du dashboard. Les commandes musique sont indisponibles pendant la partie. Le lanceur et les membres ayant « Gérer le serveur » peuvent passer une manche ou arrêter la partie.",
        examples: [
          "blindtest lancer catégorie:Années 80",
          "blindtest lancer catégorie:Chanson française manches:15 durée:20",
          "blindtest catégories",
        ],
      },
      subcommands: {
        start: {
          name: "lancer",
          description: "Lance un blindtest dans ton salon vocal",
          options: {
            category: {
              name: "catégorie",
              description: "Catégorie ou liste de musiques du serveur",
            },
            rounds: { name: "manches", description: "Nombre de manches (10 par défaut)" },
            duration: {
              name: "durée",
              description: "Durée d'une manche en secondes (30 par défaut)",
            },
          },
        },
        categories: {
          name: "catégories",
          description: "Liste les catégories et listes disponibles sur ce serveur",
        },
        skip: { name: "passer", description: "Passe la manche en cours" },
        stop: { name: "arrêter", description: "Arrête le blindtest en cours" },
      },
    },
  },

  ui: {
    nowPlayingTitle: "Musique en cours",
    trackTitle: "Titre : {track}",
    trackSource: "Source : `{source}`",
    trackDuration: "Durée : `{duration}`",
    trackRequester: "Ajoutée par `{requester}`",
    live: "live",
    unknownRequester: "inconnu",
  },

  controls: {
    pause: "Pause",
    resume: "Reprendre",
    skip: "Passer",
    previous: "Retour",
    stop: "Arrêter",
  },

  actions: {
    play: {
      playlistTitle: "Playlist ajoutée",
      playlistAdded: {
        one: "`{count}` musique de **{playlist}** a été ajoutée à la file avec l'intervention de <@{user}>.",
        other:
          "`{count}` musiques de **{playlist}** ont été ajoutées à la file avec l'intervention de <@{user}>.",
      },
      unnamedPlaylist: "la playlist",
      trackTitle: "Musique ajoutée",
      trackAdded: "{track} a été ajoutée à la file avec l'intervention de <@{user}>.",
    },
    queue: {
      title: "File d'attente",
      current: "**En cours :** {title}",
      nothingPlaying: "Rien n'est en cours de lecture.",
      empty: "La file d'attente est vide.",
      entry: "**{position}.** {title}",
      more: {
        one: "… et {count} autre titre.",
        other: "… et {count} autres titres.",
      },
    },
    nowplaying: {
      position: "Position : `{position}`",
      positionPaused: "Position : `{position}` (en pause)",
    },
    summon: {
      title: "Salon vocal rejoint",
      joined: "Gaulia a rejoint <#{channel}> avec l'intervention de <@{user}>.",
    },
    skip: {
      title: "Musique passée",
      skipped: "{track} a été passée avec l'intervention de <@{user}>.",
      unnamedTrack: "La musique",
    },
    pause: {
      title: "Musique en pause",
      paused: "La musique a été mise en pause avec l'intervention de <@{user}>.",
    },
    resume: {
      title: "Reprise de la musique",
      resumed: "La musique a repris avec l'intervention de <@{user}>.",
    },
    stop: {
      title: "Musique arrêtée",
      stopped: "La musique a été arrêtée et la file vidée avec l'intervention de <@{user}>.",
    },
    volume: {
      title: "Volume de la musique",
      changed: "Le volume est passé de `{from}%` à `{to}%` avec l'intervention de <@{user}>.",
    },
    shuffle: {
      title: "Lecture aléatoire",
      enabled: "La lecture aléatoire a été activée avec l'intervention de <@{user}>.",
      disabled: "La lecture aléatoire a été désactivée avec l'intervention de <@{user}>.",
    },
    seek: {
      title: "Position de la musique",
      moved: "La lecture reprend à `{position}` avec l'intervention de <@{user}>.",
    },
    previous: {
      title: "Retour en arrière",
      playing: "{track} est rejouée avec l'intervention de <@{user}>.",
    },
    loop: {
      title: "Répétition de la musique",
      changed: "La répétition est passée à `{mode}` avec l'intervention de <@{user}>.",
    },
    filters: {
      title: "Filtre audio",
      applied: "Le filtre `{filter}` a été appliqué avec l'intervention de <@{user}>.",
      cleared: "Les filtres ont été réinitialisés avec l'intervention de <@{user}>.",
    },
    remove: {
      title: "Musique retirée",
      removed: "{track} a été retirée de la file avec l'intervention de <@{user}>.",
    },
    stay247: {
      title: "Mode 24/7",
      enabled:
        "Le mode 24/7 a été activé avec l'intervention de <@{user}> : Gaulia reste connecté en vocal même si la file est vide.",
      disabled:
        "Le mode 24/7 a été désactivé avec l'intervention de <@{user}> : Gaulia se déconnectera après une période d'inactivité.",
    },
  },

  player: {
    errorTitle: "Lecture impossible",
    stuckTitle: "Titre bloqué",
    stuckDescription: "**{track}** a été passé.",
    unnamedTrack: "Ce titre",
  },

  access: {
    channelOnly: "Les commandes musique sont réservées au salon <#{channel}>.",
    djRoleOnly: "Cette action est réservée au rôle <@&{role}>.",
  },

  error: {
    notInVoice: "Tu dois être dans un salon vocal pour utiliser cette commande.",
    noPlayer: "Il n'y a pas de lecture en cours sur ce serveur.",
    differentVoice: "Tu dois être dans le même salon vocal que moi pour faire ça.",
    nothingPlaying: "Rien n'est en cours de lecture.",
    noNextTrack: "Aucune musique suivante dans la file d'attente.",
    noPreviousTrack: "Aucun morceau précédent.",
    alreadyPaused: "La lecture est déjà en pause. Utilise `/reprendre` pour reprendre.",
    notPaused: "La lecture n'est pas en pause.",
    noResult: "Aucun résultat trouvé pour cette recherche.",
    queueFull:
      "La file d'attente est limitée à {limit} titres sur ce serveur. Passe en Gaulia Premium pour l'étendre.",
    noTrackAtPosition: "Aucun titre à cette position.",
    invalidPosition: "Format invalide. Utilise `mm:ss` ou un nombre de secondes.",
    unknownFilter: "Filtre inconnu.",
    staleButton: "Ce bouton ne correspond pas à ce serveur.",
    playerGone: "Il n'y a plus de lecture en cours.",
  },

  blindtest: {
    categoriesTitle: "Blindtest",
    stopReply: "Blindtest arrêté.",

    category: {
      none: "Aucune catégorie n'est disponible sur ce serveur.",
      customHeading: "**Listes du serveur**",
      presetHeading: "**Catégories**",
      customName: "{name} (liste du serveur)",
      line: "- **{name}** · {tracks}",
      choice: "{name} · {tracks}",
      tracks: { one: "{count} titre", other: "{count} titres" },
    },

    button: {
      skip: "Passer la manche",
      stop: "Arrêter",
    },

    rules: {
      both: "Le titre et l'artiste rapportent chacun 1 point au premier qui les trouve.",
      title: "Le titre (ou le nom de l'œuvre) rapporte 1 point au premier qui le trouve.",
    },

    rounds: { one: "{count} manche", other: "{count} manches" },

    intro: {
      title: "Blindtest : {category}",
      setup: "{rounds} de {duration}. Rejoins <#{channel}> et écris tes réponses dans ce salon.",
      footer: "Lancé par <@{host}>. Première manche dans quelques secondes.",
    },

    round: {
      heading: "Manche {number} / {total}",
      listening: "Écoute bien ! Fin de la manche {timestamp}.",
      answer: "C'était **{title}** de **{artist}**.",
      spotify: "[Écouter sur Spotify]({url})",
      titleLabel: "Titre",
      artistLabel: "Artiste",
      foundBy: "{label} : trouvé par <@{user}>",
      notFound: "{label} : personne n'a trouvé",
      pending: "{label} : à trouver",
      skipped: "Manche passée.",
      failed: "Extrait illisible, manche annulée.",
    },

    leaderboard: {
      heading: "**Classement**",
      finalHeading: "**Classement final**",
      empty: "Personne n'a encore marqué de point.",
      entry: "{rank}. <@{user}> · {points}",
      points: { one: "{count} point", other: "{count} points" },
    },

    final: {
      heading: "{title} : {category}",
      title: {
        completed: "Blindtest terminé",
        stopped: "Blindtest arrêté",
        interrupted: "Blindtest interrompu",
        unplayable: "Blindtest interrompu",
        error: "Blindtest interrompu",
      },
      details: {
        completed: "{rounds} jouées.",
        stopped: "Partie arrêtée par <@{user}> après {rounds}.",
        interrupted: "Gaulia a quitté le salon vocal.",
        unplayable: "Impossible de charger d'autres extraits pour le moment.",
        error: "Une erreur interne est survenue.",
      },
    },

    error: {
      channelOnly: "Le blindtest est réservé aux salons suivants : {channels}",
      unsupportedChannel: "Impossible de lancer un blindtest dans ce salon.",
      unknownPlaylist: "Cette liste n'existe plus sur ce serveur.",
      playlistTooSmall: "La liste **{name}** doit contenir au moins {count} titres.",
      unknownCategory: "Choisis une catégorie proposée dans la liste.",
      disabledCategory: "Cette catégorie est désactivée sur ce serveur.",
      alreadyRunning: "Un blindtest est déjà en cours sur ce serveur.",
      joinVoice: "Rejoins un salon vocal pour lancer un blindtest.",
      musicPlaying:
        "De la musique est en cours sur ce serveur. Arrête-la avec `/arrêter` avant de lancer un blindtest.",
      otherVoiceChannel: "Gaulia est déjà connecté à un autre salon vocal.",
      notRunning: "Aucun blindtest n'est en cours sur ce serveur.",
      notHost:
        "Seul le membre qui a lancé le blindtest ou un gestionnaire du serveur peut faire ça.",
      noRound: "Aucune manche n'est en cours.",
      staleButton: "Ce bouton n'est plus valide.",
    },
  },
};

export default music;
