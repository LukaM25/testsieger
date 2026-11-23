import Link from "next/link";
import { loadDashboardData } from "@/lib/arbeitssicherheit/data";
import { buildCompliance, type Level, type PillarState } from "@/lib/arbeitssicherheit/compliance";
import { sizeClass } from "@/lib/arbeitssicherheit/options";
import { CARD, PageHead, PreviewBanner } from "./ui";

type Props = { searchParams?: Promise<{ preview?: string }> };

const LEVEL: Record<Level, { ring: string; badge: string; icon: string }> = {
  ok: { ring: "#10b981", badge: "bg-emerald-50 text-emerald-700", icon: "✓" },
  attention: { ring: "#f59e0b", badge: "bg-amber-50 text-amber-800", icon: "!" },
  action: { ring: "#e11d48", badge: "bg-rose-50 text-rose-700", icon: "!" },
};

const PILLAR: Record<PillarState, { dot: string; pill: string }> = {
  ok: { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  soon: { dot: "bg-amber-500", pill: "bg-amber-50 text-amber-800 ring-amber-200" },
  action: { dot: "bg-rose-500", pill: "bg-rose-50 text-rose-700 ring-rose-200" },
};

const PRIO_DOT = ["bg-rose-500", "bg-amber-500", "bg-sky-500"];

export default async function ASDashboardOverview({ searchParams }: Props) {
  const data = await loadDashboardData(searchParams);
  const c = buildCompliance(data);
  const L = LEVEL[c.level];
  const q = data.preview ? "?preview=1" : "";
  const pct = Math.round((c.okCount / c.total) * 100);
  const R = 42;
  const CIRC = 2 * Math.PI * R;

  return (
    <div>
      {data.preview ? <PreviewBanner /> : null}
      <PageHead
        title={data.company.name}
        text={
          [data.company.industry, data.company.employees ? `${data.company.employees} Beschäftigte (${sizeClass(data.company.employees)})` : null, data.company.bg]
            .filter(Boolean)
            .join(" · ") || undefined
        }
      />

      {/* 1. Gesamtstatus */}
      <section className={`${CARD} mt-6 flex flex-wrap items-center gap-6 p-6 sm:p-8`}>
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
            <circle cx="50" cy="50" r={R} fill="none" stroke="#e2e8f0" strokeWidth="9" />
            <circle
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={L.ring}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - pct / 100)}
              style={{ transition: "stroke-dashoffset 900ms ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold tabular-nums text-[#2B4066]">{c.okCount}/{c.total}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Pflichten</span>
          </div>
        </div>
        <div className="min-w-[220px] flex-1">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${L.badge}`}>
            <span aria-hidden>{L.icon}</span> Stand Ihrer Unterlagen
          </span>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#2B4066] sm:text-3xl">{c.headline}</h2>
          <p className="mt-1 text-sm text-slate-600">{c.sub}</p>
        </div>
      </section>

      {/* 2. Was ist zu tun */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-[#2B4066]">Das ist jetzt zu tun</h2>
        {c.actions.length === 0 ? (
          <div className="mt-3 rounded-3xl border border-emerald-200 bg-emerald-50/60 px-6 py-6 text-sm text-emerald-900">
            Nichts offen. Ihre Fachkraft meldet sich, sobald etwas ansteht.
          </div>
        ) : (
          <ul className={`${CARD} mt-3 divide-y divide-slate-100`}>
            {c.actions.map((a) => (
              <li key={a.id}>
                <Link href={`${a.href}${q}`} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50/70 sm:px-6">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${PRIO_DOT[a.priority]}`} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900">{a.title}</span>
                    {a.detail ? <span className="block text-xs text-slate-500">{a.detail}</span> : null}
                  </span>
                  {a.when ? (
                    <span className={`hidden whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold sm:inline ${a.priority === 0 ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
                      {a.when}
                    </span>
                  ) : null}
                  <span className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" aria-hidden>›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 3. Rechtlicher Mindestrahmen */}
      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-[#2B4066]">Ihr rechtlicher Mindestrahmen</h2>
            <p className="mt-1 text-sm text-slate-500">Diese sechs Pflichten muss jeder Arbeitgeber mit Beschäftigten erfüllen.</p>
          </div>
          <span className="text-sm font-semibold text-[#2B4066]">{c.okCount} von {c.total} erfüllt</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#16294d]" style={{ width: `${pct}%` }} />
        </div>
        <ul className={`${CARD} mt-4 divide-y divide-slate-100`}>
          {c.pillars.map((p) => (
            <li key={p.id}>
              <Link href={`${p.href}${q}`} className="group flex items-start gap-4 px-5 py-4 transition hover:bg-slate-50/70 sm:px-6">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    p.state === "ok" ? "bg-emerald-100 text-emerald-700" : p.state === "soon" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-700"
                  }`}
                  aria-hidden
                >
                  {p.state === "ok" ? "✓" : "!"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{p.title}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{p.norm}</span>
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-500">
                    {p.state === "ok" ? p.text : `Noch zu tun: ${p.todo}`}
                  </span>
                </span>
                <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 sm:inline ${PILLAR[p.state].pill}`}>{p.stateLabel}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-400">
          Der Status beruht auf den hinterlegten Unterlagen und ersetzt keine rechtliche Prüfung. Die Verantwortung bleibt beim Arbeitgeber.
        </p>
      </section>
    </div>
  );
}
