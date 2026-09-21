import type { TranslationModule } from "../../i18n/catalog";

const automod = {
  commands: {
    automod: {
      name: "automod",
      description: "Configure the automatic moderation of this server",
      help: {
        details:
          "Manages Discord's native AutoMod. `setup` creates baseline rules blocking spam, messages with more than 5 mentions and the banned words of Discord's own presets. `rules` lists the native rules with their ID, to be used with `rule-delete`. `config` picks the automod log channel. Gaulia's own rules (links, invites, banned words, caps, duplicates, flood) and their sanctions are set from the dashboard.",
        examples: [
          "automod setup",
          "automod rule-delete id:123456789012345678",
          "automod config log_channel:#automod-logs",
        ],
      },
      subcommands: {
        setup: {
          name: "setup",
          description: "Create the baseline native AutoMod rules (spam, mentions, banned words)",
        },
        rules: {
          name: "rules",
          description: "List the active native AutoMod rules",
        },
        ruleDelete: {
          name: "rule-delete",
          description: "Delete a native AutoMod rule",
          options: {
            id: { name: "id", description: "ID of the rule" },
          },
        },
        config: {
          name: "config",
          description: "Pick the automod log channel (rules and sanctions: dashboard)",
          options: {
            logChannel: {
              name: "log_channel",
              description: "Channel the automod logs are sent to",
            },
          },
        },
      },
    },
  },

  setup: {
    title: "AutoMod rules created",
    description: {
      one: "{count} native rule created.",
      other: "{count} native rules created.",
    },
    auditReason: "Set up by {moderator} through /automod setup",
  },

  rules: {
    title: "Native AutoMod rules",
    empty: "No rule configured.",
    entry: "**{name}** - `{id}` ({state})",
    enabled: "enabled",
    disabled: "disabled",
    deleted: "Rule deleted",
    /** Name given to each baseline rule, after the `[Gaulia]` prefix that marks our own rules. */
    names: {
      spam: "Anti-spam",
      mentionSpam: "Anti mention-spam",
      badWords: "Banned words",
    },
  },

  config: {
    title: "Automod settings updated",
    description:
      "Automod logs will be sent to <#{channel}>. The rules (links, invites, banned words, flood...) and their sanctions are set from the Gaulia dashboard.",
  },

  violations: {
    invites: {
      title: "Discord invite not allowed",
      detail: "posted an invite that is not allowed",
    },
    linkBlocked: {
      title: "Link not allowed",
      detail: "posted a link to a blocked domain",
    },
    linkNotAllowed: {
      title: "Link not allowed",
      detail: "posted a link to a domain that is not allowed",
    },
    badWords: {
      title: "Banned word",
      detail: "used a banned word",
    },
    mentions: {
      title: "Mass mentions",
      detail: "mentioned {count} members or roles",
    },
    caps: {
      title: "Too many capitals",
      detail: "wrote in capitals",
    },
    duplicates: {
      title: "Repeated message",
      detail: "repeated the same message {count} times",
    },
    flood: {
      title: "Flood",
      detail: "sent {count} messages in under {seconds}s",
    },
  },

  reason: "Automod: {rule}",

  log: {
    line: "**{target}** {detail} in <#{channel}>.",
    sanction: "**Sanction:** {outcome}",
  },

  outcome: {
    escalated: "Warning, then {sanction} ({warnings})",
    memberNotFound: "Message deleted (member not found)",
    botRoleTooLow: "Message deleted (my role is too low to sanction this member)",
    failed: "Message deleted (the sanction could not be applied)",
  },

  native: {
    title: "Native AutoMod triggered",
    member: "**Member:** <@{id}>",
    rule: "**Rule:** `{id}`",
    keyword: "**Matched word:** {keyword}",
    channel: "**Channel:** <#{id}>",
  },

  errors: {
    alreadyConfigured:
      "Gaulia rules already exist on this server. Use `/automod rules` to review them.",
    ruleNotFound: "Rule not found.",
    unknownSubcommand: "Unknown subcommand.",
  },
} satisfies TranslationModule;

export type AutomodStrings = typeof automod;

export default automod;
