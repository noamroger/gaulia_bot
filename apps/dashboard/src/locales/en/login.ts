import type { Dictionary } from "../../i18n/translate";

const login = {
  intro: "Sign in with Discord to manage your servers.",
  failed: "Sign-in failed, please try again.",
  action: "Sign in with Discord",
} satisfies Dictionary;

export type LoginStrings = typeof login;

export default login;
