"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { useDismiss } from "@/lib/useDismiss";

export interface TabItem {
  href: string;
  label: string;
  active: boolean;
}

/** Horizontal tabs that fold into a dropdown as soon as they no longer fit on one line. */
export function TabNav({ items, label }: { items: TabItem[]; label: string }) {
  const navRef = useRef<HTMLElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const listId = useId();

  useLayoutEffect(() => {
    const nav = navRef.current;
    const measure = measureRef.current;
    if (!nav || !measure) return;

    const update = (): void => setCollapsed(measure.scrollWidth > nav.clientWidth);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(nav);
    observer.observe(measure);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname, collapsed]);

  const close = useCallback((reason: "outside" | "escape") => {
    setOpen(false);
    if (reason === "escape") triggerRef.current?.focus();
  }, []);

  useDismiss(open, menuRef, close);

  const activeItem = items.find((item) => item.active) ?? items[0];

  return (
    <nav ref={navRef} className="tab-nav" aria-label={label}>
      <div ref={measureRef} className="tabs tab-nav-measure" aria-hidden="true">
        {items.map((item) => (
          <span key={item.href} className="tab">
            {item.label}
          </span>
        ))}
      </div>

      {collapsed ? (
        <div ref={menuRef} className="tab-menu">
          <button
            ref={triggerRef}
            type="button"
            className="tab-menu-trigger"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen((value) => !value)}
          >
            <span>{activeItem?.label}</span>
            <svg className="chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path
                d="M3 4.5 6 7.5l3-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {open && (
            <ul id={listId} className="menu-list">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`menu-item${item.active ? " active" : ""}`}
                    aria-current={item.active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="tabs">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`tab${item.active ? " active" : ""}`}
              aria-current={item.active ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
