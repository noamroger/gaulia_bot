import { GauliaError } from "../../../core/errors";
import type {
  ButtonComponent,
  ModalComponent,
  StringSelectComponent,
} from "../../../structures/Component";
import { MODAL_INPUT_ID, parseCustomId } from "../services/funUi";
import {
  forfeitHangman,
  guessHangmanLetter,
  guessHangmanWord,
  hangmanGames,
  hangmanWordModal,
  requireHangmanPlayer,
} from "../services/hangman";

const letterSelect: StringSelectComponent = {
  type: "stringSelect",
  customIdPrefix: "fun:hangman-letter:",
  async execute(interaction) {
    const { gameId } = parseCustomId(interaction.customId);
    const letter = interaction.values[0] ?? "";
    await interaction.update(guessHangmanLetter(gameId, interaction.user.id, letter));
    hangmanGames.attach(gameId, interaction);
  },
};

const wordButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "fun:hangman-word:",
  async execute(interaction) {
    const { gameId } = parseCustomId(interaction.customId);
    requireHangmanPlayer(gameId, interaction.user.id);
    await interaction.showModal(hangmanWordModal(gameId));
  },
};

const wordModal: ModalComponent = {
  type: "modal",
  customIdPrefix: "fun:hangman-solve:",
  async execute(interaction) {
    if (!interaction.isFromMessage()) throw new GauliaError("Cette partie n'est plus disponible.");
    const { gameId } = parseCustomId(interaction.customId);
    const word = interaction.fields.getTextInputValue(MODAL_INPUT_ID);
    await interaction.update(guessHangmanWord(gameId, interaction.user.id, word));
    hangmanGames.attach(gameId, interaction);
  },
};

const forfeitButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "fun:hangman-quit:",
  async execute(interaction) {
    const { gameId } = parseCustomId(interaction.customId);
    await interaction.update(forfeitHangman(gameId, interaction.user.id));
  },
};

export default [letterSelect, wordButton, wordModal, forfeitButton];
