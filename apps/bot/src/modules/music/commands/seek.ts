import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import { GauliaError } from "../../../core/errors";
import { localizeOption, localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { formatClockTime, musicActionPayload } from "../services/musicUi";
import { getPlayerOrThrow, requireSameVoiceChannel, resolveMember } from "../services/playerUtils";

const KEY = "music.commands.seek";

/** Accepts a bare number of seconds, `mm:ss` or `hh:mm:ss`. */
function parseTimeToMs(input: string): number {
  const parts = input.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) {
    throw new GauliaError("music.error.invalidPosition");
  }

  if (parts.length === 1) return parts[0]! * 1000;
  if (parts.length === 2) return (parts[0]! * 60 + parts[1]!) * 1000;
  if (parts.length === 3) return (parts[0]! * 3600 + parts[1]! * 60 + parts[2]!) * 1000;

  throw new GauliaError("music.error.invalidPosition");
}

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY).addStringOption((option) =>
    localizeOption(option, `${KEY}.options.position`).setRequired(true),
  ),

  async execute(interaction, client, t) {
    const member = await resolveMember(interaction);
    const player = getPlayerOrThrow(client, interaction.guildId!);
    requireSameVoiceChannel(member, player);

    if (!player.queue.current) {
      throw new GauliaError("music.error.nothingPlaying");
    }

    const positionMs = parseTimeToMs(interaction.options.getString("position", true));
    await player.seek(positionMs);

    await interaction.reply(
      musicActionPayload(
        interaction.user,
        Emojis.Skip,
        t("music.actions.seek.title"),
        t("music.actions.seek.moved", {
          position: formatClockTime(positionMs),
          user: interaction.user.id,
        }),
      ),
    );
  },
};

export default command;
