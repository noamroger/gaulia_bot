/**
 * Régions explorables. Une zone s'ouvre quand le scénario atteint l'acte correspondant : la carte
 * suit donc l'histoire, et le joueur ne peut pas sauter de palier en farmant.
 */

export interface ZoneLoot {
  itemId: string;
  /** Poids relatif dans le tirage de la trouvaille (plus élevé = plus fréquent). */
  weight: number;
  min: number;
  max: number;
}

export interface ZoneDefinition {
  id: string;
  name: string;
  emoji: string;
  description: string;
  /** Index d'acte à partir duquel la zone est accessible (0 = dès le début). */
  minAct: number;
  /** Niveau conseillé, affiché sur la carte et vérifié au voyage. */
  minLevel: number;
  monsters: string[];
  loot: ZoneLoot[];
  /** Multiplicateurs sur les gains de base (voir data/pacing.ts). */
  xpMultiplier: number;
  goldMultiplier: number;
  /** Textes d'ambiance tirés au hasard quand l'exploration ne donne rien de notable. */
  ambiances: string[];
}

export const ZONES: readonly ZoneDefinition[] = [
  {
    id: "clairiere",
    name: "Clairière des Semailles",
    emoji: "🌾",
    description: "Des champs, un puits, et des histoires qu'on raconte le soir.",
    minAct: 0,
    minLevel: 1,
    monsters: ["lapin-hargneux", "loup-gris", "sanglier-furieux"],
    loot: [
      { itemId: "bois-noueux", weight: 5, min: 1, max: 3 },
      { itemId: "peau-loup", weight: 3, min: 1, max: 2 },
      { itemId: "fer-brut", weight: 2, min: 1, max: 2 },
      { itemId: "perle-riviere", weight: 1, min: 1, max: 1 },
    ],
    xpMultiplier: 1,
    goldMultiplier: 1,
    ambiances: [
      "Le vent couche les blés et les relève, sans rien te dire.",
      "Un vieux te salue de loin, puis retourne à son puits.",
      "Tu suis un sentier jusqu'à une borne effacée par la pluie.",
    ],
  },
  {
    id: "bois-bas",
    name: "Bois-Bas",
    emoji: "🌲",
    description: "La brume y reste accrochée aux troncs jusqu'à midi.",
    minAct: 0,
    minLevel: 8,
    monsters: ["loup-gris", "detrousseur", "araignee-sylve", "ours-bois-bas"],
    loot: [
      { itemId: "bois-noueux", weight: 5, min: 2, max: 4 },
      { itemId: "fil-argent", weight: 2, min: 1, max: 2 },
      { itemId: "croc-sanglier", weight: 3, min: 1, max: 2 },
      { itemId: "perle-riviere", weight: 1, min: 1, max: 1 },
    ],
    xpMultiplier: 1.15,
    goldMultiplier: 1.1,
    ambiances: [
      "Un craquement, puis plus rien. La brume avale les bruits.",
      "Tu trouves un campement éteint depuis longtemps.",
      "Des marques fraîches sur un tronc : quelque chose est passé avant toi.",
    ],
  },
  {
    id: "tombes",
    name: "Nécropole des Sept Tombes",
    emoji: "⚰️",
    description: "Sept dalles, six noms. La septième n'a jamais été gravée.",
    minAct: 1,
    minLevel: 18,
    monsters: ["goule-affamee", "spectre-plaintif", "chevalier-tombe"],
    loot: [
      { itemId: "os-blanchi", weight: 5, min: 2, max: 4 },
      { itemId: "essence-spectrale", weight: 3, min: 1, max: 2 },
      { itemId: "lingot-fer", weight: 2, min: 1, max: 2 },
      { itemId: "calice-terni", weight: 1, min: 1, max: 1 },
    ],
    xpMultiplier: 1.3,
    goldMultiplier: 1.2,
    ambiances: [
      "Tes pas résonnent deux fois : une fois pour toi, une fois pour autre chose.",
      "Une bougie brûle encore sur une tombe. Personne alentour.",
      "Le vent passe entre les dalles avec un bruit de voix.",
    ],
  },
  {
    id: "forges",
    name: "Forges Noires",
    emoji: "⚒️",
    description: "On y bat le métal depuis si longtemps que le ciel est resté gris.",
    minAct: 2,
    minLevel: 30,
    monsters: ["forgeron-cendre", "golem-scories", "salamandre-forge"],
    loot: [
      { itemId: "fer-brut", weight: 5, min: 3, max: 6 },
      { itemId: "lingot-fer", weight: 3, min: 1, max: 3 },
      { itemId: "coeur-elementaire", weight: 1, min: 1, max: 1 },
      { itemId: "ecaille-drake", weight: 2, min: 1, max: 2 },
    ],
    xpMultiplier: 1.45,
    goldMultiplier: 1.35,
    ambiances: [
      "Un marteau frappe au loin, toujours au même rythme.",
      "La suie se dépose sur tes épaules comme une neige tiède.",
      "Tu croises un convoi de minerai, personne pour le mener.",
    ],
  },
  {
    id: "haut-givre",
    name: "Haut-Givre",
    emoji: "🏔️",
    description: "Au-dessus des nuages, là où le froid tient lieu de loi.",
    minAct: 3,
    minLevel: 42,
    monsters: ["veneur-givre", "drake-blanc", "colosse-gel"],
    loot: [
      { itemId: "ecaille-drake", weight: 4, min: 1, max: 3 },
      { itemId: "coeur-elementaire", weight: 2, min: 1, max: 2 },
      { itemId: "poudre-astrale", weight: 1, min: 1, max: 1 },
      { itemId: "statuette-jade", weight: 1, min: 1, max: 1 },
    ],
    xpMultiplier: 1.6,
    goldMultiplier: 1.45,
    ambiances: [
      "La pente monte encore. Tu arrêtes de compter les heures.",
      "Une empreinte large comme un bouclier, déjà à demi comblée.",
      "Le silence ici est si complet qu'il siffle.",
    ],
  },
  {
    id: "cote-tempetes",
    name: "Côte des Tempêtes",
    emoji: "🌊",
    description: "Des falaises, des épaves, et une mer qui ne se calme jamais.",
    minAct: 4,
    minLevel: 55,
    monsters: ["corsaire-tempete", "noye-rancunier", "drake-orage"],
    loot: [
      { itemId: "essence-spectrale", weight: 4, min: 2, max: 4 },
      { itemId: "ecaille-drake", weight: 3, min: 2, max: 4 },
      { itemId: "poudre-astrale", weight: 2, min: 1, max: 2 },
      { itemId: "calice-terni", weight: 1, min: 1, max: 1 },
    ],
    xpMultiplier: 1.75,
    goldMultiplier: 1.6,
    ambiances: [
      "Une cloche sonne au large, sans navire pour la porter.",
      "L'écume dessine des formes sur le sable, puis les efface.",
      "Tu fouilles une épave : quelqu'un est passé avant toi, récemment.",
    ],
  },
  {
    id: "voute-astrale",
    name: "Voûte Astrale",
    emoji: "🌌",
    description: "Un plafond d'étoiles sous la terre. Personne ne sait qui les a posées.",
    minAct: 5,
    minLevel: 68,
    monsters: ["veilleur-astral", "marcheur-vide", "choeur-brise"],
    loot: [
      { itemId: "poudre-astrale", weight: 5, min: 2, max: 4 },
      { itemId: "eclat-echo", weight: 1, min: 1, max: 1 },
      { itemId: "coeur-elementaire", weight: 3, min: 1, max: 3 },
      { itemId: "statuette-jade", weight: 1, min: 1, max: 1 },
    ],
    xpMultiplier: 1.9,
    goldMultiplier: 1.75,
    ambiances: [
      "Une étoile se détache et tombe lentement, très loin.",
      "Ton ombre part dans une direction que la lumière n'explique pas.",
      "Tu entends ton propre nom, prononcé par ta propre voix.",
    ],
  },
  {
    id: "coeur-echos",
    name: "Cœur des Échos",
    emoji: "✨",
    description: "L'endroit d'où les Terres se souviennent. Et où elles répondent.",
    minAct: 6,
    minLevel: 82,
    monsters: ["reflet-soi", "silence-ancien", "choeur-brise"],
    loot: [
      { itemId: "eclat-echo", weight: 4, min: 1, max: 2 },
      { itemId: "poudre-astrale", weight: 4, min: 3, max: 6 },
      { itemId: "gemme-crepuscule", weight: 1, min: 1, max: 1 },
    ],
    xpMultiplier: 2.1,
    goldMultiplier: 1.9,
    ambiances: [
      "Tout ce que tu dis revient, un instant plus tard, légèrement différent.",
      "Le sol porte tes traces avant que tu poses le pied.",
      "Une porte sans mur s'ouvre, puis se referme sur rien.",
    ],
  },
] as const;

const BY_ID = new Map(ZONES.map((zone) => [zone.id, zone]));

export function findZone(zoneId: string): ZoneDefinition | undefined {
  return BY_ID.get(zoneId);
}

export function requireZone(zoneId: string): ZoneDefinition {
  const zone = BY_ID.get(zoneId);
  if (!zone) throw new Error(`Zone d'aventure inconnue : ${zoneId}`);
  return zone;
}

/** Zones ouvertes à un personnage, d'après l'acte atteint (le niveau n'est qu'un conseil affiché). */
export function zonesForAct(actIndex: number): ZoneDefinition[] {
  return ZONES.filter((zone) => zone.minAct <= actIndex);
}
