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
