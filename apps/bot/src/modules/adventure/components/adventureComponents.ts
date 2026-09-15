import { listAdventureItems } from "@gaulia/database";
import type { ButtonInteraction, StringSelectMenuInteraction } from "discord.js";

import { successPayload } from "../../../core/ui/containers";
import type { ButtonComponent, StringSelectComponent } from "../../../structures/Component";
import { findItem, itemLabel } from "../data/items";
import { assertAdventureAccess } from "../services/access/adventureAccess";
import { requireCharacter } from "../services/character/characterService";
import { grantXp } from "../services/character/progressionService";
import { craft } from "../services/economy/craftService";
import { buyItem } from "../services/economy/shopService";
import { dispatchGameEvents } from "../services/events/eventDispatcher";
import { explore } from "../services/exploration/exploreService";
import {
  consumeItem,
  describeInventory,
  equipItem,
  unequipItem,
} from "../services/inventory/inventoryService";
import { acceptTrade, closeTrade } from "../services/economy/tradeService";
import { chapterStatus, sealChapter } from "../services/progress/storyService";
import { forgeView, inventoryView, shopView } from "../ui/economyViews";
import { exploreView } from "../ui/exploreViews";
import { gold } from "../ui/format";
import { sealView, storyView } from "../ui/progressViews";
import { tradeClosedView, tradeResultView } from "../ui/tradeViews";

/** L'identifiant porte son propriétaire : `adventure:<action>:<userId>`. */
function ownerOf(customId: string): string {
  return customId.split(":")[2] ?? "";
}

/**
 * Les boutons d'échange portent un numéro de proposition, pas un propriétaire
 * (`adventure:trade:<action>:<tradeId>`) : c'est le service qui vérifie que celui qui clique est
 * bien concerné, puisque les deux joueurs voient le même message.
 */
function tradeIdOf(customId: string): number {
  return Number(customId.split(":")[3] ?? "");
}

/**
 * Garde commune aux composants : mêmes règles de salon que les commandes, et seul le propriétaire
 * du message peut agir dessus (sinon la réponse est un simple message éphémère, pas une erreur).
 */
async function guard(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
): Promise<boolean> {
  await assertAdventureAccess(interaction);

  if (ownerOf(interaction.customId) !== interaction.user.id) {
    await interaction.reply(
      successPayload(
        true,
        "Ce n'est pas ton aventure",
        "Ce message appartient à un autre aventurier. Lance la tienne avec `/aventure commencer`.",
      ),
    );
    return false;
  }
  return true;
}

const exploreButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "adventure:explore",
  async execute(interaction) {
    if (!(await guard(interaction))) return;

    await interaction.deferUpdate();
    const { character, items } = await requireCharacter(interaction.user.id);
    await interaction.editReply(exploreView(await explore(character, items)));
  },
};

const sealButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "adventure:seal",
  async execute(interaction) {
    if (!(await guard(interaction))) return;

    await interaction.deferUpdate();
    const { character, items } = await requireCharacter(interaction.user.id);
    const result = await sealChapter(character, items);

    await interaction.editReply(storyView(result.character, chapterStatus(result.character)));
    await interaction.followUp(sealView(result));
  },
};

const itemSelect: StringSelectComponent = {
  type: "stringSelect",
  customIdPrefix: "adventure:item",
  async execute(interaction) {
    if (!(await guard(interaction))) return;

    await interaction.deferUpdate();
    const itemId = interaction.values[0] ?? "";
    const { character, items } = await requireCharacter(interaction.user.id);
    const definition = findItem(itemId);

    if (definition?.slot) {
      const worn = items.some((row) => row.itemId === itemId && row.equipped);
      const updated = worn
        ? await unequipItem(character.userId, itemId)
        : await equipItem(character, items, itemId);

      await interaction.editReply(inventoryView(character, describeInventory(updated)));
      return;
    }

    const result = await consumeItem(character, items, itemId);
    let current = result.character;
    if (result.xp > 0) current = (await grantXp(current, result.items, result.xp)).character;
    const dispatched = await dispatchGameEvents(current, result.items, [
      { type: "POTION", amount: 1 },
    ]);

    await interaction.editReply(
      inventoryView(dispatched.character, describeInventory(result.items)),
    );
    await interaction.followUp(
      successPayload(
        true,
        `${itemLabel(itemId)} utilisé`,
        [
          result.healed > 0 ? `❤️ +${result.healed} PV` : null,
          result.energy > 0 ? `⚡ +${result.energy} énergie` : null,
          result.xp > 0 ? `✨ +${result.xp} XP` : null,
        ]
          .filter(Boolean)
          .join(" · ") || "Aucun effet : tout était déjà au maximum.",
      ),
    );
  },
};

const buySelect: StringSelectComponent = {
  type: "stringSelect",
  customIdPrefix: "adventure:buy",
  async execute(interaction) {
    if (!(await guard(interaction))) return;

    await interaction.deferUpdate();
    const itemId = interaction.values[0] ?? "";
    const { character, items } = await requireCharacter(interaction.user.id);
    const result = await buyItem(character, items, itemId, 1);

    await interaction.editReply(shopView(result.character));
    await interaction.followUp(
      successPayload(
        true,
        "Achat conclu",
        `${itemLabel(itemId)} pour ${gold(result.total)}. Il te reste ${gold(result.character.gold)}.`,
      ),
    );
  },
};

const craftSelect: StringSelectComponent = {
  type: "stringSelect",
  customIdPrefix: "adventure:craft",
  async execute(interaction) {
    if (!(await guard(interaction))) return;

    await interaction.deferUpdate();
    const recipeId = interaction.values[0] ?? "";
    const { character, items } = await requireCharacter(interaction.user.id);
    const result = await craft(character, items, recipeId);

    await interaction.editReply(
      forgeView(result.character, await listAdventureItems(character.userId)),
    );
    await interaction.followUp(
      successPayload(
        true,
        "Forge terminée",
        `${result.recipe.quantity} × ${itemLabel(result.recipe.itemId)} sort de l'enclume.`,
      ),
    );
  },
};

const tradeAcceptButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "adventure:trade:accept",
  async execute(interaction) {
    await assertAdventureAccess(interaction);
    await interaction.deferUpdate();

    const result = await acceptTrade(tradeIdOf(interaction.customId), interaction.user.id);
    await interaction.editReply(
      tradeResultView(result.trade, result.initiator, result.target, result.lostUpgrades),
    );
  },
};

const tradeDeclineButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "adventure:trade:decline",
  async execute(interaction) {
    await assertAdventureAccess(interaction);
    await interaction.deferUpdate();

    const trade = await closeTrade(
      tradeIdOf(interaction.customId),
      interaction.user.id,
      "DECLINED",
    );
    await interaction.editReply(tradeClosedView(trade, "DECLINED"));
  },
};

const tradeCancelButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "adventure:trade:cancel",
  async execute(interaction) {
    await assertAdventureAccess(interaction);
    await interaction.deferUpdate();

    const trade = await closeTrade(
      tradeIdOf(interaction.customId),
      interaction.user.id,
      "CANCELLED",
    );
    await interaction.editReply(tradeClosedView(trade, "CANCELLED"));
  },
};

export default [
  exploreButton,
  sealButton,
  itemSelect,
  buySelect,
  craftSelect,
  tradeAcceptButton,
  tradeDeclineButton,
  tradeCancelButton,
];
