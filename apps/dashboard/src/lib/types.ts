export interface Session {
  userId: string;
  username: string;
  avatar: string | null;
  /** Verified Discord address (`email` scope). Null for a session opened before that scope. */
  email: string | null;
  manageableGuilds: ManageableGuild[];
  isOwner: boolean;
}

export interface ManageableGuild {
  id: string;
  name: string;
  icon: string | null;
  /** False when the user can manage this guild on Discord but Gaulia is not in it yet. */
  botPresent: boolean;
  /** Pre-filled Discord invite link (non-null only when botPresent is false). */
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
  /** Channels where fun commands are allowed; empty = every channel. */
  funChannelIds: string[];
  /** Channels where /blindtest can be started; empty = every channel. */
  blindtestChannelIds: string[];
  blindtestDisabledCategories: string[];
  /** Adventure module: enabled on the guild, and channels where it can be played. */
  adventureEnabled: boolean;
  adventureChannelMode: AdventureChannelMode;
  adventureChannelIds: string[];
}

/** "ALLOWLIST": playable only in the listed channels; "BLOCKLIST": everywhere except them. */
export type AdventureChannelMode = "ALLOWLIST" | "BLOCKLIST";

export type AdventureClass = "GUERRIER" | "MAGE" | "RODEUR";

/** One row of the admin panel player list. */
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
  /** Upgrade tier of the player's own copy (0 to 10). */
  upgradeLevel: number;
}

/** Trade offer still open, shown on the player sheet. */
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
  /** Full sentence built by the API, ready to display. */
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
  /** False for items that cannot move from one player to another (story relics). */
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

/** Intervention PATCH body: only the fields actually sent are applied. */
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
  /** Spotify preview; null = SoundCloud lookup during the game. */
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
  /** Cost in credits. */
  cost: number;
  durationLabel: string;
}

/** Where premium comes from: paid Discord subscription, or redeemed credits. */
export type PremiumSource = "SUBSCRIPTION" | "CREDITS";

export interface PremiumStatus {
  premium: boolean;
  /** Source shown when both coexist: the paid subscription wins. */
  source: PremiumSource | null;
  subscription: {
    active: boolean;
    /** Next renewal, null when Discord announces no due date. */
    renewsAt: string | null;
  };
  credits: {
    active: boolean;
    startedAt: string | null;
    expiresAt: string | null;
  };
  /** Credit balance of the signed-in user. */
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
  /** Positive for a gain, negative for a spend. */
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
  language: string;
  /** Discord subscription enabled; `premiumActive` says whether it is still valid today. */
  premium: boolean;
  premiumExpiresAt: string | null;
  premiumGrantedAt: string | null;
  premiumGrantedUntil: string | null;
  premiumActive: boolean;
  premiumSource: "SUBSCRIPTION" | "CREDITS" | null;
  modLogChannelId: string | null;
  automodLogChannelId: string | null;
  djRoleId: string | null;
  musicChannelId: string | null;
  funChannelCount: number;
  automodConfigured: boolean;
  moderationConfigured: boolean;
  musicConfigured: boolean;
  /** Null when the adventure module has never been configured on this guild. */
  adventureEnabled: boolean | null;
  moderationCaseCount: number;
  warnCount: number;
  playlistCount: number;
  createdAt: string;
  updatedAt: string;
}

/** One page of the admin panel guild list, filtered and sorted by the API. */
export interface AdminGuildPage {
  items: AdminGuild[];
  total: number;
  totalPresent: number;
  page: number;
  perPage: number;
  pageCount: number;
  languages: string[];
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
  /** Level of the adventure character deleted along with the account, null when there is none. */
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
    /** Every known category, excluded ones included, with its total over the range. */
    categories: { category: string; count: number }[];
  };
  history: ShardMetricHistory;
  shards: AdminShard[];
}

export interface ShardMetricPoint {
  /** Start of the slice (ISO). */
  at: string;
  /** null: no shard sent a heartbeat during the slice. */
  guildCount: number | null;
  memberCount: number | null;
  ping: number | null;
}

export interface ShardMetricHistory {
  stepMinutes: number;
  points: ShardMetricPoint[];
}

/** Public home page totals (GET /stats). */
export interface PublicStats {
  online: boolean;
  guildCount: number;
  memberCount: number;
  commandsLast30Days: number;
}

// --- My data (GET /me/data) ---
// Mirrors `UserDataExport` on the API side: dates arrive as ISO strings through JSON.

export interface ExportedModerationCase {
  guildId: string;
  guildName: string | null;
  caseNumber: number;
  type: string;
  reason: string | null;
  durationSecs: number | null;
  createdAt: string;
}

export interface ExportedWarn {
  guildId: string;
  guildName: string | null;
  reason: string | null;
  active: boolean;
  createdAt: string;
}

export interface ExportedCreditTransaction {
  type: string;
  amount: number;
  balanceAfter: number;
  guildId: string | null;
  guildName: string | null;
  reason: string | null;
  createdAt: string;
}

export interface ExportedCredits {
  balance: number;
  totalEarned: number;
  voteCount: number;
  lastVoteAt: string | null;
  createdAt: string;
  transactions: ExportedCreditTransaction[];
}

export interface ExportedVote {
  voteId: string;
  weight: number;
  votedAt: string;
}

export interface ExportedPremiumEntitlement {
  entitlementId: string;
  skuId: string;
  guildId: string | null;
  guildName: string | null;
  startsAt: string | null;
  endsAt: string | null;
  deleted: boolean;
}

export interface ExportedAdventure {
  characterClass: string;
  level: number;
  totalXp: number;
  gold: number;
  echoes: number;
  zoneId: string;
  actIndex: number;
  chapterIndex: number;
  storyEndedAt: string | null;
  explorations: number;
  victories: number;
  defeats: number;
  dungeonClears: number;
  lastPlayedAt: string | null;
  createdAt: string;
  items: { itemId: string; quantity: number; equipped: boolean; upgradeLevel: number }[];
  quests: unknown[];
  achievements: { achievementId: string; unlockedAt: string }[];
  logs: { type: string; message: string; createdAt: string }[];
  tradeHistory: unknown[];
}

export interface UserDataExport {
  version: number;
  userId: string;
  generatedAt: string;
  sanctionsReceived: ExportedModerationCase[];
  warnsReceived: ExportedWarn[];
  moderatorActivity: { moderationCases: number; warns: number };
  credits: ExportedCredits | null;
  topggVotes: ExportedVote[];
  premiumEntitlements: ExportedPremiumEntitlement[];
  adventure: ExportedAdventure | null;
}

/** Managed guild for which Gaulia stored something (GET /me/data). */
export interface StoredGuildRef {
  guildId: string;
  name: string | null;
  botPresent: boolean;
}

export interface MyDataResponse {
  /** Taken from the session cookie: these fields are not stored in the database. */
  account: {
    userId: string;
    username: string;
    avatar: string | null;
    email: string | null;
    manageableGuilds: { id: string; name: string }[];
  };
  data: UserDataExport;
  /** Among the managed guilds, those whose data can be deleted. */
  guilds: StoredGuildRef[];
}
