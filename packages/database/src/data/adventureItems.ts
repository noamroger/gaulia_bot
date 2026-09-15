/**
 * Catalogue des objets de l'aventure. Il vit dans ce paquet partagé, et non dans le module du
 * bot, parce que l'API et le panel admin en ont besoin pour nommer un inventaire et pour valider
 * l'objet qu'un propriétaire offre à un joueur.
 *
 * Reste un simple tableau de données : ajouter un objet ne demande ni migration ni changement de
 * service, seulement de référencer son identifiant dans une table de butin (zones.ts,
 * monsters.ts côté bot), une recette ou la boutique (`price`).
 */

export type AdventureItemKind = "EQUIPEMENT" | "CONSOMMABLE" | "MATERIAU" | "TRESOR" | "RELIQUE";
export type AdventureItemSlot = "arme" | "armure" | "talisman";
export type AdventureItemRarity = "COMMUNE" | "RARE" | "EPIQUE" | "LEGENDAIRE";

/** Bonus d'une pièce d'équipement, additionnés aux caractéristiques du personnage. */
export interface AdventureItemBonus {
  attack?: number;
  defense?: number;
  power?: number;
  maxHp?: number;
  /** Points de pourcentage ajoutés aux chances de coup critique / d'esquive. */
  crit?: number;
  dodge?: number;
}

/** Effet immédiat d'un consommable. */
export interface AdventureItemEffect {
  hp?: number;
  energy?: number;
  xp?: number;
}

export interface AdventureItemDefinition {
  id: string;
  name: string;
  emoji: string;
  kind: AdventureItemKind;
  rarity: AdventureItemRarity;
  description: string;
  /** Emplacement occupé par un équipement. */
  slot?: AdventureItemSlot;
  bonus?: AdventureItemBonus;
  effect?: AdventureItemEffect;
  /** Niveau minimum pour l'équiper ou l'utiliser. */
  level?: number;
  /** Prix en boutique ; absent = introuvable chez les marchands. */
  price?: number;
  /** Prix de revente au marchand. */
  sellPrice: number;
  /**
   * Échangeable entre joueurs. Vrai par défaut : seuls les objets marqués explicitement ici sont
   * bloqués (les reliques du scénario, qui n'ont de sens que pour celui qui les a gagnées).
   */
  tradable?: boolean;
}

/** Un objet non marqué est échangeable : la liste des exceptions reste ainsi courte et lisible. */
export function isAdventureItemTradable(item: AdventureItemDefinition): boolean {
  return item.tradable !== false;
}

export const ADVENTURE_RARITY_EMOJIS: Readonly<Record<AdventureItemRarity, string>> = {
  COMMUNE: "⬜",
  RARE: "🟦",
  EPIQUE: "🟪",
  LEGENDAIRE: "🟧",
};

export const ADVENTURE_SLOT_LABELS: Readonly<Record<AdventureItemSlot, string>> = {
  arme: "Arme",
  armure: "Armure",
  talisman: "Talisman",
};

function gear(
  id: string,
  name: string,
  emoji: string,
  slot: AdventureItemSlot,
  rarity: AdventureItemRarity,
  level: number,
  bonus: AdventureItemBonus,
  description: string,
  price?: number,
): AdventureItemDefinition {
  return {
    id,
    name,
    emoji,
    kind: "EQUIPEMENT",
    rarity,
    slot,
    level,
    bonus,
    description,
    price,
    sellPrice: Math.max(5, Math.round((price ?? level * 45) / 4)),
  };
}

function material(
  id: string,
  name: string,
  emoji: string,
  rarity: AdventureItemRarity,
  sellPrice: number,
  description: string,
): AdventureItemDefinition {
  return { id, name, emoji, kind: "MATERIAU", rarity, description, sellPrice };
}

export const ADVENTURE_ITEMS: readonly AdventureItemDefinition[] = [
  // ─── Armes : trois familles (force, esprit, agilité), sept paliers ───────
  gear(
    "epee-rouillee",
    "Épée rouillée",
    "🗡️",
    "arme",
    "COMMUNE",
    1,
    { attack: 4 },
    "Elle a connu de meilleurs jours, mais elle coupe encore.",
    60,
  ),
  gear(
    "epee-fer",
    "Épée de fer",
    "⚔️",
    "arme",
    "COMMUNE",
    8,
    { attack: 11 },
    "Lame d'atelier, honnête et bien équilibrée.",
    340,
  ),
  gear(
    "hache-ardente",
    "Hache ardente",
    "🪓",
    "arme",
    "RARE",
    18,
    { attack: 24, crit: 3 },
    "Le tranchant garde la chaleur de la forge.",
    1_400,
  ),
  gear(
    "lame-givre",
    "Lame de givre",
    "🗡️",
    "arme",
    "RARE",
    30,
    { attack: 41, crit: 4 },
    "Le sang gèle avant de perler.",
    4_200,
  ),
  gear(
    "fleau-orage",
    "Fléau d'orage",
    "⚡",
    "arme",
    "EPIQUE",
    45,
    { attack: 68, crit: 6, maxHp: 40 },
    "Chaque impact claque comme la foudre.",
    11_500,
  ),
  gear(
    "lame-crepuscule",
    "Lame du crépuscule",
    "🌘",
    "arme",
    "EPIQUE",
    62,
    { attack: 104, crit: 8 },
    "Forgée dans l'heure qui sépare le jour de la nuit.",
    28_000,
  ),
  gear(
    "lame-echos",
    "Lame des échos",
    "✨",
    "arme",
    "LEGENDAIRE",
    80,
    { attack: 160, crit: 12, maxHp: 60 },
    "Elle se souvient de tous ceux qu'elle a tranchés.",
  ),

  gear(
    "baton-noueux",
    "Bâton noueux",
    "🪄",
    "arme",
    "COMMUNE",
    1,
    { power: 5 },
    "Un bout de frêne, et beaucoup de conviction.",
    60,
  ),
  gear(
    "baton-chene",
    "Bâton de chêne",
    "🪄",
    "arme",
    "COMMUNE",
    8,
    { power: 13 },
    "Le bois retient la chaleur des sorts.",
    340,
  ),
  gear(
    "sceptre-cendre",
    "Sceptre de cendre",
    "🔥",
    "arme",
    "RARE",
    18,
    { power: 28 },
    "La cendre au sommet ne refroidit jamais.",
    1_400,
  ),
  gear(
    "sceptre-givre",
    "Sceptre de givre",
    "❄️",
    "arme",
    "RARE",
    30,
    { power: 47 },
    "L'air se couvre de buée quand on le lève.",
    4_200,
  ),
  gear(
    "grimoire-orage",
    "Grimoire d'orage",
    "📖",
    "arme",
    "EPIQUE",
    45,
    { power: 78, maxHp: 30 },
    "Les pages tournent seules quand vient l'éclair.",
    11_500,
  ),
  gear(
    "sceptre-crepuscule",
    "Sceptre du crépuscule",
    "🌘",
    "arme",
    "EPIQUE",
    62,
    { power: 118 },
    "Sa gemme avale la lumière au lieu de la refléter.",
    28_000,
  ),
  gear(
    "sceptre-echos",
    "Sceptre des échos",
    "✨",
    "arme",
    "LEGENDAIRE",
    80,
    { power: 182, maxHp: 60 },
    "Il murmure les noms des Terres avant qu'on les prononce.",
  ),

  gear(
    "arc-chasse",
    "Arc de chasse",
    "🏹",
    "arme",
    "COMMUNE",
    1,
    { attack: 3, crit: 3 },
    "Assez pour le lièvre, un peu juste pour le loup.",
    60,
  ),
  gear(
    "arc-if",
    "Arc d'if",
    "🏹",
    "arme",
    "COMMUNE",
    8,
    { attack: 9, crit: 4 },
    "Souple, silencieux, patient.",
    340,
  ),
  gear(
    "arc-corne",
    "Arc de corne",
    "🏹",
    "arme",
    "RARE",
    18,
    { attack: 20, crit: 7, dodge: 2 },
    "La corne claque sèchement à chaque tir.",
    1_400,
  ),
  gear(
    "arc-glace",
    "Arc de glace",
    "🏹",
    "arme",
    "RARE",
    30,
    { attack: 35, crit: 9, dodge: 3 },
    "Ses flèches sifflent en laissant un trait blanc.",
    4_200,
  ),
  gear(
    "arc-tempete",
    "Arc de tempête",
    "🌪️",
    "arme",
    "EPIQUE",
    45,
    { attack: 58, crit: 12, dodge: 4 },
    "La corde chante même sans vent.",
    11_500,
  ),
  gear(
    "arc-crepuscule",
    "Arc du crépuscule",
    "🌘",
    "arme",
    "EPIQUE",
    62,
    { attack: 90, crit: 15, dodge: 5 },
    "On ne voit jamais partir la flèche.",
    28_000,
  ),
  gear(
    "arc-echos",
    "Arc des échos",
    "✨",
    "arme",
    "LEGENDAIRE",
    80,
    { attack: 138, crit: 20, dodge: 7 },
    "Il vise l'endroit où la cible sera.",
    undefined,
  ),

  // ─── Armures ─────────────────────────────────────────────────────────────
  gear(
    "tunique-cuir",
    "Tunique de cuir",
    "🥾",
    "armure",
    "COMMUNE",
    1,
    { defense: 3, maxHp: 10 },
    "Du cuir bouilli, cousu serré.",
    55,
  ),
  gear(
    "robe-apprenti",
    "Robe d'apprenti",
    "🧥",
    "armure",
    "COMMUNE",
    1,
    { defense: 2, power: 3 },
    "Elle gratte, mais elle canalise.",
    55,
  ),
  gear(
    "cotte-mailles",
    "Cotte de mailles",
    "🛡️",
    "armure",
    "COMMUNE",
    10,
    { defense: 10, maxHp: 30 },
    "Lourde le matin, rassurante le soir.",
    480,
  ),
  gear(
    "armure-plates",
    "Armure de plates",
    "🛡️",
    "armure",
    "RARE",
    25,
    { defense: 24, maxHp: 70 },
    "On entend arriver celui qui la porte.",
    3_600,
  ),
  gear(
    "armure-runique",
    "Armure runique",
    "🔰",
    "armure",
    "EPIQUE",
    40,
    { defense: 42, maxHp: 130, power: 12 },
    "Les runes se réchauffent quand le danger approche.",
    9_800,
  ),
  gear(
    "harnois-astral",
    "Harnois astral",
    "🌌",
    "armure",
    "EPIQUE",
    60,
    { defense: 68, maxHp: 210 },
    "Le métal a la couleur d'un ciel sans lune.",
    24_000,
  ),
  gear(
    "egide-echos",
    "Égide des échos",
    "✨",
    "armure",
    "LEGENDAIRE",
    80,
    { defense: 105, maxHp: 320, dodge: 4 },
    "Elle renvoie les coups au moment où ils sont portés.",
  ),

  // ─── Talismans ───────────────────────────────────────────────────────────
  gear(
    "amulette-simple",
    "Amulette simple",
    "📿",
    "talisman",
    "COMMUNE",
    5,
    { maxHp: 20 },
    "Un galet percé et beaucoup d'espoir.",
    200,
  ),
  gear(
    "oeil-loup",
    "Œil de loup",
    "🐺",
    "talisman",
    "RARE",
    15,
    { crit: 5, attack: 5 },
    "Il fixe toujours la même direction : devant.",
    1_100,
  ),
  gear(
    "coeur-braise",
    "Cœur de braise",
    "🔥",
    "talisman",
    "RARE",
    28,
    { power: 18, maxHp: 40 },
    "Tiède au creux de la main, brûlant au combat.",
    3_900,
  ),
  gear(
    "larme-lune",
    "Larme de lune",
    "🌙",
    "talisman",
    "EPIQUE",
    42,
    { dodge: 6, maxHp: 90 },
    "Elle ne fond jamais complètement.",
    10_500,
  ),
  gear(
    "sceau-titan",
    "Sceau du titan",
    "🗿",
    "talisman",
    "EPIQUE",
    58,
    { attack: 40, defense: 25, maxHp: 140 },
    "Le poids d'une montagne, tenu par une chaîne.",
    26_000,
  ),
  gear(
    "couronne-echos",
    "Couronne des échos",
    "👑",
    "talisman",
    "LEGENDAIRE",
    78,
    { attack: 60, power: 60, defense: 40, maxHp: 260, crit: 8 },
    "Portée par ceux qui ont entendu les Terres répondre.",
  ),

  // ─── Consommables ────────────────────────────────────────────────────────
  {
    id: "potion-mineure",
    name: "Potion mineure",
    emoji: "🧪",
    kind: "CONSOMMABLE",
    rarity: "COMMUNE",
    description: "Rend 40 points de vie.",
    effect: { hp: 40 },
    price: 45,
    sellPrice: 11,
  },
  {
    id: "potion-majeure",
    name: "Potion majeure",
    emoji: "⚗️",
    kind: "CONSOMMABLE",
    rarity: "RARE",
    description: "Rend 180 points de vie.",
    effect: { hp: 180 },
    price: 260,
    sellPrice: 65,
    level: 20,
  },
  {
    id: "elixir-supreme",
    name: "Élixir suprême",
    emoji: "🫗",
    kind: "CONSOMMABLE",
    rarity: "EPIQUE",
    description: "Rend 600 points de vie.",
    effect: { hp: 600 },
    price: 1_500,
    sellPrice: 375,
    level: 45,
  },
  {
    id: "ration-voyage",
    name: "Ration de voyage",
    emoji: "🥖",
    kind: "CONSOMMABLE",
    rarity: "COMMUNE",
    description: "Rend 3 points d'énergie.",
    effect: { energy: 3 },
    price: 320,
    sellPrice: 40,
  },
  {
    id: "festin-auberge",
    name: "Festin d'auberge",
    emoji: "🍲",
    kind: "CONSOMMABLE",
    rarity: "RARE",
    description: "Rend 8 points d'énergie.",
    effect: { energy: 8 },
    price: 900,
    sellPrice: 120,
  },
  {
    id: "encens-savoir",
    name: "Encens du savoir",
    emoji: "🕯️",
    kind: "CONSOMMABLE",
    rarity: "RARE",
    description: "Accorde immédiatement 400 points d'expérience.",
    effect: { xp: 400 },
    price: 700,
    sellPrice: 90,
    level: 10,
  },

  // ─── Matériaux (butin, artisanat) ────────────────────────────────────────
  material("peau-loup", "Peau de loup", "🐺", "COMMUNE", 14, "Épaisse, encore chaude."),
  material(
    "croc-sanglier",
    "Croc de sanglier",
    "🐗",
    "COMMUNE",
    18,
    "Un peu ébréché, toujours tranchant.",
  ),
  material("bois-noueux", "Bois noueux", "🪵", "COMMUNE", 10, "Noueux, donc solide."),
  material("fer-brut", "Fer brut", "🪨", "COMMUNE", 22, "Un caillou lourd qui rougit au feu."),
  material(
    "lingot-fer",
    "Lingot de fer",
    "🧱",
    "COMMUNE",
    70,
    "Fondu, coulé, refroidi : prêt à devenir lame.",
  ),
  material(
    "os-blanchi",
    "Os blanchi",
    "🦴",
    "COMMUNE",
    26,
    "Le soleil a fait le reste du travail.",
  ),
  material(
    "essence-spectrale",
    "Essence spectrale",
    "👻",
    "RARE",
    120,
    "Elle fuit la lumière du regard.",
  ),
  material(
    "ecaille-drake",
    "Écaille de drake",
    "🐉",
    "RARE",
    240,
    "Plus dure que l'acier, plus légère que le cuir.",
  ),
  material(
    "fil-argent",
    "Fil d'argent",
    "🧵",
    "RARE",
    180,
    "On coud avec, on lie des runes aussi.",
  ),
  material(
    "poudre-astrale",
    "Poudre astrale",
    "🌠",
    "EPIQUE",
    520,
    "Elle flotte une seconde de trop avant de retomber.",
  ),
  material(
    "coeur-elementaire",
    "Cœur élémentaire",
    "💠",
    "EPIQUE",
    900,
    "Il bat au rythme d'un orage lointain.",
  ),
  material(
    "eclat-echo",
    "Éclat d'écho",
    "🔷",
    "LEGENDAIRE",
    1_800,
    "Un morceau de mémoire des Terres, dur comme du verre.",
  ),

  // ─── Trésors : aucune utilité, sinon être revendus très cher ─────────────
  {
    id: "perle-riviere",
    name: "Perle de rivière",
    emoji: "🫧",
    kind: "TRESOR",
    rarity: "COMMUNE",
    description: "Jolie, ronde, et recherchée en ville.",
    sellPrice: 150,
  },
  {
    id: "calice-terni",
    name: "Calice terni",
    emoji: "🏆",
    kind: "TRESOR",
    rarity: "RARE",
    description: "L'argent est noir, mais l'argent reste l'argent.",
    sellPrice: 700,
  },
  {
    id: "statuette-jade",
    name: "Statuette de jade",
    emoji: "🗿",
    kind: "TRESOR",
    rarity: "EPIQUE",
    description: "Un dieu oublié, sculpté par des mains sûres.",
    sellPrice: 2_600,
  },
  {
    id: "gemme-crepuscule",
    name: "Gemme du crépuscule",
    emoji: "💎",
    kind: "TRESOR",
    rarity: "LEGENDAIRE",
    description: "Elle change de couleur selon qui la regarde.",
    sellPrice: 9_000,
  },

  // ─── Reliques : preuves de passage, objectifs de chapitre ────────────────
  {
    id: "relique-cor-brume",
    name: "Cor de la brume",
    emoji: "📯",
    kind: "RELIQUE",
    rarity: "LEGENDAIRE",
    description: "Son appel disperse les brumes des Bois-Bas.",
    sellPrice: 0,
    tradable: false,
  },
  {
    id: "relique-clef-tombes",
    name: "Clef des tombes",
    emoji: "🗝️",
    kind: "RELIQUE",
    rarity: "LEGENDAIRE",
    description: "Elle ouvre ce qui n'aurait jamais dû être refermé.",
    sellPrice: 0,
    tradable: false,
  },
  {
    id: "relique-braise-eternelle",
    name: "Braise éternelle",
    emoji: "🔥",
    kind: "RELIQUE",
    rarity: "LEGENDAIRE",
    description: "Prise au cœur des Forges Noires, elle ne s'éteint pas.",
    sellPrice: 0,
    tradable: false,
  },
  {
    id: "relique-coeur-gel",
    name: "Cœur de gel",
    emoji: "🧊",
    kind: "RELIQUE",
    rarity: "LEGENDAIRE",
    description: "Le pouls figé du Haut-Givre.",
    sellPrice: 0,
    tradable: false,
  },
  {
    id: "relique-oeil-tempete",
    name: "Œil de la tempête",
    emoji: "🌀",
    kind: "RELIQUE",
    rarity: "LEGENDAIRE",
    description: "Un calme parfait, enfermé dans une sphère.",
    sellPrice: 0,
    tradable: false,
  },
  {
    id: "relique-voile-astral",
    name: "Voile astral",
    emoji: "🌌",
    kind: "RELIQUE",
    rarity: "LEGENDAIRE",
    description: "Tissé entre deux nuits, il ne pèse rien.",
    sellPrice: 0,
    tradable: false,
  },
  {
    id: "relique-derniere-voix",
    name: "Dernière voix",
    emoji: "🔊",
    kind: "RELIQUE",
    rarity: "LEGENDAIRE",
    description: "Ce que les Terres avaient à dire, enfin audible.",
    sellPrice: 0,
    tradable: false,
  },
] as const;

const BY_ID = new Map(ADVENTURE_ITEMS.map((item) => [item.id, item]));

export function findAdventureItem(itemId: string): AdventureItemDefinition | undefined {
  return BY_ID.get(itemId);
}

/** Définition d'un objet dont l'identifiant vient du code (butin, recette, boutique). */
export function requireAdventureItem(itemId: string): AdventureItemDefinition {
  const item = BY_ID.get(itemId);
  if (!item) throw new Error(`Objet d'aventure inconnu : ${itemId}`);
  return item;
}

export function adventureItemLabel(itemId: string): string {
  const item = BY_ID.get(itemId);
  return item ? `${item.emoji} ${item.name}` : `objet inconnu (${itemId})`;
}

/** Objets proposés par le marchand, du moins cher au plus cher. */
export function adventureShopItems(): AdventureItemDefinition[] {
  return ADVENTURE_ITEMS.filter((item) => item.price !== undefined).sort(
    (a, b) => (a.price ?? 0) - (b.price ?? 0),
  );
}

export function adventureItemsBySlot(slot: AdventureItemSlot): AdventureItemDefinition[] {
  return ADVENTURE_ITEMS.filter((item) => item.slot === slot);
}
