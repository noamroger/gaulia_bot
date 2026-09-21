import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import { infoPayload, successPayload } from "../../../core/ui/containers";
import { localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";

const KEY = "general.commands.ping";

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  guildOnly: false,
  data: localizeSlashCommand(new SlashCommandBuilder(), KEY),

  async execute(interaction, client, t) {
    const sent = await interaction.reply({
      ...infoPayload(true, `### ${Emojis.Loading} ${t("general.ping.calculating")}`),
      withResponse: true,
    });

    const roundTrip =
      (sent.resource?.message?.createdTimestamp ?? Date.now()) - interaction.createdTimestamp;
    const wsLatency = Math.round(client.ws.ping);

    await interaction.editReply(
      successPayload(
        false,
        t("general.ping.title"),
        t("general.ping.latency", { api: roundTrip, gateway: wsLatency }),
      ),
    );
  },
};

export default command;
