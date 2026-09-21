import { SlashCommandBuilder } from "discord.js";

import { localizeOption, localizeSlashCommand } from "../../../i18n";
import type { ChatInputCommand } from "../../../structures/Command";
import { funPayload } from "../services/funUi";

const KEY = "fun.commands.lovecalc";
const HEART_COUNT = 10;
const SCORE_MODULUS = BigInt(101);

const VERDICTS = [
  { min: 100, key: "soulmates" },
  { min: 80, key: "strong" },
  { min: 60, key: "good" },
  { min: 40, key: "spark" },
  { min: 20, key: "faint" },
  { min: 0, key: "none" },
] as const;

/**
 * Same result for a given pair, either way round (XOR is commutative), so nothing is stored.
 * The modulo 101 gives a score from 0 to 100%.
 */
export function loveScore(firstId: string, secondId: string): number {
  if (firstId === secondId) return 100;
  return Number((BigInt(firstId) ^ BigInt(secondId)) % SCORE_MODULUS);
}

const command: ChatInputCommand = {
  type: "chatInput",
  i18nKey: KEY,
  cooldownSeconds: 2,

  data: localizeSlashCommand(new SlashCommandBuilder(), KEY)
    .addUserOption((option) => localizeOption(option, `${KEY}.options.member`).setRequired(true))
    .addUserOption((option) => localizeOption(option, `${KEY}.options.member2`)),

  async execute(interaction, _client, t) {
    const first = interaction.options.getUser("member", true);
    const second = interaction.options.getUser("member2") ?? interaction.user;
    const score = loveScore(first.id, second.id);
    const filled = Math.round(score / HEART_COUNT);
    const verdict =
      first.id === second.id
        ? t("fun.lovecalc.self")
        : t(`fun.lovecalc.verdict.${VERDICTS.find((entry) => score >= entry.min)!.key}`);

    await interaction.reply(
      funPayload([
        `### ${t("fun.lovecalc.title")}`,
        t("fun.lovecalc.pair", { first: `<@${first.id}>`, second: `<@${second.id}>` }),
        "",
        `${"❤️".repeat(filled)}${"🖤".repeat(HEART_COUNT - filled)}  ${t("fun.lovecalc.score", { score })}`,
        verdict,
      ]),
    );
  },
};

export default command;
