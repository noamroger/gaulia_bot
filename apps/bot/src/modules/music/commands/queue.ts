import { SlashCommandBuilder } from "discord.js";

import { Colors, Emojis } from "../../../client/Constants";
import { buildContainer, toV2Payload } from "../../../core/ui/containers";
import { localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { getPlayerOrThrow } from "../services/playerUtils";

const KEY = "music.commands.queue";
const PREVIEW_SIZE = 10;

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY),

  async execute(interaction, client, t) {
    const player = getPlayerOrThrow(client, interaction.guildId!);
    const current = player.queue.current;
    const upcoming = player.queue.tracks.slice(0, PREVIEW_SIZE);

    const lines = [`### ${Emojis.Music} ${t("music.actions.queue.title")}`];
    lines.push(
      current
        ? t("music.actions.queue.current", { title: current.info.title })
        : t("music.actions.queue.nothingPlaying"),
    );

    if (upcoming.length === 0) {
      lines.push(t("music.actions.queue.empty"));
    } else {
      lines.push(
        upcoming
          .map((track, index) =>
            t("music.actions.queue.entry", { position: index + 1, title: track.info.title }),
          )
          .join("\n"),
      );
      if (player.queue.tracks.length > upcoming.length) {
        lines.push(
          t("music.actions.queue.more", { count: player.queue.tracks.length - upcoming.length }),
        );
      }
    }

    await interaction.reply(toV2Payload(false, buildContainer(Colors.Music, lines)));
  },
};

export default command;
