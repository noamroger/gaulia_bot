import type { DashboardStrings } from "../en/dashboard";

const dashboard: DashboardStrings = {
  guilds: {
    title: "Tes serveurs",
    subtitle: "Sélectionne un serveur pour gérer sa configuration.",
    empty:
      "Gaulia n'est présent sur aucun serveur où tu es gérant. Invite-le depuis la liste ci-dessous.",
    invitableTitle: "Serveurs à inviter",
    invitableSubtitle:
      "Tu es gérant sur ces serveurs mais Gaulia n'y est pas encore. Clique pour l'inviter.",
    invite: "Inviter Gaulia sur {guild}",
    manage: "Gérer",
    add: "Inviter",
  },

  panel: {
    back: "Tous mes serveurs",
    sectionsLabel: "Sections du serveur",
  },

  sections: {
    settings: "Salons de logs, message aux membres sanctionnés et échelle des avertissements.",
    automod:
      "Les filtres qui surveillent les messages des membres et sanctionnent automatiquement.",
    music: "Qui peut utiliser les commandes musique, la lecture par défaut et le blindtest.",
    fun: "Les salons où répondent les jeux et les autres commandes fun.",
    adventure: "Les salons où l'aventure peut se jouer sur ce serveur.",
    premium: "Le statut premium du serveur et l'échange de tes crédits.",
  },

  tabs: {
    label: "Sections du serveur",
    settings: "Paramètres",
    automod: "Automod",
    music: "Musique",
    fun: "Fun",
    adventure: "Aventure",
    premium: "Premium",
  },
};

export default dashboard;
