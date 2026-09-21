import type { Dictionary } from "../../i18n/translate";

const fun = {
  loadError: "Could not load the fun settings.",

  access: {
    title: "Access",
    description: 'Members holding the "Administrator" permission are never affected by this limit.',
    channels: {
      label: "Fun command channels",
      hint: "Games, lovecalc and the other fun commands only answer in these channels and their threads. With no channel picked, they answer everywhere.",
      add: "Add a channel...",
      empty: "Every channel",
      aria: "Add an allowed channel",
    },
  },
} satisfies Dictionary;

export type FunStrings = typeof fun;

export default fun;
