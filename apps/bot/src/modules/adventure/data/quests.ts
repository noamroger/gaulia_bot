/**
 * Les modèles de quêtes vivent dans `@gaulia/database` : le panel admin affiche les quêtes en
 * cours d'un joueur en toutes lettres. Ce fichier ne fait que les ré-exposer sous les noms courts
 * utilisés par le module.
 */
export {
  ADVENTURE_DAILY_QUEST_COUNT as DAILY_QUEST_COUNT,
  ADVENTURE_QUEST_TEMPLATES as QUEST_TEMPLATES,
  ADVENTURE_WEEKLY_QUEST_COUNT as WEEKLY_QUEST_COUNT,
  type AdventureQuestEventType as QuestEventType,
  type AdventureQuestTemplate as QuestTemplate,
} from "@gaulia/database";
