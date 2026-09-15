/**
 * Le scénario est défini dans `@gaulia/database`, pour que le panel admin puisse afficher l'acte
 * et le chapitre atteints par chaque joueur. Ce fichier ne fait que le ré-exposer sous les noms
 * courts utilisés par le module.
 */
export {
  ADVENTURE_ACTS as ACTS,
  ADVENTURE_TOTAL_CHAPTERS as TOTAL_CHAPTERS,
  adventureObjectiveKey as objectiveKey,
  findAdventureChapter as findChapter,
  requireAdventureAct as requireAct,
  type AdventureActDefinition as ActDefinition,
  type AdventureChapterDefinition as ChapterDefinition,
  type AdventureChapterObjective as ChapterObjective,
  type AdventureChapterReward as ChapterReward,
  type AdventureObjectiveType as ObjectiveType,
} from "@gaulia/database";
