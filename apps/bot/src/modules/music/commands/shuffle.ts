import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import { localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { musicActionPayload } from "../services/musicUi";
import { refreshNowPlayingCard } from "../services/nowPlayingCardService";
import { isShuffleEnabled, setShuffleEnabled } from "../services/playbackControls";
import { getPlayerOrThrow, requireSameVoiceChannel, resolveMember } from "../services/playerUtils";

const KEY = "music.commands.shuffle";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY),

  async execute(interaction, client, t) {
    const member = await resolveMember(interaction);
    const player = getPlayerOrThrow(client, interaction.guildId!);
    requireSameVoiceChannel(member, player);

    const enabled = !isShuffleEnabled(player);
    await setShuffleEnabled(player, enabled);

    await interaction.reply(
      musicActionPayload(
        interaction.user,
        Emojis.Shuffle,
        t("music.actions.shuffle.title"),
        t(enabled ? "music.actions.shuffle.enabled" : "music.actions.shuffle.disabled", {
          user: interaction.user.id,
        }),
      ),
    );
    await refreshNowPlayingCard(client, player);
  },
};

export default command;
