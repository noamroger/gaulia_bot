"use client";

import { useTranslation } from "@/i18n";

/**
 * Shown in place of an endless "Loading" when the API could not be reached. Retrying reloads the
 * page, so every request that failed with it (navigation bar included) runs again.
 */
export function LoadFailed() {
  const t = useTranslation();

  return (
    <div className="empty-state" role="alert">
      <p>{t("common.state.error")}</p>
      <button type="button" className="button-secondary" onClick={() => window.location.reload()}>
        {t("common.state.retry")}
      </button>
    </div>
  );
}
