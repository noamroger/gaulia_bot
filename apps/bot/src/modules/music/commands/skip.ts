import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import { GauliaError } from "../../../core/errors";
import { localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { musicActionPayload, trackLink } from "../services/musicUi";
import { getPlayerOrThrow, requireSameVoiceChannel, resolveMember } from "../services/playerUtils";

const KEY = "music.commands.skip";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY),

  async execute(interaction, client, t) {
    const member = await resolveMember(interaction);
    const player = getPlayerOrThrow(client, interaction.guildId!);
    requireSameVoiceChannel(member, player);

    if (player.queue.tracks.length === 0) {
      throw new GauliaError("music.error.noNextTrack");
    }

    const skipped = player.queue.current;
    await player.skip();

    await interaction.reply(
      musicActionPayload(
        interaction.user,
        Emojis.Skip,
        t("music.actions.skip.title"),
        t("music.actions.skip.skipped", {
          track: skipped ? trackLink(skipped) : t("music.actions.skip.unnamedTrack"),
          user: interaction.user.id,
        }),
      ),
    );
  },
};

export default command;
