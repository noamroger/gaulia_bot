import type { ButtonInteraction } from "discord.js";

import type { GauliaClient } from "../../../client/GauliaClient";
import { infoPayload } from "../../../core/ui/containers";
import type { Translator } from "../../../i18n";
import type { ButtonComponent, GauliaComponent } from "../../../structures/Component";
import { collectBotInfo } from "../services/botinfo/botStatsService";
import { botInfoView, isBotInfoView, type BotInfoView } from "../services/botinfo/botinfoUi";

/** Buttons carry their owner and their target: `botinfo:<action>:<userId>:<view>`. */
function ownerOf(customId: string): string {
  return customId.split(":")[2] ?? "";
}

/** Tabs were named in French until the English rename: panels posted before it stay usable. */
const LEGACY_VIEWS: Readonly<Record<string, BotInfoView>> = {
  apercu: "overview",
  technique: "technical",
  commandes: "commands",
};

function viewOf(customId: string): BotInfoView {
  const value = customId.split(":")[3] ?? "";
  if (isBotInfoView(value)) return value;
  return LEGACY_VIEWS[value] ?? "overview";
}

/**
 * The message is public: everyone reads it, but only the member who ran the command may switch
 * tabs, otherwise the view would change under the other readers' eyes.
 */
async function render(
  interaction: ButtonInteraction,
  client: GauliaClient,
  t: Translator,
): Promise<void> {
  if (ownerOf(interaction.customId) !== interaction.user.id) {
    await interaction.reply(
      infoPayload(
        true,
        t("general.botinfo.notYours.title"),
        t("general.botinfo.notYours.description"),
      ),
    );
    return;
  }

  await interaction.deferUpdate();
  const snapshot = await collectBotInfo(client);
  await interaction.editReply(
    botInfoView(snapshot, viewOf(interaction.customId), interaction.user.id, t),
  );
}

const viewButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "botinfo:view",
  legacyCustomIdPrefixes: ["botinfo:vue"],
  execute: render,
};

/** Same rendering as the navigation: the button simply recomputes the displayed tab. */
const refreshButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "botinfo:refresh",
  execute: render,
};

const components: GauliaComponent[] = [viewButton, refreshButton];

export default components;
