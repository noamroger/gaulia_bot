import { GauliaError } from "../../../core/errors";
import type { ButtonComponent, ModalComponent } from "../../../structures/Component";
import { MODAL_INPUT_ID, parseCustomId } from "../services/funUi";
import {
  forfeitWordle,
  guessWordle,
  requireWordlePlayer,
  wordleGames,
  wordleModal,
} from "../services/wordle";

const openButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "fun:wordle-open:",
  async execute(interaction, _client, t) {
    const { gameId } = parseCustomId(interaction.customId);
    requireWordlePlayer(gameId, interaction.user.id);
    await interaction.showModal(wordleModal(gameId, t));
  },
};

const guessModal: ModalComponent = {
  type: "modal",
  customIdPrefix: "fun:wordle-guess:",
  async execute(interaction, _client, t) {
    if (!interaction.isFromMessage()) throw new GauliaError("fun.error.gameOver");
    const { gameId } = parseCustomId(interaction.customId);
    const guess = interaction.fields.getTextInputValue(MODAL_INPUT_ID);
    await interaction.update(guessWordle(gameId, interaction.user.id, guess, t));
    wordleGames.attach(gameId, interaction);
  },
};

const forfeitButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "fun:wordle-quit:",
  async execute(interaction, _client, t) {
    const { gameId } = parseCustomId(interaction.customId);
    await interaction.update(forfeitWordle(gameId, interaction.user.id, t));
  },
};

export default [openButton, guessModal, forfeitButton];
