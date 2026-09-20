"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { api } from "@/lib/api";
import { guildIconUrl } from "@/lib/discordCdn";
import { formatNumber } from "@/lib/format";
import type { AdminGuild, AdminGuildPage } from "@/lib/types";

/** Filtre à trois états sur un réglage optionnel : sans contrainte, renseigné, vide. */
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

interface Filters {
  premium: "all" | "active" | "none" | "subscription" | "credits" | "expiring";
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

/** Tous les champs triables, y compris ceux qui n'ont pas de colonne dans le tableau. */
const SORT_FIELDS: { value: SortField; label: string }[] = [
  { value: "createdAt", label: "Arrivée du bot" },
  { value: "updatedAt", label: "Dernière modification" },
  { value: "name", label: "Nom" },
  { value: "id", label: "Identifiant" },
  { value: "members", label: "Membres" },
  { value: "language", label: "Langue" },
  { value: "premium", label: "Abonnement premium" },
  { value: "subscriptionEnd", label: "Fin d'abonnement" },
  { value: "creditsEnd", label: "Fin du premium offert" },
  { value: "cases", label: "Sanctions" },
  { value: "warns", label: "Avertissements" },
  { value: "playlists", label: "Playlists blindtest" },
];

/** Les champs texte se lisent mieux de A à Z, les nombres et les dates du plus grand au plus petit. */
const ASCENDING_BY_DEFAULT: SortField[] = ["name", "id", "language"];

const PAGE_SIZES = [25, 50, 100, 200];

const LANGUAGE_LABELS: Record<string, string> = {
  fr: "Français",
  en: "Anglais",
};

const PREMIUM_LABELS: Record<Filters["premium"], string> = {
  all: "Tous",
  active: "Premium actif",
  none: "Sans premium",
  subscription: "Abonnement Discord",
  credits: "Offert contre des crédits",
  expiring: "Se termine sous 7 jours",
};

function languageLabel(code: string): string {
  return LANGUAGE_LABELS[code] ?? code;
}

function toDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "-";
}

/** Nombre de filtres réellement posés, affiché sur le bouton qui ouvre le panneau. */
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

/** Choix « tous / renseigné / vide » avec des mots adaptés au réglage concerné. */
function flagOptions(yes: string, no: string): { value: string; label: string }[] {
  return [
    { value: "all", label: "Tous" },
    { value: "yes", label: yes },
    { value: "no", label: no },
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

/** Au-delà, les pastilles feraient grandir la ligne plus qu'elles n'aident à lire le tableau. */
const VISIBLE_BADGES = 2;

/** Réglages activés sur le serveur, en pastilles, pour repérer d'un coup d'oeil ce qui est en place. */
function ModuleBadges({ guild }: { guild: AdminGuild }) {
  const badges: string[] = [];
  if (guild.automodConfigured) badges.push("Automod");
  if (guild.moderationConfigured) badges.push("Modération");
  if (guild.musicConfigured) badges.push("Musique");
  if (guild.adventureEnabled === true) badges.push("Aventure");
  if (guild.modLogChannelId) badges.push("Logs mod");
  if (guild.automodLogChannelId) badges.push("Logs automod");
  if (guild.djRoleId) badges.push("Rôle DJ");
  if (guild.musicChannelId) badges.push("Salon musique");
  if (guild.funChannelCount > 0) badges.push(`Fun (${guild.funChannelCount})`);

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
      {hidden > 0 && <span className="badge badge-muted badge-compact">+{hidden}</span>}
    </div>
  );
}

function PremiumCell({ guild }: { guild: AdminGuild }) {
  const endsAt =
    guild.premiumSource === "CREDITS" ? guild.premiumGrantedUntil : guild.premiumExpiresAt;
  return (
    <div className="premium-status">
      <span
        className={`badge badge-compact ${guild.premiumActive ? "badge-success" : "badge-muted"}`}
      >
        {guild.premiumActive ? "Actif" : "Inactif"}
      </span>
      {guild.premiumSource && (
        <span className="badge badge-accent badge-compact">
          {guild.premiumSource === "CREDITS" ? "Offert" : "Abonnement"}
        </span>
      )}
      {guild.premiumActive && endsAt && (
        <span className="text-muted">jusqu&apos;au {toDate(endsAt)}</span>
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

  // La frappe ne déclenche pas une requête par caractère : seule la dernière saisie part.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, filters, sort, order, perPage]);

  // Seule la dernière requête lancée a le droit d'écrire le résultat : sans ce garde-fou, une
  // réponse lente arrivée après une plus récente réafficherait des lignes déjà périmées.
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
      // Rechargement plutôt que remplacement de la ligne : le serveur modifié peut très bien
      // sortir des filtres en cours, et les compteurs doivent suivre.
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
          placeholder="Rechercher par nom ou ID…"
          aria-label="Rechercher un serveur par nom ou ID"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <button
          type="button"
          className="button-secondary"
          aria-expanded={panelOpen}
          onClick={() => setPanelOpen((open) => !open)}
        >
          Filtres{activeFilters > 0 ? ` (${activeFilters})` : ""}
        </button>

        <label className="filter-inline">
          <span>Trier par</span>
          <select
            className="select select-compact"
            value={sort}
            onChange={(event) => changeSort(event.target.value as SortField)}
          >
            {SORT_FIELDS.map((field) => (
              <option key={field.value} value={field.value}>
                {field.label}
              </option>
            ))}
          </select>
        </label>

        <div className="segmented" role="group" aria-label="Sens du tri">
          <button type="button" aria-pressed={order === "asc"} onClick={() => setOrder("asc")}>
            Croissant
          </button>
          <button type="button" aria-pressed={order === "desc"} onClick={() => setOrder("desc")}>
            Décroissant
          </button>
        </div>

        {activeFilters > 0 && (
          <button type="button" className="filter-reset" onClick={resetFilters}>
            Tout effacer
          </button>
        )}

        {result && (
          <span className="text-muted">
            {formatNumber(result.total)} sur {formatNumber(result.totalPresent)} serveur(s)
          </span>
        )}
      </div>

      {panelOpen && (
        <div className="card filter-panel">
          <FilterField
            label="Premium"
            value={filters.premium}
            onChange={(value) => setFilter("premium", value as Filters["premium"])}
            options={Object.entries(PREMIUM_LABELS).map(([value, label]) => ({ value, label }))}
          />

          <FilterField
            label="Langue"
            value={filters.language}
            onChange={(value) => setFilter("language", value)}
            options={[
              { value: "", label: "Toutes" },
              ...languages.map((code) => ({ value: code, label: languageLabel(code) })),
            ]}
          />

          <div className="filter-field">
            <span>Membres</span>
            <div className="filter-range">
              <input
                type="number"
                min={0}
                className="input input-number"
                placeholder="min"
                aria-label="Nombre de membres minimum"
                value={filters.membersMin}
                onChange={(event) => setFilter("membersMin", event.target.value)}
              />
              <input
                type="number"
                min={0}
                className="input input-number"
                placeholder="max"
                aria-label="Nombre de membres maximum"
                value={filters.membersMax}
                onChange={(event) => setFilter("membersMax", event.target.value)}
              />
            </div>
          </div>

          <div className="filter-field">
            <span>Arrivée du bot</span>
            <div className="filter-range">
              <input
                type="date"
                className="input"
                aria-label="Arrivée du bot à partir du"
                value={filters.createdFrom}
                onChange={(event) => setFilter("createdFrom", event.target.value)}
              />
              <input
                type="date"
                className="input"
                aria-label="Arrivée du bot jusqu'au"
                value={filters.createdTo}
                onChange={(event) => setFilter("createdTo", event.target.value)}
              />
            </div>
          </div>

          <div className="filter-field">
            <span>Dernière modification</span>
            <div className="filter-range">
              <input
                type="date"
                className="input"
                aria-label="Dernière modification à partir du"
                value={filters.updatedFrom}
                onChange={(event) => setFilter("updatedFrom", event.target.value)}
              />
              <input
                type="date"
                className="input"
                aria-label="Dernière modification jusqu'au"
                value={filters.updatedTo}
                onChange={(event) => setFilter("updatedTo", event.target.value)}
              />
            </div>
          </div>

          <FilterField
            label="Module aventure"
            value={filters.adventure}
            onChange={(value) => setFilter("adventure", value as Filters["adventure"])}
            options={[
              { value: "all", label: "Tous" },
              { value: "enabled", label: "Ouvert" },
              { value: "disabled", label: "Fermé" },
              { value: "none", label: "Jamais réglé" },
            ]}
          />

          <FilterField
            label="Réglages automod"
            value={filters.automod}
            onChange={(value) => setFilter("automod", value as FlagFilter)}
            options={flagOptions("Configurés", "Jamais touchés")}
          />

          <FilterField
            label="Réglages modération"
            value={filters.moderation}
            onChange={(value) => setFilter("moderation", value as FlagFilter)}
            options={flagOptions("Configurés", "Jamais touchés")}
          />

          <FilterField
            label="Réglages musique"
            value={filters.music}
            onChange={(value) => setFilter("music", value as FlagFilter)}
            options={flagOptions("Configurés", "Jamais touchés")}
          />

          <FilterField
            label="Salon de logs modération"
            value={filters.modLog}
            onChange={(value) => setFilter("modLog", value as FlagFilter)}
            options={flagOptions("Défini", "Non défini")}
          />

          <FilterField
            label="Salon de logs automod"
            value={filters.automodLog}
            onChange={(value) => setFilter("automodLog", value as FlagFilter)}
            options={flagOptions("Défini", "Non défini")}
          />

          <FilterField
            label="Rôle DJ"
            value={filters.djRole}
            onChange={(value) => setFilter("djRole", value as FlagFilter)}
            options={flagOptions("Défini", "Non défini")}
          />

          <FilterField
            label="Salon musique"
            value={filters.musicChannel}
            onChange={(value) => setFilter("musicChannel", value as FlagFilter)}
            options={flagOptions("Défini", "Non défini")}
          />

          <FilterField
            label="Salons du module fun"
            value={filters.funChannels}
            onChange={(value) => setFilter("funChannels", value as FlagFilter)}
            options={flagOptions("Restreints", "Tous les salons")}
          />

          <FilterField
            label="Playlists blindtest"
            value={filters.playlists}
            onChange={(value) => setFilter("playlists", value as FlagFilter)}
            options={flagOptions("Au moins une", "Aucune")}
          />

          <FilterField
            label="Sanctions"
            value={filters.cases}
            onChange={(value) => setFilter("cases", value as FlagFilter)}
            options={flagOptions("Au moins une", "Aucune")}
          />

          <FilterField
            label="Avertissements"
            value={filters.warns}
            onChange={(value) => setFilter("warns", value as FlagFilter)}
            options={flagOptions("Au moins un", "Aucun")}
          />

          <FilterField
            label="Icône du serveur"
            value={filters.icon}
            onChange={(value) => setFilter("icon", value as FlagFilter)}
            options={flagOptions("Personnalisée", "Par défaut")}
          />
        </div>
      )}

      {failed ? (
        <div className="empty-state">La liste des serveurs n&apos;a pas pu être chargée.</div>
      ) : result === null ? (
        <p className="text-muted">Chargement…</p>
      ) : result.totalPresent === 0 ? (
        <div className="empty-state">Aucun serveur.</div>
      ) : guilds.length === 0 ? (
        <div className="empty-state">Aucun serveur ne correspond à ces filtres.</div>
      ) : (
        <>
          <div className="table-scroll" aria-busy={loading}>
            <table className="table server-table">
              <thead>
                <tr>
                  <SortHeader
                    field="name"
                    label="Serveur"
                    sort={sort}
                    order={order}
                    onSort={changeSort}
                  />
                  <SortHeader field="id" label="ID" sort={sort} order={order} onSort={changeSort} />
                  <SortHeader
                    field="members"
                    label="Membres"
                    sort={sort}
                    order={order}
                    onSort={changeSort}
                  />
                  <SortHeader
                    field="language"
                    label="Langue"
                    sort={sort}
                    order={order}
                    onSort={changeSort}
                  />
                  <SortHeader
                    field="premium"
                    label="Premium"
                    sort={sort}
                    order={order}
                    onSort={changeSort}
                  />
                  <th>Réglages</th>
                  <SortHeader
                    field="cases"
                    label="Sanctions"
                    sort={sort}
                    order={order}
                    onSort={changeSort}
                  />
                  <SortHeader
                    field="warns"
                    label="Avert."
                    sort={sort}
                    order={order}
                    onSort={changeSort}
                  />
                  <SortHeader
                    field="createdAt"
                    label="Arrivée"
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
                  const name = guild.name ?? "Sans nom";
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
                      <td className="numeric">{formatNumber(guild.memberCount)}</td>
                      <td>{languageLabel(guild.language)}</td>
                      <td>
                        <PremiumCell guild={guild} />
                      </td>
                      <td>
                        <ModuleBadges guild={guild} />
                      </td>
                      <td className="numeric">{formatNumber(guild.moderationCaseCount)}</td>
                      <td className="numeric">{formatNumber(guild.warnCount)}</td>
                      <td>{new Date(guild.createdAt).toLocaleDateString("fr-FR")}</td>
                      <td>
                        <div className="table-actions">
                          <Link
                            href={`/dashboard/${guild.id}/settings`}
                            className="button-secondary"
                          >
                            Paramètres
                          </Link>
                          <button
                            className="button-secondary"
                            disabled={pendingGuildId === guild.id}
                            onClick={() => void togglePremium(guild)}
                          >
                            {guild.premium ? "Retirer premium" : "Offrir premium"}
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
              <span>Par page</span>
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
              Page {formatNumber(result.page)} sur {formatNumber(result.pageCount)}
            </span>

            <div className="table-actions">
              <button
                type="button"
                className="button-secondary"
                disabled={result.page <= 1 || loading}
                onClick={() => setPage(result.page - 1)}
              >
                Précédent
              </button>
              <button
                type="button"
                className="button-secondary"
                disabled={result.page >= result.pageCount || loading}
                onClick={() => setPage(result.page + 1)}
              >
                Suivant
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
