// NEXT_PUBLIC_* is injected at build time (see Dockerfile.dashboard) - required because this code
// runs in the browser, which knows nothing of the internal Docker network.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Monorepo version, injected at build time from the root package.json (see next.config.js). */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "5.0.0";

/** Contact address shown in the footer and the privacy policy. */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";

/**
 * Support guild invite code (`DISCORD_SUPPORT_INVITE_CODE`, injected at build time by
 * next.config.js). Empty = no `/support` redirect, so no link is shown.
 */
export const SUPPORT_INVITE = process.env.NEXT_PUBLIC_SUPPORT_INVITE ?? "";

export const AUTHOR_NAME = "noamroger";
export const AUTHOR_URL = "https://noamroger.fr";
