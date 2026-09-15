import {
  ADVENTURE_DUNGEON_COOLDOWN_MS,
  ADVENTURE_ECHOES_PER_DAILY_SET,
  ADVENTURE_ECHOES_PER_DUNGEON,
  ADVENTURE_ECHOES_PER_WEEKLY_SET,
  ADVENTURE_ENERGY_MAX,
  ADVENTURE_ENERGY_PER_DUNGEON,
  ADVENTURE_ENERGY_PER_EXPLORE,
  ADVENTURE_ENERGY_REGEN_MS,
  ADVENTURE_MAX_LEVEL,
  ADVENTURE_MAX_PENDING_TRADES,
  ADVENTURE_MAX_UPGRADE,
  ADVENTURE_STAT_POINTS_PER_LEVEL,
  ADVENTURE_TOTAL_CHAPTERS,
  ADVENTURE_TRADE_EXPIRY_MS,
  ADVENTURE_TRADE_MAX_ITEMS,
  ADVENTURE_TRADE_MIN_LEVEL,
  ADVENTURE_UPGRADE_STEP,
} from "@gaulia/database";

import { ACTS } from "./story";
import { CLASSES } from "./classes";

/**
 * Contenu du tutoriel (`/aventure tuto`), écrit une fois et paginé à l'affichage. Les chiffres
 * sont lus dans l'équilibrage plutôt que recopiés : régler le jeu met le tutoriel à jour tout seul.
 */
export interface TutorialPage {
  /** Identifiant stable, utilisé par l'option `sujet` de la commande et par le menu de saut. */
  id: string;
  title: string;
  emoji: string;
  /** Résumé d'une ligne, affiché dans le menu de navigation. */
  summary: string;
  sections: { heading: string; body: string }[];
}

const regenMinutes = Math.round(ADVENTURE_ENERGY_REGEN_MS / 60_000);
const energyPerDay = Math.round((24 * 60) / regenMinutes);
const tradeMinutes = Math.round(ADVENTURE_TRADE_EXPIRY_MS / 60_000);
const dungeonDays = Math.round(ADVENTURE_DUNGEON_COOLDOWN_MS / (24 * 3_600_000));
const upgradePercent = Math.round(ADVENTURE_UPGRADE_STEP * 100);
const classList = CLASSES.map(
  (entry) => `${entry.emoji} **${entry.name}** — ${entry.description}\n*${entry.passive}*`,
).join("\n");

export const TUTORIAL_PAGES: readonly TutorialPage[] = [
  {
    id: "bases",
    title: "Premiers pas",
    emoji: "🧭",
    summary: "Créer son aventurier et partir explorer",
    sections: [
      {
        heading: "Ton aventurier",
        body: `Tu as **un seul aventurier**, le même partout : sur tous les serveurs où Gaulia est présent, et en message privé avec lui. Ta progression te suit, elle n'appartient à aucun serveur.\n\nChoisis une classe pour commencer — elle fixe ton style de combat, pas ton destin :\n\n${classList}`,
      },
      {
        heading: "Explorer, c'est le cœur du jeu",
        body: "`/aventure explorer` t'envoie battre la région où tu te trouves. Tu peux y croiser une créature — le combat se résout d'un bloc, tu lis le résumé —, faire une trouvaille, ou ne rien rencontrer du tout. Dans tous les cas tu gagnes de l'expérience, souvent des pièces et du butin.\n\nEnsuite, tout se pilote **aux boutons** sous le message : explorer encore, ouvrir ton sac, te soigner. Les commandes restent là pour qui préfère taper.",
      },
      {
        heading: "Énergie et points de vie",
        body: `Une exploration coûte **${ADVENTURE_ENERGY_PER_EXPLORE} énergie**. Tu en regagnes 1 toutes les ${regenMinutes} minutes, jusqu'à **${ADVENTURE_ENERGY_MAX}** en réserve — soit environ ${energyPerDay} par jour si tu passes régulièrement.\n\nTes points de vie remontent seuls avec le temps, ou d'un coup avec une potion. Perdre un combat ne coûte jamais ta progression : tu rentres soigner tes plaies, c'est tout. **Il n'y a pas de mort définitive.**`,
      },
    ],
  },
  {
    id: "progression",
    title: "Monter en puissance",
    emoji: "📈",
    summary: "Niveaux, caractéristiques, équipement, renforcement",
    sections: [
      {
        heading: "Niveaux et caractéristiques",
        body: `L'expérience te fait monter jusqu'au niveau **${ADVENTURE_MAX_LEVEL}**. Chaque niveau rend toute ta vie et t'offre **${ADVENTURE_STAT_POINTS_PER_LEVEL} points** à placer avec \`/aventure ameliorer\` :\n\n**Force** — dégâts physiques et points de vie\n**Agilité** — coups critiques, esquive et défense\n**Esprit** — dégâts magiques`,
      },
      {
        heading: "S'équiper",
        body: "Trois emplacements : **arme**, **armure**, **talisman**. Une pièce se porte depuis ton sac (`/aventure inventaire`, ou le menu sous le message). Les meilleures pièces se trouvent en explorant, s'achètent au comptoir, ou se forgent.",
      },
      {
        heading: "Renforcer son équipement",
        body: `À la forge, une pièce que tu possèdes déjà se renforce jusqu'à **+${ADVENTURE_MAX_UPGRADE}** contre de l'or et des matériaux. Chaque palier ajoute **${upgradePercent} %** à ses bonus, et rien ne peut casser : le coût est connu d'avance, tu réunis les ressources, la pièce s'améliore.\n\nAttention : le renforcement appartient à **ton exemplaire**. Si tu donnes ou revends la pièce, le renforcement part avec elle et l'autre la reçoit au palier zéro.`,
      },
    ],
  },
  {
    id: "economie",
    title: "Or, butin et forge",
    emoji: "🪙",
    summary: "Gagner des pièces et fabriquer son matériel",
    sections: [
      {
        heading: "D'où vient l'or",
        body: "Des combats, des trouvailles, des quêtes, et de la revente. Les **trésors** ne servent à rien d'autre qu'à être vendus très cher : garde-les pour le marchand, pas pour ton sac.",
      },
      {
        heading: "Le comptoir",
        body: "`/aventure boutique` liste ce que le marchand propose à ton niveau : potions, rations qui rendent de l'énergie, équipement d'entrée de gamme. Tu achètes d'un menu déroulant. `/aventure vendre` fait l'inverse — sauf pour les reliques, que personne ne rachète.",
      },
      {
        heading: "La forge",
        body: "`/aventure forge` montre les recettes accessibles à ton niveau et ce qu'il te manque pour chacune. Les matériaux viennent du butin : peaux et bois au début, écailles de drake et cœurs élémentaires plus loin, éclats d'écho tout au bout. C'est là aussi que tu renforces tes pièces.",
      },
    ],
  },
  {
    id: "scenario",
    title: "L'histoire",
    emoji: "📖",
    summary: "Chapitres, fragments d'écho, donjon hebdomadaire",
    sections: [
      {
        heading: "Sept actes, trente-cinq chapitres",
        body: `L'aventure raconte une histoire : ${ACTS.length} actes, ${ADVENTURE_TOTAL_CHAPTERS} chapitres, une nouvelle région ouverte à chaque acte. \`/aventure histoire\` te montre le chapitre en cours et ses objectifs, qui se remplissent simplement en jouant.`,
      },
      {
        heading: "Les fragments d'écho",
        body: `Remplir les objectifs ne suffit pas : pour **sceller** un chapitre il faut atteindre un niveau et dépenser des **fragments d'écho**. Ils ne s'achètent pas et ne se farment pas. Ils viennent du temps qui passe :\n\n**+${ADVENTURE_ECHOES_PER_DAILY_SET}** par lot de quêtes quotidiennes terminé\n**+${ADVENTURE_ECHOES_PER_WEEKLY_SET}** par lot hebdomadaire\n**+${ADVENTURE_ECHOES_PER_DUNGEON}** par donjon remporté\nEt rarement, un écho perdu trouvé en explorant.`,
      },
      {
        heading: "Le donjon de la semaine",
        body: `Chaque acte a son gardien, affrontable **une fois tous les ${dungeonDays} jours** pour ${ADVENTURE_ENERGY_PER_DUNGEON} énergie. C'est le gros rendez-vous : beaucoup d'expérience, d'or, et les fragments qui font avancer l'histoire. Une défaite ne consomme pas la semaine — reviens mieux équipé le jour même.`,
      },
      {
        heading: "Les quêtes",
        body: "Un lot de quêtes quotidiennes et un lot hebdomadaire, tirés au hasard. Elles se valident **toutes seules** pendant que tu joues : rien à réclamer, rien à oublier. `/aventure quetes` pour voir où tu en es.",
      },
    ],
  },
  {
    id: "echanges",
    title: "Échanger avec les autres",
    emoji: "🤝",
    summary: "Le commerce entre aventuriers, et ses règles",
    sections: [
      {
        heading: "Proposer un échange",
        body: `\`/aventure echange proposer\` met sur la table ce que tu donnes (objets, pièces, ou les deux) et ce que tu demandes en retour. L'autre reçoit la proposition et répond d'un bouton : **accepter**, **refuser**. Toi, tu peux l'annuler tant qu'elle est ouverte.\n\nÇa couvre le cadeau (tu ne demandes rien), la vente (des objets contre des pièces) et le troc (des objets contre des objets).`,
      },
      {
        heading: "Les règles du marché",
        body: `Les échanges s'ouvrent au **niveau ${ADVENTURE_TRADE_MIN_LEVEL}** des deux côtés. Une proposition expire après **${tradeMinutes} minutes**, et tu peux en avoir **${ADVENTURE_MAX_PENDING_TRADES}** ouvertes en même temps, avec au plus ${ADVENTURE_TRADE_MAX_ITEMS} objets par côté.\n\nRien n'est bloqué pendant qu'une proposition attend : tu continues de jouer normalement. Les deux sacs sont revérifiés au moment de l'acceptation, et tout part en une seule fois — impossible qu'un des deux soit délesté sans recevoir sa part.`,
      },
      {
        heading: "Ce qui ne s'échange pas",
        body: "Les **reliques** gagnées sur les gardiens restent avec celui qui les a méritées : elles ne s'échangent ni ne se vendent. Une pièce que tu portes doit être retirée avant d'être donnée. Et le renforcement, lui, ne voyage jamais.",
      },
      {
        heading: "Suivre ses affaires",
        body: "`/aventure echange liste` récapitule tes propositions en cours, reçues comme envoyées. `/aventure echange repondre` permet de répondre par numéro quand le message d'origine est loin dans l'historique. Chaque échange conclu est inscrit dans le journal des deux joueurs.",
      },
    ],
  },
  {
    id: "communaute",
    title: "Les autres aventuriers",
    emoji: "🏅",
    summary: "Classement, hauts faits, où l'on peut jouer",
    sections: [
      {
        heading: "Se comparer",
        body: "`/aventure classement` affiche les dix plus grands aventuriers, tous serveurs confondus, et ton rang. `/aventure hauts-faits` liste ce que tu as débloqué : certains hauts faits accordent un **titre**, affiché sous ton nom sur ta fiche.",
      },
      {
        heading: "Où l'on joue",
        body: "En **message privé** avec Gaulia, toujours. Sur un serveur, ça dépend de ses administrateurs : ils choisissent les salons où l'aventure est autorisée depuis le tableau de bord. Si une commande te répond que le salon n'est pas ouvert, demande-leur — ou continue en privé, c'est le même personnage.",
      },
      {
        heading: "Jouer ensemble",
        body: "Il n'y a pas d'équipe ni de combat entre joueurs : ce que vous partagez, c'est l'économie. Un joueur avancé peut équiper un débutant, deux joueurs peuvent se répartir les matériaux qu'ils récoltent, et le classement met tout le monde sur la même échelle. Les boutons d'un message n'obéissent qu'à son propriétaire, donc personne ne peut jouer à ta place.",
      },
    ],
  },
  {
    id: "rythme",
    title: "Le rythme du jeu",
    emoji: "⏳",
    summary: "Une aventure d'un an, et comment bien la vivre",
    sections: [
      {
        heading: "Ça dure longtemps, exprès",
        body: "Terminer l'histoire demande **plus d'un an**. Ce n'est pas un mur d'expérience à casser : c'est le temps réel qui compte, parce que les fragments d'écho n'arrivent qu'avec les jours et les semaines. Jouer douze heures d'affilée n'avance pas plus qu'une bonne session quotidienne.",
      },
      {
        heading: "La bonne habitude",
        body: "Passe une ou deux fois par jour, vide ton énergie, termine ton lot de quêtes, prends ton donjon dans la semaine. C'est tout. Ta **série de jours consécutifs** augmente ton butin, jusqu'à +30 % — et un jour manqué la remet à 1, jamais à zéro.",
      },
      {
        heading: "Trois conseils pour débuter",
        body: "**1.** Place tes points de caractéristique dès que tu montes de niveau, ils ne servent à rien en réserve.\n**2.** Garde tes matériaux : ils valent plus à la forge qu'au comptoir.\n**3.** Voyage dès qu'une région s'ouvre — les gains y sont meilleurs, et ton histoire t'y attend.",
      },
    ],
  },
] as const;

export function findTutorialPage(id: string): number {
  const index = TUTORIAL_PAGES.findIndex((page) => page.id === id);
  return index === -1 ? 0 : index;
}

/** Choix proposés par l'option `sujet` de `/aventure tuto`. */
export const TUTORIAL_CHOICES = TUTORIAL_PAGES.map((page) => ({
  name: `${page.emoji} ${page.title} — ${page.summary}`.slice(0, 100),
  value: page.id,
}));
