"use client";

import { useTranslation } from "@/i18n";
import { useTheme } from "@/lib/useTheme";

function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.2 12H2M22 12h-2.2M6.2 6.2 4.6 4.6M19.4 19.4l-1.6-1.6M17.8 6.2l1.6-1.6M4.6 19.4l1.6-1.6" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 14.2A8.3 8.3 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" />
    </svg>
  );
}

/**
 * Light / dark switch.
 * - `icon`: round button of the navigation bars;
 * - `menu`: entry of the mobile dropdown, with a label.
 */
export function ThemeToggle({ variant = "icon" }: { variant?: "icon" | "menu" }) {
  const { theme, setTheme } = useTheme();
  const t = useTranslation();
  const isDark = theme === "dark";
  const label = isDark ? t("common.theme.switchToLight") : t("common.theme.switchToDark");

  return (
    <button
      type="button"
      className={variant === "menu" ? "menu-item theme-menu-item" : "theme-toggle"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={variant === "menu" ? undefined : label}
      title={variant === "menu" ? undefined : label}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      {variant === "menu" && (
        <span>{isDark ? t("common.theme.light") : t("common.theme.dark")}</span>
      )}
    </button>
  );
}
