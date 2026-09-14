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
}

export interface PremiumStatus {
  premium: boolean;
  premiumExpiresAt: string | null;
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
  premiumEntitlements: number;
}

export interface UserDataSummary {
  userId: string;
  moderationCasesAsTarget: number;
  moderationCasesAsModerator: number;
  warnsAsTarget: number;
  warnsAsModerator: number;
  premiumEntitlements: number;
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
  shards: AdminShard[];
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
