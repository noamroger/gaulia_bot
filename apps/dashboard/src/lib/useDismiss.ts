"use client";

import { useEffect, type RefObject } from "react";

/** Ferme un menu ouvert au clic en dehors de `ref` ou à la touche Échap. */
export function useDismiss(
  open: boolean,
  ref: RefObject<HTMLElement | null>,
  close: (reason: "outside" | "escape") => void,
): void {
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent): void {
      if (ref.current && !ref.current.contains(event.target as Node)) close("outside");
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") close("escape");
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, ref, close]);
}
