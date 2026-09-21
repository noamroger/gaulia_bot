/**
 * Adventure item catalog. It lives in this shared package rather than in the bot module because
 * the API and the admin panel need it to name an inventory and to validate the item an owner
 * grants to a player. Text is bilingual for the same reason: each reader gets their own language.
 *
 * It stays a plain data table: adding an item needs neither a migration nor a service change, only
 * a reference to its id in a loot table (zones.ts, monsters.ts on the bot side), a recipe or the
 * shop (`price`).
 */

import { localized, type LocalizedText } from "./localized";

export type AdventureItemKind = "EQUIPEMENT" | "CONSOMMABLE" | "MATERIAU" | "TRESOR" | "RELIQUE";
export type AdventureItemSlot = "arme" | "armure" | "talisman";
export type AdventureItemRarity = "COMMUNE" | "RARE" | "EPIQUE" | "LEGENDAIRE";

/** Gear bonuses, added to the character stats. */
export interface AdventureItemBonus {
  attack?: number;
  defense?: number;
  power?: number;
  maxHp?: number;
  /** Percentage points added to the critical hit / dodge chances. */
  crit?: number;
  dodge?: number;
}

/** Immediate effect of a consumable. */
export interface AdventureItemEffect {
  hp?: number;
  energy?: number;
  xp?: number;
}

export interface AdventureItemDefinition {
  id: string;
  name: LocalizedText;
  emoji: string;
  kind: AdventureItemKind;
  rarity: AdventureItemRarity;
  description: LocalizedText;
  /** Slot taken up by a piece of gear. */
  slot?: AdventureItemSlot;
  bonus?: AdventureItemBonus;
  effect?: AdventureItemEffect;
  /** Minimum level to equip or use it. */
  level?: number;
  /** Shop price; absent means no merchant sells it. */
  price?: number;
  /** Price the merchant buys it back for. */
  sellPrice: number;
  /**
   * Tradable between players. True by default: only the items flagged here are blocked (the story
   * relics, which mean something only to the player who earned them).
   */
  tradable?: boolean;
}

/** An unflagged item is tradable, which keeps the exception list short and readable. */
export function isAdventureItemTradable(item: AdventureItemDefinition): boolean {
  return item.tradable !== false;
}

export const ADVENTURE_RARITY_EMOJIS: Readonly<Record<AdventureItemRarity, string>> = {
  COMMUNE: "⬜",
  RARE: "🟦",
  EPIQUE: "🟪",
  LEGENDAIRE: "🟧",
};

export const ADVENTURE_SLOT_LABELS: Readonly<Record<AdventureItemSlot, LocalizedText>> = {
  arme: { en: "Weapon", fr: "Arme" },
  armure: { en: "Armour", fr: "Armure" },
  talisman: { en: "Talisman", fr: "Talisman" },
};

function gear(
  id: string,
  name: LocalizedText,
  emoji: string,
  slot: AdventureItemSlot,
  rarity: AdventureItemRarity,
  level: number,
  bonus: AdventureItemBonus,
  description: LocalizedText,
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
  name: LocalizedText,
  emoji: string,
  rarity: AdventureItemRarity,
  sellPrice: number,
  description: LocalizedText,
): AdventureItemDefinition {
  return { id, name, emoji, kind: "MATERIAU", rarity, description, sellPrice };
}

export const ADVENTURE_ITEMS: readonly AdventureItemDefinition[] = [
  // Weapons: three families (strength, spirit, agility), seven tiers.
  gear(
    "epee-rouillee",
    { en: "Rusty sword", fr: "Épée rouillée" },
    "🗡️",
    "arme",
    "COMMUNE",
    1,
    { attack: 4 },
    {
      en: "It has seen better days, but it still cuts.",
      fr: "Elle a connu de meilleurs jours, mais elle coupe encore.",
    },
    60,
  ),
  gear(
    "epee-fer",
    { en: "Iron sword", fr: "Épée de fer" },
    "⚔️",
    "arme",
    "COMMUNE",
    8,
    { attack: 11 },
    {
      en: "A workshop blade, honest and well balanced.",
      fr: "Lame d'atelier, honnête et bien équilibrée.",
    },
    340,
  ),
  gear(
    "hache-ardente",
    { en: "Burning axe", fr: "Hache ardente" },
    "🪓",
    "arme",
    "RARE",
    18,
    { attack: 24, crit: 3 },
    {
      en: "The edge keeps the heat of the forge.",
      fr: "Le tranchant garde la chaleur de la forge.",
    },
    1_400,
  ),
  gear(
    "lame-givre",
    { en: "Frost blade", fr: "Lame de givre" },
    "🗡️",
    "arme",
    "RARE",
    30,
    { attack: 41, crit: 4 },
    { en: "Blood freezes before it beads.", fr: "Le sang gèle avant de perler." },
    4_200,
  ),
  gear(
    "fleau-orage",
    { en: "Storm flail", fr: "Fléau d'orage" },
    "⚡",
    "arme",
    "EPIQUE",
    45,
    { attack: 68, crit: 6, maxHp: 40 },
    { en: "Every impact cracks like lightning.", fr: "Chaque impact claque comme la foudre." },
    11_500,
  ),
  gear(
    "lame-crepuscule",
    { en: "Twilight blade", fr: "Lame du crépuscule" },
    "🌘",
    "arme",
    "EPIQUE",
    62,
    { attack: 104, crit: 8 },
    {
      en: "Forged in the hour that parts day from night.",
      fr: "Forgée dans l'heure qui sépare le jour de la nuit.",
    },
    28_000,
  ),
  gear(
    "lame-echos",
    { en: "Blade of echoes", fr: "Lame des échos" },
    "✨",
    "arme",
    "LEGENDAIRE",
    80,
    { attack: 160, crit: 12, maxHp: 60 },
    {
      en: "It remembers everyone it has cut down.",
      fr: "Elle se souvient de tous ceux qu'elle a tranchés.",
    },
  ),

  gear(
    "baton-noueux",
    { en: "Gnarled staff", fr: "Bâton noueux" },
    "🪄",
    "arme",
    "COMMUNE",
    1,
    { power: 5 },
    {
      en: "A length of ash, and a lot of conviction.",
      fr: "Un bout de frêne, et beaucoup de conviction.",
    },
    60,
  ),
  gear(
    "baton-chene",
    { en: "Oak staff", fr: "Bâton de chêne" },
    "🪄",
    "arme",
    "COMMUNE",
    8,
    { power: 13 },
    { en: "The wood holds the warmth of spells.", fr: "Le bois retient la chaleur des sorts." },
    340,
  ),
  gear(
    "sceptre-cendre",
    { en: "Ash sceptre", fr: "Sceptre de cendre" },
    "🔥",
    "arme",
    "RARE",
    18,
    { power: 28 },
    { en: "The ash on top never cools.", fr: "La cendre au sommet ne refroidit jamais." },
    1_400,
  ),
  gear(
    "sceptre-givre",
    { en: "Frost sceptre", fr: "Sceptre de givre" },
    "❄️",
    "arme",
    "RARE",
    30,
    { power: 47 },
    {
      en: "The air mists over when you raise it.",
      fr: "L'air se couvre de buée quand on le lève.",
    },
    4_200,
  ),
  gear(
    "grimoire-orage",
    { en: "Storm grimoire", fr: "Grimoire d'orage" },
    "📖",
    "arme",
    "EPIQUE",
    45,
    { power: 78, maxHp: 30 },
    {
      en: "The pages turn on their own when lightning comes.",
      fr: "Les pages tournent seules quand vient l'éclair.",
    },
    11_500,
  ),
  gear(
    "sceptre-crepuscule",
    { en: "Twilight sceptre", fr: "Sceptre du crépuscule" },
    "🌘",
    "arme",
    "EPIQUE",
    62,
    { power: 118 },
    {
      en: "Its gem swallows light instead of giving it back.",
      fr: "Sa gemme avale la lumière au lieu de la refléter.",
    },
    28_000,
  ),
  gear(
    "sceptre-echos",
    { en: "Sceptre of echoes", fr: "Sceptre des échos" },
    "✨",
    "arme",
    "LEGENDAIRE",
    80,
    { power: 182, maxHp: 60 },
    {
      en: "It whispers the names of the Lands before they are spoken.",
      fr: "Il murmure les noms des Terres avant qu'on les prononce.",
    },
  ),

  gear(
    "arc-chasse",
    { en: "Hunting bow", fr: "Arc de chasse" },
    "🏹",
    "arme",
    "COMMUNE",
    1,
    { attack: 3, crit: 3 },
    {
      en: "Enough for a hare, a little light for a wolf.",
      fr: "Assez pour le lièvre, un peu juste pour le loup.",
    },
    60,
  ),
  gear(
    "arc-if",
    { en: "Yew bow", fr: "Arc d'if" },
    "🏹",
    "arme",
    "COMMUNE",
    8,
    { attack: 9, crit: 4 },
    { en: "Supple, quiet, patient.", fr: "Souple, silencieux, patient." },
    340,
  ),
  gear(
    "arc-corne",
    { en: "Horn bow", fr: "Arc de corne" },
    "🏹",
    "arme",
    "RARE",
    18,
    { attack: 20, crit: 7, dodge: 2 },
    { en: "The horn snaps dryly with every shot.", fr: "La corne claque sèchement à chaque tir." },
    1_400,
  ),
  gear(
    "arc-glace",
    { en: "Ice bow", fr: "Arc de glace" },
    "🏹",
    "arme",
    "RARE",
    30,
    { attack: 35, crit: 9, dodge: 3 },
    {
      en: "Its arrows whistle and leave a white streak behind.",
      fr: "Ses flèches sifflent en laissant un trait blanc.",
    },
    4_200,
  ),
  gear(
    "arc-tempete",
    { en: "Storm bow", fr: "Arc de tempête" },
    "🌪️",
    "arme",
    "EPIQUE",
    45,
    { attack: 58, crit: 12, dodge: 4 },
    { en: "The string sings even without wind.", fr: "La corde chante même sans vent." },
    11_500,
  ),
  gear(
    "arc-crepuscule",
    { en: "Twilight bow", fr: "Arc du crépuscule" },
    "🌘",
    "arme",
    "EPIQUE",
    62,
    { attack: 90, crit: 15, dodge: 5 },
    { en: "Nobody ever sees the arrow leave.", fr: "On ne voit jamais partir la flèche." },
    28_000,
  ),
  gear(
    "arc-echos",
    { en: "Bow of echoes", fr: "Arc des échos" },
    "✨",
    "arme",
    "LEGENDAIRE",
    80,
    { attack: 138, crit: 20, dodge: 7 },
    { en: "It aims where the target is going to be.", fr: "Il vise l'endroit où la cible sera." },
    undefined,
  ),

  // Armour.
  gear(
    "tunique-cuir",
    { en: "Leather tunic", fr: "Tunique de cuir" },
    "🥾",
    "armure",
    "COMMUNE",
    1,
    { defense: 3, maxHp: 10 },
    { en: "Boiled leather, tightly stitched.", fr: "Du cuir bouilli, cousu serré." },
    55,
  ),
  gear(
    "robe-apprenti",
    { en: "Apprentice robe", fr: "Robe d'apprenti" },
    "🧥",
    "armure",
    "COMMUNE",
    1,
    { defense: 2, power: 3 },
    { en: "It itches, but it channels well.", fr: "Elle gratte, mais elle canalise." },
    55,
  ),
  gear(
    "cotte-mailles",
    { en: "Chain mail", fr: "Cotte de mailles" },
    "🛡️",
    "armure",
    "COMMUNE",
    10,
    { defense: 10, maxHp: 30 },
    {
      en: "Heavy in the morning, reassuring at night.",
      fr: "Lourde le matin, rassurante le soir.",
    },
    480,
  ),
  gear(
    "armure-plates",
    { en: "Plate armour", fr: "Armure de plates" },
    "🛡️",
    "armure",
    "RARE",
    25,
    { defense: 24, maxHp: 70 },
    {
      en: "You hear its wearer coming a long way off.",
      fr: "On entend arriver celui qui la porte.",
    },
    3_600,
  ),
  gear(
    "armure-runique",
    { en: "Runic armour", fr: "Armure runique" },
    "🔰",
    "armure",
    "EPIQUE",
    40,
    { defense: 42, maxHp: 130, power: 12 },
    {
      en: "The runes warm up when danger draws near.",
      fr: "Les runes se réchauffent quand le danger approche.",
    },
    9_800,
  ),
  gear(
    "harnois-astral",
    { en: "Astral harness", fr: "Harnois astral" },
    "🌌",
    "armure",
    "EPIQUE",
    60,
    { defense: 68, maxHp: 210 },
    {
      en: "The metal has the colour of a moonless sky.",
      fr: "Le métal a la couleur d'un ciel sans lune.",
    },
    24_000,
  ),
  gear(
    "egide-echos",
    { en: "Aegis of echoes", fr: "Égide des échos" },
    "✨",
    "armure",
    "LEGENDAIRE",
    80,
    { defense: 105, maxHp: 320, dodge: 4 },
    {
      en: "It returns blows at the very moment they land.",
      fr: "Elle renvoie les coups au moment où ils sont portés.",
    },
  ),

  // Talismans.
  gear(
    "amulette-simple",
    { en: "Plain amulet", fr: "Amulette simple" },
    "📿",
    "talisman",
    "COMMUNE",
    5,
    { maxHp: 20 },
    { en: "A holed pebble and a lot of hope.", fr: "Un galet percé et beaucoup d'espoir." },
    200,
  ),
  gear(
    "oeil-loup",
    { en: "Wolf eye", fr: "Œil de loup" },
    "🐺",
    "talisman",
    "RARE",
    15,
    { crit: 5, attack: 5 },
    {
      en: "It always stares the same way: straight ahead.",
      fr: "Il fixe toujours la même direction : devant.",
    },
    1_100,
  ),
  gear(
    "coeur-braise",
    { en: "Ember heart", fr: "Cœur de braise" },
    "🔥",
    "talisman",
    "RARE",
    28,
    { power: 18, maxHp: 40 },
    {
      en: "Warm in the palm, burning in a fight.",
      fr: "Tiède au creux de la main, brûlant au combat.",
    },
    3_900,
  ),
  gear(
    "larme-lune",
    { en: "Moon tear", fr: "Larme de lune" },
    "🌙",
    "talisman",
    "EPIQUE",
    42,
    { dodge: 6, maxHp: 90 },
    { en: "It never melts all the way.", fr: "Elle ne fond jamais complètement." },
    10_500,
  ),
  gear(
    "sceau-titan",
    { en: "Titan seal", fr: "Sceau du titan" },
    "🗿",
    "talisman",
    "EPIQUE",
    58,
    { attack: 40, defense: 25, maxHp: 140 },
    {
      en: "The weight of a mountain, held by a chain.",
      fr: "Le poids d'une montagne, tenu par une chaîne.",
    },
    26_000,
  ),
  gear(
    "couronne-echos",
    { en: "Crown of echoes", fr: "Couronne des échos" },
    "👑",
    "talisman",
    "LEGENDAIRE",
    78,
    { attack: 60, power: 60, defense: 40, maxHp: 260, crit: 8 },
    {
      en: "Worn by those who have heard the Lands answer.",
      fr: "Portée par ceux qui ont entendu les Terres répondre.",
    },
  ),

  // Consumables.
  {
    id: "potion-mineure",
    name: { en: "Minor potion", fr: "Potion mineure" },
    emoji: "🧪",
    kind: "CONSOMMABLE",
    rarity: "COMMUNE",
    description: { en: "Restores 40 health.", fr: "Rend 40 points de vie." },
    effect: { hp: 40 },
    price: 45,
    sellPrice: 11,
  },
  {
    id: "potion-majeure",
    name: { en: "Major potion", fr: "Potion majeure" },
    emoji: "⚗️",
    kind: "CONSOMMABLE",
    rarity: "RARE",
    description: { en: "Restores 180 health.", fr: "Rend 180 points de vie." },
    effect: { hp: 180 },
    price: 260,
    sellPrice: 65,
    level: 20,
  },
  {
    id: "elixir-supreme",
    name: { en: "Supreme elixir", fr: "Élixir suprême" },
    emoji: "🫗",
    kind: "CONSOMMABLE",
    rarity: "EPIQUE",
    description: { en: "Restores 600 health.", fr: "Rend 600 points de vie." },
    effect: { hp: 600 },
    price: 1_500,
    sellPrice: 375,
    level: 45,
  },
  {
    id: "ration-voyage",
    name: { en: "Travel ration", fr: "Ration de voyage" },
    emoji: "🥖",
    kind: "CONSOMMABLE",
    rarity: "COMMUNE",
    description: { en: "Restores 3 energy.", fr: "Rend 3 points d'énergie." },
    effect: { energy: 3 },
    price: 320,
    sellPrice: 40,
  },
  {
    id: "festin-auberge",
    name: { en: "Inn feast", fr: "Festin d'auberge" },
    emoji: "🍲",
    kind: "CONSOMMABLE",
    rarity: "RARE",
    description: { en: "Restores 8 energy.", fr: "Rend 8 points d'énergie." },
    effect: { energy: 8 },
    price: 900,
    sellPrice: 120,
  },
  {
    id: "encens-savoir",
    name: { en: "Incense of lore", fr: "Encens du savoir" },
    emoji: "🕯️",
    kind: "CONSOMMABLE",
    rarity: "RARE",
    description: {
      en: "Grants 400 experience right away.",
      fr: "Accorde immédiatement 400 points d'expérience.",
    },
    effect: { xp: 400 },
    price: 700,
    sellPrice: 90,
    level: 10,
  },

  // Materials (loot, crafting).
  material("peau-loup", { en: "Wolf pelt", fr: "Peau de loup" }, "🐺", "COMMUNE", 14, {
    en: "Thick, and still warm.",
    fr: "Épaisse, encore chaude.",
  }),
  material("croc-sanglier", { en: "Boar tusk", fr: "Croc de sanglier" }, "🐗", "COMMUNE", 18, {
    en: "Slightly chipped, still sharp.",
    fr: "Un peu ébréché, toujours tranchant.",
  }),
  material("bois-noueux", { en: "Gnarled wood", fr: "Bois noueux" }, "🪵", "COMMUNE", 10, {
    en: "Gnarled, and therefore sturdy.",
    fr: "Noueux, donc solide.",
  }),
  material("fer-brut", { en: "Raw iron", fr: "Fer brut" }, "🪨", "COMMUNE", 22, {
    en: "A heavy stone that reddens in the fire.",
    fr: "Un caillou lourd qui rougit au feu.",
  }),
  material("lingot-fer", { en: "Iron ingot", fr: "Lingot de fer" }, "🧱", "COMMUNE", 70, {
    en: "Melted, poured, cooled: ready to become a blade.",
    fr: "Fondu, coulé, refroidi : prêt à devenir lame.",
  }),
  material("os-blanchi", { en: "Bleached bone", fr: "Os blanchi" }, "🦴", "COMMUNE", 26, {
    en: "The sun did the rest of the work.",
    fr: "Le soleil a fait le reste du travail.",
  }),
  material(
    "essence-spectrale",
    { en: "Spectral essence", fr: "Essence spectrale" },
    "👻",
    "RARE",
    120,
    { en: "It shies away from the light of a gaze.", fr: "Elle fuit la lumière du regard." },
  ),
  material("ecaille-drake", { en: "Drake scale", fr: "Écaille de drake" }, "🐉", "RARE", 240, {
    en: "Harder than steel, lighter than leather.",
    fr: "Plus dure que l'acier, plus légère que le cuir.",
  }),
  material("fil-argent", { en: "Silver thread", fr: "Fil d'argent" }, "🧵", "RARE", 180, {
    en: "You sew with it, and you bind runes with it too.",
    fr: "On coud avec, on lie des runes aussi.",
  }),
  material("poudre-astrale", { en: "Astral powder", fr: "Poudre astrale" }, "🌠", "EPIQUE", 520, {
    en: "It hangs a second too long before settling.",
    fr: "Elle flotte une seconde de trop avant de retomber.",
  }),
  material(
    "coeur-elementaire",
    { en: "Elemental heart", fr: "Cœur élémentaire" },
    "💠",
    "EPIQUE",
    900,
    {
      en: "It beats to the rhythm of a distant storm.",
      fr: "Il bat au rythme d'un orage lointain.",
    },
  ),
  material("eclat-echo", { en: "Echo shard", fr: "Éclat d'écho" }, "🔷", "LEGENDAIRE", 1_800, {
    en: "A piece of the Lands' memory, hard as glass.",
    fr: "Un morceau de mémoire des Terres, dur comme du verre.",
  }),

  // Treasures: no use beyond being sold back at a high price.
  {
    id: "perle-riviere",
    name: { en: "River pearl", fr: "Perle de rivière" },
    emoji: "🫧",
    kind: "TRESOR",
    rarity: "COMMUNE",
    description: {
      en: "Pretty, round, and sought after in town.",
      fr: "Jolie, ronde, et recherchée en ville.",
    },
    sellPrice: 150,
  },
  {
    id: "calice-terni",
    name: { en: "Tarnished chalice", fr: "Calice terni" },
    emoji: "🏆",
    kind: "TRESOR",
    rarity: "RARE",
    description: {
      en: "The silver is black, but silver is still silver.",
      fr: "L'argent est noir, mais l'argent reste l'argent.",
    },
    sellPrice: 700,
  },
  {
    id: "statuette-jade",
    name: { en: "Jade statuette", fr: "Statuette de jade" },
    emoji: "🗿",
    kind: "TRESOR",
    rarity: "EPIQUE",
    description: {
      en: "A forgotten god, carved by steady hands.",
      fr: "Un dieu oublié, sculpté par des mains sûres.",
    },
    sellPrice: 2_600,
  },
  {
    id: "gemme-crepuscule",
    name: { en: "Twilight gem", fr: "Gemme du crépuscule" },
    emoji: "💎",
    kind: "TRESOR",
    rarity: "LEGENDAIRE",
    description: {
      en: "It changes colour depending on who looks at it.",
      fr: "Elle change de couleur selon qui la regarde.",
    },
    sellPrice: 9_000,
  },

  // Relics: proof of passage, and chapter objectives.
  {
    id: "relique-cor-brume",
    name: { en: "Horn of the mist", fr: "Cor de la brume" },
    emoji: "📯",
    kind: "RELIQUE",
    rarity: "LEGENDAIRE",
    description: {
      en: "Its call scatters the mists of Lowwood.",
      fr: "Son appel disperse les brumes des Bois-Bas.",
    },
    sellPrice: 0,
    tradable: false,
  },
  {
    id: "relique-clef-tombes",
    name: { en: "Key of the tombs", fr: "Clef des tombes" },
    emoji: "🗝️",
    kind: "RELIQUE",
    rarity: "LEGENDAIRE",
    description: {
      en: "It opens what should never have been closed again.",
      fr: "Elle ouvre ce qui n'aurait jamais dû être refermé.",
    },
    sellPrice: 0,
    tradable: false,
  },
  {
    id: "relique-braise-eternelle",
    name: { en: "Eternal ember", fr: "Braise éternelle" },
    emoji: "🔥",
    kind: "RELIQUE",
    rarity: "LEGENDAIRE",
    description: {
      en: "Taken from the heart of the Black Forges, it never dies out.",
      fr: "Prise au cœur des Forges Noires, elle ne s'éteint pas.",
    },
    sellPrice: 0,
    tradable: false,
  },
  {
    id: "relique-coeur-gel",
    name: { en: "Heart of frost", fr: "Cœur de gel" },
    emoji: "🧊",
    kind: "RELIQUE",
    rarity: "LEGENDAIRE",
    description: { en: "The frozen pulse of Highfrost.", fr: "Le pouls figé du Haut-Givre." },
    sellPrice: 0,
    tradable: false,
  },
  {
    id: "relique-oeil-tempete",
    name: { en: "Eye of the storm", fr: "Œil de la tempête" },
    emoji: "🌀",
    kind: "RELIQUE",
    rarity: "LEGENDAIRE",
    description: {
      en: "A perfect calm, sealed inside a sphere.",
      fr: "Un calme parfait, enfermé dans une sphère.",
    },
    sellPrice: 0,
    tradable: false,
  },
  {
    id: "relique-voile-astral",
    name: { en: "Astral veil", fr: "Voile astral" },
    emoji: "🌌",
    kind: "RELIQUE",
    rarity: "LEGENDAIRE",
    description: {
      en: "Woven between two nights, it weighs nothing.",
      fr: "Tissé entre deux nuits, il ne pèse rien.",
    },
    sellPrice: 0,
    tradable: false,
  },
  {
    id: "relique-derniere-voix",
    name: { en: "Last voice", fr: "Dernière voix" },
    emoji: "🔊",
    kind: "RELIQUE",
    rarity: "LEGENDAIRE",
    description: {
      en: "What the Lands had to say, finally audible.",
      fr: "Ce que les Terres avaient à dire, enfin audible.",
    },
    sellPrice: 0,
    tradable: false,
  },
] as const;

const BY_ID = new Map(ADVENTURE_ITEMS.map((item) => [item.id, item]));

export function findAdventureItem(itemId: string): AdventureItemDefinition | undefined {
  return BY_ID.get(itemId);
}

/** Definition of an item whose id comes from the code (loot, recipe, shop). */
export function requireAdventureItem(itemId: string): AdventureItemDefinition {
  const item = BY_ID.get(itemId);
  if (!item) throw new Error(`Unknown adventure item: ${itemId}`);
  return item;
}

/** Emoji plus name, the form every list and message uses. */
export function adventureItemLabel(itemId: string, locale: string): string {
  const item = BY_ID.get(itemId);
  return item ? `${item.emoji} ${localized(item.name, locale)}` : itemId;
}

/** Items the merchant offers, cheapest first. */
export function adventureShopItems(): AdventureItemDefinition[] {
  return ADVENTURE_ITEMS.filter((item) => item.price !== undefined).sort(
    (a, b) => (a.price ?? 0) - (b.price ?? 0),
  );
}

export function adventureItemsBySlot(slot: AdventureItemSlot): AdventureItemDefinition[] {
  return ADVENTURE_ITEMS.filter((item) => item.slot === slot);
}
