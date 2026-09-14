import { GauliaError } from "../../../core/errors";
import type { ButtonComponent } from "../../../structures/Component";
import {
  blackjackGames,
  hitBlackjack,
  standBlackjack,
  startBlackjack,
} from "../services/blackjack";
import { parseCustomId } from "../services/funUi";

const hitButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "fun:bj-hit:",
  async execute(interaction) {
    const { gameId } = parseCustomId(interaction.customId);
    await interaction.update(hitBlackjack(gameId, interaction.user.id));
    blackjackGames.attach(gameId, interaction);
  },
};

const standButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "fun:bj-stand:",
  async execute(interaction) {
    const { gameId } = parseCustomId(interaction.customId);
    await interaction.update(standBlackjack(gameId, interaction.user.id));
  },
};

const replayButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "fun:bj-new:",
  async execute(interaction) {
    const { gameId: playerId } = parseCustomId(interaction.customId);
    if (interaction.user.id !== playerId) {
      throw new GauliaError("Lance ta propre partie avec `/blackjack`.");
    }
    const { gameId, payload } = startBlackjack(playerId);
    await interaction.update(payload);
    blackjackGames.attach(gameId, interaction);
  },
};

export default [hitButton, standButton, replayButton];
