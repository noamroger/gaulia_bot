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

export interface PremiumStatus {
  premium: boolean;
  premiumExpiresAt: string | null;
  /** Échéance du premium offert contre des crédits (null si aucun). */
  premiumGrantedUntil: string | null;
  /** Solde de crédits de l'utilisateur connecté. */
  credits: number;
  offers: PremiumOffer[];
}

export interface PremiumRedeemResult {
  premium: boolean;
  premiumGrantedUntil: string;
  credits: number;
  offerId: PremiumOffer["id"];
}

export type CreditTransactionType = "VOTE" | "PREMIUM_REDEEM" | "ADMIN_ADJUST";

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

export interface ShardInfo {
  shardId: number;
  guildCount: number;
  ping: number;
  online: boolean;
  startedAt: string;
  updatedAt: string;
}

export interface Stats {
  shardCount: number;
  onlineShardCount: number;
  guildCount: number;
  averagePing: number | null;
  shards: ShardInfo[];
}
