import type { ButtonComponent } from "../../../structures/Component";
import { parseCustomId } from "../services/funUi";
import { forfeitTicTacToe, playTicTacToe, ticTacToeGames } from "../services/tictactoe";

const cellButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "fun:ttt:",
  async execute(interaction) {
    const { gameId, value } = parseCustomId(interaction.customId);
    await interaction.update(playTicTacToe(gameId, interaction.user.id, Number(value)));
    ticTacToeGames.attach(gameId, interaction);
  },
};

const forfeitButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "fun:ttt-quit:",
  async execute(interaction) {
    const { gameId } = parseCustomId(interaction.customId);
    await interaction.update(forfeitTicTacToe(gameId, interaction.user.id));
  },
};

export default [cellButton, forfeitButton];
