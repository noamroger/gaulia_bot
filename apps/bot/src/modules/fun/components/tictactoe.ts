import type { ButtonComponent } from "../../../structures/Component";
import { parseCustomId } from "../services/funUi";
import { forfeitTicTacToe, playTicTacToe, ticTacToeGames } from "../services/tictactoe";

const cellButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "fun:ttt:",
  async execute(interaction, _client, t) {
    const { gameId, value } = parseCustomId(interaction.customId);
    await interaction.update(playTicTacToe(gameId, interaction.user.id, Number(value), t));
    ticTacToeGames.attach(gameId, interaction);
  },
};

const forfeitButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "fun:ttt-quit:",
  async execute(interaction, _client, t) {
    const { gameId } = parseCustomId(interaction.customId);
    await interaction.update(forfeitTicTacToe(gameId, interaction.user.id, t));
  },
};

export default [cellButton, forfeitButton];
