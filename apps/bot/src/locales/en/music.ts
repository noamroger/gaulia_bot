import type { TranslationModule } from "../../i18n/catalog";

const music = {
  commands: {
    play: {
      name: "play",
      description: "Play a track or add it to the queue",
      help: {
        details:
          "Searches SoundCloud from a title or an artist, or loads a link directly (track or playlist), then adds the result to the queue. Gaulia joins your voice channel and starts playing when nothing else is. The queue holds up to 100 tracks, 1000 with Premium.",
        examples: [
          "play query:Daft Punk One More Time",
          "play query:https://soundcloud.com/artist/track",
        ],
      },
      options: {
        query: { name: "query", description: "Title, artist or link" },
      },
    },

    queue: {
      name: "queue",
      description: "Show the queue",
      help: {
        details:
          "Shows the track playing right now and the next 10 tracks with their position, which `/remove` takes.",
        examples: ["queue"],
      },
    },

    nowplaying: {
      name: "nowplaying",
      description: "Show the track playing right now",
      help: {
        details:
          "Shows the music playing right now: title, source, length, the member who added it, the artwork and the playback position.",
        examples: ["nowplaying"],
      },
    },

    summon: {
      name: "summon",
      description: "Make Gaulia join your voice channel",
      help: {
        details:
          "Brings Gaulia into your voice channel without starting any music. You have to be in a voice channel yourself.",
        examples: ["summon"],
      },
    },

    skip: {
      name: "skip",
      description: "Skip to the next track",
      help: {
        details:
          "Stops the current track and moves on to the next one in the queue. You have to be in the same voice channel as Gaulia.",
        examples: ["skip"],
      },
    },

    pause: {
      name: "pause",
      description: "Pause playback",
      help: {
        details:
          "Pauses the current track without clearing the queue. Use `/resume` to start it again. You have to be in the same voice channel as Gaulia.",
        examples: ["pause"],
      },
    },

    resume: {
      name: "resume",
      description: "Resume playback",
      help: {
        details:
          "Starts playback again after `/pause`. You have to be in the same voice channel as Gaulia.",
        examples: ["resume"],
      },
    },

    stop: {
      name: "stop",
      description: "Stop the music, clear the queue and leave the voice channel",
      help: {
        details:
          "Stops playback, clears the queue and makes Gaulia leave the voice channel. You have to be in the same voice channel as Gaulia.",
        examples: ["stop"],
      },
    },

    volume: {
      name: "volume",
      description: "Set the playback volume",
      help: {
        details:
          "Sets the volume of the current playback, from 0 to 150 %. The player buttons move it 10 % at a time. The default volume of the server is set on the dashboard. You have to be in the same voice channel as Gaulia.",
        examples: ["volume level:80"],
      },
      options: {
        level: { name: "level", description: "Volume between 0 and 150" },
      },
    },

    shuffle: {
      name: "shuffle",
      description: "Turn shuffle on or off",
      help: {
        details:
          "Turns shuffle on or off, like the player button. When it goes on, the queue is shuffled without interrupting the current track, then shuffled again on every addition while the mode stays on. You have to be in the same voice channel as Gaulia.",
        examples: ["shuffle"],
      },
    },

    seek: {
      name: "seek",
      description: "Jump to a position in the current track",
      help: {
        details:
          "Moves playback of the current track to the given position. Accepted formats: seconds (`90`), `mm:ss` (`1:30`) or `hh:mm:ss`. You have to be in the same voice channel as Gaulia.",
        examples: ["seek position:1:30", "seek position:90"],
      },
      options: {
        position: { name: "position", description: "For example 1:30 or 90" },
      },
    },

    previous: {
      name: "previous",
      description: "Play the previous track again",
      help: {
        details:
          "Starts the last played track again. You have to be in the same voice channel as Gaulia.",
        examples: ["previous"],
      },
    },

    loop: {
      name: "loop",
      description: "Set the repeat mode",
      help: {
        details:
          "Picks what is played again at the end of a track: nothing, the current track or the whole queue. The repeat button of the player switches between no repeat and repeating the queue. You have to be in the same voice channel as Gaulia.",
        examples: ["loop mode:Queue"],
      },
      options: {
        mode: {
          name: "mode",
          description: "Repeat mode",
          choices: {
            off: "None",
            track: "Current track",
            queue: "Queue",
          },
        },
      },
    },

    filters: {
      name: "filters",
      description: "[Premium] Apply an audio filter to the current playback",
      help: {
        details:
          "Applies an audio effect to the current playback. Nightcore, Vaporwave and 8D switch on or off on every use, Bassboost lifts the low end and Reset drops every filter. You have to be in the same voice channel as Gaulia.",
        examples: ["filters filter:Nightcore", "filters filter:Reset"],
      },
      options: {
        filter: {
          name: "filter",
          description: "Filter to apply",
          choices: {
            bassboost: "Bassboost",
            nightcore: "Nightcore",
            vaporwave: "Vaporwave",
            "8d": "8D",
            clear: "Reset",
          },
        },
      },
    },

    remove: {
      name: "remove",
      description: "Remove a track from the queue",
      help: {
        details:
          "Removes from the queue the track sitting at the position `/queue` shows. You have to be in the same voice channel as Gaulia.",
        examples: ["remove position:3"],
      },
      options: {
        position: { name: "position", description: "Position in the queue (see /queue)" },
      },
    },

    stay247: {
      name: "247",
      description: "[Premium] Turn the 24/7 mode on or off (Gaulia stays in voice)",
      help: {
        details:
          "Turns the 24/7 mode on or off on every use. While it is on, Gaulia stays in the voice channel even when the queue is empty, instead of leaving after a while without music. The setting is kept for the server.",
        examples: ["247"],
      },
    },

    blindtest: {
      name: "blindtest",
      description: "Music blindtest in your voice channel",
      help: {
        details:
          "Gaulia plays 30 second clips in your voice channel. Type the title or the artist in the channel of the game: the first to find each of them scores 1 point, and light typos are forgiven. Only the members sitting in the voice channel can answer. The offered categories, the custom lists and the allowed channels are set in the Music tab of the dashboard. Music commands are unavailable while the game runs. The member who started it and the members who can manage the server may skip a round or stop the game.",
        examples: [
          "blindtest start category:80s",
          "blindtest start category:French songs rounds:15 duration:20",
          "blindtest categories",
        ],
      },
      subcommands: {
        start: {
          name: "start",
          description: "Start a blindtest in your voice channel",
          options: {
            category: { name: "category", description: "Preset category or server list" },
            rounds: { name: "rounds", description: "Number of rounds (10 by default)" },
            duration: {
              name: "duration",
              description: "Length of a round in seconds (30 by default)",
            },
          },
        },
        categories: {
          name: "categories",
          description: "List the categories and lists available on this server",
        },
        skip: { name: "skip", description: "Skip the current round" },
        stop: { name: "stop", description: "Stop the running blindtest" },
      },
    },
  },

  ui: {
    nowPlayingTitle: "Now playing",
    trackTitle: "Title: {track}",
    trackSource: "Source: `{source}`",
    trackDuration: "Length: `{duration}`",
    trackRequester: "Added by `{requester}`",
    live: "live",
    unknownRequester: "unknown",
  },

  controls: {
    pause: "Pause",
    resume: "Resume",
    skip: "Skip",
    previous: "Back",
    stop: "Stop",
  },

  actions: {
    play: {
      playlistTitle: "Playlist added",
      playlistAdded: {
        one: "`{count}` track from **{playlist}** was added to the queue by <@{user}>.",
        other: "`{count}` tracks from **{playlist}** were added to the queue by <@{user}>.",
      },
      unnamedPlaylist: "the playlist",
      trackTitle: "Track added",
      trackAdded: "{track} was added to the queue by <@{user}>.",
    },
    queue: {
      title: "Queue",
      current: "**Now playing:** {title}",
      nothingPlaying: "Nothing is playing.",
      empty: "The queue is empty.",
      entry: "**{position}.** {title}",
      more: {
        one: "… and {count} more track.",
        other: "… and {count} more tracks.",
      },
    },
    nowplaying: {
      position: "Position: `{position}`",
      positionPaused: "Position: `{position}` (paused)",
    },
    summon: {
      title: "Voice channel joined",
      joined: "Gaulia joined <#{channel}>, summoned by <@{user}>.",
    },
    skip: {
      title: "Track skipped",
      skipped: "{track} was skipped by <@{user}>.",
      unnamedTrack: "The track",
    },
    pause: {
      title: "Playback paused",
      paused: "Playback was paused by <@{user}>.",
    },
    resume: {
      title: "Playback resumed",
      resumed: "Playback was resumed by <@{user}>.",
    },
    stop: {
      title: "Playback stopped",
      stopped: "Playback was stopped and the queue cleared by <@{user}>.",
    },
    volume: {
      title: "Playback volume",
      changed: "Volume went from `{from}%` to `{to}%`, set by <@{user}>.",
    },
    shuffle: {
      title: "Shuffle",
      enabled: "Shuffle was turned on by <@{user}>.",
      disabled: "Shuffle was turned off by <@{user}>.",
    },
    seek: {
      title: "Playback position",
      moved: "Playback starts again at `{position}`, moved by <@{user}>.",
    },
    previous: {
      title: "Back one track",
      playing: "{track} is playing again, brought back by <@{user}>.",
    },
    loop: {
      title: "Repeat mode",
      changed: "Repeat mode is now `{mode}`, set by <@{user}>.",
    },
    filters: {
      title: "Audio filter",
      applied: "The `{filter}` filter was applied by <@{user}>.",
      cleared: "Every filter was reset by <@{user}>.",
    },
    remove: {
      title: "Track removed",
      removed: "{track} was removed from the queue by <@{user}>.",
    },
    stay247: {
      title: "24/7 mode",
      enabled:
        "The 24/7 mode was turned on by <@{user}>: Gaulia stays in the voice channel even when the queue is empty.",
      disabled:
        "The 24/7 mode was turned off by <@{user}>: Gaulia leaves after a while without music.",
    },
  },

  player: {
    errorTitle: "Playback failed",
    stuckTitle: "Track stuck",
    stuckDescription: "**{track}** was skipped.",
    unnamedTrack: "This track",
  },

  access: {
    channelOnly: "Music commands are limited to <#{channel}>.",
    djRoleOnly: "This action is limited to the <@&{role}> role.",
  },

  error: {
    notInVoice: "You have to be in a voice channel to use this command.",
    noPlayer: "Nothing is playing on this server.",
    differentVoice: "You have to be in the same voice channel as me to do that.",
    nothingPlaying: "Nothing is playing right now.",
    noNextTrack: "There is no next track in the queue.",
    noPreviousTrack: "There is no previous track.",
    alreadyPaused: "Playback is already paused. Use `/resume` to start it again.",
    notPaused: "Playback is not paused.",
    noResult: "No result found for this search.",
    queueFull:
      "The queue is limited to {limit} tracks on this server. Go Gaulia Premium to extend it.",
    noTrackAtPosition: "No track sits at this position.",
    invalidPosition: "Invalid format. Use `mm:ss` or a number of seconds.",
    unknownFilter: "Unknown filter.",
    staleButton: "This button does not belong to this server.",
    playerGone: "There is nothing playing any more.",
  },

  blindtest: {
    categoriesTitle: "Blindtest",
    stopReply: "Blindtest stopped.",

    category: {
      none: "No category is available on this server.",
      customHeading: "**Server lists**",
      presetHeading: "**Categories**",
      customName: "{name} (server list)",
      line: "- **{name}** · {tracks}",
      choice: "{name} · {tracks}",
      tracks: { one: "{count} track", other: "{count} tracks" },
    },

    button: {
      skip: "Skip the round",
      stop: "Stop",
    },

    rules: {
      both: "The title and the artist each earn 1 point for whoever finds them first.",
      title: "The title (or the name of the work) earns 1 point for whoever finds it first.",
    },

    rounds: { one: "{count} round", other: "{count} rounds" },

    intro: {
      title: "Blindtest: {category}",
      setup: "{rounds} of {duration}. Join <#{channel}> and type your answers in this channel.",
      footer: "Started by <@{host}>. First round in a few seconds.",
    },

    round: {
      heading: "Round {number} / {total}",
      listening: "Listen closely! The round ends {timestamp}.",
      answer: "That was **{title}** by **{artist}**.",
      spotify: "[Listen on Spotify]({url})",
      titleLabel: "Title",
      artistLabel: "Artist",
      foundBy: "{label}: found by <@{user}>",
      notFound: "{label}: nobody found it",
      pending: "{label}: still to find",
      skipped: "Round skipped.",
      failed: "Clip could not be played, round cancelled.",
    },

    leaderboard: {
      heading: "**Standings**",
      finalHeading: "**Final standings**",
      empty: "Nobody has scored yet.",
      entry: "{rank}. <@{user}> · {points}",
      points: { one: "{count} point", other: "{count} points" },
    },

    final: {
      heading: "{title}: {category}",
      title: {
        completed: "Blindtest over",
        stopped: "Blindtest stopped",
        interrupted: "Blindtest interrupted",
        unplayable: "Blindtest interrupted",
        error: "Blindtest interrupted",
      },
      details: {
        completed: "{rounds} played.",
        stopped: "Game stopped by <@{user}> after {rounds}.",
        interrupted: "Gaulia left the voice channel.",
        unplayable: "No other clip could be loaded for now.",
        error: "Something went wrong on our end.",
      },
    },

    error: {
      channelOnly: "Blindtests are limited to these channels: {channels}",
      unsupportedChannel: "A blindtest cannot be started in this channel.",
      unknownPlaylist: "This list no longer exists on this server.",
      playlistTooSmall: "The list **{name}** has to hold at least {count} tracks.",
      unknownCategory: "Pick one of the categories offered in the list.",
      disabledCategory: "This category is turned off on this server.",
      alreadyRunning: "A blindtest is already running on this server.",
      joinVoice: "Join a voice channel to start a blindtest.",
      musicPlaying:
        "Music is playing on this server. Stop it with `/stop` before starting a blindtest.",
      otherVoiceChannel: "Gaulia is already connected to another voice channel.",
      notRunning: "No blindtest is running on this server.",
      notHost: "Only the member who started the blindtest or a server manager can do that.",
      noRound: "No round is running.",
      staleButton: "This button is no longer valid.",
    },
  },
} satisfies TranslationModule;

export type MusicStrings = typeof music;

export default music;
