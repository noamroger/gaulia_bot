// Permissions demandées à l'invitation : même valeur que INVITE_PERMISSIONS côté API
// (apps/api/src/discord/discordApi.ts), sans aller jusqu'à Administrator.
const INVITE_PERMISSIONS = "1099783334966";

// Le contexte de build est la racine du monorepo (voir Dockerfile.dashboard) : la version
// affichée dans le pied de page suit celle du projet, sans être recopiée à la main.
const { version } = require("../../package.json");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,

  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    // Le pied de page n'affiche le lien « Serveur de support » que si la redirection existe.
    NEXT_PUBLIC_SUPPORT_INVITE: process.env.DISCORD_SUPPORT_INVITE_CODE ?? "",
  },

  // Lu au build (argument Docker) : le conteneur du dashboard n'a pas de .env au runtime.
  async redirects() {
    const redirects = [];
    const botId = process.env.DISCORD_CLIENT_ID;

    if (botId) {
      const inviteParams = new URLSearchParams({
        client_id: botId,
        scope: "bot applications.commands",
        permissions: INVITE_PERMISSIONS,
      });

      redirects.push(
        {
          source: "/vote",
          destination: `https://top.gg/bot/${botId}/vote`,
          permanent: false,
        },
        {
          source: "/invite",
          destination: `https://discord.com/oauth2/authorize?${inviteParams.toString()}`,
          permanent: false,
        },
        {
          source: "/app-directory",
          destination: `https://discord.com/application-directory/${botId}`,
          permanent: false,
        },
      );
    }

    // Code d'invitation du serveur de support : ce qui suit discord.gg/ dans le lien.
    const supportCode = process.env.DISCORD_SUPPORT_INVITE_CODE;
    if (supportCode) {
      redirects.push({
        source: "/support",
        destination: `https://discord.gg/${supportCode}`,
        permanent: false,
      });
    }

    return redirects;
  },
};

module.exports = nextConfig;
