import type { ButtonComponent } from "../../../structures/Component";
import { acceptDuel, declineDuel } from "../services/duel";
import { parseCustomId } from "../services/funUi";

const acceptButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "fun:duel-accept:",
  async execute(interaction) {
    await acceptDuel(interaction, parseCustomId(interaction.customId).gameId);
  },
};

const declineButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "fun:duel-decline:",
  async execute(interaction) {
    await declineDuel(interaction, parseCustomId(interaction.customId).gameId);
  },
};

export default [acceptButton, declineButton];
