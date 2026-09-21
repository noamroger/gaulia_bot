import { getAdventureCharacter, listAdventureItems, type AdventureClass } from "@gaulia/database";
import type { ButtonInteraction, StringSelectMenuInteraction } from "discord.js";

import { successPayload } from "../../../core/ui/containers";
import type { Translator } from "../../../i18n";
import type { ButtonComponent, StringSelectComponent } from "../../../structures/Component";
import { classDefinition } from "../data/classes";
import { findItem, itemLabel } from "../data/items";
import { findTutorialPage } from "../data/tutorial";
import { assertAdventureAccess } from "../services/access/adventureAccess";
import { requireCharacter, startAdventure } from "../services/character/characterService";
import { grantXp } from "../services/character/progressionService";
import { computeStats } from "../services/character/statsService";
import { runDungeon } from "../services/dungeon/dungeonService";
import { craft } from "../services/economy/craftService";
import { buyItem } from "../services/economy/shopService";
import { acceptTrade, closeTrade } from "../services/economy/tradeService";
import { upgradeItem } from "../services/economy/upgradeService";
import { dispatchGameEvents } from "../services/events/eventDispatcher";
import { explore } from "../services/exploration/exploreService";
import { travelTo } from "../services/exploration/travelService";
import {
  bestHealingItem,
  consumeItem,
  describeInventory,
  equipItem,
  unequipItem,
} from "../services/inventory/inventoryService";
import { checkAchievements } from "../services/progress/achievementService";
import { chapterStatus, sealChapter } from "../services/progress/storyService";
import { forgeView, inventoryView, shopView } from "../ui/economyViews";
import { dungeonResultView, exploreView, travelView } from "../ui/exploreViews";
import { gold } from "../ui/format";
import type { AdventureView } from "../ui/navigation";
import { sealView, storyView } from "../ui/progressViews";
import { renderAdventureView } from "../ui/renderView";
import { tradeClosedView, tradeResultView, upgradeView } from "../ui/tradeViews";
import { tutorialView } from "../ui/tutorialViews";

/** The id carries its owner: `adventure:<action>:<userId>`. */
function ownerOf(customId: string): string {
  return customId.split(":")[2] ?? "";
}

/**
 * Trade buttons carry an offer number rather than an owner (`adventure:trade:<action>:<tradeId>`):
 * the service is the one checking that whoever clicks is actually involved, since both players see
 * the same message.
 */
function tradeIdOf(customId: string): number {
  return Number(customId.split(":")[3] ?? "");
}

/**
 * Guard shared by every component: same channel rules as the commands, and only the owner of the
 * message may act on it (the answer is then a plain ephemeral message, not an error).
 */
async function guard(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  t: Translator,
): Promise<boolean> {
  await assertAdventureAccess(interaction);

  if (ownerOf(interaction.customId) !== interaction.user.id) {
    await interaction.reply(
      successPayload(
        true,
        t("adventure.replies.notYoursTitle"),
        t("adventure.replies.notYoursBody"),
      ),
    );
    return false;
  }
  return true;
}

const exploreButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "adventure:explore",
  async execute(interaction, _client, t) {
    if (!(await guard(interaction, t))) return;

    await interaction.deferUpdate();
    const { character, items } = await requireCharacter(interaction.user.id);
    await interaction.editReply(exploreView(await explore(character, items, t), t));
  },
};

const sealButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "adventure:seal",
  async execute(interaction, _client, t) {
    if (!(await guard(interaction, t))) return;

    await interaction.deferUpdate();
    const { character, items } = await requireCharacter(interaction.user.id);
    const result = await sealChapter(character, items, t);

    await interaction.editReply(storyView(result.character, chapterStatus(result.character, t), t));
    await interaction.followUp(sealView(result, t));
  },
};

const itemSelect: StringSelectComponent = {
  type: "stringSelect",
  customIdPrefix: "adventure:item",
  async execute(interaction, _client, t) {
    if (!(await guard(interaction, t))) return;

    await interaction.deferUpdate();
    const itemId = interaction.values[0] ?? "";
    const { character, items } = await requireCharacter(interaction.user.id);
    const definition = findItem(itemId);

    if (definition?.slot) {
      const worn = items.some((row) => row.itemId === itemId && row.equipped);
      const updated = worn
        ? await unequipItem(character.userId, itemId)
        : await equipItem(character, items, itemId, t);

      await interaction.editReply(inventoryView(character, describeInventory(updated), t));
      return;
    }

    const result = await consumeItem(character, items, itemId, t);
    let current = result.character;
    if (result.xp > 0) current = (await grantXp(current, result.items, result.xp)).character;
    const dispatched = await dispatchGameEvents(
      current,
      result.items,
      [{ type: "POTION", amount: 1 }],
      t,
    );

    await interaction.editReply(
      inventoryView(dispatched.character, describeInventory(result.items), t),
    );
    await interaction.followUp(
      successPayload(
        true,
        t("adventure.replies.usedTitle", { item: itemLabel(t, itemId) }),
        [
          result.healed > 0 ? t("adventure.replies.usedHp", { amount: result.healed }) : null,
          result.energy > 0 ? t("adventure.replies.usedEnergy", { amount: result.energy }) : null,
          result.xp > 0 ? t("adventure.replies.usedXp", { amount: result.xp }) : null,
        ]
          .filter(Boolean)
          .join(" · ") || t("adventure.replies.usedNothing"),
      ),
    );
  },
};

const buySelect: StringSelectComponent = {
  type: "stringSelect",
  customIdPrefix: "adventure:buy",
  async execute(interaction, _client, t) {
    if (!(await guard(interaction, t))) return;

    await interaction.deferUpdate();
    const itemId = interaction.values[0] ?? "";
    const { character, items } = await requireCharacter(interaction.user.id);
    const result = await buyItem(character, items, itemId, 1, t);

    await interaction.editReply(shopView(result.character, t));
    await interaction.followUp(
      successPayload(
        true,
        t("adventure.replies.boughtTitle"),
        [
          t("adventure.replies.boughtOne", {
            item: itemLabel(t, itemId),
            total: gold(t, result.total),
          }),
          t("adventure.replies.purseLeft", { gold: gold(t, result.character.gold) }),
        ].join(" "),
      ),
    );
  },
};

const craftSelect: StringSelectComponent = {
  type: "stringSelect",
  customIdPrefix: "adventure:craft",
  async execute(interaction, _client, t) {
    if (!(await guard(interaction, t))) return;

    await interaction.deferUpdate();
    const recipeId = interaction.values[0] ?? "";
    const { character, items } = await requireCharacter(interaction.user.id);
    const result = await craft(character, items, recipeId, t);

    await interaction.editReply(
      forgeView(result.character, await listAdventureItems(character.userId), t),
    );
    await interaction.followUp(
      successPayload(
        true,
        t("adventure.replies.craftedTitle"),
        t("adventure.replies.craftedLine", {
          quantity: result.recipe.quantity,
          item: itemLabel(t, result.recipe.itemId),
        }),
      ),
    );
  },
};

const tradeAcceptButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "adventure:trade:accept",
  async execute(interaction, _client, t) {
    await assertAdventureAccess(interaction);
    await interaction.deferUpdate();

    const result = await acceptTrade(tradeIdOf(interaction.customId), interaction.user.id, t);
    await interaction.editReply(
      tradeResultView(result.trade, result.initiator, result.target, result.lostUpgrades, t),
    );
  },
};

const tradeDeclineButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "adventure:trade:decline",
  async execute(interaction, _client, t) {
    await assertAdventureAccess(interaction);
    await interaction.deferUpdate();

    const trade = await closeTrade(
      tradeIdOf(interaction.customId),
      interaction.user.id,
      "DECLINED",
    );
    await interaction.editReply(tradeClosedView(trade, "DECLINED", t));
  },
};

const tradeCancelButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "adventure:trade:cancel",
  async execute(interaction, _client, t) {
    await assertAdventureAccess(interaction);
    await interaction.deferUpdate();

    const trade = await closeTrade(
      tradeIdOf(interaction.customId),
      interaction.user.id,
      "CANCELLED",
    );
    await interaction.editReply(tradeClosedView(trade, "CANCELLED", t));
  },
};

/**
 * Navigation: a single component knows how to render every browsable view (`adventure:nav:
 * <userId>:<view>`). Adding a button towards a new view therefore needs no extra component, only an
 * entry in `AdventureView`.
 */
const navButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "adventure:nav",
  async execute(interaction, _client, t) {
    if (!(await guard(interaction, t))) return;

    await interaction.deferUpdate();
    const view = (interaction.customId.split(":")[3] ?? "profile") as AdventureView;
    await interaction.editReply(await renderAdventureView(interaction.user, view, t));
  },
};

/** Travel from the map: the target region is carried by the button id. */
const travelButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "adventure:travel",
  async execute(interaction, _client, t) {
    if (!(await guard(interaction, t))) return;

    await interaction.deferUpdate();
    const zoneId = interaction.customId.split(":")[3] ?? "";
    const { character, items } = await requireCharacter(interaction.user.id);
    const result = await travelTo(character, items, zoneId, t);

    await interaction.editReply(travelView(result.character, result.zone, result.notices, t));
  },
};

/** Quick heal after a fight: drinks the thriftiest potion that covers the damage taken. */
const healButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "adventure:heal",
  async execute(interaction, _client, t) {
    if (!(await guard(interaction, t))) return;

    await interaction.deferUpdate();
    const { character, items } = await requireCharacter(interaction.user.id);
    const missing = computeStats(character, items).maxHp - character.hp;

    const potion = bestHealingItem(items, missing, character.level);
    if (!potion) {
      await interaction.followUp(
        successPayload(
          true,
          t("adventure.replies.noPotionTitle"),
          t("adventure.replies.noPotionBody"),
        ),
      );
      return;
    }

    const result = await consumeItem(character, items, potion.item.id, t);
    const dispatched = await dispatchGameEvents(
      result.character,
      result.items,
      [{ type: "POTION", amount: 1 }],
      t,
    );

    await interaction.editReply(await renderAdventureView(interaction.user, "profile", t));
    await interaction.followUp(
      successPayload(
        true,
        t("adventure.replies.drankTitle", { item: itemLabel(t, potion.item.id) }),
        [t("adventure.replies.healed", { amount: result.healed }), ...dispatched.notices].join(
          "\n",
        ),
      ),
    );
  },
};

/** Dungeon run from its own sheet, without going back through `/adventure dungeon fight:true`. */
const dungeonButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "adventure:dungeon",
  async execute(interaction, _client, t) {
    if (!(await guard(interaction, t))) return;

    await interaction.deferUpdate();
    const { character, items } = await requireCharacter(interaction.user.id);
    await interaction.editReply(dungeonResultView(await runDungeon(character, items, t), t));
  },
};

/** Upgrading from the forge: the chosen piece climbs one tier. */
const upgradeSelect: StringSelectComponent = {
  type: "stringSelect",
  customIdPrefix: "adventure:upgrade",
  async execute(interaction, _client, t) {
    if (!(await guard(interaction, t))) return;

    await interaction.deferUpdate();
    const itemId = interaction.values[0] ?? "";
    const { character, items } = await requireCharacter(interaction.user.id);
    const result = await upgradeItem(character, items, itemId, t);

    await interaction.editReply(await renderAdventureView(interaction.user, "forge", t));
    await interaction.followUp(upgradeView(result.character, result.plan, true, t));
  },
};

/**
 * Tutorial pages. Like the command, these components need no adventurer: the ownership guard is
 * enough, since a newcomer has by definition no character yet.
 */
const tutorialPageButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "adventure:tutorial-page",
  async execute(interaction, _client, t) {
    if (!(await guard(interaction, t))) return;

    await interaction.deferUpdate();
    const page = Number(interaction.customId.split(":")[3] ?? "0");
    const character = await getAdventureCharacter(interaction.user.id);
    await interaction.editReply(tutorialView(interaction.user.id, page, character !== null, t));
  },
};

const tutorialJumpSelect: StringSelectComponent = {
  type: "stringSelect",
  customIdPrefix: "adventure:tutorial-jump",
  async execute(interaction, _client, t) {
    if (!(await guard(interaction, t))) return;

    await interaction.deferUpdate();
    const character = await getAdventureCharacter(interaction.user.id);
    await interaction.editReply(
      tutorialView(
        interaction.user.id,
        findTutorialPage(interaction.values[0] ?? ""),
        character !== null,
        t,
      ),
    );
  },
};

/** Character creation from the tutorial: the class travels inside the button id. */
const tutorialStartButton: ButtonComponent = {
  type: "button",
  customIdPrefix: "adventure:tutorial-start",
  async execute(interaction, _client, t) {
    if (!(await guard(interaction, t))) return;

    await interaction.deferUpdate();
    const characterClass = (interaction.customId.split(":")[3] ?? "GUERRIER") as AdventureClass;
    const created = await startAdventure(
      interaction.user.id,
      interaction.user.username,
      characterClass,
    );
    await checkAchievements(created.character, t);

    await interaction.editReply(await renderAdventureView(interaction.user, "profile", t));
    await interaction.followUp(
      successPayload(
        true,
        t("adventure.replies.startedTitle", { emoji: classDefinition(characterClass).emoji }),
        t("adventure.replies.startedBody"),
      ),
    );
  },
};

export default [
  exploreButton,
  navButton,
  tutorialPageButton,
  tutorialJumpSelect,
  tutorialStartButton,
  travelButton,
  healButton,
  dungeonButton,
  upgradeSelect,
  sealButton,
  itemSelect,
  buySelect,
  craftSelect,
  tradeAcceptButton,
  tradeDeclineButton,
  tradeCancelButton,
];
