import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Mes données — Gaulia",
  description: "Consulte, télécharge ou supprime les données que Gaulia conserve sur ton compte.",
};

export default function MyDataLayout({ children }: { children: ReactNode }) {
  return children;
}
