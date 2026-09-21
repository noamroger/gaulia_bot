import { SlashCommandBuilder } from "discord.js";

import { Emojis, FREE_QUEUE_LIMIT, PREMIUM_QUEUE_LIMIT } from "../../../client/Constants";
import { GauliaError } from "../../../core/errors";
import { localizeOption, localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { isPremiumGuild } from "../../premium/services/entitlementService";
import { musicActionPayload, trackLink } from "../services/musicUi";
import { isShuffleEnabled } from "../services/playbackControls";
import {
  getOrCreateConfiguredPlayer,
  requireVoiceChannelId,
  resolveMember,
} from "../services/playerUtils";

const KEY = "music.commands.play";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: true,
  cooldownSeconds: 2,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY).addStringOption((option) =>
    localizeOption(option, `${KEY}.options.query`).setRequired(true),
  ),

  async execute(interaction, client, t) {
    const member = await resolveMember(interaction);
    const voiceChannelId = requireVoiceChannelId(member);
    const query = interaction.options.getString("query", true);
    const guildId = interaction.guildId!;

    await interaction.deferReply();

    const player = await getOrCreateConfiguredPlayer(client, {
      guildId,
      voiceChannelId,
      textChannelId: interaction.channelId,
    });

    if (!player.connected) {
      await player.connect();
    }

    // YouTube blocks server side playback (403 / "confirm you're not a bot") without an account.
    const result = await player.search({ query, source: "scsearch" }, interaction.user);

    if (!result.tracks.length) {
      throw new GauliaError("music.error.noResult");
    }

    const limit = isPremiumGuild(guildId) ? PREMIUM_QUEUE_LIMIT : FREE_QUEUE_LIMIT;
    if (player.queue.tracks.length >= limit) {
      throw new GauliaError("music.error.queueFull", { limit });
    }

    if (result.loadType === "playlist") {
      await player.queue.add(result.tracks);
      await interaction.editReply(
        musicActionPayload(
          interaction.user,
          Emojis.Music,
          t("music.actions.play.playlistTitle"),
          t("music.actions.play.playlistAdded", {
            count: result.tracks.length,
            playlist: result.playlist?.name ?? t("music.actions.play.unnamedPlaylist"),
            user: interaction.user.id,
          }),
        ),
      );
    } else {
      const track = result.tracks[0]!;
      await player.queue.add(track);
      await interaction.editReply(
        musicActionPayload(
          interaction.user,
          Emojis.Music,
          t("music.actions.play.trackTitle"),
          t("music.actions.play.trackAdded", {
            track: trackLink(track),
            user: interaction.user.id,
          }),
        ),
      );
    }

    if (isShuffleEnabled(player)) {
      await player.queue.shuffle();
    }

    if (!player.playing && !player.paused) {
      await player.play();
    }
  },
};

export default command;
