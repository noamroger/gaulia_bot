import type { ButtonComponent } from "../../../structures/Component";
import { acceptDuel, declineDuel } from "../services/duel";
import { parseCustomId } from "../services/funUi";

const acceptButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "fun:duel-accept:",
  async execute(interaction, _client, t) {
    await acceptDuel(interaction, parseCustomId(interaction.customId).gameId, t);
  },
};

const declineButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "fun:duel-decline:",
  async execute(interaction, _client, t) {
    await declineDuel(interaction, parseCustomId(interaction.customId).gameId, t);
  },
};

export default [acceptButton, declineButton];
