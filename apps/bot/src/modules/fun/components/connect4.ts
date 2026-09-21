import type { ButtonComponent } from "../../../structures/Component";
import { connect4Games, forfeitConnect4, playConnect4 } from "../services/connect4";
import { parseCustomId } from "../services/funUi";

const columnButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "fun:c4:",
  async execute(interaction, _client, t) {
    const { gameId, value } = parseCustomId(interaction.customId);
    await interaction.update(playConnect4(gameId, interaction.user.id, Number(value), t));
    connect4Games.attach(gameId, interaction);
  },
};

const forfeitButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "fun:c4-quit:",
  async execute(interaction, _client, t) {
    const { gameId } = parseCustomId(interaction.customId);
    await interaction.update(forfeitConnect4(gameId, interaction.user.id, t));
  },
};

export default [columnButton, forfeitButton];
