// Permissions demandées à l'invitation : même valeur que INVITE_PERMISSIONS côté API
// (apps/api/src/discord/discordApi.ts), sans aller jusqu'à Administrator.
const INVITE_PERMISSIONS = "1099783334966";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,

  // Lu au build (argument Docker) : le conteneur du dashboard n'a pas de .env au runtime.
  async redirects() {
    const botId = process.env.DISCORD_CLIENT_ID;
    if (!botId) return [];

    const inviteParams = new URLSearchParams({
      client_id: botId,
      scope: "bot applications.commands",
      permissions: INVITE_PERMISSIONS,
    });

    return [
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
    ];
  },
};

module.exports = nextConfig;
