import { SlashCommandBuilder } from "discord.js";

import { Emojis } from "../../../client/Constants";
import { GauliaError } from "../../../core/errors";
import type { ChatInputCommand } from "../../../structures/Command";
import { formatTrackTime, interventionOf, musicActionPayload } from "../services/musicUi";
import { getPlayerOrThrow, requireSameVoiceChannel, resolveMember } from "../services/playerUtils";

function parseTimeToMs(input: string): number {
  const parts = input.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) {
    throw new GauliaError("Format invalide. Utilise `mm:ss` ou un nombre de secondes.");
  }

  if (parts.length === 1) return parts[0]! * 1000;
  if (parts.length === 2) return (parts[0]! * 60 + parts[1]!) * 1000;
  if (parts.length === 3) return (parts[0]! * 3600 + parts[1]! * 60 + parts[2]!) * 1000;

  throw new GauliaError("Format invalide. Utilise `mm:ss` ou un nombre de secondes.");
}

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("seek")
    .setDescription("Avance ou recule dans le morceau en cours")
    .addStringOption((option) =>
      option.setName("position").setDescription("Ex: 1:30 ou 90").setRequired(true),
    ),

  help: {
    details:
      "Déplace la lecture du morceau en cours à la position indiquée. Formats acceptés : secondes (`90`), `mm:ss` (`1:30`) ou `hh:mm:ss`. Tu dois être dans le même salon vocal que Gaulia.",
    examples: ["seek position:1:30", "seek position:90"],
  },

  async execute(interaction, client) {
    const member = await resolveMember(interaction);
    const player = getPlayerOrThrow(client, interaction.guildId!);
    requireSameVoiceChannel(member, player);

    if (!player.queue.current) {
      throw new GauliaError("Rien n'est en cours de lecture.");
    }

    const positionMs = parseTimeToMs(interaction.options.getString("position", true));
    await player.seek(positionMs);

    await interaction.reply(
      musicActionPayload(
        interaction.user,
        Emojis.Skip,
        "Position de la musique",
        `La lecture reprend à \`${formatTrackTime(positionMs)}\` ${interventionOf(interaction.user)}.`,
      ),
    );
  },
};

export default command;
