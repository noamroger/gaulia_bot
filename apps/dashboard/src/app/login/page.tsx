"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { useTranslation } from "@/i18n";
import { API_URL } from "@/lib/config";

function LoginCard() {
  const params = useSearchParams();
  const error = params.get("error");
  const t = useTranslation();

  return (
    <div className="container auth-page">
      <div className="card auth-card">
        <span className="brand-mark brand-mark-lg" aria-hidden="true">
          G
        </span>
        <h1>Gaulia</h1>
        <p className="text-muted">{t("login.intro")}</p>
        {error && (
          <p className="notice notice-error" role="alert">
            {t("login.failed")}
          </p>
        )}
        <a className="button-primary button-block" href={`${API_URL}/auth/login`}>
          {t("login.action")}
        </a>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginCard />
    </Suspense>
  );
}
