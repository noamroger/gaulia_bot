import type { TranslationModule } from "../../i18n/catalog";

const settings = {
  commands: {
    language: {
      name: "language",
      description: "Choose the language Gaulia answers in",
      help: {
        details:
          "Without a choice, shows the language Gaulia currently answers you in and where that comes from. `me` sets your own language, on every server; `server` sets the one used for messages the whole channel reads, and needs the Manage Server permission. Both accept `auto`, which follows the language Discord is set to.",
        examples: [
          "language show",
          "language me language:English",
          "language server language:auto",
        ],
      },
      subcommands: {
        show: {
          name: "show",
          description: "Show the language currently in use",
        },
        me: {
          name: "me",
          description: "Set the language Gaulia answers you in",
          options: {
            language: {
              name: "language",
              description: "Language to use for you",
              choices: {
                auto: "Automatic (my Discord language)",
                en: "English",
                fr: "French",
              },
            },
          },
        },
        server: {
          name: "server",
          description: "Set the language of the messages sent to this whole server",
          options: {
            language: {
              name: "language",
              description: "Language to use on this server",
              choices: {
                auto: "Automatic (the server's Discord language)",
                en: "English",
                fr: "French",
              },
            },
          },
        },
      },
    },
  },

  language: {
    showTitle: "Language",
    yours: "Gaulia answers you in **{language}**.",
    sourceUser: "That comes from your own choice, set with `/language me`.",
    sourceDiscordUser: "That comes from the language your Discord client is set to.",
    sourceGuild: "That comes from this server's choice, set with `/language server`.",
    sourceDiscordGuild: "That comes from the language this server is set to on Discord.",
    sourceDefault: "No language could be determined, so English is used.",
    guildLine: "Messages sent to the whole server use **{language}**.",
    guildLineAuto: "Messages sent to the whole server follow this server's Discord language.",

    userUpdated: "Your language is now **{language}**.",
    userUpdatedAuto: "Gaulia will now follow the language your Discord client is set to.",
    guildUpdated: "This server's language is now **{language}**.",
    guildUpdatedAuto: "Gaulia will now follow the language this server is set to on Discord.",

    guildOnly: "This subcommand only works inside a server.",
    needsManageGuild: "Only members who can manage the server may change its language.",
  },
} satisfies TranslationModule;

export type SettingsStrings = typeof settings;

export default settings;
