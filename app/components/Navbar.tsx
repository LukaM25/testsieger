"use client";

import { useState, useEffect, type ReactElement } from "react";
import { Menu, X } from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  children?: NavItem[];
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    label: "Start",
    items: [{ label: "Start", href: "/" }],
  },
  {
    label: "Leistungen",
    items: [
      { label: "Übersicht", href: "/produkte" },
      {
        label: "Produkttest",
        href: "/produkte/produkt-test",
        children: [
          { label: "Pre-Check", href: "/precheck" },
          { label: "Prüfverfahren", href: "/verfahren" },
          { label: "Pakete", href: "/pakete" },
        ],
      },
      { label: "Ausbildung-Check", href: "/produkte/ausbildung-check" },
    ],
  },
  {
    label: "Service",
    items: [
      { label: "Kundenportal", href: "/kundenportal" },
      { label: "Login", href: "/login" },
    ],
  },
  {
    label: "Unternehmen",
    items: [
      { label: "Kontakt", href: "/kontakt" },
      { label: "Karriere", href: "/karriere" },
    ],
  },
];

const startLink = sections.find((section) => section.label === "Start")?.items[0];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("hashchange", close);
    return () => window.removeEventListener("hashchange", close);
  }, []);

  const renderNestedItems = (
    items: NavItem[],
    variant: "desktop" | "mobile",
    level = 0,
  ): ReactElement[] =>
    items.map((item) => (
      <div
        key={`${item.href}-${variant}-${level}`}
        className="flex flex-col text-sm text-gray-900"
        style={variant === "mobile" ? { paddingLeft: `${level * 12}px` } : undefined}
      >
        <a
          href={item.href}
          className={
            variant === "desktop"
              ? "block rounded-lg px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-gray-50"
              : "px-4 py-3 font-medium transition hover:bg-gray-50"
          }
          onClick={() => setOpen(false)}
        >
          {item.label}
        </a>
        {item.children && (
          <div className={variant === "desktop" ? "ml-3 space-y-1" : "space-y-0.5"}>
            {renderNestedItems(item.children, variant, level + 1)}
          </div>
        )}
      </div>
    ));

  const renderDesktopItems = (items: NavItem[]) => renderNestedItems(items, "desktop");
  const renderMobileItems = (items: NavItem[], level = 0) => renderNestedItems(items, "mobile", level);

  // NOTE: keep "(" on the SAME line as return
  return (
    <header className="fixed w-full top-0 left-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <div className="grid place-items-center w-8 h-8 rounded-full bg-[#2e4053] text-white font-semibold">P</div>
          <span className="font-semibold text-[#2e4053]">Prüfsiegel Zentrum UG</span>
        </a>

        {/* Desktop links */}
        <nav className="flex items-center gap-4 text-sm font-medium">
          {startLink && (
            <a
              href={startLink.href}
              className="rounded-full border border-transparent px-4 py-2 text-sm font-semibold text-[#0a74da] transition hover:border-[#0a74da] hover:bg-[#0d1c2b]/5"
            >
              {startLink.label}
            </a>
          )}
          {sections
            .filter((section) => section.label !== "Start")
            .map((section) => (
              <details
                key={section.label}
                className="group relative cursor-pointer rounded-full px-3 py-2 hover:bg-gray-100"
                role="list"
              >
                <summary className="flex items-center gap-1 text-sm font-semibold text-gray-700 outline-none">
                  {section.label}
                  <span className="text-xs transition-transform duration-200 group-open:rotate-180">▾</span>
                </summary>
                <div className="absolute right-0 z-50 mt-2 min-w-[220px] rounded-xl border border-gray-200 bg-white shadow-lg opacity-0 transition-opacity group-open:opacity-100">
                  <div className="px-3 py-3">{renderDesktopItems(section.items)}</div>
                </div>
              </details>
            ))}
        </nav>

        {/* Always-visible hamburger */}
        <button
          className="p-2 rounded-lg border"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
        >
          {/* icon fallback if lucide fails */}
          <span className="inline-flex items-center">
            <span className="mr-1">Menü</span>
            {open ? <X size={22} /> : <Menu size={22} />}
          </span>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="px-6 pb-4">
          <nav className="divide-y divide-gray-100 rounded-xl border bg-white shadow-sm">
            {sections.map((section) => (
              <details key={section.label} className="group px-4 py-3 first:pt-0" role="list">
                <summary className="flex cursor-pointer items-center justify-between text-[11px] font-semibold uppercase tracking-[0.36em] text-gray-500 outline-none transition hover:text-[#0a74da]">
                  {section.label}
                  <span className="text-xs transition-transform duration-200 group-open:rotate-180">▾</span>
                </summary>
                <div className="mt-2 space-y-1">{renderMobileItems(section.items)}</div>
              </details>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
