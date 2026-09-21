// Permissions requested on invite: same value as INVITE_PERMISSIONS on the API side
// (apps/api/src/discord/discordApi.ts), stopping short of Administrator.
const INVITE_PERMISSIONS = "1099783334966";

// The build context is the monorepo root (see Dockerfile.dashboard), so the version in the
// footer follows the project's without being copied by hand.
const { version } = require("../../package.json");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,

  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    // The footer only shows the support server link when the redirect exists.
    NEXT_PUBLIC_SUPPORT_INVITE: process.env.DISCORD_SUPPORT_INVITE_CODE ?? "",
  },

  // Read at build time (Docker argument): the dashboard container has no .env at runtime.
  async redirects() {
    // The adventure pages were renamed from French to English: a bookmark kept from before
    // would otherwise land on a 404.
    const redirects = [
      { source: "/admin/aventure", destination: "/admin/adventure", permanent: true },
      {
        source: "/dashboard/:guildId/aventure",
        destination: "/dashboard/:guildId/adventure",
        permanent: true,
      },
    ];
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

    // Support server invite code: whatever follows discord.gg/ in the link.
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
