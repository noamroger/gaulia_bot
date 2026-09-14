import {
  AutoModerationActionType,
  AutoModerationRuleEventType,
  AutoModerationRuleKeywordPresetType,
  AutoModerationRuleTriggerType,
  type AutoModerationRule,
  type Guild,
} from "discord.js";

import { GauliaError } from "../../../core/errors";

/** Préfixe utilisé pour identifier les règles créées par Gaulia parmi celles du serveur. */
export const GAULIA_RULE_PREFIX = "[Gaulia]";

/**
 * Crée un jeu de règles AutoMod natives de base : anti-spam, anti mention-spam et un filtre de
 * mots-clés (presets Discord : contenu injurieux, sexuel, insultes). Toutes bloquent le message.
 */
export async function setupBaselineRules(
  guild: Guild,
  moderatorTag: string,
): Promise<AutoModerationRule[]> {
  const existingRules = await guild.autoModerationRules.fetch();
  const alreadyConfigured = existingRules.some((rule) => rule.name.startsWith(GAULIA_RULE_PREFIX));

  if (alreadyConfigured) {
    throw new GauliaError(
      "Des règles Gaulia existent déjà sur ce serveur. Utilise `/automod rules` pour les consulter.",
    );
  }

  const reason = `Configuré par ${moderatorTag} via /automod setup`;

  const spamRule = await guild.autoModerationRules.create({
    name: `${GAULIA_RULE_PREFIX} Anti-spam`,
    eventType: AutoModerationRuleEventType.MessageSend,
    triggerType: AutoModerationRuleTriggerType.Spam,
    actions: [{ type: AutoModerationActionType.BlockMessage }],
    enabled: true,
    reason,
  });

  const mentionSpamRule = await guild.autoModerationRules.create({
    name: `${GAULIA_RULE_PREFIX} Anti mention-spam`,
    eventType: AutoModerationRuleEventType.MessageSend,
    triggerType: AutoModerationRuleTriggerType.MentionSpam,
    triggerMetadata: { mentionTotalLimit: 5 },
    actions: [{ type: AutoModerationActionType.BlockMessage }],
    enabled: true,
    reason,
  });

  const keywordPresetRule = await guild.autoModerationRules.create({
    name: `${GAULIA_RULE_PREFIX} Mots interdits`,
    eventType: AutoModerationRuleEventType.MessageSend,
    triggerType: AutoModerationRuleTriggerType.KeywordPreset,
    triggerMetadata: {
      presets: [
        AutoModerationRuleKeywordPresetType.Profanity,
        AutoModerationRuleKeywordPresetType.SexualContent,
        AutoModerationRuleKeywordPresetType.Slurs,
      ],
    },
    actions: [{ type: AutoModerationActionType.BlockMessage }],
    enabled: true,
    reason,
  });

  return [spamRule, mentionSpamRule, keywordPresetRule];
}

export async function listRules(guild: Guild): Promise<AutoModerationRule[]> {
  const rules = await guild.autoModerationRules.fetch();
  return [...rules.values()];
}

export async function deleteRule(guild: Guild, ruleId: string): Promise<void> {
  const rule = await guild.autoModerationRules.fetch(ruleId).catch(() => null);
  if (!rule) {
    throw new GauliaError("Règle introuvable.");
  }
  await rule.delete();
}

export async function toggleRule(
  guild: Guild,
  ruleId: string,
  enabled: boolean,
): Promise<AutoModerationRule> {
  const rule = await guild.autoModerationRules.fetch(ruleId).catch(() => null);
  if (!rule) {
    throw new GauliaError("Règle introuvable.");
  }
  return rule.setEnabled(enabled);
}
