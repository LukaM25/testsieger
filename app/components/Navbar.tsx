"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/", label: "Start" },
  { href: "/precheck", label: "Pre-Check" },
  { href: "/pakete", label: "Pakete" },
  { href: "/login", label: "Login" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("hashchange", close);
    return () => window.removeEventListener("hashchange", close);
  }, []);

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
        <nav className="flex items-center gap-6 text-sm font-medium">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-[#0a74da] transition-colors">
              {l.label}
            </a>
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
          <nav className="grid rounded-xl border bg-white shadow-sm">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="px-4 py-3 text-sm font-medium hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
