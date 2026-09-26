"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CreditsCard } from "@/components/credits/CreditsCard";
import { LoadFailed } from "@/components/LoadFailed";
import { useTranslation } from "@/i18n";
import { api } from "@/lib/api";
import type { ManageableGuild } from "@/lib/types";
import { useSession } from "@/lib/useSession";

function guildIconUrl(guild: ManageableGuild): string | null {
  if (!guild.icon) return null;
  return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`;
}

export default function DashboardPage() {
  const t = useTranslation();
  const { session, loading, failed } = useSession();
  const [guilds, setGuilds] = useState<ManageableGuild[] | null>(null);

  useEffect(() => {
    if (!session) return;
    api
      .get<ManageableGuild[]>("/guilds")
      .then(setGuilds)
      .catch(() => setGuilds([]));
  }, [session]);

  function openInvitePopup(guild: ManageableGuild): void {
    if (!guild.inviteUrl) return;
    window.open(guild.inviteUrl, "gaulia-invite", "width=500,height=800,noopener,noreferrer");
  }

  if (failed) {
    return (
      <div className="container">
        <LoadFailed />
      </div>
    );
  }

  if (loading || !session) {
    return <div className="container text-muted">{t("common.state.loading")}</div>;
  }

  const activeGuilds = guilds?.filter((guild) => guild.botPresent) ?? null;
  const invitableGuilds = guilds?.filter((guild) => !guild.botPresent) ?? null;

  return (
    <div className="container">
      <h1>{t("dashboard.guilds.title")}</h1>
      <p className="text-muted">{t("dashboard.guilds.subtitle")}</p>

      <CreditsCard />

      {guilds === null ? (
        <p className="text-muted">{t("common.state.loading")}</p>
      ) : (
        <>
          {activeGuilds?.length === 0 && (
            <div className="empty-state">{t("dashboard.guilds.empty")}</div>
          )}

          {activeGuilds !== null && activeGuilds.length > 0 && (
            <div className="guild-grid">
              {activeGuilds.map((guild) => {
                const icon = guildIconUrl(guild);
                return (
                  <Link
                    key={guild.id}
                    href={`/dashboard/${guild.id}/settings`}
                    className="card guild-card"
                  >
                    <div className="guild-avatar">
                      {icon ? <img src={icon} alt="" /> : guild.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span>{guild.name}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {invitableGuilds !== null && invitableGuilds.length > 0 && (
            <>
              <h2 style={{ marginTop: 32 }}>{t("dashboard.guilds.invitableTitle")}</h2>
              <p className="text-muted">{t("dashboard.guilds.invitableSubtitle")}</p>
              <div className="guild-grid">
                {invitableGuilds.map((guild) => {
                  const icon = guildIconUrl(guild);
                  return (
                    <button
                      key={guild.id}
                      type="button"
                      onClick={() => openInvitePopup(guild)}
                      className="card guild-card guild-card-invitable"
                      title={t("dashboard.guilds.invite", { guild: guild.name })}
                    >
                      <div className="guild-avatar">
                        {icon ? <img src={icon} alt="" /> : guild.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{guild.name}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
