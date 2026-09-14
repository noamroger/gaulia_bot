"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { PremiumStatus } from "@/lib/types";

export default function PremiumPage() {
  const params = useParams<{ guildId: string }>();
  const [status, setStatus] = useState<PremiumStatus | null>(null);

  useEffect(() => {
    api
      .get<PremiumStatus>(`/guilds/${params.guildId}/premium`)
      .then(setStatus)
      .catch(() => setStatus(null));
  }, [params.guildId]);

  if (!status) {
    return <p className="text-muted">Chargement…</p>;
  }

  return (
    <section>
      <h2>Statut premium</h2>
      <div className="card">
        {status.premium ? (
          <>
            <span className="badge badge-success">Actif</span>
            {status.premiumExpiresAt && (
              <p className="text-muted" style={{ marginTop: 10 }}>
                Renouvellement : {new Date(status.premiumExpiresAt).toLocaleDateString("fr-FR")}
              </p>
            )}
          </>
        ) : (
          <>
            <span className="badge badge-muted">Inactif</span>
            <p className="text-muted" style={{ marginTop: 10 }}>
              Utilise <code>/premium upgrade</code> sur Discord pour activer Gaulia Premium sur ce
              serveur.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
