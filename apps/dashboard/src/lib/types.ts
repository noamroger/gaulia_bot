export interface Session {
  userId: string;
  username: string;
  avatar: string | null;
  manageableGuilds: ManageableGuild[];
  isOwner: boolean;
}

export interface ManageableGuild {
  id: string;
  name: string;
  icon: string | null;
  /** Faux si l'utilisateur peut gérer ce serveur côté Discord mais que Gaulia n'y est pas encore. */
  botPresent: boolean;
  /** Lien d'invitation Discord pré-rempli (non-null uniquement quand botPresent est faux). */
  inviteUrl: string | null;
}

export interface GuildChannelOption {
  id: string;
  name: string;
  parentName: string | null;
}

export interface GuildRoleOption {
  id: string;
  name: string;
  color: number;
}

export interface GuildResources {
  channels: GuildChannelOption[];
  roles: GuildRoleOption[];
}

export type SanctionType = "delete" | "warn" | "timeout" | "kick" | "ban";

export interface Sanction {
  type: SanctionType;
  timeoutMinutes: number;
}

export interface AutomodRules {
  links: { enabled: boolean; mode: "blocklist" | "allowlist"; domains: string[]; action: Sanction };
  invites: { enabled: boolean; allowedInvites: string[]; action: Sanction };
  badWords: { enabled: boolean; words: string[]; action: Sanction };
  mentions: { enabled: boolean; maxMentions: number; action: Sanction };
  caps: { enabled: boolean; percent: number; minLength: number; action: Sanction };
  duplicates: { enabled: boolean; maxRepeats: number; action: Sanction };
  flood: { enabled: boolean; maxMessages: number; perSeconds: number; action: Sanction };
}

export interface AutomodSettings {
  guildId: string;
  rules: AutomodRules;
  ignoredChannelIds: string[];
  ignoredRoleIds: string[];
  exemptStaff: boolean;
}

export type EscalationAction = "timeout" | "kick" | "ban";

export interface EscalationStep {
  warnCount: number;
  action: EscalationAction;
  timeoutMinutes: number;
}

export type LoopMode = "NONE" | "TRACK" | "QUEUE";

export interface GuildSettings {
  premium: boolean;
  modLogChannelId: string | null;
  automodLogChannelId: string | null;
  dmOnSanction: boolean;
  warnEscalation: EscalationStep[];
  musicChannelId: string | null;
  djRoleId: string | null;
  musicVolume: number;
  musicDefaultLoop: LoopMode;
  musicStay247: boolean;
  /** Salons où les commandes fun sont utilisables ; vide = tous les salons. */
  funChannelIds: string[];
  /** Salons où /blindtest peut être lancé ; vide = tous les salons. */
  blindtestChannelIds: string[];
  blindtestDisabledCategories: string[];
  /** Module aventure : actif sur le serveur, et salons où il est jouable. */
  adventureEnabled: boolean;
  adventureChannelMode: AdventureChannelMode;
  adventureChannelIds: string[];
}

/** « ALLOWLIST » : jouable uniquement dans les salons listés ; « BLOCKLIST » : partout sauf eux. */
export type AdventureChannelMode = "ALLOWLIST" | "BLOCKLIST";

export type AdventureClass = "GUERRIER" | "MAGE" | "RODEUR";

/** Une ligne de la liste des joueurs du panel admin. */
export interface AdventurePlayer {
  userId: string;
  username: string | null;
  characterClass: AdventureClass;
  level: number;
  totalXp: number;
  gold: number;
  echoes: number;
  actIndex: number;
  chapterIndex: number;
  storyEndedAt: string | null;
  explorations: number;
  dungeonClears: number;
  lastPlayedAt: string | null;
  createdAt: string;
}

export interface AdventureCharacter extends AdventurePlayer {
  xp: number;
  statPoints: number;
  might: number;
  agility: number;
  spirit: number;
  hp: number;
  energy: number;
  victories: number;
  defeats: number;
  streak: number;
  bestStreak: number;
  lastDungeonAt: string | null;
  upgrades: number;
  trades: number;
}

export interface AdventureInventoryRow {
  id: number;
  itemId: string;
  quantity: number;
  equipped: boolean;
  /** Palier de renforcement de l'exemplaire du joueur (0 à 10). */
  upgradeLevel: number;
}

/** Proposition d'échange encore ouverte, affichée sur la fiche du joueur. */
export interface AdventurePendingTrade {
  id: number;
  initiatorId: string;
  initiatorName: string | null;
  targetId: string;
  targetName: string | null;
  offeredItems: { itemId: string; quantity: number }[];
  offeredGold: number;
  requestedItems: { itemId: string; quantity: number }[];
  requestedGold: number;
  expiresAt: string;
}

export interface AdventureQuestRow {
  id: number;
  kind: "DAILY" | "WEEKLY";
  questId: string;
  /** Libellé complet calculé par l'API (« Explorer 12 fois »). */
  label: string;
  target: number;
  progress: number;
  claimedAt: string | null;
  periodStart: string;
}

export interface AdventureLogRow {
  id: number;
  type: "STORY" | "DUNGEON" | "LEVEL_UP" | "TRADE" | "ADMIN";
  message: string;
  actorId: string | null;
  createdAt: string;
}

export interface AdventurePlayerDetail {
  character: AdventureCharacter;
  items: AdventureInventoryRow[];
  quests: AdventureQuestRow[];
  achievements: { achievementId: string; unlockedAt: string }[];
  logs: AdventureLogRow[];
  pendingTrades: AdventurePendingTrade[];
}

export interface AdventureCatalogueItem {
  id: string;
  name: string;
  emoji: string;
  kind: "EQUIPEMENT" | "CONSOMMABLE" | "MATERIAU" | "TRESOR" | "RELIQUE";
  rarity: "COMMUNE" | "RARE" | "EPIQUE" | "LEGENDAIRE";
  slot: string | null;
  level: number | null;
  price: number | null;
  sellPrice: number;
  description: string;
  /** Faux pour les objets qui ne peuvent pas passer d'un joueur à l'autre (reliques du scénario). */
  tradable: boolean;
}

export interface AdventureCatalogue {
  items: AdventureCatalogueItem[];
  acts: {
    id: string;
    title: string;
    emoji: string;
    chapters: { id: string; title: string; levelRequirement: number; echoCost: number }[];
  }[];
  totalChapters: number;
  maxLevel: number;
  maxEnergy: number;
  maxUpgrade: number;
}

/** Corps du PATCH d'intervention : seuls les champs envoyés sont appliqués. */
export interface AdventureIntervention {
  xp?: number;
  gold?: number;
  echoes?: number;
  energy?: number;
  statPoints?: number;
  level?: number;
  items?: { itemId: string; quantity: number }[];
  reason?: string;
}

export interface BlindtestPreset {
  id: string;
  name: string;
  description: string;
  trackCount: number;
}

export interface BlindtestTrack {
  uri: string | null;
  title: string;
  artist: string;
  durationMs: number;
  /** Extrait Spotify ; null = recherche SoundCloud pendant la partie. */
  preview: string | null;
}

export interface BlindtestPlaylistSummary {
  id: string;
  name: string;
  trackCount: number;
  updatedAt: string;
}

export interface BlindtestPlaylist extends BlindtestPlaylistSummary {
  tracks: BlindtestTrack[];
}

export interface SpotifyImport {
  name: string;
  tracks: BlindtestTrack[];
}

export interface PremiumOffer {
  id: "week" | "month";
  label: string;
  /** Coût en crédits. */
  cost: number;
  durationLabel: string;
}

/** D'où vient le premium : abonnement Discord payant, ou crédits échangés. */
export type PremiumSource = "SUBSCRIPTION" | "CREDITS";

export interface PremiumStatus {
  premium: boolean;
  /** Source affichée quand les deux coexistent : l'abonnement payant prime. */
  source: PremiumSource | null;
  subscription: {
    active: boolean;
    /** Prochain renouvellement, null si Discord n'annonce pas d'échéance. */
    renewsAt: string | null;
  };
  credits: {
    active: boolean;
    startedAt: string | null;
    expiresAt: string | null;
  };
  /** Solde de crédits de l'utilisateur connecté. */
  balance: number;
  offers: PremiumOffer[];
}

export interface PremiumRedeemResult {
  premium: boolean;
  premiumGrantedUntil: string;
  balance: number;
  offerId: PremiumOffer["id"];
}

export type CreditTransactionType = "VOTE" | "PREMIUM_REDEEM" | "ADMIN_ADJUST" | "PREMIUM_REFUND";

export interface CreditTransaction {
  id: number;
  type: CreditTransactionType;
  /** Positif pour un gain, négatif pour une dépense. */
  amount: number;
  balanceAfter: number;
  guildId: string | null;
  reason: string | null;
  createdAt: string;
}

export interface CreditsOverview {
  balance: number;
  totalEarned: number;
  voteCount: number;
  lastVoteAt: string | null;
  creditsPerVote: number;
  offers: PremiumOffer[];
  transactions: CreditTransaction[];
}

export interface AdminCreditAccount {
  userId: string;
  username: string | null;
  avatar: string | null;
  balance: number;
  totalEarned: number;
  voteCount: number;
  lastVoteAt: string | null;
  updatedAt: string;
}

export interface AdminGuild {
  id: string;
  name: string | null;
  icon: string | null;
  memberCount: number;
  premium: boolean;
  premiumExpiresAt: string | null;
  createdAt: string;
}

export interface GuildDataSummary {
  guildId: string;
  configured: boolean;
  name: string | null;
  moderationCases: number;
  warns: number;
  automodConfig: boolean;
  musicSettings: boolean;
  blindtestPlaylists: number;
  adventureSettings: boolean;
  premiumEntitlements: number;
}

export interface UserDataSummary {
  userId: string;
  moderationCasesAsTarget: number;
  moderationCasesAsModerator: number;
  warnsAsTarget: number;
  warnsAsModerator: number;
  premiumEntitlements: number;
  creditBalance: number;
  topggVotes: number;
  /** Niveau du personnage d'aventure supprimé avec le compte, null s'il n'y en a pas. */
  adventureLevel: number | null;
}

export interface AdminShard {
  shardId: number;
  guildCount: number;
  memberCount: number;
  ping: number;
  memoryMb: number;
  playerCount: number;
  online: boolean;
  startedAt: string;
  updatedAt: string;
}

export interface AdminStats {
  days: number;
  guildCount: number;
  memberCount: number;
  playerCount: number;
  shardCount: number;
  onlineShardCount: number;
  averagePing: number | null;
  commands: {
    totalAllTime: number;
    totalInRange: number;
    daily: { date: string; count: number }[];
    topCommands: { commandName: string; count: number }[];
    /** Toutes les catégories connues, même exclues, avec leur total sur la période. */
    categories: { category: string; count: number }[];
  };
  history: ShardMetricHistory;
  shards: AdminShard[];
}

export interface ShardMetricPoint {
  /** Début de la tranche (ISO). */
  at: string;
  /** null : aucun shard n'a envoyé de heartbeat pendant la tranche. */
  guildCount: number | null;
  memberCount: number | null;
  ping: number | null;
}

export interface ShardMetricHistory {
  stepMinutes: number;
  points: ShardMetricPoint[];
}

/** Totaux publics de la page d'accueil (GET /stats). */
export interface PublicStats {
  online: boolean;
  guildCount: number;
  memberCount: number;
  commandsLast30Days: number;
}
