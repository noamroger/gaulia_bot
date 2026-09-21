import { SlashCommandBuilder } from "discord.js";

import { GauliaError } from "../../../core/errors";
import { toV2Payload } from "../../../core/ui/containers";
import { localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { buildTrackContainer, formatClockTime } from "../services/musicUi";
import { getPlayerOrThrow } from "../services/playerUtils";

const KEY = "music.commands.nowplaying";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY),

  async execute(interaction, client, t) {
    const player = getPlayerOrThrow(client, interaction.guildId!);
    const track = player.queue.current;

    if (!track) {
      throw new GauliaError("music.error.nothingPlaying");
    }

    const position = t(
      player.paused
        ? "music.actions.nowplaying.positionPaused"
        : "music.actions.nowplaying.position",
      { position: formatClockTime(player.position) },
    );

    await interaction.reply(
      toV2Payload(false, buildTrackContainer(t, t("music.ui.nowPlayingTitle"), track, [position])),
    );
  },
};

export default command;
