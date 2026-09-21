import type { TranslationModule } from "../../i18n/catalog";

const general = {
  commands: {
    ping: {
      name: "ping",
      description: "Show the bot's latency",
      help: {
        details:
          "Measures how fast Gaulia answers: the API latency (the round trip of the command) and the WebSocket latency of the shard handling this server.",
        examples: ["ping"],
      },
    },

    help: {
      name: "help",
      description: "List Gaulia's commands, or the detailed help of one command",
      options: {
        command: {
          name: "command",
          description: "Command to show the detailed help of",
        },
      },
      help: {
        details:
          "Without an option, lists every command by category. With a command name, shows its detailed help: usage, options, access conditions and examples. The name completes itself as you type.",
        examples: ["help", "help command:ban"],
      },
    },

    botinfo: {
      name: "botinfo",
      description: "Show Gaulia's information and statistics",
      options: {
        view: {
          name: "view",
          description: "Tab to open right away",
          choices: {
            overview: "Overview",
            technical: "Technical",
            shards: "Shards",
            commands: "Commands",
          },
        },
      },
      help: {
        details:
          "Everything there is to know about Gaulia, in four tabs you can move between with buttons: the overview (identity, servers, members, state), the technical sheet (versions, memory, database, Lavalink), the shard breakdown and 30 days of command usage. Totals come from the heartbeats every shard sends, not only from the one answering you.",
        examples: ["botinfo", "botinfo view:shards"],
      },
    },
  },

  ping: {
    calculating: "Measuring...",
    title: "Pong!",
    latency: "**API latency:** {api}ms\n**WebSocket latency:** {gateway}ms",
  },

  help: {
    title: "Gaulia help",
    footer: "`/help command:<name>` shows the detailed help of a command.",
    notFound: 'No command is called "{query}". Use `/help` to see the list.',

    usage: "Usage",
    examples: "Examples",
    access: "Access",
    required: ", required",
    choices: " (choices: {list})",

    categories: {
      general: "General",
      moderation: "Moderation",
      automod: "Automod",
      music: "Music",
      fun: "Fun",
      adventure: "Adventure",
      premium: "Premium",
      settings: "Settings",
    },

    optionTypes: {
      string: "text",
      integer: "whole number",
      number: "number",
      boolean: "yes/no",
      user: "member",
      channel: "channel",
      role: "role",
      mentionable: "member or role",
      attachment: "file",
      fallback: "value",
    },

    contextMenu: {
      onMessage: "a message",
      onUser: "a member",
      summary: "Context menu on {target}",
      usage: "Right click on {target} > Apps > {name}",
    },

    accessLevel: "Level required: {level}",
    guildOnly: "Usable on a server only",
    alsoInDm: "Usable in direct messages too",
    premiumOnly: "Reserved for Gaulia Premium servers",
    cooldown: "Delay between two uses: {seconds} s",
    musicControl: "Limited to the music channel and the DJ role when they are configured",
    musicListen: "Limited to the music channel when it is configured",
  },

  botinfo: {
    views: {
      overview: "Overview",
      technical: "Technical",
      shards: "Shards",
      commands: "Commands",
    },

    units: {
      megabyte: "{value} MB",
      percent: "{value}%",
    },

    refresh: "Refresh",
    addBot: "Add Gaulia",
    dashboard: "Dashboard",
    notYours: {
      title: "This panel belongs to someone else",
      description: "Run `/botinfo` to browse your own sheet.",
    },

    tagline: "Discord bot: moderation, automod, music, games and a long running adventure.",
    unknownVersion: "unknown",

    overview: {
      identity: "Identity",
      id: "Id: `{id}`",
      version: "Version: `{version}`",
      createdAt: "Created on {date} ({relative})",
      owner: "Owner: [{owner}]({url})",

      numbers: "In numbers",
      guildsAndMembers: "🌍 {guilds} · 👥 {members}",
      commandsAndUsage: "🧩 {commands} · ⚡ {usage} over {days} days",
      playersAndAdventurers: "🎵 {players} playing · ⚔️ {adventurers}",
      premiumGuilds: "✨ {count} premium server(s)",

      state: "State",
      noHeartbeat: "no heartbeat recorded",
      shardsOnline: "{online}/{total} shard(s) online",
      averagePing: "📡 Average latency: {ping} ms",
      averagePingUnknown: "Average latency: unknown",
      uptime: "⏱️ Online for {duration} (shard {shard})",
      footer: "Totals computed from the shard heartbeats · {timestamp}",
    },

    technical: {
      title: "Technical",
      runtime: "Runtime",
      versions: "Node.js {node} · discord.js {discordJs}",
      platform: "Platform: {platform} · {cores} · load {load}",
      systemMemory: "Machine memory: {memory}",

      process: "Shard {shard} process",
      memory: "Memory: {rss} (including {heap} of heap)",
      cache: "Cache: {guilds} · {users}",
      wsPing: "WebSocket latency: {ping}",
      wsPingMeasuring: "being measured",
      uptime: "Online for {duration}",

      database: "Database",
      databaseDown: "🔴 PostgreSQL unreachable right now.",
      databaseUp: "🟢 PostgreSQL · ping {ping}",

      lavalink: "Lavalink",
      lavalinkNone: "No node configured.",
      lavalinkNode: "{state} `{id}` · {playing} playing out of {players}",
      lavalinkDetail:
        "-# RAM {memory} · CPU {botLoad} of the bot, {systemLoad} system ({cores} cores) · started {uptime} ago",
      footer: "{count} audio player(s) running across every shard.",
    },

    shards: {
      title: "Shards",
      none: "No shard has sent a heartbeat yet. Global totals will be available within a minute.",
      header: "{online}/{total} online · you are served by shard **{shard}** (➤).",
      line: "{marker} {state} **Shard {shard}**: {guilds} · {members}",
      lineDetail: "-# {ping} · {memory} · {players} · started {relative}",
      more: "-# ... and {count} more shard(s).",

      totals: "Total across the online shards",
      guildsAndMembers: "🌍 {guilds} · 👥 {members}",
      averagePing: "📡 Average latency: {ping}",
      averagePingUnknown: "📡 Average latency: unknown",
      declaredGuilds: "📋 Servers reported by Discord: {count}",
      footer: "A shard is considered offline after 90 seconds without a heartbeat.",
    },

    commands: {
      title: "Commands",
      header: "{commands} and {components}.",
      usage: "Usage",
      today: "Today: {count}",
      window: "Last {days} days: {count}",
      history: "Last {days} days: {count}",
      top: "Top {count}",
      topNone: "No command used over the period.",
      topLine: "{rank}. `/{command}` - {count}",
      footer: "-# Only per command counters are kept, {days} days at most, never who ran what.",
    },

    counts: {
      server: { one: "{value} server", other: "{value} servers" },
      member: { one: "{value} member", other: "{value} members" },
      command: { one: "{value} command", other: "{value} commands" },
      component: { one: "{value} button or menu", other: "{value} buttons or menus" },
      player: { one: "{value} player", other: "{value} players" },
      adventurer: { one: "{value} adventurer", other: "{value} adventurers" },
      usage: { one: "{value} use", other: "{value} uses" },
      core: { one: "{value} core", other: "{value} cores" },
      user: { one: "{value} user", other: "{value} users" },
    },
  },
} satisfies TranslationModule;

export type GeneralStrings = typeof general;

export default general;
