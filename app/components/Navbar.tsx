 "use client";

import Link from "next/link";
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
    label: "Leistungen",
    items: [
      { label: "Übersicht", href: "/produkte" },
  { label: "PRODUKT TEST", href: "/produkte/produkt-test" },
      { label: "Ausbildungs Check", href: "/produkte/ausbildung-check" },
      { label: "Testergebnisse", href: "/testergebnisse" },
      { label: "Lizenzverwaltung", href: "/lizenzen" },
    ],
  },
  {
    label: "Unternehmen",
    items: [
      { label: "Karriere", href: "/karriere" },
      { label: "Kontakt", href: "/kontakt" },
      { label: "Kundenportal", href: "/kundenportal" },
      { label: "Login", href: "/login" },
    ],
  },
];

const startLink = { label: "Start", href: "/" };

export default function Navbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("hashchange", close);
    return () => window.removeEventListener("hashchange", close);
  }, []);

  const renderDropdownItems = (items: NavItem[]) =>
    items.map((item) => {
      if (item.children && item.children.length > 0) {
        return (
          <details key={item.label} className="group border-b border-gray-100 first:border-t-0" role="list">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-900 outline-none transition hover:text-[#0a74da]">
              {item.label}
              <span className="text-xs transition-transform duration-200 group-open:rotate-180">▾</span>
            </summary>
            <div className="px-4 pb-2 space-y-2">
              <Link
                href={item.href}
                className="block px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className="block px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-gray-50"
                  onClick={() => setOpen(false)}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          </details>
        );
      }

      return (
        <Link
          key={item.href}
          href={item.href}
          className="block px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-gray-50"
          onClick={() => setOpen(false)}
        >
          {item.label}
        </Link>
      );
    });

  return (
    <header className="relative w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 overflow-visible">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <div className="grid place-items-center w-8 h-8 rounded-full bg-[#2e4053] text-white font-semibold">P</div>
          <span className="font-semibold text-[#2e4053]">Deutsches Prüfsiegel Institut</span>
        </a>

        <div className="flex items-center gap-4">
          <a
            href={startLink.href}
            className="rounded-full border border-transparent px-4 py-2 text-sm font-semibold text-black transition hover:border-[#0a74da] hover:bg-[#0d1c2b]/5"
          >
            START
          </a>
          <div className="relative">
            <button
              className="p-2 rounded-lg border"
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Menü schließen" : "Menü öffnen"}
            >
              <span className="inline-flex items-center">
                <span className="mr-1">Menü</span>
                {open ? <X size={22} /> : <Menu size={22} />}
              </span>
            </button>
            {open && (
            <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
              <nav className="max-h-[60vh] overflow-y-auto text-sm text-gray-700 font-sans">
                {sections.map((section) => (
                  <details
                    key={section.label}
                    className="group border-b border-gray-100 first:border-t-0"
                    role="list"
                  >
                    <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-[11px] font-bold uppercase tracking-[0.36em] text-slate-900 outline-none transition hover:text-[#0a74da]">
                      {section.label}
                      <span className="text-xs transition-transform duration-200 group-open:rotate-180">▾</span>
                    </summary>
                    <div className="px-4 pb-2">{renderDropdownItems(section.items)}</div>
                  </details>
                ))}
              </nav>
            </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
