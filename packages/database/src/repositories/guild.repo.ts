import type { Guild, Prisma } from "@prisma/client";

import { prisma } from "../client";
import { describePremium } from "./premium.repo";

/**
 * Récupère la config d'un serveur, ou la crée avec les valeurs par défaut si elle n'existe pas encore.
 */
export async function getOrCreateGuild(guildId: string): Promise<Guild> {
  return prisma.guild.upsert({
    where: { id: guildId },
    update: {},
    create: { id: guildId },
  });
}

export async function updateGuild(
  guildId: string,
  data: Partial<
    Pick<
      Guild,
      | "language"
      | "modLogChannelId"
      | "automodLogChannelId"
      | "djRoleId"
      | "musicChannelId"
      | "funChannelIds"
    >
  >,
): Promise<Guild> {
  return prisma.guild.upsert({
    where: { id: guildId },
    update: data,
    create: { id: guildId, ...data },
  });
}

export async function setGuildPremium(
  guildId: string,
  premium: boolean,
  premiumExpiresAt: Date | null,
): Promise<Guild> {
  return prisma.guild.upsert({
    where: { id: guildId },
    update: { premium, premiumExpiresAt },
    create: { id: guildId, premium, premiumExpiresAt },
  });
}

/**
 * Synchronise le nom et/ou la présence du bot sur le serveur (guildCreate/guildDelete/guildUpdate/
 * sync au ready). L'API/dashboard ne liste que les serveurs où `botPresent` est vrai ; `name` sert
 * uniquement à l'affichage (ex: panel admin, pour les serveurs où l'admin connecté n'est pas membre).
 */
export async function upsertGuildInfo(
  guildId: string,
  data: { name?: string; icon?: string | null; memberCount?: number; botPresent?: boolean },
): Promise<Guild> {
  return prisma.guild.upsert({
    where: { id: guildId },
    update: data,
    create: { id: guildId, ...data },
  });
}

export async function listPresentGuildIds(): Promise<string[]> {
  const guilds = await prisma.guild.findMany({
    where: { botPresent: true },
    select: { id: true },
  });
  return guilds.map((guild) => guild.id);
}

/** Parmi une liste de guildId (ex: ceux gérables par un utilisateur côté Discord), retourne ceux où le bot est présent. */
export async function filterPresentGuildIds(guildIds: string[]): Promise<string[]> {
  if (guildIds.length === 0) return [];
  const guilds = await prisma.guild.findMany({
    where: { id: { in: guildIds }, botPresent: true },
    select: { id: true },
  });
  return guilds.map((guild) => guild.id);
}

// ─── Liste du panel admin : filtres, tri et pagination ──────────────────────
// Tout est calculé par Postgres plutôt que dans le navigateur : la liste peut grossir sans que la
// page ait à télécharger la totalité des serveurs pour en filtrer une poignée.

/** Filtre à trois états sur un réglage optionnel : sans contrainte, renseigné, vide. */
export type GuildFlagFilter = "all" | "yes" | "no";

/**
 * Premium : `active` = l'une des deux sources en cours, `subscription` = abonnement Discord,
 * `credits` = premium offert contre des crédits, `expiring` = actif mais qui se termine bientôt.
 */
export type GuildPremiumFilter =
  "all" | "active" | "none" | "subscription" | "credits" | "expiring";

/** Module aventure : réglé et ouvert, réglé et fermé, ou jamais réglé sur ce serveur. */
export type GuildAdventureFilter = "all" | "enabled" | "disabled" | "none";

export type GuildSortField =
  | "name"
  | "id"
  | "members"
  | "language"
  | "createdAt"
  | "updatedAt"
  | "premium"
  | "subscriptionEnd"
  | "creditsEnd"
  | "cases"
  | "warns"
  | "playlists";

export type SortOrder = "asc" | "desc";

/** Fenêtre au-delà de laquelle un premium n'est plus considéré comme « bientôt terminé ». */
export const PREMIUM_EXPIRING_WINDOW_MS = 7 * 24 * 60 * 60 * 1_000;

export const GUILD_PAGE_SIZE_MAX = 200;

export interface AdminGuildFilters {
  /** Recherche libre sur le nom ou l'identifiant. */
  query?: string | null;
  premium?: GuildPremiumFilter;
  language?: string | null;
  membersMin?: number | null;
  membersMax?: number | null;
  createdFrom?: Date | null;
  createdTo?: Date | null;
  updatedFrom?: Date | null;
  updatedTo?: Date | null;
  icon?: GuildFlagFilter;
  modLog?: GuildFlagFilter;
  automodLog?: GuildFlagFilter;
  djRole?: GuildFlagFilter;
  musicChannel?: GuildFlagFilter;
  funChannels?: GuildFlagFilter;
  automod?: GuildFlagFilter;
  moderation?: GuildFlagFilter;
  music?: GuildFlagFilter;
  adventure?: GuildAdventureFilter;
  playlists?: GuildFlagFilter;
  cases?: GuildFlagFilter;
  warns?: GuildFlagFilter;
  sort?: GuildSortField;
  order?: SortOrder;
  page?: number;
  perPage?: number;
}

/** Une ligne de la liste : les champs bruts du serveur, plus ce qui n'existe qu'agrégé. */
export interface AdminGuildRow {
  id: string;
  name: string | null;
  icon: string | null;
  memberCount: number;
  language: string;
  premium: boolean;
  premiumExpiresAt: Date | null;
  premiumGrantedAt: Date | null;
  premiumGrantedUntil: Date | null;
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
  /** Null quand le module aventure n'a jamais été réglé sur ce serveur. */
  adventureEnabled: boolean | null;
  moderationCaseCount: number;
  warnCount: number;
  playlistCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminGuildPage {
  items: AdminGuildRow[];
  /** Serveurs retenus par les filtres, toutes pages confondues. */
  total: number;
  /** Serveurs où le bot est présent, sans aucun filtre : le « sur N » affiché à côté du total. */
  totalPresent: number;
  page: number;
  perPage: number;
  pageCount: number;
  /** Langues réellement utilisées, pour ne proposer dans le filtre que des choix qui donnent un résultat. */
  languages: string[];
}

const ADMIN_GUILD_SELECT = {
  id: true,
  name: true,
  icon: true,
  memberCount: true,
  language: true,
  premium: true,
  premiumExpiresAt: true,
  premiumGrantedAt: true,
  premiumGrantedUntil: true,
  modLogChannelId: true,
  automodLogChannelId: true,
  djRoleId: true,
  musicChannelId: true,
  funChannelIds: true,
  createdAt: true,
  updatedAt: true,
  automodConfig: { select: { guildId: true } },
  moderationSettings: { select: { guildId: true } },
  musicSettings: { select: { guildId: true } },
  adventureSettings: { select: { enabled: true } },
  _count: { select: { moderationCases: true, warns: true, blindtestPlaylists: true } },
} satisfies Prisma.GuildSelect;

type AdminGuildRecord = Prisma.GuildGetPayload<{ select: typeof ADMIN_GUILD_SELECT }>;

function toAdminGuildRow(guild: AdminGuildRecord): AdminGuildRow {
  const premium = describePremium(guild);
  return {
    id: guild.id,
    name: guild.name,
    icon: guild.icon,
    memberCount: guild.memberCount,
    language: guild.language,
    premium: guild.premium,
    premiumExpiresAt: guild.premiumExpiresAt,
    premiumGrantedAt: guild.premiumGrantedAt,
    premiumGrantedUntil: guild.premiumGrantedUntil,
    premiumActive: premium.active,
    premiumSource: premium.source,
    modLogChannelId: guild.modLogChannelId,
    automodLogChannelId: guild.automodLogChannelId,
    djRoleId: guild.djRoleId,
    musicChannelId: guild.musicChannelId,
    funChannelCount: guild.funChannelIds.length,
    automodConfigured: guild.automodConfig !== null,
    moderationConfigured: guild.moderationSettings !== null,
    musicConfigured: guild.musicSettings !== null,
    adventureEnabled: guild.adventureSettings?.enabled ?? null,
    moderationCaseCount: guild._count.moderationCases,
    warnCount: guild._count.warns,
    playlistCount: guild._count.blindtestPlaylists,
    createdAt: guild.createdAt,
    updatedAt: guild.updatedAt,
  };
}

/** Condition « ce champ optionnel est renseigné / est vide », ou rien du tout. */
function nullableFilter(flag: GuildFlagFilter | undefined): { not: null } | null | undefined {
  if (flag === "yes") return { not: null };
  if (flag === "no") return null;
  return undefined;
}

/** Même logique pour une relation un-à-un optionnelle (réglages d'un module). */
function relationFilter(
  flag: GuildFlagFilter | undefined,
): { is: null } | { isNot: null } | undefined {
  if (flag === "yes") return { isNot: null };
  if (flag === "no") return { is: null };
  return undefined;
}

/** Et pour une relation un-à-plusieurs : au moins une ligne, ou aucune. */
function collectionFilter(
  flag: GuildFlagFilter | undefined,
): { some: object } | { none: object } | undefined {
  if (flag === "yes") return { some: {} };
  if (flag === "no") return { none: {} };
  return undefined;
}

/** Abonnement Discord en cours : actif et pas encore arrivé à échéance. */
function subscriptionActiveWhere(now: Date): Prisma.GuildWhereInput {
  return {
    premium: true,
    OR: [{ premiumExpiresAt: null }, { premiumExpiresAt: { gt: now } }],
  };
}

function premiumWhere(filter: GuildPremiumFilter, now: Date): Prisma.GuildWhereInput | undefined {
  const creditsActive: Prisma.GuildWhereInput = { premiumGrantedUntil: { gt: now } };
  const anyActive: Prisma.GuildWhereInput = { OR: [subscriptionActiveWhere(now), creditsActive] };

  switch (filter) {
    case "active":
      return anyActive;
    case "none":
      // La négation de la condition « premium actif » ne convient pas : en SQL, comparer une date
      // absente ne donne ni vrai ni faux, et les serveurs sans aucune date se feraient écarter.
      // On décrit donc l'absence de premium source par source, en nommant le cas « jamais rien ».
      return {
        AND: [
          { OR: [{ premium: false }, { premiumExpiresAt: { lte: now } }] },
          { OR: [{ premiumGrantedUntil: null }, { premiumGrantedUntil: { lte: now } }] },
        ],
      };
    case "subscription":
      return subscriptionActiveWhere(now);
    case "credits":
      return creditsActive;
    case "expiring": {
      const limit = new Date(now.getTime() + PREMIUM_EXPIRING_WINDOW_MS);
      return {
        OR: [
          { premium: true, premiumExpiresAt: { gt: now, lte: limit } },
          { premiumGrantedUntil: { gt: now, lte: limit } },
        ],
      };
    }
    default:
      return undefined;
  }
}

function buildWhere(filters: AdminGuildFilters, now: Date): Prisma.GuildWhereInput {
  const and: Prisma.GuildWhereInput[] = [];

  const query = filters.query?.trim();
  if (query) {
    and.push({
      OR: [{ name: { contains: query, mode: "insensitive" } }, { id: { contains: query } }],
    });
  }

  const premium = premiumWhere(filters.premium ?? "all", now);
  if (premium) and.push(premium);

  if (filters.language) and.push({ language: filters.language });

  if (filters.membersMin != null || filters.membersMax != null) {
    and.push({
      memberCount: {
        ...(filters.membersMin != null ? { gte: filters.membersMin } : {}),
        ...(filters.membersMax != null ? { lte: filters.membersMax } : {}),
      },
    });
  }

  if (filters.createdFrom || filters.createdTo) {
    and.push({
      createdAt: {
        ...(filters.createdFrom ? { gte: filters.createdFrom } : {}),
        ...(filters.createdTo ? { lte: filters.createdTo } : {}),
      },
    });
  }

  if (filters.updatedFrom || filters.updatedTo) {
    and.push({
      updatedAt: {
        ...(filters.updatedFrom ? { gte: filters.updatedFrom } : {}),
        ...(filters.updatedTo ? { lte: filters.updatedTo } : {}),
      },
    });
  }

  const icon = nullableFilter(filters.icon);
  if (icon !== undefined) and.push({ icon });

  const modLog = nullableFilter(filters.modLog);
  if (modLog !== undefined) and.push({ modLogChannelId: modLog });

  const automodLog = nullableFilter(filters.automodLog);
  if (automodLog !== undefined) and.push({ automodLogChannelId: automodLog });

  const djRole = nullableFilter(filters.djRole);
  if (djRole !== undefined) and.push({ djRoleId: djRole });

  const musicChannel = nullableFilter(filters.musicChannel);
  if (musicChannel !== undefined) and.push({ musicChannelId: musicChannel });

  if (filters.funChannels === "yes") and.push({ funChannelIds: { isEmpty: false } });
  if (filters.funChannels === "no") and.push({ funChannelIds: { isEmpty: true } });

  const automod = relationFilter(filters.automod);
  if (automod) and.push({ automodConfig: automod });

  const moderation = relationFilter(filters.moderation);
  if (moderation) and.push({ moderationSettings: moderation });

  const music = relationFilter(filters.music);
  if (music) and.push({ musicSettings: music });

  switch (filters.adventure) {
    case "enabled":
      and.push({ adventureSettings: { is: { enabled: true } } });
      break;
    case "disabled":
      and.push({ adventureSettings: { is: { enabled: false } } });
      break;
    case "none":
      and.push({ adventureSettings: { is: null } });
      break;
    default:
      break;
  }

  const playlists = collectionFilter(filters.playlists);
  if (playlists) and.push({ blindtestPlaylists: playlists });

  const cases = collectionFilter(filters.cases);
  if (cases) and.push({ moderationCases: cases });

  const warns = collectionFilter(filters.warns);
  if (warns) and.push({ warns });

  return { botPresent: true, ...(and.length > 0 ? { AND: and } : {}) };
}

/**
 * Tri demandé, suivi de l'identifiant : sans ce départage, deux serveurs de même valeur peuvent
 * changer de place d'une page à l'autre et une ligne se retrouve affichée deux fois ou jamais.
 */
function buildOrderBy(
  sort: GuildSortField,
  order: SortOrder,
): Prisma.GuildOrderByWithRelationInput[] {
  const tiebreak: Prisma.GuildOrderByWithRelationInput = { id: "asc" };

  switch (sort) {
    case "name":
      return [{ name: { sort: order, nulls: "last" } }, tiebreak];
    case "id":
      return [{ id: order }];
    case "members":
      return [{ memberCount: order }, tiebreak];
    case "language":
      return [{ language: order }, tiebreak];
    case "updatedAt":
      return [{ updatedAt: order }, tiebreak];
    case "premium":
      return [{ premium: order }, tiebreak];
    case "subscriptionEnd":
      return [{ premiumExpiresAt: { sort: order, nulls: "last" } }, tiebreak];
    case "creditsEnd":
      return [{ premiumGrantedUntil: { sort: order, nulls: "last" } }, tiebreak];
    case "cases":
      return [{ moderationCases: { _count: order } }, tiebreak];
    case "warns":
      return [{ warns: { _count: order } }, tiebreak];
    case "playlists":
      return [{ blindtestPlaylists: { _count: order } }, tiebreak];
    default:
      return [{ createdAt: order }, tiebreak];
  }
}

/** Liste filtrée, triée et paginée des serveurs, pour le panel admin réservé aux propriétaires. */
export async function listAdminGuilds(filters: AdminGuildFilters = {}): Promise<AdminGuildPage> {
  const now = new Date();
  const where = buildWhere(filters, now);
  const perPage = Math.min(Math.max(Math.trunc(filters.perPage ?? 50), 1), GUILD_PAGE_SIZE_MAX);
  const requestedPage = Math.max(Math.trunc(filters.page ?? 1), 1);

  const [total, totalPresent, languageRows] = await Promise.all([
    prisma.guild.count({ where }),
    prisma.guild.count({ where: { botPresent: true } }),
    prisma.guild.findMany({
      where: { botPresent: true },
      distinct: ["language"],
      select: { language: true },
      orderBy: { language: "asc" },
    }),
  ]);

  // Un filtre qui vide la dernière page (suppression, premium retiré) ramène sur la dernière
  // page qui contient encore quelque chose, plutôt que sur un tableau vide sans explication.
  const pageCount = Math.max(Math.ceil(total / perPage), 1);
  const page = Math.min(requestedPage, pageCount);

  const rows = await prisma.guild.findMany({
    where,
    select: ADMIN_GUILD_SELECT,
    orderBy: buildOrderBy(filters.sort ?? "createdAt", filters.order ?? "desc"),
    skip: (page - 1) * perPage,
    take: perPage,
  });

  return {
    items: rows.map(toAdminGuildRow),
    total,
    totalPresent,
    page,
    perPage,
    pageCount,
    languages: languageRows.map((row) => row.language),
  };
}

/** Une ligne seule, au même format que la liste : sert à rafraîchir le tableau après un changement. */
export async function getAdminGuild(guildId: string): Promise<AdminGuildRow | null> {
  const guild = await prisma.guild.findUnique({
    where: { id: guildId },
    select: ADMIN_GUILD_SELECT,
  });
  return guild ? toAdminGuildRow(guild) : null;
}
