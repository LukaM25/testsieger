"use client";

import { useEffect, useMemo, useState } from "react";

type AnalyticsSummary = {
  days: number;
  totals: {
    events: number;
    pageViews: number;
    visitors: number;
    conversions: number;
  };
  changes: {
    pageViews: number | null;
    visitors: number | null;
    conversions: number | null;
  };
  eventCounts: Array<{ name: string; label: string; count: number }>;
  topPages: Array<{ label: string; path: string; count: number }>;
  sources: Array<{ source: string; count: number }>;
  daily: Array<{ day: string; pageViews: number; visitors: number; conversions: number }>;
  generatedAt: string;
  warning?: string;
};

const DAY_OPTIONS = [7, 30, 90] as const;

function formatNumber(value: number) {
  return new Intl.NumberFormat("de-DE").format(value);
}

function formatChange(value: number | null) {
  if (value === null) return "neu";
  if (value === 0) return "0%";
  return `${value > 0 ? "+" : ""}${value}%`;
}

function changeTone(value: number | null) {
  if (value === null || value > 0) return "text-emerald-700 bg-emerald-50 ring-emerald-100";
  if (value < 0) return "text-rose-700 bg-rose-50 ring-rose-100";
  return "text-slate-600 bg-slate-50 ring-slate-100";
}

function shortDate(day: string) {
  return new Date(`${day}T00:00:00`).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default function AnalyticsPanel() {
  const [days, setDays] = useState<(typeof DAY_OPTIONS)[number]>(30);
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetch(`/api/admin/analytics?days=${days}`, {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "ANALYTICS_LOAD_FAILED");
        return data as AnalyticsSummary;
      })
      .then((data) => {
        if (!active) return;
        setSummary(data);
      })
      .catch(() => {
        if (!active) return;
        setError("Analytics konnten nicht geladen werden.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [days]);

  const compactSummary = summary
    ? `${formatNumber(summary.totals.pageViews)} Views · ${formatNumber(summary.totals.visitors)} Besucher · ${formatNumber(summary.totals.conversions)} Conversions`
    : loading
      ? "Lädt…"
      : error
        ? "Nicht verfügbar"
        : "Noch keine Daten";

  const maxDaily = useMemo(() => {
    if (!summary?.daily.length) return 1;
    return Math.max(...summary.daily.map((row) => row.pageViews), 1);
  }, [summary]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="group flex min-w-0 flex-1 items-start gap-3 text-left"
          aria-expanded={isOpen}
        >
          <span className="mt-8 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition group-hover:bg-slate-100">
            <span className={`block text-lg leading-none transition-transform ${isOpen ? "rotate-90" : ""}`}>›</span>
          </span>
          <span className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-indigo-500">Analytics</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Traffic und Conversion Tracking</h2>
          <p className="mt-1 text-sm text-slate-500">
            {isOpen ? "First-party Events aus Seitenaufrufen, Formularen und Stripe-Webhooks." : compactSummary}
          </p>
          </span>
        </button>
        <div className={`inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 ${isOpen ? "" : "hidden sm:inline-flex"}`}>
          {DAY_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDays(option)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                days === option ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-white"
              }`}
            >
              {option} Tage
            </button>
          ))}
        </div>
      </div>

      {!isOpen ? null : loading ? (
        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
          Lade Analytics…
        </div>
      ) : error ? (
        <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 p-5 text-sm text-rose-700">
          {error}
        </div>
      ) : summary ? (
        <div className="mt-5 space-y-5">
          {summary.warning ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {summary.warning}
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-4">
            {[
              { label: "Seitenaufrufe", value: summary.totals.pageViews, change: summary.changes.pageViews },
              { label: "Besucher", value: summary.totals.visitors, change: summary.changes.visitors },
              { label: "Conversions", value: summary.totals.conversions, change: summary.changes.conversions },
              { label: "Events gesamt", value: summary.totals.events, change: 0 },
            ].map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {metric.label}
                  </span>
                  {metric.label !== "Events gesamt" ? (
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${changeTone(metric.change)}`}>
                      {formatChange(metric.change)}
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-950">{formatNumber(metric.value)}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Tagesverlauf</h3>
              <span className="text-xs text-slate-500">Seitenaufrufe</span>
            </div>
            <div className="flex h-36 items-end gap-1">
              {summary.daily.map((row) => (
                <div key={row.day} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t bg-indigo-500"
                    title={`${shortDate(row.day)}: ${formatNumber(row.pageViews)} Seitenaufrufe`}
                    style={{ height: `${Math.max(4, (row.pageViews / maxDaily) * 100)}%` }}
                  />
                  {summary.daily.length <= 30 ? (
                    <span className="text-[10px] text-slate-400">{shortDate(row.day)}</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">Events</h3>
              <div className="mt-3 space-y-2">
                {summary.eventCounts.length ? (
                  summary.eventCounts.map((event) => (
                    <div key={event.name} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-slate-600">{event.label}</span>
                      <span className="font-semibold text-slate-900">{formatNumber(event.count)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Noch keine Events.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">Top-Seiten</h3>
              <div className="mt-3 space-y-2">
                {summary.topPages.length ? (
                  summary.topPages.map((page) => (
                    <div key={page.path} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-slate-600" title={page.path}>{page.label}</span>
                      <span className="font-semibold text-slate-900">{formatNumber(page.count)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Noch keine Seitenaufrufe.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">Quellen</h3>
              <div className="mt-3 space-y-2">
                {summary.sources.length ? (
                  summary.sources.map((source) => (
                    <div key={source.source} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-slate-600">{source.source}</span>
                      <span className="font-semibold text-slate-900">{formatNumber(source.count)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Noch keine Quellen.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
