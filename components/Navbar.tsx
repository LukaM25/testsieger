"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

type NavItem = {
  label: string;
  href: string;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const navigation: (NavItem | NavSection)[] = [
  { label: "Start", href: "/" },
  {
    label: "Produkte",
    items: [
      { label: "Übersicht", href: "/produkte" },
      { label: "Ausbildung-Check", href: "/produkte/ausbildung-check" },
    ],
  },
  {
    label: "Leistungen",
    items: [
      { label: "Lizenzpläne", href: "/pakete" },
      { label: "Prüfverfahren", href: "/verfahren" },
      { label: "Testergebnisse", href: "/testergebnisse" },
    ],
  },
  {
    label: "Service",
    items: [
      { label: "Pakete", href: "/pakete" },
      { label: "Lizenzverwaltung", href: "/lizenzen" },
      { label: "Kundenportal", href: "/dashboard" },
    ],
  },
  {
    label: "Unternehmen",
    items: [
      { label: "Kontakt", href: "/kontakt" },
      { label: "Impressum", href: "/impressum" },
      { label: "Datenschutz", href: "/datenschutz" },
      { label: "AGB", href: "/agb" },
    ],
  },
  { label: "Login", href: "/login" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header data-animate="nav" className="fixed top-0 left-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2 select-none">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-[#2e4053] text-white font-semibold">P</div>
          <span className="whitespace-nowrap font-semibold text-[#2e4053]">Deutsche Prüfsiegel Institut</span>
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            className="rounded-lg border bg-white p-2 shadow-sm transition hover:bg-gray-50"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Menü schließen" : "Menü öffnen"}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>

          {open && (
            <div
              className="absolute right-0 mt-2 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
              style={{ zIndex: 60 }}
            >
              <nav className="max-h-[70vh] overflow-y-auto text-sm text-gray-700">
                {navigation.map((entry) => {
                  if ("href" in entry) {
                    return (
                      <Link
                        key={entry.href}
                        href={entry.href}
                        className="block px-4 py-3 font-medium transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400"
                        onClick={() => setOpen(false)}
                      >
                        <span className="relative after:block after:absolute after:inset-x-0 after:-bottom-0.5 after:h-[1.5px] after:scale-x-0 after:origin-left after:bg-sky-400 motion-safe:after:transition-transform motion-safe:after:duration-260 hover:after:scale-x-100">
                          {entry.label}
                        </span>
                      </Link>
                    );
                  }

                  return (
                    <div key={entry.label} className="border-t border-gray-100 first:border-t-0">
                      <div className="px-4 pt-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-gray-500">
                        {entry.label}
                      </div>
                      <div className="pb-1">
                        {entry.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block px-4 py-2.5 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400"
                            onClick={() => setOpen(false)}
                          >
                            <span className="relative after:block after:absolute after:inset-x-0 after:-bottom-0.5 after:h-[1.5px] after:scale-x-0 after:origin-left after:bg-sky-400 motion-safe:after:transition-transform motion-safe:after:duration-260 hover:after:scale-x-100">
                              {item.label}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </div>

      {open && (
        <button
          aria-hidden
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/5"
          style={{ zIndex: 40 }}
        />
      )}
    </header>
  );
}
