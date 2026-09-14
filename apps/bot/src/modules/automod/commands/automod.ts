import { updateGuild } from "@gaulia/database";
import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

import { Colors, Emojis } from "../../../client/Constants";
import { GauliaError } from "../../../core/errors";
import { PermissionLevel } from "../../../core/permissions/permissionLevel";
import { buildContainer, successPayload, toV2Payload } from "../../../core/ui/containers";
import type { ChatInputCommand } from "../../../structures/Command";
import { deleteRule, listRules, setupBaselineRules } from "../services/nativeAutoModService";

const command: ChatInputCommand = {
  type: "chatInput",
  guildOnly: true,
  permissionLevel: PermissionLevel.Administrator,
  data: new SlashCommandBuilder()
    .setName("automod")
    .setDescription("Configure la modération automatique de ce serveur")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Crée les règles AutoMod natives de base (spam, mentions, mots interdits)"),
    )
    .addSubcommand((sub) =>
      sub.setName("rules").setDescription("Liste les règles AutoMod natives actives"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("rule-delete")
        .setDescription("Supprime une règle AutoMod native")
        .addStringOption((option) =>
          option.setName("id").setDescription("ID de la règle").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("config")
        .setDescription("Choisit le salon des logs automod (règles et sanctions : dashboard)")
        .addChannelOption((option) =>
          option
            .setName("salon_logs")
            .setDescription("Salon où envoyer les logs automod")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    ),

  help: {
    details:
      "Gère l'AutoMod natif de Discord. `setup` crée des règles de base qui bloquent le spam, les messages de plus de 5 mentions et les mots interdits des listes prédéfinies de Discord. `rules` liste les règles natives avec leur identifiant, à utiliser avec `rule-delete`. `config` choisit le salon des logs automod. Les règles propres à Gaulia (liens, invitations, mots interdits, majuscules, doublons, flood) et leurs sanctions se configurent sur le dashboard.",
    examples: [
      "automod setup",
      "automod rule-delete id:123456789012345678",
      "automod config salon_logs:#logs-automod",
    ],
  },

  async execute(interaction) {
    const guild = interaction.guild!;
    const subcommand = interaction.options.getSubcommand(true);

    if (subcommand === "setup") {
      const rules = await setupBaselineRules(guild, interaction.user.tag);
      await interaction.reply(
        successPayload(
          false,
          "Règles AutoMod créées",
          `${rules.length} règle(s) native(s) créée(s) avec succès.`,
        ),
      );
      return;
    }

    if (subcommand === "rules") {
      const rules = await listRules(guild);
      const lines = [`### ${Emojis.Automod} Règles AutoMod natives`];
      lines.push(
        rules.length === 0
          ? "Aucune règle configurée."
          : rules
              .map(
                (rule) =>
                  `**${rule.name}** — \`${rule.id}\` (${rule.enabled ? "activée" : "désactivée"})`,
              )
              .join("\n"),
      );
      await interaction.reply(toV2Payload(false, buildContainer(Colors.Primary, lines)));
      return;
    }

    if (subcommand === "rule-delete") {
      const ruleId = interaction.options.getString("id", true);
      await deleteRule(guild, ruleId);
      await interaction.reply(successPayload(false, "Règle supprimée"));
      return;
    }

    if (subcommand === "config") {
      const logChannel = interaction.options.getChannel("salon_logs", true);
      await updateGuild(guild.id, { automodLogChannelId: logChannel.id });
      await interaction.reply(
        successPayload(
          false,
          "Configuration automod mise à jour",
          `Les logs automod seront envoyés dans <#${logChannel.id}>. Les règles (liens, invitations, mots interdits, flood…) et leurs sanctions se configurent depuis le dashboard Gaulia.`,
        ),
      );
      return;
    }

    throw new GauliaError("Sous-commande inconnue.");
  },
};

export default command;
