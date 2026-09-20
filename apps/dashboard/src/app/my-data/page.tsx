"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { API_URL } from "@/lib/config";
import { userAvatarUrl } from "@/lib/discordCdn";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { MyDataResponse, UserDataExport } from "@/lib/types";

/** La connexion repasse par l'API, qui ramène ici plutôt que sur le tableau de bord. */
const LOGIN_URL = `${API_URL}/auth/login?redirect=/my-data`;

/** Mot à recopier pour confirmer la suppression, exigé aussi par l'API. */
const CONFIRMATION_WORD = "SUPPRIMER";

const CASE_LABELS: Record<string, string> = {
  BAN: "Bannissement",
  UNBAN: "Débannissement",
  KICK: "Expulsion",
  TIMEOUT: "Sourdine",
  UNTIMEOUT: "Fin de sourdine",
  WARN: "Avertissement",
  UNWARN: "Avertissement retiré",
  PURGE: "Purge de messages",
};

const CREDIT_LABELS: Record<string, string> = {
  VOTE: "Vote top.gg",
  PREMIUM_REDEEM: "Échange contre du premium",
  ADMIN_ADJUST: "Ajustement par un administrateur",
  PREMIUM_REFUND: "Remboursement de premium offert",
};

const CLASS_LABELS: Record<string, string> = {
  GUERRIER: "Guerrier",
  MAGE: "Mage",
  RODEUR: "Rôdeur",
};

type Step = "idle" | "confirming" | "deleting" | "done";

function label(labels: Record<string, string>, value: string): string {
  return labels[value] ?? value;
}

function guildLabel(name: string | null, id: string | null): string {
  if (name) return name;
  return id ? `Serveur ${id}` : "—";
}

function duration(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  if (seconds < 86_400) return `${Math.round(seconds / 3600)} h`;
  return `${Math.round(seconds / 86_400)} j`;
}

function errorMessage(error: unknown): string {
  return error instanceof ApiError && error.status < 500
    ? error.message
    : "Une erreur est survenue. Réessaie dans quelques instants.";
}

/** Déclenche le téléchargement du JSON sans passer par le serveur : tout est déjà chargé. */
function download(data: UserDataExport): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `gaulia-mes-donnees-${data.userId}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function LoginPrompt() {
  return (
    <div className="card my-data-card">
      <h2 style={{ marginTop: 0 }}>Connecte-toi pour voir tes données</h2>
      <p className="text-muted">
        Cette page affiche ce que Gaulia conserve sur ton compte Discord. Elle passe donc par une
        connexion Discord : c&apos;est elle qui prouve que le compte est bien le tien, et personne
        d&apos;autre ne peut consulter ni supprimer tes données.
      </p>
      <a className="button-primary" href={LOGIN_URL}>
        Se connecter avec Discord
      </a>
    </div>
  );
}

/** Section repliée par défaut : le détail ne s'ouvre que si l'utilisateur le demande. */
function Section({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <details className="my-data-section" open={false}>
      <summary>
        <span>{title}</span>
        <strong>{count === 0 ? "Aucune" : formatNumber(count)}</strong>
      </summary>
      <div className="my-data-section-body">
        {count === 0 ? <p className="text-muted">{empty}</p> : children}
      </div>
    </details>
  );
}

export default function MyDataPage() {
  const [payload, setPayload] = useState<MyDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(true);
  const [step, setStep] = useState<Step>("idle");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api
      .get<MyDataResponse>("/me/data")
      .then((data) => {
        if (!cancelled) setPayload(data);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        // Pas de session : la page propose de se connecter, ce n'est pas une erreur.
        if (loadError instanceof ApiError && loadError.status === 401) setAuthenticated(false);
        else setError(errorMessage(loadError));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function erase(): Promise<void> {
    setStep("deleting");
    setError(null);
    try {
      await api.delete("/me/data", { confirm: CONFIRMATION_WORD });
      setStep("done");
      setPayload(null);
    } catch (eraseError) {
      setError(errorMessage(eraseError));
      setStep("confirming");
    }
  }

  if (step === "done") {
    return (
      <div className="container">
        <h1>Mes données</h1>
        <div className="card my-data-card">
          <p className="notice notice-success" role="status" style={{ marginTop: 0 }}>
            Tes données ont été supprimées.
          </p>
          <p className="text-muted">
            Ta session a été fermée, puisqu&apos;elle contenait elle aussi ton pseudo et ton
            adresse. Les réglages des serveurs que tu administres n&apos;ont pas été touchés : ils
            appartiennent aux serveurs, pas à ton compte. Si tu utilises encore Gaulia, de nouvelles
            données pourront être créées, et cette page te permettra de les supprimer à nouveau.
          </p>
          <Link className="button-primary" href="/">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  const data = payload?.data;
  const account = payload?.account;

  return (
    <div className="container">
      <p>
        <Link href="/" className="text-muted">
          ← Retour à l&apos;accueil
        </Link>
      </p>

      <h1>Mes données</h1>
      <p className="text-muted my-data-intro">
        Tout ce que Gaulia conserve sur ton compte Discord, à consulter, à télécharger ou à
        supprimer toi-même, sans avoir à écrire à qui que ce soit. Pour le détail de ce qui est
        collecté et pourquoi, la <Link href="/privacy">politique de confidentialité</Link> explique
        chaque point.
      </p>

      {loading && <p className="text-muted">Chargement…</p>}
      {!loading && !authenticated && <LoginPrompt />}
      {!loading && authenticated && error && !data && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}

      {!loading && data && account && (
        <>
          <section className="card my-data-card">
            <div className="contact-identity">
              <img
                src={userAvatarUrl(account.userId, account.avatar, 64)}
                alt=""
                width={44}
                height={44}
                className="contact-avatar"
              />
              <div>
                <strong>{account.username}</strong>
                <p className="text-muted">
                  {account.userId}
                  {account.email ? ` · ${account.email}` : ""}
                </p>
              </div>
            </div>
            <p className="field-hint" style={{ marginTop: 10 }}>
              Ton pseudo, ton avatar et ton adresse viennent de Discord et ne vivent que dans le
              cookie de ta session, pendant 12 heures. Ils ne sont pas enregistrés en base de
              données.
            </p>

            <div className="toolbar" style={{ marginBottom: 0 }}>
              <button type="button" className="button-primary" onClick={() => download(data)}>
                Télécharger mes données (JSON)
              </button>
              <span className="text-muted" style={{ fontSize: 13 }}>
                Relevé du {formatDateTime(data.generatedAt)}
              </span>
            </div>
          </section>

          <section className="card my-data-card">
            <h2 className="card-title">Ce que nous avons enregistré</h2>
            <p className="card-subtitle">
              Les identifiants des autres membres (le modérateur d&apos;une sanction, le partenaire
              d&apos;un échange) ne figurent pas ici : ce sont leurs données, pas les tiennes.
            </p>

            <Section
              title="Sanctions reçues"
              count={data.sanctionsReceived.length}
              empty="Aucune sanction enregistrée à ton nom."
            >
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Serveur</th>
                      <th>Type</th>
                      <th>Raison</th>
                      <th>Durée</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sanctionsReceived.map((entry) => (
                      <tr key={`${entry.guildId}-${entry.caseNumber}`}>
                        <td>{guildLabel(entry.guildName, entry.guildId)}</td>
                        <td>{label(CASE_LABELS, entry.type)}</td>
                        <td>{entry.reason ?? "—"}</td>
                        <td>{duration(entry.durationSecs)}</td>
                        <td>{formatDateTime(entry.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section
              title="Avertissements reçus"
              count={data.warnsReceived.length}
              empty="Aucun avertissement enregistré à ton nom."
            >
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Serveur</th>
                      <th>Raison</th>
                      <th>État</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.warnsReceived.map((entry) => (
                      <tr key={`${entry.guildId}-${entry.createdAt}`}>
                        <td>{guildLabel(entry.guildName, entry.guildId)}</td>
                        <td>{entry.reason ?? "—"}</td>
                        <td>{entry.active ? "Actif" : "Retiré"}</td>
                        <td>{formatDateTime(entry.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section
              title="Sanctions données en tant que modérateur"
              count={data.moderatorActivity.moderationCases + data.moderatorActivity.warns}
              empty="Tu n'as sanctionné personne avec Gaulia."
            >
              <ul className="data-summary">
                <li>
                  <span>Sanctions prononcées</span>
                  <strong>{formatNumber(data.moderatorActivity.moderationCases)}</strong>
                </li>
                <li>
                  <span>Avertissements donnés</span>
                  <strong>{formatNumber(data.moderatorActivity.warns)}</strong>
                </li>
              </ul>
              <p className="text-muted" style={{ fontSize: 13 }}>
                Ces lignes appartiennent à l&apos;historique des serveurs concernés. Une suppression
                de tes données en retire ton identité, mais laisse la sanction en place.
              </p>
            </Section>

            <Section
              title="Crédits et votes top.gg"
              count={(data.credits ? 1 : 0) + data.topggVotes.length}
              empty="Aucun compte de crédits : tu n'as jamais voté pour Gaulia."
            >
              {data.credits && (
                <ul className="data-summary">
                  <li>
                    <span>Solde actuel</span>
                    <strong>{formatNumber(data.credits.balance)}</strong>
                  </li>
                  <li>
                    <span>Total gagné depuis le début</span>
                    <strong>{formatNumber(data.credits.totalEarned)}</strong>
                  </li>
                  <li>
                    <span>Votes comptabilisés</span>
                    <strong>{formatNumber(data.credits.voteCount)}</strong>
                  </li>
                  <li>
                    <span>Dernier vote</span>
                    <strong>
                      {data.credits.lastVoteAt ? formatDateTime(data.credits.lastVoteAt) : "—"}
                    </strong>
                  </li>
                </ul>
              )}
              {data.credits && data.credits.transactions.length > 0 && (
                <div className="table-scroll" style={{ marginTop: 16 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Mouvement</th>
                        <th className="numeric">Montant</th>
                        <th className="numeric">Solde après</th>
                        <th>Serveur</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.credits.transactions.map((entry) => (
                        <tr key={`${entry.createdAt}-${entry.balanceAfter}`}>
                          <td>{label(CREDIT_LABELS, entry.type)}</td>
                          <td className="numeric">
                            {entry.amount > 0
                              ? `+${formatNumber(entry.amount)}`
                              : formatNumber(entry.amount)}
                          </td>
                          <td className="numeric">{formatNumber(entry.balanceAfter)}</td>
                          <td>
                            {entry.guildId ? guildLabel(entry.guildName, entry.guildId) : "—"}
                          </td>
                          <td>{formatDateTime(entry.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {data.topggVotes.length > 0 && (
                <p className="text-muted" style={{ fontSize: 13 }}>
                  {formatNumber(data.topggVotes.length)} vote(s) gardé(s) en mémoire, uniquement
                  pour ne pas te créditer deux fois le même. Le détail est dans le fichier JSON.
                </p>
              )}
            </Section>

            <Section
              title="Droits premium"
              count={data.premiumEntitlements.length}
              empty="Aucun abonnement premium rattaché à ton compte."
            >
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Serveur</th>
                      <th>Début</th>
                      <th>Fin</th>
                      <th>État</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.premiumEntitlements.map((entry) => (
                      <tr key={entry.entitlementId}>
                        <td>{entry.guildId ? guildLabel(entry.guildName, entry.guildId) : "—"}</td>
                        <td>{entry.startsAt ? formatDateTime(entry.startsAt) : "—"}</td>
                        <td>{entry.endsAt ? formatDateTime(entry.endsAt) : "—"}</td>
                        <td>{entry.deleted ? "Terminé" : "Actif"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-muted" style={{ fontSize: 13 }}>
                Ce sont les droits transmis par Discord. Aucune information de paiement ne nous
                parvient : l&apos;abonnement lui-même se gère depuis les paramètres Discord.
              </p>
            </Section>

            <Section
              title="Aventure"
              count={data.adventure ? 1 : 0}
              empty="Aucun personnage d'aventure créé."
            >
              {data.adventure && (
                <>
                  <ul className="data-summary">
                    <li>
                      <span>Classe</span>
                      <strong>{label(CLASS_LABELS, data.adventure.characterClass)}</strong>
                    </li>
                    <li>
                      <span>Niveau</span>
                      <strong>{formatNumber(data.adventure.level)}</strong>
                    </li>
                    <li>
                      <span>Expérience totale</span>
                      <strong>{formatNumber(data.adventure.totalXp)}</strong>
                    </li>
                    <li>
                      <span>Or et échos</span>
                      <strong>
                        {formatNumber(data.adventure.gold)} · {formatNumber(data.adventure.echoes)}
                      </strong>
                    </li>
                    <li>
                      <span>Objets en inventaire</span>
                      <strong>{formatNumber(data.adventure.items.length)}</strong>
                    </li>
                    <li>
                      <span>Hauts faits débloqués</span>
                      <strong>{formatNumber(data.adventure.achievements.length)}</strong>
                    </li>
                    <li>
                      <span>Explorations · victoires · défaites</span>
                      <strong>
                        {formatNumber(data.adventure.explorations)} ·{" "}
                        {formatNumber(data.adventure.victories)} ·{" "}
                        {formatNumber(data.adventure.defeats)}
                      </strong>
                    </li>
                    <li>
                      <span>Dernière partie</span>
                      <strong>
                        {data.adventure.lastPlayedAt
                          ? formatDateTime(data.adventure.lastPlayedAt)
                          : "—"}
                      </strong>
                    </li>
                  </ul>
                  <p className="text-muted" style={{ fontSize: 13 }}>
                    L&apos;inventaire, les quêtes, le journal et l&apos;historique des échanges
                    figurent en entier dans le fichier JSON.
                  </p>
                </>
              )}
            </Section>

            <Section
              title="Serveurs que tu peux gérer"
              count={account.manageableGuilds.length}
              empty="Aucun serveur administrable avec ce compte."
            >
              <ul className="data-summary">
                {account.manageableGuilds.map((guild) => (
                  <li key={guild.id}>
                    <span>{guild.name}</span>
                    <strong>{guild.id}</strong>
                  </li>
                ))}
              </ul>
              <p className="text-muted" style={{ fontSize: 13 }}>
                Cette liste vient de Discord à chaque connexion et n&apos;est pas enregistrée. Elle
                sert à savoir quels serveurs afficher dans le tableau de bord.
              </p>
            </Section>
          </section>

          <section className="card my-data-card my-data-danger">
            <h2 className="card-title">Supprimer mes données</h2>
            <p className="card-subtitle">
              La suppression est définitive et immédiate. Elle efface ce qui te concerne :
            </p>
            <ul className="my-data-list">
              <li>les sanctions et avertissements que tu as reçus ;</li>
              <li>ton compte de crédits, son historique et tes votes top.gg enregistrés ;</li>
              <li>ton personnage d&apos;aventure, son inventaire et sa progression ;</li>
              <li>les droits premium gardés en cache pour ton compte.</li>
            </ul>
            <p className="text-muted" style={{ fontSize: 13 }}>
              Les sanctions que tu as prononcées en tant que modérateur restent dans
              l&apos;historique des serveurs concernés, sans ton identité. La configuration des
              serveurs que tu administres n&apos;est pas touchée : elle appartient au serveur, et sa
              suppression se demande séparément. Un abonnement premium encore actif chez Discord
              sera resynchronisé automatiquement : pour l&apos;arrêter, annule-le depuis les
              paramètres Discord.
            </p>

            {step === "idle" ? (
              <button type="button" className="button-danger" onClick={() => setStep("confirming")}>
                Supprimer mes données
              </button>
            ) : (
              <>
                <div className="field" style={{ maxWidth: 320 }}>
                  <label htmlFor="my-data-confirm">
                    Recopie {CONFIRMATION_WORD} pour confirmer
                  </label>
                  <input
                    id="my-data-confirm"
                    className="input"
                    type="text"
                    autoComplete="off"
                    value={confirmation}
                    disabled={step === "deleting"}
                    onChange={(event) => setConfirmation(event.target.value)}
                  />
                </div>
                <div className="toolbar" style={{ marginBottom: 0 }}>
                  <button
                    type="button"
                    className="button-danger"
                    disabled={confirmation.trim() !== CONFIRMATION_WORD || step === "deleting"}
                    onClick={() => void erase()}
                  >
                    {step === "deleting" ? "Suppression…" : "Confirmer la suppression définitive"}
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    disabled={step === "deleting"}
                    onClick={() => {
                      setStep("idle");
                      setConfirmation("");
                      setError(null);
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </>
            )}

            {error && (
              <p className="notice notice-error" role="alert">
                {error}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
