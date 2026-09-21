import type { Dictionary } from "../../i18n/translate";

const common = {
  meta: {
    title: "Gaulia - Dashboard",
    description: "Manage moderation, automod and the premium status of your Gaulia servers.",
  },

  state: {
    loading: "Loading...",
    error: "Something went wrong.",
    empty: "Nothing to show yet.",
    retry: "Try again",
  },

  theme: {
    switchToLight: "Switch to light mode",
    switchToDark: "Switch to dark mode",
    light: "Light mode",
    dark: "Dark mode",
  },

  action: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    confirm: "Confirm",
    close: "Close",
    back: "Back",
  },
} satisfies Dictionary;

export type CommonStrings = typeof common;

export default common;
