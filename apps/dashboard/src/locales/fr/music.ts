import type { MusicStrings } from "../en/music";

const music: MusicStrings = {
  loadError: "Impossible de charger les réglages musique.",

  access: {
    title: "Accès",
    description:
      "Les membres ayant la permission « Administrateur » ne sont jamais concernés par ces restrictions.",
    channel: {
      label: "Salon des commandes musique",
      hint: "Les commandes musique ne fonctionnent que dans ce salon, pour tous les membres sauf les administrateurs.",
      aria: "Salon des commandes musique",
      any: "Tous les salons",
    },
    dj: {
      label: "Rôle DJ",
      hint: "Sans ce rôle, un membre peut écouter et ajouter des titres, mais pas passer, arrêter, ni régler la lecture. Les membres ayant la permission « Gérer le serveur » n'en ont pas besoin.",
      aria: "Rôle DJ",
      none: "Aucun (tout le monde)",
    },
  },

  playback: {
    title: "Lecture",
    description: "Appliqué quand Gaulia rejoint un salon vocal.",
    volume: {
      label: "Volume par défaut",
      aria: "Volume par défaut",
      value: "{value} %",
    },
    loop: {
      label: "Répétition par défaut",
      aria: "Répétition par défaut",
    },
    stay247: {
      label: "Mode 24/7",
      aria: "Mode 24/7",
      badge: "Premium",
      hint: "Gaulia reste connecté en vocal même quand la file d'attente est vide.",
      locked: "Nécessite Gaulia Premium sur ce serveur.",
    },
  },

  loopMode: {
    NONE: "Désactivée",
    TRACK: "Titre en cours",
    QUEUE: "File d'attente",
  },

  blindtest: {
    title: "Blindtest",
    description:
      "Réglages de la commande /blindtest. Les administrateurs ne sont jamais concernés par la restriction de salons.",
    channels: {
      label: "Salons du blindtest",
      hint: "Le blindtest ne peut être lancé que dans ces salons et leurs fils, indépendamment du salon des commandes musique. Sans salon choisi, il est utilisable partout.",
      add: "Ajouter un salon...",
      empty: "Tous les salons",
      aria: "Ajouter un salon de blindtest",
    },
    categories: {
      label: "Catégories proposées",
      hint: "Une catégorie désactivée n'apparaît plus dans l'autocomplétion de /blindtest sur ce serveur.",
      loadError: "Impossible de charger les catégories.",
      toggleAria: "Proposer la catégorie {name}",
      tracks: {
        one: "{value} titre",
        other: "{value} titres",
      },
    },
  },

  playlists: {
    title: "Listes personnalisées",
    description:
      "Crée tes propres listes de musiques : elles sont proposées dans l'autocomplétion de /blindtest, en plus des catégories activées. La création et la suppression sont enregistrées immédiatement.",
    loadError: "Impossible de charger les listes.",
    empty: "Aucune liste pour le moment.",
    tracks: {
      one: "{value} titre",
      other: "{value} titres",
    },
    edit: "Modifier",
    deleting: "Suppression...",
    namePlaceholder: "Nom de la nouvelle liste",
    nameAria: "Nom de la nouvelle liste",
    create: "Créer la liste",
    creating: "Création...",
    limit: "Limite de {count} listes atteinte : supprimes-en une pour en créer une nouvelle.",
  },

  playlist: {
    back: "Retour aux réglages musique",
    loadError: "Impossible de charger cette liste.",
    title: "Liste personnalisée",
    name: {
      label: "Nom",
      hint: "Affiché dans l'autocomplétion de /blindtest.",
      aria: "Nom de la liste",
      required: "Donne un nom à la liste.",
    },

    add: {
      title: "Ajouter des titres",
      description:
        "Colle le lien d'une playlist, d'un album ou d'un titre Spotify public (les 100 premiers titres d'une playlist sont lus). Un titre ajouté à la main sera cherché sur SoundCloud pendant la partie.",
      linkPlaceholder: "https://open.spotify.com/playlist/...",
      linkAria: "Lien Spotify à importer",
      import: "Importer",
      importing: "Import...",
      titlePlaceholder: "Titre",
      titleAria: "Titre à ajouter",
      artistPlaceholder: "Artiste",
      artistAria: "Artiste du titre à ajouter",
      submit: "Ajouter",
    },

    imported: {
      one: "{count} titre ajouté depuis « {name} »",
      other: "{count} titres ajoutés depuis « {name} »",
    },
    duplicates: {
      one: "{count} déjà présent",
      other: "{count} déjà présents",
    },
    overflow: {
      one: "{count} ignoré (limite de {max} titres)",
      other: "{count} ignorés (limite de {max} titres)",
    },
    remember: "Pense à enregistrer.",
    duplicateTrack: "Ce titre est déjà dans la liste.",
    full: "La liste est limitée à {max} titres.",

    tracks: {
      title: "Titres ({value} / {max})",
      minimum: "Il faut au moins {count} titres dans la liste pour lancer un blindtest.",
      filterPlaceholder: "Filtrer par titre ou artiste",
      filterAria: "Filtrer les titres",
      empty: "Aucun titre pour le moment.",
      noMatch: "Aucun titre ne correspond à ce filtre.",
      columnTitle: "Titre",
      columnArtist: "Artiste",
      columnPreview: "Extrait",
      columnActions: "Actions",
      remove: "Retirer",
      removeAria: "Retirer {title}",
    },
  },
};

export default music;
