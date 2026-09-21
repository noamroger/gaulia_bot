import type { TranslationModule } from "../../i18n/catalog";

const moderation = {
  commands: {
    ban: {
      name: "ban",
      description: "Ban a member from the server",
      help: {
        details:
          "Bans a member, or a user who already left the server. A moderation case is created and posted in the mod log channel, and the member is warned in DM when that option is on in the moderation settings. Their highest role must sit below yours and below Gaulia's.",
        examples: ["ban user:@Nickname reason:Spam", "ban user:@Nickname delete_message_days:7"],
      },
      options: {
        user: { name: "user", description: "Member to ban" },
        reason: { name: "reason", description: "Reason for the ban" },
        deleteMessageDays: {
          name: "delete_message_days",
          description: "Delete the messages of the last N days (0-7)",
        },
      },
    },

    kick: {
      name: "kick",
      description: "Kick a member from the server",
      help: {
        details:
          "Kicks a member from the server: they can come back with a new invite. A moderation case is created and the member is warned in DM when that option is on in the moderation settings. Their highest role must sit below yours and below Gaulia's.",
        examples: ["kick user:@Nickname reason:Toxic behaviour"],
      },
      options: {
        user: { name: "user", description: "Member to kick" },
        reason: { name: "reason", description: "Reason for the kick" },
      },
    },

    timeout: {
      name: "timeout",
      description: "Time a member out temporarily",
      help: {
        details:
          "Stops a member from writing, reacting and speaking in voice for the given duration, from 1 second to 28 days. Accepted formats: a number of seconds (`90`) or a value followed by `s`, `m`, `h` or `d` (`30s`, `10m`, `2h`, `1d`). A moderation case is created and the member is warned in DM when that option is on.",
        examples: [
          "timeout user:@Nickname duration:10m reason:Flood",
          "timeout user:@Nickname duration:1d",
        ],
      },
      options: {
        user: { name: "user", description: "Member to time out" },
        duration: { name: "duration", description: "Ex: 10m, 2h, 1d (28d max)" },
        reason: { name: "reason", description: "Reason" },
      },
    },

    untimeout: {
      name: "untimeout",
      description: "Lift a member's timeout",
      help: {
        details:
          "Lifts a member's timeout right away. A moderation case is created and the member is warned in DM when that option is on.",
        examples: ["untimeout user:@Nickname"],
      },
      options: {
        user: { name: "user", description: "Member concerned" },
        reason: { name: "reason", description: "Reason" },
      },
    },

    unban: {
      name: "unban",
      description: "Unban a user",
      help: {
        details:
          'Lifts a user\'s ban from their Discord ID, which you can read in Server Settings > Bans or copy with "Copy User ID" in developer mode. A moderation case is created.',
        examples: ["unban user_id:123456789012345678 reason:Appeal accepted"],
      },
      options: {
        userId: { name: "user_id", description: "Discord ID of the user" },
        reason: { name: "reason", description: "Reason for the unban" },
      },
    },

    warn: {
      name: "warn",
      description: "Warn a member",
      help: {
        details:
          "Adds a warning to the member, creates a moderation case and warns them in DM when that option is on. When escalation steps are set on the dashboard, a timeout, a kick or a ban is applied automatically once the member reaches the warning count of a step.",
        examples: ["warn user:@Nickname reason:Insults"],
      },
      options: {
        user: { name: "user", description: "Member to warn" },
        reason: { name: "reason", description: "Reason for the warning" },
      },
    },

    warnings: {
      name: "warnings",
      description: "List the active warnings of a member",
      help: {
        details:
          "Lists the active warnings of a member with their number, their reason and their date. Only you can see the reply.",
        examples: ["warnings user:@Nickname"],
      },
      options: {
        user: { name: "user", description: "Member concerned" },
      },
    },

    purge: {
      name: "purge",
      description: "Bulk delete recent messages of this channel",
      help: {
        details:
          "Deletes up to 100 of the most recent messages of the channel. With the user option, only their messages among those are deleted. Messages older than 14 days are skipped (a Discord limit). The operation is recorded as a moderation case.",
        examples: ["purge amount:50", "purge amount:100 user:@Nickname"],
      },
      options: {
        amount: { name: "amount", description: "Number of messages to delete (1-100)" },
        user: { name: "user", description: "Only delete the messages of this member" },
      },
    },

    case: {
      name: "case",
      description: "Show the details of a moderation case",
      help: {
        details:
          "Shows the target, the moderator, the date, the reason and, for a timeout, the duration of a moderation case. The case number is given with every sanction and in the mod log channel.",
        examples: ["case number:12"],
      },
      options: {
        number: { name: "number", description: "Case number" },
      },
    },

    modlogsConfig: {
      name: "modlogs-config",
      description: "Set the moderation log channel",
      help: {
        details:
          "Sets the text channel where Gaulia posts every moderation case: bans, kicks, timeouts, warnings and purges. Gaulia must be allowed to send messages there.",
        examples: ["modlogs-config channel:#mod-logs"],
      },
      options: {
        channel: { name: "channel", description: "Channel the moderation logs are sent to" },
      },
    },

    warnUser: {
      name: "Warn user",
      help: {
        details:
          "Opens a form to type the reason, then warns the member like `/warn`: moderation case, DM when that option is on, and automatic escalation steps.",
        examples: [] as string[],
      },
    },
  },

  /** Display label of each `ModerationCaseType` stored in the database. */
  caseType: {
    BAN: "Ban",
    UNBAN: "Unban",
    KICK: "Kick",
    TIMEOUT: "Timeout",
    UNTIMEOUT: "Timeout lifted",
    WARN: "Warning",
    UNWARN: "Warning revoked",
    PURGE: "Message purge",
  },

  case: {
    header: "Case #{case} - {type}",
    target: "**Target:** {tag} (`{id}`)",
    moderator: "**Moderator:** {tag}",
    /** The moderator erased their account: the case keeps a placeholder instead of a tag. */
    deletedModerator: "deleted account",
    date: "**Date:** {date}",
    reason: "**Reason:** {reason}",
    duration: "**Duration:** {duration}",
  },

  auditReason: "Moderator: {moderator}",

  dm: {
    header: "Moderation action - {guild}",
    action: "**Action:** {action}",
  },

  sanction: {
    delete: "Message deleted",
    warn: "Warning",
    timeout: "Timeout of {duration}",
    kick: "Kick",
    ban: "Ban",
  },

  escalation: {
    line: "**Automatic sanction:** {sanction} ({warnings})",
    reason: "Automatic sanction: {warnings}",
    warnCount: { one: "{count} warning", other: "{count} warnings" },
  },

  ban: {
    title: "Member banned (case #{case})",
    description: "**{target}** has been banned.",
  },

  kick: {
    title: "Member kicked (case #{case})",
    description: "**{target}** has been kicked.",
  },

  timeout: {
    title: "Member timed out (case #{case})",
    description: "**{target}** is timed out for **{duration}**.",
  },

  untimeout: {
    title: "Timeout lifted (case #{case})",
    description: "**{target}** is no longer timed out.",
  },

  unban: {
    title: "User unbanned (case #{case})",
    description: "**{target}** has been unbanned.",
  },

  warn: {
    title: "Member warned (case #{case})",
    description: "**{target}** has been warned.",
  },

  warnings: {
    title: "Warnings of {target}",
    empty: "No active warning.",
    entry: "**#{id}** - {reason} ({date})",
    noReason: "No reason",
  },

  purge: {
    title: "Messages deleted (case #{case})",
    description: {
      one: "**{count}** message deleted.",
      other: "**{count}** messages deleted.",
    },
    caseReason: {
      one: "{count} message deleted",
      other: "{count} messages deleted",
    },
    caseReasonFrom: {
      one: "{count} message from {target} deleted",
      other: "{count} messages from {target} deleted",
    },
  },

  modlogs: {
    title: "Settings updated",
    description: "Moderation logs will be sent to <#{channel}>.",
  },

  warnModal: {
    title: "Warn {user}",
    reasonLabel: "Reason for the warning",
  },

  errors: {
    memberNotInGuild: "This member is not in the server.",
    timeoutRange: "The duration must be between 1 second and 28 days.",
    notTimedOut: "This member is not timed out right now.",
    notBanned: "This user is not banned on this server.",
    textChannelOnly: "This command only works in a server text channel.",
    caseNotFound: "No case #{case} on this server.",
    guildOnly: "This action only works inside a server.",
    unknownTarget: "I cannot tell who this warning is for.",
    userNotFound: "User not found.",
  },
} satisfies TranslationModule;

export type ModerationStrings = typeof moderation;

export default moderation;
