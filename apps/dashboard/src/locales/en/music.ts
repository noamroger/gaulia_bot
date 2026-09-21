import type { Dictionary } from "../../i18n/translate";

const music = {
  loadError: "Could not load the music settings.",

  access: {
    title: "Access",
    description:
      'Members holding the "Administrator" permission are never affected by these limits.',
    channel: {
      label: "Music command channel",
      hint: "Music commands only answer in this channel, for every member except administrators.",
      aria: "Music command channel",
      any: "Every channel",
    },
    dj: {
      label: "DJ role",
      hint: 'Without this role a member can listen and queue tracks, but cannot skip, stop or tune playback. Members holding the "Manage Server" permission do not need it.',
      aria: "DJ role",
      none: "None (everyone)",
    },
  },

  playback: {
    title: "Playback",
    description: "Applied when Gaulia joins a voice channel.",
    volume: {
      label: "Default volume",
      aria: "Default volume",
      value: "{value} %",
    },
    loop: {
      label: "Default repeat",
      aria: "Default repeat",
    },
    stay247: {
      label: "24/7 mode",
      aria: "24/7 mode",
      badge: "Premium",
      hint: "Gaulia stays in the voice channel even once the queue runs out.",
      locked: "Requires Gaulia Premium on this server.",
    },
  },

  loopMode: {
    NONE: "Off",
    TRACK: "Current track",
    QUEUE: "Queue",
  },

  blindtest: {
    title: "Blindtest",
    description:
      "Settings for the /blindtest command. Administrators are never affected by the channel limit.",
    channels: {
      label: "Blindtest channels",
      hint: "The blindtest can only start in these channels and their threads, whatever the music command channel is. With no channel picked, it starts anywhere.",
      add: "Add a channel...",
      empty: "Every channel",
      aria: "Add a blindtest channel",
    },
    categories: {
      label: "Categories on offer",
      hint: "A disabled category no longer shows up in the /blindtest autocomplete on this server.",
      loadError: "Could not load the categories.",
      toggleAria: "Offer the {name} category",
      tracks: {
        one: "{value} track",
        other: "{value} tracks",
      },
    },
  },

  playlists: {
    title: "Custom lists",
    description:
      "Build your own track lists: they show up in the /blindtest autocomplete alongside the categories you left on. Creating and deleting a list is saved right away.",
    loadError: "Could not load the lists.",
    empty: "No list yet.",
    tracks: {
      one: "{value} track",
      other: "{value} tracks",
    },
    edit: "Edit",
    deleting: "Deleting...",
    namePlaceholder: "Name of the new list",
    nameAria: "Name of the new list",
    create: "Create the list",
    creating: "Creating...",
    limit: "Limit of {count} lists reached: delete one to make room.",
  },

  playlist: {
    back: "Back to the music settings",
    loadError: "Could not load this list.",
    title: "Custom list",
    name: {
      label: "Name",
      hint: "Shown in the /blindtest autocomplete.",
      aria: "Name of the list",
      required: "Give the list a name.",
    },

    add: {
      title: "Add tracks",
      description:
        "Paste the link of a public Spotify playlist, album or track (the first 100 tracks of a playlist are read). A track added by hand is looked up on SoundCloud during the game.",
      linkPlaceholder: "https://open.spotify.com/playlist/...",
      linkAria: "Spotify link to import",
      import: "Import",
      importing: "Importing...",
      titlePlaceholder: "Title",
      titleAria: "Title to add",
      artistPlaceholder: "Artist",
      artistAria: "Artist of the track to add",
      submit: "Add",
    },

    imported: {
      one: '{count} track added from "{name}"',
      other: '{count} tracks added from "{name}"',
    },
    duplicates: {
      one: "{count} already in the list",
      other: "{count} already in the list",
    },
    overflow: {
      one: "{count} skipped (limit of {max} tracks)",
      other: "{count} skipped (limit of {max} tracks)",
    },
    remember: "Remember to save.",
    duplicateTrack: "This track is already in the list.",
    full: "The list is capped at {max} tracks.",

    tracks: {
      title: "Tracks ({value} / {max})",
      minimum: "A blindtest needs at least {count} tracks in the list to start.",
      filterPlaceholder: "Filter by title or artist",
      filterAria: "Filter the tracks",
      empty: "No track yet.",
      noMatch: "No track matches this filter.",
      columnTitle: "Title",
      columnArtist: "Artist",
      columnPreview: "Preview",
      columnActions: "Actions",
      remove: "Remove",
      removeAria: "Remove {title}",
    },
  },
} satisfies Dictionary;

export type MusicStrings = typeof music;

export default music;
