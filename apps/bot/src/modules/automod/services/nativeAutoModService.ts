import {
  AutoModerationActionType,
  AutoModerationRuleEventType,
  AutoModerationRuleKeywordPresetType,
  AutoModerationRuleTriggerType,
  type AutoModerationRule,
  type Guild,
} from "discord.js";

import { GauliaError } from "../../../core/errors";
import { guildTranslatorFor } from "../../../i18n";

/** Prefix marking the rules created by Gaulia among the ones of the server. */
export const GAULIA_RULE_PREFIX = "[Gaulia]";

/**
 * Creates a baseline set of native AutoMod rules: anti-spam, anti mention-spam and a keyword filter
 * (Discord presets: profanity, sexual content, slurs). All of them block the message.
 * Rule names and the audit reason stay in the guild settings, so they follow the guild language.
 */
export async function setupBaselineRules(
  guild: Guild,
  moderatorTag: string,
): Promise<AutoModerationRule[]> {
  const existingRules = await guild.autoModerationRules.fetch();
  const alreadyConfigured = existingRules.some((rule) => rule.name.startsWith(GAULIA_RULE_PREFIX));

  if (alreadyConfigured) {
    throw new GauliaError("automod.errors.alreadyConfigured");
  }

  const t = await guildTranslatorFor(guild.id, guild.preferredLocale);
  const reason = t("automod.setup.auditReason", { moderator: moderatorTag });

  const spamRule = await guild.autoModerationRules.create({
    name: `${GAULIA_RULE_PREFIX} ${t("automod.rules.names.spam")}`,
    eventType: AutoModerationRuleEventType.MessageSend,
    triggerType: AutoModerationRuleTriggerType.Spam,
    actions: [{ type: AutoModerationActionType.BlockMessage }],
    enabled: true,
    reason,
  });

  const mentionSpamRule = await guild.autoModerationRules.create({
    name: `${GAULIA_RULE_PREFIX} ${t("automod.rules.names.mentionSpam")}`,
    eventType: AutoModerationRuleEventType.MessageSend,
    triggerType: AutoModerationRuleTriggerType.MentionSpam,
    triggerMetadata: { mentionTotalLimit: 5 },
    actions: [{ type: AutoModerationActionType.BlockMessage }],
    enabled: true,
    reason,
  });

  const keywordPresetRule = await guild.autoModerationRules.create({
    name: `${GAULIA_RULE_PREFIX} ${t("automod.rules.names.badWords")}`,
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
    throw new GauliaError("automod.errors.ruleNotFound");
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
    throw new GauliaError("automod.errors.ruleNotFound");
  }
  return rule.setEnabled(enabled);
}
