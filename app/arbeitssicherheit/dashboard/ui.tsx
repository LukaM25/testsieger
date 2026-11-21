import type { ReactNode } from "react";
import type { DocStatus } from "@/lib/arbeitssicherheit/status";

export const CARD =
  "rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_60px_-45px_rgba(43,64,102,0.35)]";

export function PageHead({ title, text, aside }: { title: string; text?: string; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-[#2B4066] sm:text-3xl">{title}</h1>
        {text ? <p className="mt-1 max-w-2xl text-sm text-slate-600">{text}</p> : null}
      </div>
      {aside}
    </div>
  );
}

export function PreviewBanner() {
  return (
    <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      Vorschau mit Beispieldaten. Das ist nur lokal sichtbar.
    </div>
  );
}

const STATUS_STYLE: Record<DocStatus, { label: string; cls: string }> = {
  valid: { label: "Aktuell", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  expiring: { label: "Bald fällig", cls: "bg-amber-50 text-amber-800 ring-amber-200" },
  expired: { label: "Abgelaufen", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
  missing: { label: "Fehlt", cls: "bg-slate-100 text-slate-600 ring-slate-200" },
};

export function StatusPill({ status }: { status: DocStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${s.cls}`}>
      {s.label}
    </span>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-8 text-center">
      <p className="text-sm font-semibold text-[#2B4066]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{text}</p>
    </div>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#16294d]" style={{ width: `${pct}%` }} />
    </div>
  );
}
