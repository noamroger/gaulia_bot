import { Events, type AutoModerationActionExecution } from "discord.js";

import { Colors, Emojis } from "../../../client/Constants";
import type { GauliaClient } from "../../../client/GauliaClient";
import { buildContainer, toV2Payload } from "../../../core/ui/containers";
import { getOrCreateGuild } from "@gaulia/database";
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

    const lines = [
      `### ${Emojis.Automod} AutoMod natif déclenché`,
      `**Membre :** <@${execution.userId}>`,
      `**Règle :** \`${execution.ruleId}\``,
    ];

    if (execution.matchedKeyword) lines.push(`**Mot détecté :** ${execution.matchedKeyword}`);
    if (execution.channelId) lines.push(`**Salon :** <#${execution.channelId}>`);

    await channel.send(toV2Payload(false, buildContainer(Colors.Warning, lines)));
  },
};

export default event;
