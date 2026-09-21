"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { useLocale, useTranslation, type AppLocale, type Translator } from "@/i18n";
import { api, ApiError } from "@/lib/api";
import { userAvatarUrl } from "@/lib/discordCdn";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { AdminCreditAccount } from "@/lib/types";

const SNOWFLAKE = /^\d{17,20}$/;

/** The avatar comes from the top.gg webhook (full URL); otherwise, the default Discord avatar. */
function avatarUrl(account: AdminCreditAccount): string {
  return account.avatar?.startsWith("http")
    ? account.avatar
    : userAvatarUrl(account.userId, account.avatar);
}

/** Keeps the explicit "+" that number formatting drops on a positive change. */
function signedAmount(value: number, locale: AppLocale): string {
  return `${value > 0 ? "+" : ""}${formatNumber(value, locale)}`;
}

function errorMessage(error: unknown, t: Translator): string {
  return error instanceof ApiError && error.status < 500 && !error.generic
    ? error.message
    : t("common.state.error");
}

/** Edit in progress on a row: the typed value, then a confirmation before saving. */
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

  // "Add / remove by ID" dialog.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogUserId, setDialogUserId] = useState("");
  const [dialogAmount, setDialogAmount] = useState("");
  const [dialogReason, setDialogReason] = useState("");
  const [dialogConfirming, setDialogConfirming] = useState(false);

  const t = useTranslation();
  const locale = useLocale();

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
      setSuccess(
        t("admin.credits.balanceSet", {
          count: updated.balance,
          userId,
          amount: formatNumber(updated.balance, locale),
        }),
      );
    } catch (saveError) {
      setError(errorMessage(saveError, t));
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
        t("admin.credits.deltaApplied", {
          count: Math.abs(delta),
          amount: signedAmount(delta, locale),
          userId,
          balance: formatNumber(updated.balance, locale),
        }),
      );
      setDialogOpen(false);
      setDialogConfirming(false);
      setDialogUserId("");
      setDialogAmount("");
      setDialogReason("");
    } catch (adjustError) {
      setError(errorMessage(adjustError, t));
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
          placeholder={t("admin.credits.searchPlaceholder")}
          aria-label={t("admin.credits.searchLabel")}
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
          {t("admin.credits.adjust")}
        </button>
        {accounts && filtered && (
          <span className="text-muted">
            {t("admin.credits.accounts", {
              count: accounts.length,
              shown: filtered.length,
              total: accounts.length,
            })}{" "}
            · {t("admin.credits.circulation", { credits: formatNumber(totalCredits, locale) })}
          </span>
        )}
      </div>

      {dialogOpen && (
        <section className="card credit-dialog" aria-label={t("admin.credits.dialog.title")}>
          <h2 className="card-title">{t("admin.credits.dialog.title")}</h2>
          <p className="card-subtitle">{t("admin.credits.dialog.description")}</p>

          <form
            className="credit-dialog-form"
            onSubmit={(event) => {
              event.preventDefault();
              setDialogConfirming(true);
            }}
          >
            <label className="field">
              <span>{t("admin.credits.dialog.userId")}</span>
              <input
                type="text"
                inputMode="numeric"
                className="input"
                placeholder={t("admin.credits.dialog.userIdPlaceholder")}
                value={dialogUserId}
                onChange={(event) => {
                  setDialogUserId(event.target.value);
                  setDialogConfirming(false);
                }}
              />
            </label>
            <label className="field">
              <span>{t("admin.credits.dialog.amount")}</span>
              <input
                type="number"
                className="input input-number"
                placeholder={t("admin.credits.dialog.amountPlaceholder")}
                value={dialogAmount}
                onChange={(event) => {
                  setDialogAmount(event.target.value);
                  setDialogConfirming(false);
                }}
              />
            </label>
            <label className="field">
              <span>{t("admin.credits.dialog.reason")}</span>
              <input
                type="text"
                className="input"
                placeholder={t("admin.credits.dialog.reasonPlaceholder")}
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
                {t("admin.credits.dialog.submit")}
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
                    ? t("admin.credits.saving")
                    : t("admin.credits.confirm", { amount: signedAmount(dialogDelta, locale) })}
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  disabled={pendingUserId !== null}
                  onClick={() => setDialogConfirming(false)}
                >
                  {t("common.action.cancel")}
                </button>
              </div>
            )}
          </form>

          {dialogUserId.trim() !== "" && !dialogUserIdValid && (
            <p className="field-hint">{t("admin.credits.invalidId")}</p>
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
        <p className="text-muted">{t("common.state.loading")}</p>
      ) : accounts.length === 0 ? (
        <div className="empty-state">{t("admin.credits.empty")}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">{t("admin.credits.noMatch", { query: query.trim() })}</div>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 16 }}>
          <table className="table">
            <thead>
              <tr>
                <th>{t("admin.credits.table.user")}</th>
                <th>{t("admin.credits.table.id")}</th>
                <th>{t("admin.credits.table.credits")}</th>
                <th>{t("admin.credits.table.votes")}</th>
                <th>{t("admin.credits.table.lastVote")}</th>
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
                        formatNumber(account.balance, locale)
                      )}
                    </td>
                    <td className="numeric">{formatNumber(account.voteCount, locale)}</td>
                    <td>{account.lastVoteAt ? formatDateTime(account.lastVoteAt, locale) : "-"}</td>
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
                            {t("admin.credits.edit")}
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
                                ? t("admin.credits.saving")
                                : t("admin.credits.confirm", {
                                    amount: formatNumber(editValue, locale),
                                  })}
                            </button>
                            <button
                              type="button"
                              className="button-secondary"
                              disabled={pendingUserId === account.userId}
                              onClick={() => setEdit({ ...edit, confirming: false })}
                            >
                              {t("common.action.cancel")}
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
                              {t("common.action.save")}
                            </button>
                            <button
                              type="button"
                              className="button-secondary"
                              onClick={() => setEdit(null)}
                            >
                              {t("common.action.cancel")}
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
          {t("admin.credits.pendingEdit", {
            count: editValue,
            userId: edit.userId,
            amount: formatNumber(editValue, locale),
          })}
        </p>
      )}
    </div>
  );
}
