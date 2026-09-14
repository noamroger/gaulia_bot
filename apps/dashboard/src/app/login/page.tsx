"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { API_URL } from "@/lib/config";

function LoginCard() {
  const params = useSearchParams();
  const error = params.get("error");

  return (
    <div
      className="container"
      style={{ display: "flex", minHeight: "80vh", alignItems: "center", justifyContent: "center" }}
    >
      <div className="card" style={{ maxWidth: 380, textAlign: "center" }}>
        <h1 style={{ marginTop: 0 }}>Gaulia</h1>
        <p className="text-muted">Connecte-toi avec Discord pour gérer tes serveurs.</p>
        {error && (
          <p style={{ color: "var(--danger)", fontSize: 14 }}>La connexion a échoué, réessaie.</p>
        )}
        <a className="button-primary" href={`${API_URL}/auth/login`}>
          Se connecter avec Discord
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
