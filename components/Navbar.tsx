"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/", label: "Start" },
  { href: "/precheck", label: "Pre-Check" },
  { href: "/pakete", label: "Pakete" },
  { href: "/login", label: "Login" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed w-full top-0 left-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 select-none">
          <div className="grid place-items-center w-8 h-8 rounded-full bg-[#2e4053] text-white font-semibold">P</div>
          <span className="font-semibold text-[#2e4053] whitespace-nowrap">Prüfsiegel Zentrum UG</span>
        </a>

        {/* Always-visible hamburger (desktop + mobile) */}
        <div className="relative" ref={menuRef}>
          <button
            className="p-2 rounded-lg border bg-white shadow-sm hover:bg-gray-50 transition"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? "Menü schließen" : "Menü öffnen"}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Desktop: compact dropdown top-right; Mobile: same UI, just narrower screen */}
          {open && (
            <div
              className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-fade-in"
              style={{ zIndex: 60 }}
            >
              <nav className="flex flex-col text-sm font-medium text-gray-700">
                {links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="px-4 py-3 hover:bg-gray-50 transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </a>
                ))}
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop @ 5% — click to close */}
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
