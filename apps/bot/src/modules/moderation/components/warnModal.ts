import { GauliaError } from "../../../core/errors";
import { canModerate } from "../../../core/permissions/hierarchy";
import { successPayload } from "../../../core/ui/containers";
import type { ModalComponent } from "../../../structures/Component";
import { escalationLine, performWarn } from "../services/moderationService";

const component: ModalComponent = {
  type: "modal",
  customIdPrefix: "moderation:warnModal:",

  async execute(interaction, _client, t) {
    if (!interaction.inGuild() || !interaction.guild) {
      throw new GauliaError("moderation.errors.guildOnly");
    }

    const targetUserId = interaction.customId.split(":")[2];
    if (!targetUserId) {
      throw new GauliaError("moderation.errors.unknownTarget");
    }

    const targetUser = await interaction.client.users.fetch(targetUserId).catch(() => null);
    if (!targetUser) {
      throw new GauliaError("moderation.errors.userNotFound");
    }

    const moderatorMember = await interaction.guild.members.fetch(interaction.user.id);
    const targetMember = await interaction.guild.members.fetch(targetUserId).catch(() => null);

    if (targetMember) {
      const modCheck = canModerate(moderatorMember, targetMember);
      if (!modCheck.allowed) throw new GauliaError(modCheck.reasonKey!);
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
        t("moderation.warn.title", { case: moderationCase.caseNumber }),
        [
          t("moderation.warn.description", { target: targetUser.tag }),
          t("moderation.case.reason", { reason }),
        ].join("\n") + escalationLine(escalation, t),
      ),
    );
  },
};

export default component;
