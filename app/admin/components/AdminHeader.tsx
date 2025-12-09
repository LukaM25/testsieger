'use client';

import { PAYMENT_STATUS_OPTIONS, STATUS_OPTIONS, STATUS_TONE, statusLabel } from '../constants';
import { PaymentStatusOption, StatusOption } from '../types';

type Props = {
  isSuperAdmin: boolean;
  showSuperControls: boolean;
  onToggleSuper: () => void;
  onRefresh: () => void;
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

export default function AdminHeader({
  isSuperAdmin,
  showSuperControls,
  onToggleSuper,
  onRefresh,
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
  return (
    <header className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-900/5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Admin Control</p>
          <h1 className="text-3xl font-bold text-slate-900">Zertifikats-Workflow steuern</h1>
          <p className="mt-2 text-sm text-slate-600">
            Suche, filtere, aktualisiere Status und verschicke Zertifikate mit klar beschrifteten Aktionen.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isSuperAdmin && (
            <button
              type="button"
              onClick={onToggleSuper}
              className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 shadow-sm transition hover:bg-indigo-100"
            >
              {showSuperControls ? 'Superadmin Controls verbergen' : 'Superadmin Controls'}
            </button>
          )}
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-xl border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
          >
            Liste aktualisieren / Refresh list
          </button>
        </div>
      </div>

      <div className="mt-5 grid items-center gap-3 md:grid-cols-[1.4fr,1fr,1fr,auto]">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-inner">
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Suche Name/Marke/E-Mail · Search name/brand/email"
            className="w-full bg-transparent text-sm text-slate-900 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as StatusOption | 'ALL')}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
        >
          <option value="ALL">Alle Status · All statuses</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => onPaymentFilterChange(e.target.value as PaymentStatusOption | 'ALL')}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
        >
          <option value="ALL">Alle Zahlungen · All payments</option>
          {PAYMENT_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={onResetFilters}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Filter zurücksetzen / Reset filters
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(statusCounts).length === 0 ? (
          <span className="text-xs text-slate-500">Keine Treffer / No matches</span>
        ) : (
          Object.entries(statusCounts).map(([key, count]) => (
            <span
              key={key}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${STATUS_TONE[key] ?? 'bg-slate-100 text-slate-700 ring-slate-200'}`}
            >
              {statusLabel(key)} <span className="text-[11px] font-bold text-slate-800">({count})</span>
            </span>
          ))
        )}
      </div>
      {banner && <p className="mt-3 text-sm text-rose-600">{banner}</p>}
    </header>
  );
}
