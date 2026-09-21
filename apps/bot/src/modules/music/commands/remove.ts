import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import { GauliaError } from "../../../core/errors";
import { localizeOption, localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { musicActionPayload, trackLink } from "../services/musicUi";
import { getPlayerOrThrow, requireSameVoiceChannel, resolveMember } from "../services/playerUtils";

const KEY = "music.commands.remove";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY).addIntegerOption((option) =>
    localizeOption(option, `${KEY}.options.position`).setRequired(true).setMinValue(1),
  ),

  async execute(interaction, client, t) {
    const member = await resolveMember(interaction);
    const player = getPlayerOrThrow(client, interaction.guildId!);
    requireSameVoiceChannel(member, player);

    const position = interaction.options.getInteger("position", true);
    const index = position - 1;
    const track = player.queue.tracks[index];

    if (!track) {
      throw new GauliaError("music.error.noTrackAtPosition");
    }

    await player.queue.remove(index);
    await interaction.reply(
      musicActionPayload(
        interaction.user,
        Emojis.Music,
        t("music.actions.remove.title"),
        t("music.actions.remove.removed", {
          track: trackLink(track),
          user: interaction.user.id,
        }),
      ),
    );
  },
};

export default command;
