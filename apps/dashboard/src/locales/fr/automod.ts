import type { AutomodStrings } from "../en/automod";

const automod: AutomodStrings = {
  loadError: "Impossible de charger l'automod de ce serveur.",

  intro: {
    before:
      "Chaque règle a sa propre sanction. Elles s'ajoutent aux règles AutoMod natives de Discord, créées avec",
    command: "/automod installer",
    after: ".",
  },

  exemptions: {
    title: "Exemptions",
    description: "Membres et salons jamais contrôlés par l'automod.",
    staff: {
      label: "Ignorer l'équipe de modération",
      hint: "Membres ayant la permission « Gérer les messages ».",
    },
    channels: {
      label: "Salons ignorés",
      add: "Ajouter un salon...",
      empty: "Aucun salon ignoré",
      aria: "Ajouter un salon ignoré",
    },
    roles: {
      label: "Rôles ignorés",
      add: "Ajouter un rôle...",
      empty: "Aucun rôle ignoré",
      aria: "Ajouter un rôle ignoré",
    },
  },

  links: {
    title: "Liens",
    description: "Filtre les liens selon leur nom de domaine.",
    modeAria: "Mode du filtre de liens",
    blocklist: "Liste noire",
    allowlist: "Liste blanche",
    blocklistHint: "Seuls les liens vers ces domaines sont sanctionnés.",
    allowlistEmptyHint: "Liste vide : tous les liens seront sanctionnés.",
    allowlistHint: "Tous les liens sont sanctionnés, sauf ceux vers ces domaines.",
    subdomains: "Les sous-domaines sont inclus.",
    placeholder: "exemple.com",
    addAria: "Ajouter un domaine",
    invalid: "« {domain} » n'est pas un nom de domaine valide.",
  },

  invites: {
    title: "Invitations Discord",
    description: "Sanctionne les invitations vers d'autres serveurs Discord.",
    hint: "Codes d'invitation toujours autorisés, par exemple celui de ton serveur.",
    placeholder: "Code d'invitation (ex : gaulia)",
    addAria: "Ajouter un code d'invitation autorisé",
  },

  badWords: {
    title: "Mots interdits",
    description:
      "Sanctionne les messages contenant un mot interdit (mot entier, sans tenir compte des majuscules).",
    placeholder: "Mot ou expression",
    addAria: "Ajouter un mot interdit",
  },

  mentions: {
    title: "Mentions de masse",
    description: "Sanctionne les messages qui mentionnent trop de membres ou de rôles.",
    max: "Mentions maximum par message",
  },

  caps: {
    title: "Majuscules",
    description: "Sanctionne les messages écrits principalement en majuscules.",
    percent: "Part de majuscules (%)",
    percentAria: "Part de majuscules en pourcentage",
    minLength: "À partir de (lettres)",
    minLengthAria: "Nombre minimum de lettres",
  },

  duplicates: {
    title: "Messages répétés",
    description: "Sanctionne un membre qui envoie plusieurs fois le même message d'affilée.",
    max: "Répétitions avant sanction",
  },

  flood: {
    title: "Flood",
    description: "Sanctionne un membre qui envoie trop de messages en peu de temps.",
    messages: "Messages",
    messagesAria: "Nombre de messages",
    seconds: "En (secondes)",
    secondsAria: "Fenêtre en secondes",
  },
};

export default automod;
