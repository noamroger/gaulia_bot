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
  async execute(interaction) {
    const { gameId } = parseCustomId(interaction.customId);
    requireWordlePlayer(gameId, interaction.user.id);
    await interaction.showModal(wordleModal(gameId));
  },
};

const guessModal: ModalComponent = {
  type: "modal",
  customIdPrefix: "fun:wordle-guess:",
  async execute(interaction) {
    if (!interaction.isFromMessage()) throw new GauliaError("Cette partie n'est plus disponible.");
    const { gameId } = parseCustomId(interaction.customId);
    const guess = interaction.fields.getTextInputValue(MODAL_INPUT_ID);
    await interaction.update(guessWordle(gameId, interaction.user.id, guess));
    wordleGames.attach(gameId, interaction);
  },
};

const forfeitButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "fun:wordle-quit:",
  async execute(interaction) {
    const { gameId } = parseCustomId(interaction.customId);
    await interaction.update(forfeitWordle(gameId, interaction.user.id));
  },
};

export default [openButton, guessModal, forfeitButton];
