const CDN = "https://cdn.discordapp.com";

export function guildIconUrl(guildId: string, icon: string | null, size = 128): string | null {
  if (!icon) return null;
  const extension = icon.startsWith("a_") ? "gif" : "png";
  return `${CDN}/icons/${guildId}/${icon}.${extension}?size=${size}`;
}

/** Without a custom avatar, Discord derives a default one from the ID (unique username system). */
export function userAvatarUrl(userId: string, avatar: string | null, size = 64): string {
  if (avatar) {
    const extension = avatar.startsWith("a_") ? "gif" : "png";
    return `${CDN}/avatars/${userId}/${avatar}.${extension}?size=${size}`;
  }
  const index = Number((BigInt(userId) >> 22n) % 6n);
  return `${CDN}/embed/avatars/${index}.png`;
}
