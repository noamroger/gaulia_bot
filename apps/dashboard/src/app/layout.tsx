import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Gaulia — Dashboard",
  description: "Gère la modération, l'automod et le statut premium de tes serveurs Gaulia.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <footer className="site-footer">
          <Link href="/privacy">Politique de confidentialité</Link>
        </footer>
      </body>
    </html>
  );
}
