import { SlashCommandBuilder } from "discord.js";

import type { ChatInputCommand } from "../../../structures/Command";
import { funPayload } from "../services/funUi";

const HEART_COUNT = 10;
const SCORE_MODULUS = BigInt(101);

const VERDICTS: { min: number; text: string }[] = [
  { min: 100, text: "L'âme sœur, tout simplement." },
  { min: 80, text: "Une connexion rare, foncez !" },
  { min: 60, text: "Belle complicité, ça promet." },
  { min: 40, text: "Il y a quelque chose, à creuser." },
  { min: 20, text: "Ce n'est pas gagné, mais rien n'est impossible." },
  { min: 0, text: "Aucune alchimie : restez amis… de loin." },
];

/**
 * Même résultat pour un même duo, dans les deux sens (XOR commutatif) : rien à enregistrer.
 * Le modulo 101 donne un score de 0 à 100 %.
 */
export function loveScore(firstId: string, secondId: string): number {
  if (firstId === secondId) return 100;
  return Number((BigInt(firstId) ^ BigInt(secondId)) % SCORE_MODULUS);
}

const command: ChatInputCommand = {
  type: "chatInput",
  cooldownSeconds: 2,
  data: new SlashCommandBuilder()
    .setName("lovecalc")
    .setDescription("Calcule la compatibilité amoureuse entre deux membres")
    .addUserOption((option) =>
      option.setName("membre").setDescription("Premier membre").setRequired(true),
    )
    .addUserOption((option) =>
      option.setName("membre2").setDescription("Second membre (toi par défaut)"),
    ),

  help: {
    details:
      "Calcule un score de compatibilité de 0 à 100 % à partir des identifiants Discord des deux membres. Le résultat est toujours le même pour un même duo, quel que soit l'ordre, et rien n'est enregistré. Sans second membre, le calcul se fait avec toi.",
    examples: ["lovecalc membre:@Pseudo", "lovecalc membre:@Pseudo membre2:@Autre"],
  },

  async execute(interaction) {
    const first = interaction.options.getUser("membre", true);
    const second = interaction.options.getUser("membre2") ?? interaction.user;
    const score = loveScore(first.id, second.id);
    const filled = Math.round(score / HEART_COUNT);
    const verdict =
      first.id === second.id
        ? "S'aimer soi-même, c'est la base."
        : VERDICTS.find((entry) => score >= entry.min)!.text;

    await interaction.reply(
      funPayload([
        "### Love calculator",
        `<@${first.id}> et <@${second.id}>`,
        "",
        `${"❤️".repeat(filled)}${"🖤".repeat(HEART_COUNT - filled)}  **${score} %**`,
        verdict,
      ]),
    );
  },
};

export default command;
