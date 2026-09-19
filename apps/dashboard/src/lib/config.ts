// NEXT_PUBLIC_* est injecté au build (voir Dockerfile.dashboard) — nécessaire car ce code tourne
// dans le navigateur, qui ne connaît rien du réseau Docker interne.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Version du monorepo, injectée au build depuis le package.json racine (voir next.config.js). */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "5.0.0";

/** Adresse de contact affichée dans le pied de page et la politique de confidentialité. */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";

export const AUTHOR_NAME = "noamroger";
export const AUTHOR_URL = "https://noamroger.fr";
