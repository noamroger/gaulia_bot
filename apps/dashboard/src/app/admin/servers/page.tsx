"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useLocale, useTranslation, type AppLocale, type Translator } from "@/i18n";
import { api } from "@/lib/api";
import { guildIconUrl } from "@/lib/discordCdn";
import { formatNumber } from "@/lib/format";
import type { AdminGuild, AdminGuildPage } from "@/lib/types";

/** Three state filter on an optional setting: unconstrained, filled in, empty. */
type FlagFilter = "all" | "yes" | "no";

type SortField =
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

type SortOrder = "asc" | "desc";

type PremiumFilter = "all" | "active" | "none" | "subscription" | "credits" | "expiring";

interface Filters {
  premium: PremiumFilter;
  language: string;
  membersMin: string;
  membersMax: string;
  createdFrom: string;
  createdTo: string;
  updatedFrom: string;
  updatedTo: string;
  icon: FlagFilter;
  modLog: FlagFilter;
  automodLog: FlagFilter;
  djRole: FlagFilter;
  musicChannel: FlagFilter;
  funChannels: FlagFilter;
  automod: FlagFilter;
  moderation: FlagFilter;
  music: FlagFilter;
  adventure: "all" | "enabled" | "disabled" | "none";
  playlists: FlagFilter;
  cases: FlagFilter;
  warns: FlagFilter;
}

const EMPTY_FILTERS: Filters = {
  premium: "all",
  language: "",
  membersMin: "",
  membersMax: "",
  createdFrom: "",
  createdTo: "",
  updatedFrom: "",
  updatedTo: "",
  icon: "all",
  modLog: "all",
  automodLog: "all",
  djRole: "all",
  musicChannel: "all",
  funChannels: "all",
  automod: "all",
  moderation: "all",
  music: "all",
  adventure: "all",
  playlists: "all",
  cases: "all",
  warns: "all",
};

/** Every sortable field, including those without a column in the table. */
const SORT_FIELDS: SortField[] = [
  "createdAt",
  "updatedAt",
  "name",
  "id",
  "members",
  "language",
  "premium",
  "subscriptionEnd",
  "creditsEnd",
  "cases",
  "warns",
  "playlists",
];

/** Text fields read better from A to Z, numbers and dates from largest to smallest. */
const ASCENDING_BY_DEFAULT: SortField[] = ["name", "id", "language"];

const PAGE_SIZES = [25, 50, 100, 200];

const PREMIUM_FILTERS: PremiumFilter[] = [
  "all",
  "active",
  "none",
  "subscription",
  "credits",
  "expiring",
];

/** "auto" follows the Discord locale of the server and is the default for a new server. */
const LANGUAGE_VALUES = ["auto", "en", "fr"];

/** An unexpected code still shows something readable rather than an empty cell. */
function languageLabel(code: string, t: Translator): string {
  return LANGUAGE_VALUES.includes(code) ? t(`admin.servers.language.${code}`) : code.toUpperCase();
}

function toDate(iso: string | null, locale: AppLocale): string {
  return iso ? new Date(iso).toLocaleDateString(locale) : "-";
}

/** Number of filters actually set, shown on the button that opens the panel. */
function countActiveFilters(filters: Filters): number {
  return Object.entries(filters).filter(([, value]) => value !== "all" && value !== "").length;
}

function buildSearch(
  filters: Filters,
  query: string,
  sort: SortField,
  order: SortOrder,
  page: number,
  perPage: number,
): string {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  for (const [key, value] of Object.entries(filters)) {
    if (value !== "all" && value !== "") params.set(key, value);
  }
  params.set("sort", sort);
  params.set("order", order);
  params.set("page", String(page));
  params.set("perPage", String(perPage));
  return params.toString();
}

interface FilterFieldProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function FilterField({ label, value, options, onChange }: FilterFieldProps) {
  return (
    <label className="filter-field">
      <span>{label}</span>
      <select
        className="select select-compact"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** "All / set / empty" choice, worded to fit the setting it filters on. */
function flagOptions(t: Translator, yes: string, no: string): { value: string; label: string }[] {
  return [
    { value: "all", label: t("admin.servers.filter.options.all") },
    { value: "yes", label: t(`admin.servers.filter.options.${yes}`) },
    { value: "no", label: t(`admin.servers.filter.options.${no}`) },
  ];
}

interface SortHeaderProps {
  field: SortField;
  label: string;
  sort: SortField;
  order: SortOrder;
  onSort: (field: SortField) => void;
}

function SortHeader({ field, label, sort, order, onSort }: SortHeaderProps) {
  const active = sort === field;
  return (
    <th aria-sort={active ? (order === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        className="sort-header"
        aria-pressed={active}
        onClick={() => onSort(field)}
      >
        {label}
        <span className="sort-arrow" aria-hidden="true">
          {active ? (order === "asc" ? "↑" : "↓") : "⇅"}
        </span>
      </button>
    </th>
  );
}

/** Beyond that, the badges grow the row more than they help read the table. */
const VISIBLE_BADGES = 2;

/** Settings enabled on the server, as badges, to spot at a glance what is in place. */
function ModuleBadges({ guild }: { guild: AdminGuild }) {
  const t = useTranslation();
  const badges: string[] = [];
  if (guild.automodConfigured) badges.push(t("admin.servers.badges.automod"));
  if (guild.moderationConfigured) badges.push(t("admin.servers.badges.moderation"));
  if (guild.musicConfigured) badges.push(t("admin.servers.badges.music"));
  if (guild.adventureEnabled === true) badges.push(t("admin.servers.badges.adventure"));
  if (guild.modLogChannelId) badges.push(t("admin.servers.badges.modLog"));
  if (guild.automodLogChannelId) badges.push(t("admin.servers.badges.automodLog"));
  if (guild.djRoleId) badges.push(t("admin.servers.badges.djRole"));
  if (guild.musicChannelId) badges.push(t("admin.servers.badges.musicChannel"));
  if (guild.funChannelCount > 0) {
    badges.push(t("admin.servers.badges.fun", { count: guild.funChannelCount }));
  }

  if (badges.length === 0) return <span className="text-muted">-</span>;

  const shown = badges.slice(0, VISIBLE_BADGES);
  const hidden = badges.length - shown.length;
  return (
    <div className="module-badges" title={badges.join(", ")}>
      {shown.map((badge) => (
        <span key={badge} className="badge badge-muted badge-compact">
          {badge}
        </span>
      ))}
      {hidden > 0 && (
        <span className="badge badge-muted badge-compact">
          {t("admin.servers.badges.more", { count: hidden })}
        </span>
      )}
    </div>
  );
}

function PremiumCell({ guild }: { guild: AdminGuild }) {
  const t = useTranslation();
  const locale = useLocale();
  const endsAt =
    guild.premiumSource === "CREDITS" ? guild.premiumGrantedUntil : guild.premiumExpiresAt;
  return (
    <div className="premium-status">
      <span
        className={`badge badge-compact ${guild.premiumActive ? "badge-success" : "badge-muted"}`}
      >
        {guild.premiumActive
          ? t("admin.servers.premiumCell.active")
          : t("admin.servers.premiumCell.inactive")}
      </span>
      {guild.premiumSource && (
        <span className="badge badge-accent badge-compact">
          {guild.premiumSource === "CREDITS"
            ? t("admin.servers.premiumCell.gifted")
            : t("admin.servers.premiumCell.subscription")}
        </span>
      )}
      {guild.premiumActive && endsAt && (
        <span className="text-muted">
          {t("admin.servers.premiumCell.until", { date: toDate(endsAt, locale) })}
        </span>
      )}
    </div>
  );
}

export default function AdminServersPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortField>("createdAt");
  const [order, setOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [panelOpen, setPanelOpen] = useState(false);

  const [result, setResult] = useState<AdminGuildPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [pendingGuildId, setPendingGuildId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const t = useTranslation();
  const locale = useLocale();

  // Typing does not fire one request per character: only the last input goes out.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, filters, sort, order, perPage]);

  // Only the latest request may write the result: without this guard, a slow response arriving
  // after a newer one would put stale rows back on screen.
  const latestRequest = useRef(0);

  const search = useMemo(
    () => buildSearch(filters, debouncedQuery, sort, order, page, perPage),
    [filters, debouncedQuery, sort, order, page, perPage],
  );

  useEffect(() => {
    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;
    setLoading(true);

    api
      .get<AdminGuildPage>(`/admin/guilds?${search}`)
      .then((data) => {
        if (latestRequest.current !== requestId) return;
        setResult(data);
        setFailed(false);
      })
      .catch(() => {
        if (latestRequest.current !== requestId) return;
        setFailed(true);
      })
      .finally(() => {
        if (latestRequest.current === requestId) setLoading(false);
      });
  }, [search, reloadToken]);

  const setFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  }, []);

  function changeSort(field: SortField): void {
    if (field === sort) {
      setOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSort(field);
    setOrder(ASCENDING_BY_DEFAULT.includes(field) ? "asc" : "desc");
  }

  function resetFilters(): void {
    setQuery("");
    setFilters(EMPTY_FILTERS);
    setSort("createdAt");
    setOrder("desc");
  }

  async function togglePremium(guild: AdminGuild): Promise<void> {
    setPendingGuildId(guild.id);
    try {
      await api.patch<AdminGuild>(`/admin/guilds/${guild.id}/premium`, {
        premium: !guild.premium,
        premiumExpiresAt: null,
      });
      // Reload rather than patch the row: the edited server may well fall out of the current
      // filters, and the counters have to follow.
      setReloadToken((current) => current + 1);
    } finally {
      setPendingGuildId(null);
    }
  }

  const activeFilters = countActiveFilters(filters) + (debouncedQuery.trim() ? 1 : 0);
  const languages = result?.languages ?? [];
  const guilds = result?.items ?? [];

  return (
    <div>
      <div className="toolbar">
        <input
          type="search"
          className="search-input"
          placeholder={t("admin.servers.searchPlaceholder")}
          aria-label={t("admin.servers.searchLabel")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <button
          type="button"
          className="button-secondary"
          aria-expanded={panelOpen}
          onClick={() => setPanelOpen((open) => !open)}
        >
          {activeFilters > 0
            ? t("admin.servers.filtersButtonCount", { count: activeFilters })
            : t("admin.servers.filtersButton")}
        </button>

        <label className="filter-inline">
          <span>{t("admin.servers.sortBy")}</span>
          <select
            className="select select-compact"
            value={sort}
            onChange={(event) => changeSort(event.target.value as SortField)}
          >
            {SORT_FIELDS.map((field) => (
              <option key={field} value={field}>
                {t(`admin.servers.sort.${field}`)}
              </option>
            ))}
          </select>
        </label>

        <div className="segmented" role="group" aria-label={t("admin.servers.orderLabel")}>
          <button type="button" aria-pressed={order === "asc"} onClick={() => setOrder("asc")}>
            {t("admin.servers.ascending")}
          </button>
          <button type="button" aria-pressed={order === "desc"} onClick={() => setOrder("desc")}>
            {t("admin.servers.descending")}
          </button>
        </div>

        {activeFilters > 0 && (
          <button type="button" className="filter-reset" onClick={resetFilters}>
            {t("admin.servers.clearAll")}
          </button>
        )}

        {result && (
          <span className="text-muted">
            {t("admin.servers.count", {
              count: result.totalPresent,
              shown: formatNumber(result.total, locale),
              total: formatNumber(result.totalPresent, locale),
            })}
          </span>
        )}
      </div>

      {panelOpen && (
        <div className="card filter-panel">
          <FilterField
            label={t("admin.servers.filter.premium")}
            value={filters.premium}
            onChange={(value) => setFilter("premium", value as PremiumFilter)}
            options={PREMIUM_FILTERS.map((value) => ({
              value,
              label: t(`admin.servers.premiumFilter.${value}`),
            }))}
          />

          <FilterField
            label={t("admin.servers.filter.language")}
            value={filters.language}
            onChange={(value) => setFilter("language", value)}
            options={[
              { value: "", label: t("admin.servers.filter.languageAll") },
              ...languages.map((code) => ({ value: code, label: languageLabel(code, t) })),
            ]}
          />

          <div className="filter-field">
            <span>{t("admin.servers.filter.members")}</span>
            <div className="filter-range">
              <input
                type="number"
                min={0}
                className="input input-number"
                placeholder={t("admin.servers.filter.minPlaceholder")}
                aria-label={t("admin.servers.filter.membersMin")}
                value={filters.membersMin}
                onChange={(event) => setFilter("membersMin", event.target.value)}
              />
              <input
                type="number"
                min={0}
                className="input input-number"
                placeholder={t("admin.servers.filter.maxPlaceholder")}
                aria-label={t("admin.servers.filter.membersMax")}
                value={filters.membersMax}
                onChange={(event) => setFilter("membersMax", event.target.value)}
              />
            </div>
          </div>

          <div className="filter-field">
            <span>{t("admin.servers.filter.created")}</span>
            <div className="filter-range">
              <input
                type="date"
                className="input"
                aria-label={t("admin.servers.filter.createdFrom")}
                value={filters.createdFrom}
                onChange={(event) => setFilter("createdFrom", event.target.value)}
              />
              <input
                type="date"
                className="input"
                aria-label={t("admin.servers.filter.createdTo")}
                value={filters.createdTo}
                onChange={(event) => setFilter("createdTo", event.target.value)}
              />
            </div>
          </div>

          <div className="filter-field">
            <span>{t("admin.servers.filter.updated")}</span>
            <div className="filter-range">
              <input
                type="date"
                className="input"
                aria-label={t("admin.servers.filter.updatedFrom")}
                value={filters.updatedFrom}
                onChange={(event) => setFilter("updatedFrom", event.target.value)}
              />
              <input
                type="date"
                className="input"
                aria-label={t("admin.servers.filter.updatedTo")}
                value={filters.updatedTo}
                onChange={(event) => setFilter("updatedTo", event.target.value)}
              />
            </div>
          </div>

          <FilterField
            label={t("admin.servers.filter.adventure")}
            value={filters.adventure}
            onChange={(value) => setFilter("adventure", value as Filters["adventure"])}
            options={[
              { value: "all", label: t("admin.servers.filter.options.all") },
              { value: "enabled", label: t("admin.servers.filter.options.adventureEnabled") },
              { value: "disabled", label: t("admin.servers.filter.options.adventureDisabled") },
              { value: "none", label: t("admin.servers.filter.options.adventureNever") },
            ]}
          />

          <FilterField
            label={t("admin.servers.filter.automod")}
            value={filters.automod}
            onChange={(value) => setFilter("automod", value as FlagFilter)}
            options={flagOptions(t, "configured", "untouched")}
          />

          <FilterField
            label={t("admin.servers.filter.moderation")}
            value={filters.moderation}
            onChange={(value) => setFilter("moderation", value as FlagFilter)}
            options={flagOptions(t, "configured", "untouched")}
          />

          <FilterField
            label={t("admin.servers.filter.music")}
            value={filters.music}
            onChange={(value) => setFilter("music", value as FlagFilter)}
            options={flagOptions(t, "configured", "untouched")}
          />

          <FilterField
            label={t("admin.servers.filter.modLog")}
            value={filters.modLog}
            onChange={(value) => setFilter("modLog", value as FlagFilter)}
            options={flagOptions(t, "channelSet", "channelUnset")}
          />

          <FilterField
            label={t("admin.servers.filter.automodLog")}
            value={filters.automodLog}
            onChange={(value) => setFilter("automodLog", value as FlagFilter)}
            options={flagOptions(t, "channelSet", "channelUnset")}
          />

          <FilterField
            label={t("admin.servers.filter.djRole")}
            value={filters.djRole}
            onChange={(value) => setFilter("djRole", value as FlagFilter)}
            options={flagOptions(t, "channelSet", "channelUnset")}
          />

          <FilterField
            label={t("admin.servers.filter.musicChannel")}
            value={filters.musicChannel}
            onChange={(value) => setFilter("musicChannel", value as FlagFilter)}
            options={flagOptions(t, "channelSet", "channelUnset")}
          />

          <FilterField
            label={t("admin.servers.filter.funChannels")}
            value={filters.funChannels}
            onChange={(value) => setFilter("funChannels", value as FlagFilter)}
            options={flagOptions(t, "funRestricted", "funEveryChannel")}
          />

          <FilterField
            label={t("admin.servers.filter.playlists")}
            value={filters.playlists}
            onChange={(value) => setFilter("playlists", value as FlagFilter)}
            options={flagOptions(t, "playlistsSome", "playlistsNone")}
          />

          <FilterField
            label={t("admin.servers.filter.cases")}
            value={filters.cases}
            onChange={(value) => setFilter("cases", value as FlagFilter)}
            options={flagOptions(t, "casesSome", "casesNone")}
          />

          <FilterField
            label={t("admin.servers.filter.warns")}
            value={filters.warns}
            onChange={(value) => setFilter("warns", value as FlagFilter)}
            options={flagOptions(t, "warnsSome", "warnsNone")}
          />

          <FilterField
            label={t("admin.servers.filter.icon")}
            value={filters.icon}
            onChange={(value) => setFilter("icon", value as FlagFilter)}
            options={flagOptions(t, "iconCustom", "iconDefault")}
          />
        </div>
      )}

      {failed ? (
        <div className="empty-state">{t("admin.servers.loadFailed")}</div>
      ) : result === null ? (
        <p className="text-muted">{t("common.state.loading")}</p>
      ) : result.totalPresent === 0 ? (
        <div className="empty-state">{t("admin.servers.empty")}</div>
      ) : guilds.length === 0 ? (
        <div className="empty-state">{t("admin.servers.noMatch")}</div>
      ) : (
        <>
          <div className="table-scroll" aria-busy={loading}>
            <table className="table server-table">
              <thead>
                <tr>
                  <SortHeader
                    field="name"
                    label={t("admin.servers.table.server")}
                    sort={sort}
                    order={order}
                    onSort={changeSort}
                  />
                  <SortHeader
                    field="id"
                    label={t("admin.servers.table.id")}
                    sort={sort}
                    order={order}
                    onSort={changeSort}
                  />
                  <SortHeader
                    field="members"
                    label={t("admin.servers.table.members")}
                    sort={sort}
                    order={order}
                    onSort={changeSort}
                  />
                  <SortHeader
                    field="language"
                    label={t("admin.servers.table.language")}
                    sort={sort}
                    order={order}
                    onSort={changeSort}
                  />
                  <SortHeader
                    field="premium"
                    label={t("admin.servers.table.premium")}
                    sort={sort}
                    order={order}
                    onSort={changeSort}
                  />
                  <th>{t("admin.servers.table.settings")}</th>
                  <SortHeader
                    field="cases"
                    label={t("admin.servers.table.cases")}
                    sort={sort}
                    order={order}
                    onSort={changeSort}
                  />
                  <SortHeader
                    field="warns"
                    label={t("admin.servers.table.warns")}
                    sort={sort}
                    order={order}
                    onSort={changeSort}
                  />
                  <SortHeader
                    field="createdAt"
                    label={t("admin.servers.table.joined")}
                    sort={sort}
                    order={order}
                    onSort={changeSort}
                  />
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {guilds.map((guild) => {
                  const icon = guildIconUrl(guild.id, guild.icon, 64);
                  const name = guild.name ?? t("admin.servers.table.unnamed");
                  return (
                    <tr key={guild.id}>
                      <td>
                        <div className="guild-cell">
                          <span className="guild-avatar guild-avatar-sm">
                            {icon ? <img src={icon} alt="" /> : name.slice(0, 2).toUpperCase()}
                          </span>
                          <span>{name}</span>
                        </div>
                      </td>
                      <td>
                        <code>{guild.id}</code>
                      </td>
                      <td className="numeric">{formatNumber(guild.memberCount, locale)}</td>
                      <td>{languageLabel(guild.language, t)}</td>
                      <td>
                        <PremiumCell guild={guild} />
                      </td>
                      <td>
                        <ModuleBadges guild={guild} />
                      </td>
                      <td className="numeric">{formatNumber(guild.moderationCaseCount, locale)}</td>
                      <td className="numeric">{formatNumber(guild.warnCount, locale)}</td>
                      <td>{toDate(guild.createdAt, locale)}</td>
                      <td>
                        <div className="table-actions">
                          <Link
                            href={`/dashboard/${guild.id}/settings`}
                            className="button-secondary"
                          >
                            {t("admin.servers.table.openSettings")}
                          </Link>
                          <button
                            className="button-secondary"
                            disabled={pendingGuildId === guild.id}
                            onClick={() => void togglePremium(guild)}
                          >
                            {guild.premium
                              ? t("admin.servers.table.revokePremium")
                              : t("admin.servers.table.grantPremium")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <label className="filter-inline">
              <span>{t("admin.servers.pagination.perPage")}</span>
              <select
                className="select select-compact"
                value={perPage}
                onChange={(event) => setPerPage(Number(event.target.value))}
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>

            <span className="text-muted">
              {t("admin.servers.pagination.page", {
                page: formatNumber(result.page, locale),
                pageCount: formatNumber(result.pageCount, locale),
              })}
            </span>

            <div className="table-actions">
              <button
                type="button"
                className="button-secondary"
                disabled={result.page <= 1 || loading}
                onClick={() => setPage(result.page - 1)}
              >
                {t("admin.servers.pagination.previous")}
              </button>
              <button
                type="button"
                className="button-secondary"
                disabled={result.page >= result.pageCount || loading}
                onClick={() => setPage(result.page + 1)}
              >
                {t("admin.servers.pagination.next")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
