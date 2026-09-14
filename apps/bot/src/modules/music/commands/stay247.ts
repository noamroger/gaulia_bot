import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import type { ChatInputCommand } from "../../../structures/Command";
import { getMusicSettings, updateMusicSettings } from "@gaulia/database";
import { clearIdleTimer } from "../services/idleTimers";
import { interventionOf, musicActionPayload } from "../services/musicUi";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  premiumOnly: true,
  data: new SlashCommandBuilder()
    .setName("247")
    .setDescription("[Premium] Active ou désactive le mode 24/7 (le bot reste connecté en vocal)"),

  help: {
    details:
      "Active ou désactive le mode 24/7 à chaque utilisation. Quand il est actif, Gaulia reste dans le salon vocal même lorsque la file est vide, au lieu de se déconnecter après une période d'inactivité. Le réglage est conservé pour le serveur.",
    examples: ["247"],
  },

  async execute(interaction) {
    const guildId = interaction.guildId!;
    const settings = await getMusicSettings(guildId);
    const enabled = !settings.stay247;

    await updateMusicSettings(guildId, { stay247: enabled });

    if (!enabled) {
      clearIdleTimer(guildId);
    }

    await interaction.reply(
      musicActionPayload(
        interaction.user,
        Emojis.Music,
        "Mode 24/7",
        enabled
          ? `Le mode 24/7 a été activé ${interventionOf(interaction.user)} : Gaulia reste connecté en vocal même si la file est vide.`
          : `Le mode 24/7 a été désactivé ${interventionOf(interaction.user)} : Gaulia se déconnectera après une période d'inactivité.`,
      ),
    );
  },
};

export default command;
