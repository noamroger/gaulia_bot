import { GauliaError } from "../../../core/errors";
import { canModerate } from "../../../core/permissions/hierarchy";
import { successPayload } from "../../../core/ui/containers";
import type { ModalComponent } from "../../../structures/Component";
import { escalationLine, performWarn } from "../services/moderationService";

const component: ModalComponent = {
  type: "modal",
  customIdPrefix: "moderation:warnModal:",

  async execute(interaction) {
    if (!interaction.inGuild() || !interaction.guild) {
      throw new GauliaError("Cette action n'est utilisable qu'en serveur.");
    }

    const targetUserId = interaction.customId.split(":")[2];
    if (!targetUserId) {
      throw new GauliaError("Impossible de déterminer la cible de cet avertissement.");
    }

    const targetUser = await interaction.client.users.fetch(targetUserId).catch(() => null);
    if (!targetUser) {
      throw new GauliaError("Utilisateur introuvable.");
    }

    const moderatorMember = await interaction.guild.members.fetch(interaction.user.id);
    const targetMember = await interaction.guild.members.fetch(targetUserId).catch(() => null);

    if (targetMember) {
      const modCheck = canModerate(moderatorMember, targetMember);
      if (!modCheck.allowed) throw new GauliaError(modCheck.reason!);
    }

    const reason = interaction.fields.getTextInputValue("reason");

    const { moderationCase, escalation } = await performWarn(
      interaction.guild,
      targetUser,
      { id: interaction.user.id, tag: interaction.user.tag },
      reason,
    );

    await interaction.reply(
      successPayload(
        true,
        `Membre averti (cas #${moderationCase.caseNumber})`,
        `**${targetUser.tag}** a été averti.\n**Raison :** ${reason}${escalationLine(escalation)}`,
      ),
    );
  },
};

export default component;
