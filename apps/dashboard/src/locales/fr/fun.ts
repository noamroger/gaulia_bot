import type { FunStrings } from "../en/fun";

const fun: FunStrings = {
  loadError: "Impossible de charger les réglages fun.",

  access: {
    title: "Accès",
    description:
      "Les membres ayant la permission « Administrateur » ne sont jamais concernés par cette restriction.",
    channels: {
      label: "Salons des commandes fun",
      hint: "Jeux, lovecalc et autres commandes fun ne fonctionnent que dans ces salons et leurs fils. Sans salon choisi, elles sont utilisables partout.",
      add: "Ajouter un salon...",
      empty: "Tous les salons",
      aria: "Ajouter un salon autorisé",
    },
  },
};

export default fun;
