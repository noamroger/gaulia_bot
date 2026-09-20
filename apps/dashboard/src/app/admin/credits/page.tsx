"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { api, ApiError } from "@/lib/api";
import { userAvatarUrl } from "@/lib/discordCdn";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { AdminCreditAccount } from "@/lib/types";

const SNOWFLAKE = /^\d{17,20}$/;

/** L'avatar vient du webhook top.gg (URL complète) ; sinon, avatar Discord par défaut. */
function avatarUrl(account: AdminCreditAccount): string {
  return account.avatar?.startsWith("http")
    ? account.avatar
    : userAvatarUrl(account.userId, account.avatar);
}

function errorMessage(error: unknown): string {
  return error instanceof ApiError && error.status < 500
    ? error.message
    : "Une erreur interne est survenue.";
}

/** Édition en cours sur une ligne : nouvelle valeur saisie, puis confirmation avant sauvegarde. */
interface RowEdit {
  userId: string;
  value: string;
  confirming: boolean;
}

export default function AdminCreditsPage() {
  const [accounts, setAccounts] = useState<AdminCreditAccount[] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const [edit, setEdit] = useState<RowEdit | null>(null);

  // Boîte de dialogue « ajouter / retirer par identifiant ».
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogUserId, setDialogUserId] = useState("");
  const [dialogAmount, setDialogAmount] = useState("");
  const [dialogReason, setDialogReason] = useState("");
  const [dialogConfirming, setDialogConfirming] = useState(false);

  useEffect(() => {
    api
      .get<AdminCreditAccount[]>("/admin/credits")
      .then(setAccounts)
      .catch(() => setAccounts([]));
  }, []);

  const filtered = useMemo(() => {
    if (!accounts) return null;
    const needle = query.trim().toLowerCase();
    if (!needle) return accounts;
    return accounts.filter(
      (account) =>
        account.userId.includes(needle) || (account.username ?? "").toLowerCase().includes(needle),
    );
  }, [accounts, query]);

  const totalCredits = useMemo(
    () => (accounts ?? []).reduce((sum, account) => sum + account.balance, 0),
    [accounts],
  );

  function mergeAccount(updated: AdminCreditAccount): void {
    setAccounts((current) => {
      if (!current) return [updated];
      const exists = current.some((account) => account.userId === updated.userId);
      const next = exists
        ? current.map((account) => (account.userId === updated.userId ? updated : account))
        : [...current, updated];
      return [...next].sort((a, b) => b.balance - a.balance);
    });
  }

  async function saveBalance(userId: string, balance: number): Promise<void> {
    setPendingUserId(userId);
    setError(null);
    setSuccess(null);
    try {
      const updated = await api.patch<AdminCreditAccount>(`/admin/credits/${userId}`, { balance });
      mergeAccount(updated);
      setEdit(null);
      setSuccess(`Solde de ${userId} fixé à ${formatNumber(updated.balance)} crédit(s).`);
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setPendingUserId(null);
    }
  }

  async function applyDelta(event?: FormEvent<HTMLFormElement>): Promise<void> {
    event?.preventDefault();
    const userId = dialogUserId.trim();
    const delta = Number(dialogAmount);
    if (!SNOWFLAKE.test(userId) || !Number.isInteger(delta) || delta === 0) return;

    setPendingUserId(userId);
    setError(null);
    setSuccess(null);
    try {
      const updated = await api.patch<AdminCreditAccount>(`/admin/credits/${userId}`, {
        delta,
        ...(dialogReason.trim() ? { reason: dialogReason.trim() } : {}),
      });
      mergeAccount(updated);
      setSuccess(
        `${delta > 0 ? "+" : ""}${formatNumber(delta)} crédit(s) pour ${userId} - nouveau solde : ${formatNumber(updated.balance)}.`,
      );
      setDialogOpen(false);
      setDialogConfirming(false);
      setDialogUserId("");
      setDialogAmount("");
      setDialogReason("");
    } catch (adjustError) {
      setError(errorMessage(adjustError));
      setDialogConfirming(false);
    } finally {
      setPendingUserId(null);
    }
  }

  const dialogUserIdValid = SNOWFLAKE.test(dialogUserId.trim());
  const dialogDelta = Number(dialogAmount);
  const dialogAmountValid = Number.isInteger(dialogDelta) && dialogDelta !== 0;

  const editValue = edit ? Number(edit.value) : Number.NaN;
  const editValid = Number.isInteger(editValue) && editValue >= 0;

  return (
    <div>
      <div className="toolbar">
        <input
          type="search"
          className="search-input"
          placeholder="Rechercher par pseudo ou ID…"
          aria-label="Rechercher un utilisateur par pseudo ou ID"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button
          type="button"
          className="button-primary"
          onClick={() => {
            setDialogOpen((open) => !open);
            setDialogConfirming(false);
            setError(null);
            setSuccess(null);
          }}
        >
          Ajouter / retirer des crédits
        </button>
        {accounts && filtered && (
          <span className="text-muted">
            {filtered.length} / {accounts.length} compte(s) · {formatNumber(totalCredits)} crédits
            en circulation
          </span>
        )}
      </div>

      {dialogOpen && (
        <section className="card credit-dialog" aria-label="Ajouter ou retirer des crédits">
          <h2 className="card-title">Ajouter ou retirer des crédits</h2>
          <p className="card-subtitle">
            Saisis l&apos;identifiant Discord de l&apos;utilisateur et la variation à appliquer : un
            nombre positif ajoute des crédits, un nombre négatif en retire. Le compte est créé
            s&apos;il n&apos;existe pas encore.
          </p>

          <form
            className="credit-dialog-form"
            onSubmit={(event) => {
              event.preventDefault();
              setDialogConfirming(true);
            }}
          >
            <label className="field">
              <span>Identifiant Discord</span>
              <input
                type="text"
                inputMode="numeric"
                className="input"
                placeholder="123456789012345678"
                value={dialogUserId}
                onChange={(event) => {
                  setDialogUserId(event.target.value);
                  setDialogConfirming(false);
                }}
              />
            </label>
            <label className="field">
              <span>Crédits (+ / −)</span>
              <input
                type="number"
                className="input input-number"
                placeholder="150"
                value={dialogAmount}
                onChange={(event) => {
                  setDialogAmount(event.target.value);
                  setDialogConfirming(false);
                }}
              />
            </label>
            <label className="field">
              <span>Motif (facultatif)</span>
              <input
                type="text"
                className="input"
                placeholder="Compensation, concours…"
                maxLength={200}
                value={dialogReason}
                onChange={(event) => setDialogReason(event.target.value)}
              />
            </label>

            {!dialogConfirming ? (
              <button
                type="submit"
                className="button-primary"
                disabled={!dialogUserIdValid || !dialogAmountValid}
              >
                Continuer
              </button>
            ) : (
              <div className="toolbar" style={{ margin: 0 }}>
                <button
                  type="button"
                  className="button-primary"
                  disabled={pendingUserId !== null}
                  onClick={() => void applyDelta()}
                >
                  {pendingUserId !== null
                    ? "Enregistrement…"
                    : `Confirmer ${dialogDelta > 0 ? "+" : ""}${formatNumber(dialogDelta)}`}
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  disabled={pendingUserId !== null}
                  onClick={() => setDialogConfirming(false)}
                >
                  Annuler
                </button>
              </div>
            )}
          </form>

          {dialogUserId.trim() !== "" && !dialogUserIdValid && (
            <p className="field-hint">Un identifiant Discord contient 17 à 20 chiffres.</p>
          )}
        </section>
      )}

      {error && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="notice notice-success" role="status">
          {success}
        </p>
      )}

      {accounts === null || filtered === null ? (
        <p className="text-muted">Chargement…</p>
      ) : accounts.length === 0 ? (
        <div className="empty-state">
          Aucun utilisateur ne possède de crédits pour l&apos;instant.
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">Aucun compte ne correspond à « {query.trim()} ».</div>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 16 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>ID</th>
                <th>Crédits</th>
                <th>Votes</th>
                <th>Dernier vote</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((account) => {
                const editing = edit?.userId === account.userId;
                const name = account.username ?? "-";
                return (
                  <tr key={account.userId}>
                    <td>
                      <div className="guild-cell">
                        <span className="guild-avatar guild-avatar-sm">
                          <img src={avatarUrl(account)} alt="" />
                        </span>
                        <span>{name}</span>
                      </div>
                    </td>
                    <td>
                      <code>{account.userId}</code>
                    </td>
                    <td className="numeric">
                      {editing ? (
                        <input
                          type="number"
                          className="input input-number"
                          min={0}
                          autoFocus
                          value={edit.value}
                          disabled={pendingUserId === account.userId}
                          onChange={(event) =>
                            setEdit({
                              userId: account.userId,
                              value: event.target.value,
                              confirming: false,
                            })
                          }
                        />
                      ) : (
                        formatNumber(account.balance)
                      )}
                    </td>
                    <td className="numeric">{formatNumber(account.voteCount)}</td>
                    <td>{account.lastVoteAt ? formatDateTime(account.lastVoteAt) : "-"}</td>
                    <td>
                      <div className="table-actions">
                        {!editing ? (
                          <button
                            type="button"
                            className="button-secondary"
                            onClick={() => {
                              setEdit({
                                userId: account.userId,
                                value: String(account.balance),
                                confirming: false,
                              });
                              setError(null);
                              setSuccess(null);
                            }}
                          >
                            Modifier
                          </button>
                        ) : edit.confirming ? (
                          <>
                            <button
                              type="button"
                              className="button-primary"
                              disabled={pendingUserId === account.userId}
                              onClick={() => void saveBalance(account.userId, editValue)}
                            >
                              {pendingUserId === account.userId
                                ? "Enregistrement…"
                                : `Confirmer ${formatNumber(editValue)}`}
                            </button>
                            <button
                              type="button"
                              className="button-secondary"
                              disabled={pendingUserId === account.userId}
                              onClick={() => setEdit({ ...edit, confirming: false })}
                            >
                              Annuler
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="button-primary"
                              disabled={!editValid || editValue === account.balance}
                              onClick={() => setEdit({ ...edit, confirming: true })}
                            >
                              Enregistrer
                            </button>
                            <button
                              type="button"
                              className="button-secondary"
                              onClick={() => setEdit(null)}
                            >
                              Annuler
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {edit?.confirming && (
        <p className="text-muted" style={{ fontSize: 13, marginTop: 12 }}>
          Le solde de {edit.userId} passera à {formatNumber(editValue)} crédit(s). La variation est
          enregistrée dans l&apos;historique du compte.
        </p>
      )}
    </div>
  );
}
