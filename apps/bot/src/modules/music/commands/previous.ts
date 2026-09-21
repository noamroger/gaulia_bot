import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import { GauliaError } from "../../../core/errors";
import { localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { musicActionPayload, trackLink } from "../services/musicUi";
import { getPlayerOrThrow, requireSameVoiceChannel, resolveMember } from "../services/playerUtils";

const KEY = "music.commands.previous";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY),

  async execute(interaction, client, t) {
    const member = await resolveMember(interaction);
    const player = getPlayerOrThrow(client, interaction.guildId!);
    requireSameVoiceChannel(member, player);

    const previous = player.queue.previous.at(0);
    if (!previous) {
      throw new GauliaError("music.error.noPreviousTrack");
    }

    await player.play({ track: previous });
    await interaction.reply(
      musicActionPayload(
        interaction.user,
        Emojis.Back,
        t("music.actions.previous.title"),
        t("music.actions.previous.playing", {
          track: trackLink(previous),
          user: interaction.user.id,
        }),
      ),
    );
  },
};

export default command;
