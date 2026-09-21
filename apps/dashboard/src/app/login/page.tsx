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
    <div
      className="container"
      style={{ display: "flex", minHeight: "80vh", alignItems: "center", justifyContent: "center" }}
    >
      <div className="card" style={{ maxWidth: 380, textAlign: "center" }}>
        <h1 style={{ marginTop: 0 }}>Gaulia</h1>
        <p className="text-muted">{t("login.intro")}</p>
        {error && <p style={{ color: "var(--danger)", fontSize: 14 }}>{t("login.failed")}</p>}
        <a className="button-primary" href={`${API_URL}/auth/login`}>
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
