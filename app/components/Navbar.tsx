 "use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback, type ReactNode, type FormEvent } from "react";
import Fuse from 'fuse.js';
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, Search, User, Eye, EyeOff } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

type NavItem = {
  labelKey: string;
  href: string;
  children?: NavItem[];
};

type NavSection = {
  labelKey: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    labelKey: "nav.services",
    items: [
      { labelKey: "nav.overview", href: "/produkte" },
      { labelKey: "nav.productTest", href: "/produkte/produkt-test" },
      { labelKey: "nav.trainingCheck", href: "/produkte/ausbildung-check" },
      { labelKey: "nav.playgroundSafety", href: "/produkte/spielplatz-sicherheit" },
    ],
  },
  {
    labelKey: "nav.licenses",
    items: [
      { labelKey: "nav.plans", href: "/pakete" },
      { labelKey: "nav.licensing", href: "/lizenzen" },
    ],
  },
  {
    labelKey: "nav.company",
    items: [
      { labelKey: "nav.careers", href: "/karriere" },
      { labelKey: "nav.contact", href: "/kontakt" },
      { labelKey: "nav.portal", href: "/dashboard" },
      { labelKey: "nav.login", href: "/login" },
    ],
  },
];

// We'll load a prebuilt search index from /search-index.json for richer keywords
type SearchEntry = { label: string; href: string; keywords?: string[]; excerpt?: string };
type ProfileUser = { id: string; name: string; email: string };


export default function Navbar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();

  // loaded search index
  const [index, setIndex] = useState<SearchEntry[]>([]);
  const fuseRef = useRef<Fuse<SearchEntry> | null>(null);
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  // Search state
  const [query, setQuery] = useState("");
  // results now include matches from Fuse when available
  const [results, setResults] = useState<Array<{ item: SearchEntry; matches?: Fuse.FuseResultMatch[] }>>([]);
  const [active, setActive] = useState(-1);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);
  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) return null;
      const data = await res.json();
      return data?.user ?? null;
    } catch {
      return null;
    }
  }, []);

  const checkAdminStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/me', { credentials: 'same-origin' });
      if (!res.ok) return false;
      const data = await res.json().catch(() => ({}));
      return Boolean(data?.admin);
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    let active = true;
    setProfileLoading(true);
    loadProfile()
      .then((user) => {
        if (!active) return;
        setProfileUser(user);
      })
      .finally(() => {
        if (!active) return;
        setProfileLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadProfile, pathname]);

  useEffect(() => {
    let active = true;
    setAdminLoading(true);
    checkAdminStatus()
      .then((admin) => {
        if (!active) return;
        setAdminAuthed(admin);
      })
      .finally(() => {
        if (!active) return;
        setAdminLoading(false);
      });
    return () => {
      active = false;
    };
  }, [checkAdminStatus, pathname]);

  useEffect(() => {
    function handleProfileClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleProfileClickOutside);
    return () => document.removeEventListener('mousedown', handleProfileClickOutside);
  }, []);


  const profileLabel = profileLoading || adminLoading
    ? t('profile.loading', 'Lade...')
    : profileUser
      ? profileUser.name
      : adminAuthed
        ? t('profile.admin', 'Admin')
        : t('profile.signin', 'Anmelden');

	  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
	    event.preventDefault();
	    setLoginError(null);
	    setLoginLoading(true);
	    try {
	      // Try user login first to avoid noisy 401s for normal users; if it fails, try admin login.
	      const res = await fetch('/api/auth/login', {
	        method: 'POST',
	        headers: { 'Content-Type': 'application/json' },
	        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
	      });
	      const data = await res.json().catch(() => ({}));
	      if (res.ok && data.ok) {
	        const user = await loadProfile();
	        setProfileUser(user);
	        setProfileOpen(true);
	        setLoginEmail('');
	        setLoginPassword('');
	        return;
	      }

	      const adminRes = await fetch('/api/admin/login', {
	        method: 'POST',
	        headers: { 'Content-Type': 'application/json' },
	        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
	      });
	      const adminData = await adminRes.json().catch(() => ({}));
	      if (adminRes.ok) {
	        setAdminAuthed(true);
	        setProfileUser(null);
	        setProfileOpen(false);
	        setLoginEmail('');
	        setLoginPassword('');
	        router.refresh();
	        router.push('/admin');
	        return;
	      }

	      const errorMessage = adminData?.error || data.error || 'Login fehlgeschlagen';
	      throw new Error(errorMessage);
	    } catch (error) {
	      const message = error instanceof Error ? error.message : 'Login fehlgeschlagen';
	      setLoginError(message);
	    } finally {
	      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to log out?')) {
      return;
    }
    setProfileLoading(true);
    setAdminLoading(true);
    try {
      const endpoint = adminAuthed && !profileUser ? '/api/admin/logout' : '/api/auth/logout';
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        throw new Error('Logout fehlgeschlagen');
      }
      setProfileUser(null);
      setAdminAuthed(false);
      setProfileOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      setProfileLoading(false);
      setAdminLoading(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegisterError(null);
    setRegisterLoading(true);
    try {
      if (registerData.password !== registerData.confirmPassword) {
        setRegisterError('Passwörter stimmen nicht überein');
        setRegisterLoading(false);
        return;
      }
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerData.name,
          email: registerData.email,
          password: registerData.password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Registrierung fehlgeschlagen');
      }
      const user = await loadProfile();
      setProfileUser(user);
      setShowRegister(false);
      setRegisterData({ name: '', email: '', password: '', confirmPassword: '' });
      setProfileOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registrierung fehlgeschlagen';
      setRegisterError(message);
    } finally {
      setRegisterLoading(false);
    }
  };

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
      const lower = q.toLowerCase();
      let scored: Array<{ item: SearchEntry; matches?: Fuse.FuseResultMatch[] }> = [];
      if (fuseRef.current && q.length > 0) {
        const res = (fuseRef.current.search(q) as any) as Array<{
          item: SearchEntry;
          matches?: Fuse.FuseResultMatch[];
        }>;
        scored = res.slice(0, 8).map((r) => ({ item: r.item, matches: r.matches }));
      } else if (q.length > 0) {
        scored = index
          .filter((e) => {
            const hasTextHit =
              e.label.toLowerCase().includes(lower) ||
              (e.excerpt || '').toLowerCase().includes(lower);
            const hasKeywordHit = (e.keywords || []).some((k) => k.toLowerCase().includes(lower));
            return hasTextHit || hasKeywordHit;
          })
          .slice(0, 8)
          .map((item) => ({ item }));
      }
      setResults(scored);
      setShowResults(scored.length > 0);
      setActive(-1);
    }, 180);

    return () => clearTimeout(t);
  }, [query, index]);

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
        { name: 'label', weight: 0.6 },
        { name: 'excerpt', weight: 0.3 },
        { name: 'keywords', weight: 0.1 },
      ],
      includeScore: true,
      includeMatches: true,
      threshold: 0.35,
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
    const parts: ReactNode[] = [];
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
        const nodes: ReactNode[] = [];
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
          const nodes: ReactNode[] = [];
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
      const label = t(item.labelKey, item.labelKey);
      if (item.children && item.children.length > 0) {
        return (
          <details key={item.labelKey} className="group border-b border-gray-100 first:border-t-0" role="list">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-900 outline-none transition hover:text-[#0a74da]">
              {label}
              <span className="text-xs transition-transform duration-200 group-open:rotate-180">▾</span>
            </summary>
            <div className="px-4 pb-2 space-y-2">
              <Link
                href={item.href}
                className="block px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className="block px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-gray-50"
                  onClick={() => setOpen(false)}
                >
                  {t(child.labelKey, child.labelKey)}
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
          {label}
        </Link>
      );
    });

  return (
    <header className="relative w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 overflow-visible">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-3 sm:px-6 gap-3">
        {/* Logo */}
        <a href="/" className="flex h-full items-center shrink-0 py-2">
          <Image
            src="/dpilogo-v3.png"
            alt="Deutsches Prüfsiegel Institut"
            width={360}
            height={96}
            priority
            className="block h-full w-auto object-contain"
          />
        </a>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Always-open search bubble */}
          <div className="relative" ref={inputRef as any}>
            <div className="flex items-center sm:hidden">
              <button
                type="button"
                aria-label={t('search.aria', 'Suche')}
                onClick={() => {
                  setSearchOpen((v) => {
                    const next = !v;
                    if (next) {
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }
                    return next;
                  });
                  setShowResults(false);
                }}
                className="p-2 rounded-full border border-gray-200 text-slate-700 shadow-sm"
              >
                <Search size={18} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (results.length > 0) {
                  router.push(results[0].item.href);
                }
              }}
              className={`${
                searchOpen ? 'flex' : 'hidden'
              } sm:flex items-center mt-2 sm:mt-0`}
            >
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-full px-3 sm:px-4 py-2 w-[240px] sm:w-[352px] shadow-lg">
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
                  placeholder={t('search.placeholder', 'Suche auf der Seite...')}
                  className="w-full bg-transparent outline-none text-sm md:text-base"
                  aria-label={t('search.aria', 'Suche')}
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
                    className="ml-1 sm:ml-2 p-1 rounded-full hover:bg-gray-100"
                  >
                    <X size={14} className="text-slate-500" />
                  </button>
                )}
              </div>
            </form>

              {showResults && (
              <div className="absolute left-0 mt-2 w-[240px] sm:w-[352px] bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
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

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green"
              onClick={() => setProfileOpen((value) => !value)}
              aria-expanded={profileOpen}
              aria-label={profileUser ? `Profil öffnen (${profileUser.name})` : 'Kundenkonto öffnen'}
            >
              <User size={20} className="text-slate-700" />
              <span className="whitespace-nowrap text-sm font-semibold">
                {profileLabel}
              </span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl z-50">
                {profileUser ? (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-900">{profileUser.name}</p>
                    <div className="space-y-2">
                      <Link
                        href="/dashboard"
                        className="block rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 text-left transition hover:bg-slate-50"
                        onClick={() => setProfileOpen(false)}
                      >
                        {t('profile.dashboard')}
                      </Link>
                      <button
                        type="button"
                        className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                        onClick={handleLogout}
                      >
                        {t('profile.logout')}
                      </button>
                    </div>
                  </div>
                ) : adminAuthed ? (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-900">{t('profile.adminTitle')}</p>
                    <div className="space-y-2">
                      <Link
                        href="/admin"
                        className="block rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 text-left transition hover:bg-slate-50"
                        onClick={() => setProfileOpen(false)}
                      >
                        {t('profile.adminDashboard')}
                      </Link>
                      <button
                        type="button"
                        className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                        onClick={handleLogout}
                      >
                        {t('profile.logout')}
                      </button>
                    </div>
                  </div>
                ) : showRegister ? (
                  <form onSubmit={handleRegister} className="space-y-3">
                    <p className="text-sm font-semibold text-slate-900">{t('profile.register', 'Registrieren')}</p>
                    <input
                      type="text"
                      placeholder={t('profile.name', 'Name')}
                      value={registerData.name}
                      onChange={(e) => setRegisterData((s) => ({ ...s, name: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                      autoComplete="name"
                      required
                    />
                    <input
                      type="email"
                      placeholder={t('profile.email')}
                      value={registerData.email}
                      onChange={(e) => setRegisterData((s) => ({ ...s, email: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                      autoComplete="email"
                      required
                    />
                    <div className="relative">
                      <input
                        type={showRegisterPassword ? 'text' : 'password'}
                        placeholder={t('profile.password')}
                        value={registerData.password}
                        onChange={(e) => setRegisterData((s) => ({ ...s, password: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 pr-12 text-sm"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword((v) => !v)}
                        className="absolute inset-y-0 right-2 flex items-center px-2 text-gray-500"
                        aria-label={showRegisterPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                      >
                        {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showRegisterConfirm ? 'text' : 'password'}
                        placeholder={t('profile.confirmPassword', 'Passwort wiederholen')}
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData((s) => ({ ...s, confirmPassword: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 pr-12 text-sm"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterConfirm((v) => !v)}
                        className="absolute inset-y-0 right-2 flex items-center px-2 text-gray-500"
                        aria-label={showRegisterConfirm ? 'Passwort verbergen' : 'Passwort anzeigen'}
                      >
                        {showRegisterConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {registerError && <p className="text-xs text-rose-600">{registerError}</p>}
                    <button
                      type="submit"
                      disabled={registerLoading}
                      className="w-full rounded-full bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                      {registerLoading ? t('profile.registering', 'Registriere...') : t('profile.register', 'Registrieren')}
                    </button>
                    <button
                      type="button"
                      className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                      onClick={() => setShowRegister(false)}
                    >
                      {t('profile.backToLogin', 'Zurück zum Login')}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-3">
                    <p className="text-sm font-semibold text-slate-900">{t('profile.loginTitle')}</p>
                    <input
                      type="text"
                      inputMode="email"
                      placeholder={t('profile.email')}
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                      autoComplete="username"
                      required
                    />
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        placeholder={t('profile.password')}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 pr-12 text-sm"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((v) => !v)}
                        className="absolute inset-y-0 right-2 flex items-center px-2 text-gray-500"
                        aria-label={showLoginPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                      >
                        {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {loginError && <p className="text-xs text-rose-600">{loginError}</p>}
                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full rounded-full bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                      {loginLoading ? t('profile.loginChecking') : t('profile.loginButton')}
                    </button>
                    <p className="text-xs text-slate-500 text-right">
                      <Link href="/reset-password" className="font-semibold text-slate-900 underline">
                        Passwort vergessen?
                      </Link>
                    </p>
                    <p className="text-xs text-slate-500">
                      {t('profile.classicLogin')}{' '}
                      <Link href="/login" className="font-semibold text-slate-900 underline">{t('nav.login')}</Link>
                    </p>
                    <p className="text-xs text-slate-500">
                      <strong>Admin?</strong> {t('profile.adminHint')}
                    </p>
                    <button
                      type="button"
                      className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                      onClick={() => setShowRegister(true)}
                    >
                      {t('profile.register', 'Registrieren')}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              className="p-2 rounded-lg border"
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? t('nav.menu.close') : t('nav.menu.open')}
            >
              <span className="inline-flex items-center">
                <span className="mr-1">{t('nav.menu')}</span>
                {open ? <X size={22} /> : <Menu size={22} />}
              </span>
            </button>
            {open && (
            <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
              <nav className="max-h-[60vh] overflow-y-auto text-sm text-gray-700 font-sans">
                {sections.map((section) => (
                  <details
                    key={section.labelKey}
                    className="group border-b border-gray-100 first:border-t-0"
                    role="list"
                  >
                    <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-[11px] font-bold uppercase tracking-[0.36em] text-slate-900 outline-none transition hover:text-brand-green">
                      {t(section.labelKey, section.labelKey)}
                      <span className="text-xs transition-transform duration-200 group-open:rotate-180">▾</span>
                    </summary>
                    <div className="px-4 pb-2">{renderDropdownItems(section.items)}</div>
                  </details>
                ))}
              </nav>
              <div className="border-t border-gray-100 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 mb-2">
                  {t('lang.label')}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      locale === 'de'
                        ? 'border-slate-900 text-slate-900 bg-slate-50'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                    onClick={() => setLocale('de')}
                  >
                    🇩🇪 DE
                  </button>
                  <button
                    type="button"
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      locale === 'en'
                        ? 'border-slate-900 text-slate-900 bg-slate-50'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                    onClick={() => setLocale('en')}
                  >
                    🇬🇧 EN
                  </button>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
