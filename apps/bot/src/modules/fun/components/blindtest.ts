import type { ButtonInteraction } from "discord.js";

import { GauliaError } from "../../../core/errors";
import type { ButtonComponent } from "../../../structures/Component";
import { requireBlindtestControl, skipBlindtestRound, stopBlindtest } from "../services/blindtest";
import { parseCustomId } from "../services/funUi";

function controlledSession(interaction: ButtonInteraction) {
  if (!interaction.inCachedGuild()) throw new GauliaError("Ce bouton n'est plus valide.");
  const { gameId } = parseCustomId(interaction.customId);
  if (gameId !== interaction.guildId) throw new GauliaError("Ce bouton n'est plus valide.");
  return requireBlindtestControl(gameId, interaction.member);
}

const skipButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "fun:blindtest-skip:",
  async execute(interaction) {
    const session = controlledSession(interaction);
    await interaction.deferUpdate();
    await skipBlindtestRound(session);
  },
};

const stopButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "fun:blindtest-stop:",
  async execute(interaction) {
    const session = controlledSession(interaction);
    await interaction.deferUpdate();
    await stopBlindtest(session, interaction.user.id);
  },
};

export default [skipButton, stopButton];
