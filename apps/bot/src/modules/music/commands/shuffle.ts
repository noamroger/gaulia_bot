import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import type { ChatInputCommand } from "../../../structures/Command";
import { interventionOf, musicActionPayload } from "../services/musicUi";
import { refreshNowPlayingCard } from "../services/nowPlayingCardService";
import { isShuffleEnabled, setShuffleEnabled } from "../services/playbackControls";
import { getPlayerOrThrow, requireSameVoiceChannel, resolveMember } from "../services/playerUtils";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("shuffle")
    .setDescription("Active ou désactive la lecture aléatoire"),

  help: {
    details:
      "Active ou désactive la lecture aléatoire, comme le bouton du lecteur. À l'activation, la file d'attente est mélangée sans interrompre le morceau en cours, puis de nouveau à chaque ajout tant que le mode reste actif. Tu dois être dans le même salon vocal que Gaulia.",
    examples: ["shuffle"],
  },

  async execute(interaction, client) {
    const member = await resolveMember(interaction);
    const player = getPlayerOrThrow(client, interaction.guildId!);
    requireSameVoiceChannel(member, player);

    const enabled = !isShuffleEnabled(player);
    await setShuffleEnabled(player, enabled);

    await interaction.reply(
      musicActionPayload(
        interaction.user,
        Emojis.Shuffle,
        "Lecture aléatoire",
        `La lecture aléatoire a été ${enabled ? "activée" : "désactivée"} ${interventionOf(interaction.user)}.`,
      ),
    );
    await refreshNowPlayingCard(client, player);
  },
};

export default command;
