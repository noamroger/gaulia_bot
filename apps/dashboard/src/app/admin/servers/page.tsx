"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import { guildIconUrl } from "@/lib/discordCdn";
import { formatNumber } from "@/lib/format";
import type { AdminGuild } from "@/lib/types";

export default function AdminServersPage() {
  const [guilds, setGuilds] = useState<AdminGuild[] | null>(null);
  const [query, setQuery] = useState("");
  const [pendingGuildId, setPendingGuildId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<AdminGuild[]>("/admin/guilds")
      .then(setGuilds)
      .catch(() => setGuilds([]));
  }, []);

  const filteredGuilds = useMemo(() => {
    if (!guilds) return null;
    const needle = query.trim().toLowerCase();
    if (!needle) return guilds;
    return guilds.filter(
      (guild) => guild.id.includes(needle) || (guild.name ?? "").toLowerCase().includes(needle),
    );
  }, [guilds, query]);

  async function togglePremium(guild: AdminGuild): Promise<void> {
    setPendingGuildId(guild.id);
    try {
      const updated = await api.patch<AdminGuild>(`/admin/guilds/${guild.id}/premium`, {
        premium: !guild.premium,
        premiumExpiresAt: null,
      });
      setGuilds((current) =>
        current ? current.map((item) => (item.id === guild.id ? updated : item)) : current,
      );
    } finally {
      setPendingGuildId(null);
    }
  }

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
        {guilds && filteredGuilds && (
          <span className="text-muted">
            {filteredGuilds.length} / {guilds.length} serveur(s)
          </span>
        )}
      </div>

      {guilds === null || filteredGuilds === null ? (
        <p className="text-muted">Chargement…</p>
      ) : guilds.length === 0 ? (
        <div className="empty-state">Aucun serveur.</div>
      ) : filteredGuilds.length === 0 ? (
        <div className="empty-state">Aucun serveur ne correspond à « {query.trim()} ».</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Serveur</th>
                <th>ID</th>
                <th>Membres</th>
                <th>Premium</th>
                <th>Depuis</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredGuilds.map((guild) => {
                const icon = guildIconUrl(guild.id, guild.icon, 64);
                const name = guild.name ?? "—";
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
                    <td>
                      <span className={`badge ${guild.premium ? "badge-success" : "badge-muted"}`}>
                        {guild.premium ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td>{new Date(guild.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td>
                      <div className="table-actions">
                        <Link href={`/dashboard/${guild.id}/settings`} className="button-secondary">
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
      )}
    </div>
  );
}
