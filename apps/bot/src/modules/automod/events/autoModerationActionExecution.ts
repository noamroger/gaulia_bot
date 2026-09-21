import { getOrCreateGuild } from "@gaulia/database";
import { Events, type AutoModerationActionExecution } from "discord.js";

import { Colors, Emojis } from "../../../client/Constants";
import type { GauliaClient } from "../../../client/GauliaClient";
import { buildContainer, toV2Payload } from "../../../core/ui/containers";
import { guildTranslatorFor } from "../../../i18n";
import type { GauliaEvent } from "../../../structures/Event";

const event: GauliaEvent<typeof Events.AutoModerationActionExecution> = {
  name: Events.AutoModerationActionExecution,
  async execute(client: GauliaClient, execution: AutoModerationActionExecution) {
    const guildConfig = await getOrCreateGuild(execution.guild.id);
    if (!guildConfig.automodLogChannelId) return;

    const channel = await execution.guild.channels
      .fetch(guildConfig.automodLogChannelId)
      .catch(() => null);
    if (!channel || !channel.isTextBased() || !("send" in channel)) return;

    // Posted in a log channel read by the staff, so it follows the guild language.
    const t = await guildTranslatorFor(execution.guild.id, execution.guild.preferredLocale);

    const lines = [
      `### ${Emojis.Automod} ${t("automod.native.title")}`,
      t("automod.native.member", { id: execution.userId }),
      t("automod.native.rule", { id: execution.ruleId }),
    ];

    if (execution.matchedKeyword) {
      lines.push(t("automod.native.keyword", { keyword: execution.matchedKeyword }));
    }
    if (execution.channelId) {
      lines.push(t("automod.native.channel", { id: execution.channelId }));
    }

    await channel.send(toV2Payload(false, buildContainer(Colors.Warning, lines)));
  },
};

export default event;
