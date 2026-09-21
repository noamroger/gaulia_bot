import type { SettingsStrings } from "../en/settings";

const settings: SettingsStrings = {
  commands: {
    language: {
      name: "langue",
      description: "Choisir la langue dans laquelle Gaulia répond",
      help: {
        details:
          "Sans choix, affiche la langue dans laquelle Gaulia te répond et d'où elle vient. `moi` règle ta langue à toi, sur tous les serveurs ; `serveur` règle celle des messages que tout le salon lit, et demande la permission « Gérer le serveur ». Les deux acceptent `auto`, qui suit la langue configurée sur Discord.",
        examples: ["langue afficher", "langue moi langue:Français", "langue serveur langue:auto"],
      },
      subcommands: {
        show: {
          name: "afficher",
          description: "Afficher la langue utilisée en ce moment",
        },
        me: {
          name: "moi",
          description: "Régler la langue dans laquelle Gaulia te répond",
          options: {
            language: {
              name: "langue",
              description: "Langue à utiliser pour toi",
              choices: {
                auto: "Automatique (ma langue Discord)",
                en: "Anglais",
                fr: "Français",
              },
            },
          },
        },
        server: {
          name: "serveur",
          description: "Régler la langue des messages envoyés à tout le serveur",
          options: {
            language: {
              name: "langue",
              description: "Langue à utiliser sur ce serveur",
              choices: {
                auto: "Automatique (langue Discord du serveur)",
                en: "Anglais",
                fr: "Français",
              },
            },
          },
        },
      },
    },
  },

  language: {
    showTitle: "Langue",
    yours: "Gaulia te répond en **{language}**.",
    sourceUser: "C'est ton propre choix, réglé avec `/langue moi`.",
    sourceDiscordUser: "C'est la langue de ton client Discord.",
    sourceGuild: "C'est le choix de ce serveur, réglé avec `/langue serveur`.",
    sourceDiscordGuild: "C'est la langue de ce serveur sur Discord.",
    sourceDefault: "Aucune langue n'a pu être déterminée, c'est donc l'anglais qui est utilisé.",
    guildLine: "Les messages envoyés à tout le serveur utilisent **{language}**.",
    guildLineAuto: "Les messages envoyés à tout le serveur suivent la langue Discord du serveur.",

    userUpdated: "Ta langue est maintenant **{language}**.",
    userUpdatedAuto: "Gaulia suivra désormais la langue de ton client Discord.",
    guildUpdated: "La langue de ce serveur est maintenant **{language}**.",
    guildUpdatedAuto: "Gaulia suivra désormais la langue de ce serveur sur Discord.",

    guildOnly: "Cette sous-commande n'est utilisable qu'au sein d'un serveur.",
    needsManageGuild: "Seuls les membres pouvant gérer le serveur peuvent en changer la langue.",
  },
};

export default settings;
