"use client";

import { useMemo, useState } from "react";
import { DOC_CATEGORIES, type ASDocument } from "@/lib/arbeitssicherheit/types";
import { docStatus, formatDateShort, type DocStatus } from "@/lib/arbeitssicherheit/status";
import { CARD, EmptyState, StatusPill } from "./ui";

type Filter = "all" | "attention" | "missing";

export default function DocList({ documents }: { documents: ASDocument[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DOC_CATEGORIES.map((cat) => {
      const docs = documents
        .filter((d) => d.categoryId === cat.id)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      return { cat, docs, status: docStatus(docs[0]) as DocStatus };
    }).filter(({ cat, docs, status }) => {
      if (filter === "missing" && status !== "missing") return false;
      if (filter === "attention" && status !== "expiring" && status !== "expired") return false;
      if (!q) return true;
      return (
        cat.title.toLowerCase().includes(q) ||
        docs.some((d) => d.title.toLowerCase().includes(q) || (d.fileName ?? "").toLowerCase().includes(q))
      );
    });
  }, [documents, filter, query]);

  const counts = useMemo(() => {
    const all = DOC_CATEGORIES.map((c) => docStatus(documents.filter((d) => d.categoryId === c.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]));
    return {
      all: all.length,
      attention: all.filter((s) => s === "expiring" || s === "expired").length,
      missing: all.filter((s) => s === "missing").length,
    };
  }, [documents]);

  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: "Alle" },
    { id: "attention", label: "Handlungsbedarf" },
    { id: "missing", label: "Fehlt" },
  ];

  return (
    <div>
      <div className={`${CARD} flex flex-wrap items-center gap-3 p-4`}>
        <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 transition focus-within:border-[#1d4ed8]/50 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#1d4ed8]/10">
          <svg viewBox="0 0 20 20" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <circle cx="9" cy="9" r="5.5" />
            <path d="m13.5 13.5 3 3" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Dokument oder Thema suchen"
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </label>
        <div className="flex gap-1" role="group" aria-label="Filter">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={filter === t.id}
              onClick={() => setFilter(t.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                filter === t.id ? "bg-[#16294d] !text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${filter === t.id ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>
                {counts[t.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {rows.length === 0 ? (
          <EmptyState title="Nichts gefunden" text="Passen Sie Suche oder Filter an." />
        ) : (
          rows.map(({ cat, docs, status }) => (
            <section key={cat.id} className={`${CARD} p-6`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-[#2B4066]">{cat.title}</h2>
                  <p className="mt-0.5 text-sm text-slate-500">{cat.hint}</p>
                </div>
                <StatusPill status={status} />
              </div>
              <div className="mt-4">
                {docs.length === 0 ? (
                  <EmptyState title="Noch nichts hinterlegt" text="Ihre Fachkraft lädt die Unterlage hier hoch, sobald sie vorliegt." />
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {docs.map((d) => (
                      <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{d.title}</p>
                          <p className="text-xs text-slate-500">
                            Stand {formatDateShort(d.updatedAt)}
                            {d.validUntil ? ` · gültig bis ${formatDateShort(d.validUntil)}` : ""}
                          </p>
                        </div>
                        {d.downloadUrl ? (
                          <a href={d.downloadUrl} className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-[#2B4066] hover:bg-slate-50">
                            Herunterladen
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">Download folgt</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
