import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import { localizeChoices, localizeOption, localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { musicActionPayload } from "../services/musicUi";
import { refreshNowPlayingCard } from "../services/nowPlayingCardService";
import { getPlayerOrThrow, requireSameVoiceChannel, resolveMember } from "../services/playerUtils";

const KEY = "music.commands.loop";
const MODES = ["off", "track", "queue"] as const;

type RepeatMode = (typeof MODES)[number];

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY).addStringOption((option) =>
    localizeOption(option, `${KEY}.options.mode`)
      .setRequired(true)
      .addChoices(...localizeChoices(`${KEY}.options.mode`, MODES)),
  ),

  async execute(interaction, client, t) {
    const member = await resolveMember(interaction);
    const player = getPlayerOrThrow(client, interaction.guildId!);
    requireSameVoiceChannel(member, player);

    const mode = interaction.options.getString("mode", true) as RepeatMode;
    await player.setRepeatMode(mode);

    await interaction.reply(
      musicActionPayload(
        interaction.user,
        Emojis.Loop,
        t("music.actions.loop.title"),
        t("music.actions.loop.changed", {
          mode: t(`${KEY}.options.mode.choices.${mode}`),
          user: interaction.user.id,
        }),
      ),
    );
    await refreshNowPlayingCard(client, player);
  },
};

export default command;
