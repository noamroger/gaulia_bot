/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,

  // Lu au build (argument Docker) : le conteneur du dashboard n'a pas de .env au runtime.
  async redirects() {
    const botId = process.env.DISCORD_CLIENT_ID;
    if (!botId) return [];

    return [
      {
        source: "/vote",
        destination: `https://top.gg/bot/${botId}/vote`,
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
