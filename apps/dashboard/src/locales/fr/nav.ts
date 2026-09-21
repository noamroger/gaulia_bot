import type { NavStrings } from "../en/nav";

const nav: NavStrings = {
  language: {
    switchTo: "Passer en {language}",
  },

  top: {
    admin: "Admin",
    credits: "{count} crédits",
    creditsTitle: "Crédits gagnés en votant sur top.gg",
    creditsMenu: "{count} crédit(s)",
    accountMenu: "Menu du compte",
    myServers: "Mes serveurs",
    logout: "Déconnexion",
  },

  footer: {
    tagline:
      "Bot Discord français : modération, automod, musique, blindtest, jeux et aventure au long cours, le tout réglable serveur par serveur depuis ce tableau de bord.",
    version: "Version {version}",
    maintainedBy: "créé et maintenu par",
    rights: "© {year} Gaulia · non affilié à Discord Inc.",

    bot: "Le bot",
    addBot: "Ajouter Gaulia",
    vote: "Voter sur top.gg",
    appDirectory: "App Directory Discord",
    support: "Serveur de support",

    dashboard: "Tableau de bord",
    home: "Accueil",
    myServers: "Mes serveurs",

    resources: "Ressources",
    contact: "Nous contacter",
    myData: "Mes données",
    privacy: "Politique de confidentialité",
  },
};

export default nav;
