import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

import { GauliaError } from "../../../core/errors";
import { canBotModerate, canModerate } from "../../../core/permissions/hierarchy";
import { PermissionLevel } from "../../../core/permissions/permissionLevel";
import { successPayload } from "../../../core/ui/containers";
import { formatDurationMs, parseDurationMs } from "../../../core/utils/duration";
import type { ChatInputCommand } from "../../../structures/Command";
import { notifyTarget, recordCase } from "../services/moderationService";

const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000;

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  permissionLevel: PermissionLevel.Moderator,
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Met un membre en sourdine temporairement")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option.setName("utilisateur").setDescription("Membre à mettre en sourdine").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("duree").setDescription("Ex: 10m, 2h, 1d (max 28j)").setRequired(true),
    )
    .addStringOption((option) => option.setName("raison").setDescription("Raison")),

  help: {
    details:
      "Empêche un membre d'écrire, de réagir et de parler en vocal pendant la durée indiquée, de 1 seconde à 28 jours. Formats acceptés : un nombre de secondes (`90`) ou une valeur suivie de `s`, `m`, `h` ou `d` (`30s`, `10m`, `2h`, `1d`). Un cas de modération est créé et le membre est prévenu en message privé si l'option est activée.",
    examples: [
      "timeout utilisateur:@Pseudo duree:10m raison:Flood",
      "timeout utilisateur:@Pseudo duree:1d",
    ],
  },

  async execute(interaction) {
    const guild = interaction.guild!;
    const targetUser = interaction.options.getUser("utilisateur", true);
    const reason = interaction.options.getString("raison") ?? undefined;
    const durationMs = parseDurationMs(interaction.options.getString("duree", true));

    if (durationMs <= 0 || durationMs > MAX_TIMEOUT_MS) {
      throw new GauliaError("La durée doit être comprise entre 1 seconde et 28 jours.");
    }

    const moderatorMember = await guild.members.fetch(interaction.user.id);
    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      throw new GauliaError("Ce membre n'est pas sur le serveur.");
    }

    const modCheck = canModerate(moderatorMember, targetMember);
    if (!modCheck.allowed) throw new GauliaError(modCheck.reason!);

    const botMember = await guild.members.fetchMe();
    const botCheck = canBotModerate(botMember, targetMember);
    if (!botCheck.allowed) throw new GauliaError(botCheck.reason!);

    await targetMember.timeout(durationMs, reason ?? `Modérateur : ${interaction.user.tag}`);
    await notifyTarget(guild, targetUser, "TIMEOUT", reason);

    const moderationCase = await recordCase({
      guild,
      type: "TIMEOUT",
      target: { id: targetUser.id, tag: targetUser.tag },
      moderator: { id: interaction.user.id, tag: interaction.user.tag },
      reason,
      durationSecs: Math.round(durationMs / 1000),
    });

    await interaction.reply(
      successPayload(
        false,
        `Membre mis en sourdine (cas #${moderationCase.caseNumber})`,
        `**${targetUser.tag}** est en sourdine pour **${formatDurationMs(durationMs)}**.${reason ? `\n**Raison :** ${reason}` : ""}`,
      ),
    );
  },
};

export default command;
