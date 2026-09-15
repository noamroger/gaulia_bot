import type { ButtonInteraction } from "discord.js";

import type { GauliaClient } from "../../../client/GauliaClient";
import { infoPayload } from "../../../core/ui/containers";
import type { ButtonComponent, GauliaComponent } from "../../../structures/Component";
import { collectBotInfo } from "../services/botinfo/botStatsService";
import { botInfoView, isBotInfoView, type BotInfoView } from "../services/botinfo/botinfoUi";

/** Les boutons portent leur propriétaire et leur cible : `botinfo:<action>:<userId>:<vue>`. */
function ownerOf(customId: string): string {
  return customId.split(":")[2] ?? "";
}

function viewOf(customId: string): BotInfoView {
  const value = customId.split(":")[3] ?? "";
  return isBotInfoView(value) ? value : "apercu";
}

/**
 * Le message est public : tout le monde le lit, mais seul l'auteur de la commande peut changer
 * d'onglet, sinon la vue changerait sous les yeux des autres lecteurs.
 */
async function render(interaction: ButtonInteraction, client: GauliaClient): Promise<void> {
  if (ownerOf(interaction.customId) !== interaction.user.id) {
    await interaction.reply(
      infoPayload(
        true,
        "Ce panneau appartient à quelqu'un d'autre",
        "Lance `/botinfo` pour naviguer dans ta propre fiche.",
      ),
    );
    return;
  }

  await interaction.deferUpdate();
  const snapshot = await collectBotInfo(client);
  await interaction.editReply(
    botInfoView(snapshot, viewOf(interaction.customId), interaction.user.id),
  );
}

const viewButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "botinfo:vue",
  execute: render,
};

/** Même rendu que la navigation : le bouton recalcule simplement l'onglet affiché. */
const refreshButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "botinfo:refresh",
  execute: render,
};

const components: GauliaComponent[] = [viewButton, refreshButton];

export default components;
