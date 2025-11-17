 "use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, type ReactElement } from "react";
import Fuse from 'fuse.js';
import { useRouter } from "next/navigation";
import { Menu, X, Search } from "lucide-react";

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

// We'll load a prebuilt search index from /search-index.json for richer keywords
type SearchEntry = { label: string; href: string; keywords?: string[]; excerpt?: string };


export default function Navbar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // loaded search index
  const [index, setIndex] = useState<SearchEntry[]>([]);
  const fuseRef = useRef<Fuse<SearchEntry> | null>(null);

  // Search state
  const [query, setQuery] = useState("");
  // results now include matches from Fuse when available
  const [results, setResults] = useState<Array<{ item: SearchEntry; matches?: Fuse.FuseResultMatch[] }>>([]);
  const [active, setActive] = useState(-1);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("hashchange", close);
    return () => window.removeEventListener("hashchange", close);
  }, []);

  // Debounced search over the local index
  useEffect(() => {
    if (!query) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const t = setTimeout(() => {
      const q = query.trim();
      let scored: Array<{ item: SearchEntry; matches?: Fuse.FuseResultMatch[] }> = [];
      if (fuseRef.current && q.length > 0) {
  const res = (fuseRef.current.search(q) as any) as Array<{
          item: SearchEntry;
          matches?: Fuse.FuseResultMatch[];
        }>;
  scored = res.slice(0, 8).map((r) => ({ item: r.item, matches: r.matches }));
      } else if (q.length > 0) {
        scored = index
          .filter((e) => e.label.toLowerCase().includes(q.toLowerCase()) || (e.keywords || []).some((k) => k.toLowerCase().includes(q.toLowerCase())))
          .slice(0, 8)
          .map((item) => ({ item }));
      }
      setResults(scored);
      setShowResults(scored.length > 0);
      setActive(-1);
    }, 180);

    return () => clearTimeout(t);
  }, [query]);

  // Load the search index once
  useEffect(() => {
    let mounted = true;
    fetch('/search-index.json')
      .then((r) => r.json())
      .then((data: SearchEntry[]) => {
        if (mounted && Array.isArray(data)) setIndex(data);
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      mounted = false;
    };
  }, []);

  // initialize Fuse when index loads
  useEffect(() => {
    if (index.length === 0) {
      fuseRef.current = null;
      return;
    }
    fuseRef.current = new Fuse(index, {
      keys: [
        { name: 'label', weight: 0.7 },
        { name: 'keywords', weight: 0.3 },
      ],
      includeScore: true,
      threshold: 0.4,
      ignoreLocation: true,
    });
  }, [index]);

  // helpers to build highlighted label and snippet from Fuse matches
  function escapeHtml(str: string) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function highlightLabel(item: SearchEntry, matches?: Fuse.FuseResultMatch[]) {
    const text = item.label || '';
    if (!matches || matches.length === 0) return [text];
    const labelMatch = matches.find((m) => m.key === 'label' && m.indices && m.indices.length > 0);
    if (!labelMatch) return [text];
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    for (const [start, end] of labelMatch.indices as [number, number][]) {
      if (start > lastIdx) parts.push(text.slice(lastIdx, start));
      parts.push(<strong key={`${item.href}-lbl-${start}-${end}`}>{text.slice(start, end + 1)}</strong>);
      lastIdx = end + 1;
    }
    if (lastIdx < text.length) parts.push(text.slice(lastIdx));
    return parts;
  }

  function snippetFromMatches(item: SearchEntry, matches: Fuse.FuseResultMatch[] | undefined, q: string) {
    // prefer excerpt if it contains the query
    const query = q.trim().toLowerCase();
    if (item.excerpt && item.excerpt.toLowerCase().includes(query)) {
      const excerpt = item.excerpt;
      // highlight matched substrings in excerpt
      if (query.length === 0) return escapeHtml(excerpt.slice(0, 140));
      const idx = excerpt.toLowerCase().indexOf(query);
      if (idx >= 0) {
        const start = Math.max(0, idx - 40);
        const end = Math.min(excerpt.length, idx + query.length + 40);
        const before = excerpt.slice(start, idx);
        const match = excerpt.slice(idx, idx + query.length);
        const after = excerpt.slice(idx + query.length, end);
        const nodes: React.ReactNode[] = [];
        if (start > 0) nodes.push('... ');
        if (before) nodes.push(before);
        nodes.push(<strong key={`${item.href}-snip-${idx}`}>{match}</strong>);
        if (after) nodes.push(after);
        if (end < excerpt.length) nodes.push(' ...');
        return nodes;
      }
      return excerpt.slice(0, 140);
    }

    if (matches && matches.length > 0) {
      // prefer a textual field match (label or excerpt)
      const stringMatch = matches.find((m) => (m.key === 'label' || m.key === 'excerpt') && m.indices && m.indices.length > 0);
      if (stringMatch && stringMatch.key) {
        const field = (item as any)[stringMatch.key] as string;
        if (typeof field === 'string') {
          const [s, e] = (stringMatch.indices as [number, number][])[0];
          const start = Math.max(0, s - 40);
          const end = Math.min(field.length, e + 1 + 40);
          const before = field.slice(start, s);
          const match = field.slice(s, e + 1);
          const after = field.slice(e + 1, end);
          const nodes: React.ReactNode[] = [];
          if (start > 0) nodes.push('... ');
          if (before) nodes.push(before);
          nodes.push(<strong key={`${item.href}-snip-${s}`}>{match}</strong>);
          if (after) nodes.push(after);
          if (end < field.length) nodes.push(' ...');
          return nodes;
        }
      }

      // handle keywords array: find matched keyword(s)
      const kwMatch = matches.find((m) => m.key === 'keywords');
      if (kwMatch && Array.isArray(item.keywords) && item.keywords.length > 0) {
        // find keywords that include the query
        const matched = item.keywords.filter((k) => k.toLowerCase().includes(query));
        if (matched.length) {
          return matched.slice(0, 3).map((k, idx) => <strong key={`${item.href}-kw-${idx}`}>{k}</strong>);
        }
      }
    }

    // fallback to excerpt or keywords
  if (item.excerpt) return item.excerpt.slice(0, 140);
  return (item.keywords || []).slice(0, 8).join(' ').slice(0, 140);
  }

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
          <div className="grid place-items-center w-8 h-8 rounded-full bg-transparent text-white font-semibold overflow-hidden">
            <Image src="/images/iconen/logoTC.png" alt="Logo" width={26} height={26} className="h-[26px] w-[26px] object-contain" />
          </div>
          <span className="font-semibold text-[#2e4053]">Deutsches Prüfsiegel Institut</span>
        </a>

        <div className="flex items-center gap-4">
          {/* Always-open search bubble */}
          <div className="relative" ref={inputRef as any}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (results.length > 0) {
                  router.push(results[0].item.href);
                }
              }}
              className="flex items-center"
            >
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-full px-4 py-2 w-[352px] shadow-lg">
                <Search size={18} className="text-slate-700" />
                <input
                  ref={inputRef}
                  id="nav-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setActive((a) => Math.min(results.length - 1, a + 1));
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setActive((a) => Math.max(-1, a - 1));
                    } else if (e.key === 'Enter') {
                      if (active >= 0 && results[active]) {
                        e.preventDefault();
                        router.push(results[active].item.href);
                      }
                    } else if (e.key === 'Escape') {
                      setShowResults(false);
                    }
                  }}
                  placeholder="Suche auf der Seite..."
                  className="w-full bg-transparent outline-none text-sm md:text-base"
                  aria-label="Suche"
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setQuery('');
                      setResults([]);
                      setShowResults(false);
                      setActive(-1);
                      inputRef.current?.focus();
                    }}
                    className="ml-2 p-1 rounded-full hover:bg-gray-100"
                  >
                    <X size={14} className="text-slate-500" />
                  </button>
                )}
              </div>
            </form>

              {showResults && (
              <div className="absolute left-0 mt-2 w-[352px] bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                <ul className="max-h-56 overflow-auto">
                  {results.map((r, i) => {
                    const isActive = i === active;
                    const item = r.item;
                    const summary = snippetFromMatches(item, r.matches, query);
                    const highlightedLabelHtml = highlightLabel(item, r.matches);
                    return (
                      <li
                        key={item.href}
                        onMouseDown={() => router.push(item.href)}
                        onMouseEnter={() => setActive(i)}
                        className={`px-4 py-3 cursor-pointer transition-colors ${
                          isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-sm font-medium text-slate-900">{highlightedLabelHtml}</div>
                        <div className="text-xs text-slate-500 italic">"{Array.isArray(summary) ? summary : summary}"</div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
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
