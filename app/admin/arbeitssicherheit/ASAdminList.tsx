'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AreaSwitch from '../components/AreaSwitch';
import CreateCustomerDialog from '../components/CreateCustomerDialog';

type Level = 'ok' | 'attention' | 'action';
type Row = {
  id: string;
  name: string;
  industry: string;
  employees: number;
  bg: string | null;
  createdAt: string;
  contact: { name: string; email: string };
  level: Level;
  okCount: number;
  total: number;
  openActions: number;
  urgentActions: number;
  nextInspection: string | null;
};

const LEVEL: Record<Level, { label: string; pill: string; dot: string }> = {
  action: { label: 'Handlungsbedarf', pill: 'bg-rose-50 text-rose-700 ring-rose-200', dot: 'bg-rose-500' },
  attention: { label: 'Bald fällig', pill: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  ok: { label: 'In Ordnung', pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
};

const CARD = 'rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_60px_-45px_rgba(43,64,102,0.35)]';

export default function ASAdminList({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Level | 'all'>('all');
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/arbeitssicherheit/organizations', { credentials: 'same-origin', cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setRows(data.organizations ?? []);
    } catch {
      setError('Betriebe konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      action: rows.filter((r) => r.level === 'action').length,
      attention: rows.filter((r) => r.level === 'attention').length,
      ok: rows.filter((r) => r.level === 'ok').length,
    }),
    [rows],
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (filter === 'all' || r.level === filter) &&
        (!q || [r.name, r.industry, r.contact.name, r.contact.email].some((v) => v.toLowerCase().includes(q))),
    );
  }, [rows, filter, query]);

  const kpis: { key: Level | 'all'; label: string; value: number }[] = [
    { key: 'all', label: 'Betriebe', value: counts.all },
    { key: 'action', label: 'Handlungsbedarf', value: counts.action },
    { key: 'attention', label: 'Bald fällig', value: counts.attention },
    { key: 'ok', label: 'In Ordnung', value: counts.ok },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-20 pt-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Admin</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#2B4066]">Arbeitssicherheit</h1>
            <p className="mt-1 text-sm text-slate-500" aria-live="polite">
              {loading ? 'Lädt…' : `${shown.length} von ${rows.length} Betrieben`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AreaSwitch active="arbeitssicherheit" />
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#16294d] px-5 py-2 text-sm font-semibold !text-white shadow-sm transition hover:brightness-110"
              >
                + Betrieb anlegen
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((k) => (
            <button
              key={k.key}
              type="button"
              onClick={() => setFilter(k.key)}
              className={`rounded-2xl border bg-white p-4 text-left transition duration-200 hover:-translate-y-0.5 ${
                filter === k.key ? 'border-[#1d4ed8]/40 shadow-[0_18px_40px_-28px_rgba(29,78,216,0.55)]' : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {k.key !== 'all' && <span className={`h-2 w-2 rounded-full ${LEVEL[k.key].dot}`} />}
                {k.label}
              </span>
              <span className="mt-2 block text-3xl font-semibold tabular-nums text-[#2B4066]">{k.value}</span>
            </button>
          ))}
        </div>

        <label className={`${CARD} flex items-center gap-2 px-5 py-3 transition focus-within:ring-4 focus-within:ring-[#1d4ed8]/10`}>
          <svg viewBox="0 0 20 20" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <circle cx="9" cy="9" r="5.5" />
            <path d="m13.5 13.5 3 3" strokeLinecap="round" />
          </svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Betrieb, Branche, Ansprechpartner oder E-Mail suchen" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
        </label>

        {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        {loading && rows.length === 0 ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-3xl border border-slate-200/70 bg-white" />)}
          </div>
        ) : shown.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
            <p className="text-base font-semibold text-[#2B4066]">{rows.length === 0 ? 'Noch keine Betriebe' : 'Keine Treffer'}</p>
            <p className="mt-1 text-sm text-slate-500">{rows.length === 0 ? 'Betriebe erscheinen hier, sobald sie sich registrieren oder du sie anlegst.' : 'Passe Suche oder Filter an.'}</p>
          </div>
        ) : (
          <ul className={`${CARD} divide-y divide-slate-100`}>
            {shown.map((r) => {
              const L = LEVEL[r.level];
              return (
                <li key={r.id}>
                  <Link href={`/admin/arbeitssicherheit/${r.id}`} className="group flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-slate-50/70 sm:px-6">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1d4ed8] to-[#16294d] text-sm font-semibold text-white">
                      {r.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">{r.name}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {r.industry} · {r.employees} Beschäftigte{r.bg ? ` · ${r.bg}` : ''} · {r.contact.name}
                      </span>
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-slate-500">{r.okCount}/{r.total} Pflichten</span>
                    {r.openActions > 0 && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-600">{r.openActions} offen</span>
                    )}
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${L.pill}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${L.dot}`} />
                      {L.label}
                    </span>
                    <span className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" aria-hidden>›</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <CreateCustomerDialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          void load();
        }}
        onCreateProduct={() => {}}
        fixedArea="ARBEITSSICHERHEIT"
      />
    </div>
  );
}
