'use client';

import Link from 'next/link';

import AreaSwitch from './AreaSwitch';

import { PAYMENT_STATUS_OPTIONS, STATUS_OPTIONS } from '../constants';
import { PaymentStatusOption, StatusOption } from '../types';

type Props = {
  isSuperAdmin: boolean;
  showSuperControls: boolean;
  onToggleSuper: () => void;
  onCreateCustomer?: () => void;
  onRefresh: () => void;
  shownCount: number;
  totalCount: number | null;
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusOption | 'ALL';
  onStatusFilterChange: (value: StatusOption | 'ALL') => void;
  paymentFilter: PaymentStatusOption | 'ALL';
  onPaymentFilterChange: (value: PaymentStatusOption | 'ALL') => void;
  onResetFilters: () => void;
  statusCounts: Record<string, number>;
  banner: string | null;
};

const TAB_LABEL: Record<string, string> = {
  PRECHECK: 'Pre-Check',
  RECEIVED: 'Eingegangen',
  ANALYSIS: 'Analyse',
  PASS: 'Bestanden',
  COMPLETION: 'Abschluss',
  FAIL: 'Nicht bestanden',
};

const DOT: Record<string, string> = {
  PRECHECK: 'bg-slate-400',
  RECEIVED: 'bg-sky-500',
  ANALYSIS: 'bg-indigo-500',
  PASS: 'bg-emerald-500',
  COMPLETION: 'bg-blue-500',
  FAIL: 'bg-rose-500',
};

const PAY_LABEL: Record<string, string> = { UNPAID: 'Unbezahlt', PAID: 'Bezahlt', MANUAL: 'Manuell' };

export default function AdminHeader({
  isSuperAdmin,
  showSuperControls,
  onToggleSuper,
  onCreateCustomer,
  onRefresh,
  shownCount,
  totalCount,
  isLoading,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  paymentFilter,
  onPaymentFilterChange,
  onResetFilters,
  statusCounts,
  banner,
}: Props) {
  const filtersActive = statusFilter !== 'ALL' || paymentFilter !== 'ALL' || search.trim() !== '';
  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  const kpis = [
    { key: 'ALL', label: 'Gesamt', value: typeof totalCount === 'number' ? totalCount : total },
    { key: 'ANALYSIS', label: 'In Analyse', value: statusCounts.ANALYSIS ?? 0 },
    { key: 'PASS', label: 'Bestanden', value: statusCounts.PASS ?? 0 },
    { key: 'FAIL', label: 'Nicht bestanden', value: statusCounts.FAIL ?? 0 },
  ];

  return (
    <header className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Admin</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#2B4066]">Prüfungen &amp; Zertifikate</h1>
          <p className="mt-1 text-sm text-slate-500" aria-live="polite">
            {isLoading
              ? 'Aktualisiert…'
              : typeof totalCount === 'number'
                ? `${shownCount} von ${totalCount} Einträgen`
                : `${shownCount} Einträge`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AreaSwitch active="produkttest" />
          {isSuperAdmin && onCreateCustomer && (
            <button
              type="button"
              onClick={onCreateCustomer}
              className="inline-flex items-center gap-2 rounded-full border border-[#1d4ed8]/30 bg-white px-4 py-2 text-sm font-semibold text-[#1d4ed8] shadow-sm transition hover:bg-[#1d4ed8]/5"
            >
              <span aria-hidden className="text-base leading-none">+</span> Kunde anlegen
            </button>
          )}
          {isSuperAdmin && (
            <Link
              href="/admin/blog"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              Blog
            </Link>
          )}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={onToggleSuper}
              aria-pressed={showSuperControls}
              className={`rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition ${
                showSuperControls
                  ? 'border-[#16294d] bg-[#16294d] text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              Superadmin
            </button>
          )}
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#16294d] px-5 py-2 text-sm font-semibold !text-white shadow-sm transition hover:brightness-110"
          >
            <svg viewBox="0 0 20 20" className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M16 10a6 6 0 1 1-1.8-4.3M16 3v3.5h-3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Aktualisieren
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => {
          const active = (k.key === 'ALL' && statusFilter === 'ALL') || statusFilter === k.key;
          return (
            <button
              key={k.key}
              type="button"
              onClick={() => onStatusFilterChange(k.key as StatusOption | 'ALL')}
              className={`group rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 ${
                active
                  ? 'border-[#1d4ed8]/40 bg-white shadow-[0_18px_40px_-28px_rgba(29,78,216,0.55)]'
                  : 'border-slate-200/80 bg-white shadow-[0_12px_30px_-26px_rgba(43,64,102,0.4)] hover:border-slate-300'
              }`}
            >
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {k.key !== 'ALL' && <span className={`h-2 w-2 rounded-full ${DOT[k.key]}`} />}
                {k.label}
              </span>
              <span className={`mt-2 block text-3xl font-semibold tabular-nums transition-opacity ${isLoading ? 'opacity-40' : ''} text-[#2B4066]`}>
                {k.value}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_20px_60px_-45px_rgba(43,64,102,0.35)]">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 transition focus-within:border-[#1d4ed8]/50 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#1d4ed8]/10">
            <svg viewBox="0 0 20 20" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <circle cx="9" cy="9" r="5.5" />
              <path d="m13.5 13.5 3 3" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Name, Marke, E-Mail oder Vorgangsnummer suchen"
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            {search && (
              <button type="button" onClick={() => onSearchChange('')} aria-label="Suche leeren" className="text-slate-400 hover:text-slate-700">
                ×
              </button>
            )}
          </label>

          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Zahlung">
            {(['ALL', ...PAYMENT_STATUS_OPTIONS.map((o) => o.value)] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onPaymentFilterChange(v as PaymentStatusOption | 'ALL')}
                aria-pressed={paymentFilter === v}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  paymentFilter === v ? 'bg-white text-[#2B4066] shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {v === 'ALL' ? 'Alle Zahlungen' : PAY_LABEL[v]}
              </button>
            ))}
          </div>

          {filtersActive && (
            <button type="button" onClick={onResetFilters} className="text-sm font-semibold text-[#1d4ed8] hover:underline">
              Zurücksetzen
            </button>
          )}
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {[{ value: 'ALL', label: 'Alle' }, ...STATUS_OPTIONS.map((o) => ({ value: o.value as string, label: TAB_LABEL[o.value] ?? o.label }))].map((t) => {
            const active = statusFilter === t.value;
            const count = t.value === 'ALL' ? null : statusCounts[t.value];
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => onStatusFilterChange(t.value as StatusOption | 'ALL')}
                aria-pressed={active}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  active ? 'bg-[#16294d] !text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.label}
                {typeof count === 'number' && (
                  <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {banner && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{banner}</p>}
    </header>
  );
}
