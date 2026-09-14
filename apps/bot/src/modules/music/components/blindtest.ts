import type { ButtonInteraction } from "discord.js";

import { GauliaError } from "../../../core/errors";
import type { ButtonComponent } from "../../../structures/Component";
import { requireBlindtestControl, skipBlindtestRound, stopBlindtest } from "../services/blindtest";

/** customId `blindtest:<action>:<serveur>` : seul le serveur de la partie est accepté. */
function controlledSession(interaction: ButtonInteraction) {
  if (!interaction.inCachedGuild()) throw new GauliaError("Ce bouton n'est plus valide.");
  const guildId = interaction.customId.split(":")[2];
  if (guildId !== interaction.guildId) throw new GauliaError("Ce bouton n'est plus valide.");
  return requireBlindtestControl(guildId, interaction.member);
}

const skipButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "blindtest:skip:",
  async execute(interaction) {
    const session = controlledSession(interaction);
    await interaction.deferUpdate();
    await skipBlindtestRound(session);
  },
};

const stopButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "blindtest:stop:",
  async execute(interaction) {
    const session = controlledSession(interaction);
    await interaction.deferUpdate();
    await stopBlindtest(session, interaction.user.id);
  },
};

export default [skipButton, stopButton];
