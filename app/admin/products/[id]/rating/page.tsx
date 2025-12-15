"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { RATING_CRITERIA_V1, type RatingComputed, type RatingSectionKey, type RatingValues } from "@/lib/ratingV1";

type ApiResponse = {
  ok?: boolean;
  error?: string;
  product?: { id: string; name: string };
  lockedAt?: string | null;
  values?: RatingValues;
  computed?: RatingComputed;
  csv?: { key?: string; sha256?: string; updatedAt?: string } | null;
  pdf?: { key?: string; sha256?: string; updatedAt?: string } | null;
};

const SECTION_LABEL: Record<RatingSectionKey, string> = {
  A: "A · Produktschutz",
  B: "B · Verarbeitung & Erscheinungsbild",
  C: "C · Praxistest",
  D: "D · Preis/Leistung & Bewertungen",
};

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("de-DE");
}

export default function AdminProductRatingPage() {
  const params = useParams<{ id: string }>();
  const productId = params?.id;

  const [adminAuthed, setAdminAuthed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [values, setValues] = useState<RatingValues>({});

  const grouped = useMemo(() => {
    const by = new Map<RatingSectionKey, (typeof RATING_CRITERIA_V1)[number][]>();
    for (const c of RATING_CRITERIA_V1) {
      const list = by.get(c.section) || [];
      list.push(c);
      by.set(c.section, list);
    }
    return Array.from(by.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setMessage(null);
      try {
        const me = await fetch("/api/admin/me", { cache: "no-store" }).then((r) => r.json());
        if (cancelled) return;
        setAdminAuthed(Boolean(me?.admin));
        if (!me?.admin) {
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/admin/products/${productId}/rating`, { cache: "no-store" });
        const json = (await res.json().catch(() => ({}))) as ApiResponse;
        if (cancelled) return;
        setData(json);
        setValues(json.values || {});
      } catch (err) {
        if (!cancelled) setMessage("Laden fehlgeschlagen.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (productId) load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const lockedAt = data?.lockedAt ?? null;
  const isLocked = Boolean(lockedAt);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}/rating`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const json = (await res.json().catch(() => ({}))) as ApiResponse;
      if (!res.ok) {
        setMessage(json.error || "Speichern fehlgeschlagen.");
        return;
      }
      setData((prev) => ({ ...(prev || {}), ...json }));
      setMessage("Gespeichert. CSV wurde aktualisiert.");
    } catch {
      setMessage("Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  };

  if (adminAuthed === false) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-3xl space-y-4">
          <h1 className="text-2xl font-semibold text-slate-900">Prüfergebnis</h1>
          <p className="text-slate-700">Bitte im Admin-Dashboard einloggen.</p>
          <Link href="/admin" className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black">
            Zum Admin Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Admin</p>
            <h1 className="text-2xl font-semibold text-slate-900">Prüfergebnis – {data?.product?.name || "Produkt"}</h1>
            <p className="text-sm text-slate-600">Produkt-ID: <span className="font-mono">{productId}</span></p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50">
              Zurück
            </Link>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || saving || isLocked}
              className={`rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition ${
                loading || saving || isLocked ? "bg-slate-200 text-slate-500 cursor-not-allowed" : "bg-slate-900 text-white hover:bg-black"
              }`}
              title={isLocked ? `Gesperrt seit ${fmtDate(lockedAt)} (E-Mail #4 gesendet).` : undefined}
            >
              {saving ? "Speichere…" : isLocked ? "Gesperrt" : "Speichern"}
            </button>
          </div>
        </header>

        {message && <p className="text-sm text-slate-700">{message}</p>}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{isLocked ? "Gesperrt" : "Bearbeitbar"}</div>
              <div className="mt-1 text-xs text-slate-600">Gesperrt seit: {fmtDate(lockedAt)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">CSV</div>
              <div className="mt-1 text-xs text-slate-600">Aktualisiert: {fmtDate(data?.csv?.updatedAt || null)}</div>
              <div className="mt-1 text-xs text-slate-600 break-all">Key: {data?.csv?.key || "—"}</div>
              <div className="mt-2">
                <a
                  className="text-xs font-semibold text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-900"
                  href={`/api/admin/products/${productId}/rating-sheet`}
                  onClick={(e) => {
                    if (!data?.csv?.key) e.preventDefault();
                  }}
                >
                  CSV herunterladen
                </a>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">PDF</div>
              <div className="mt-1 text-xs text-slate-600">Aktualisiert: {fmtDate(data?.pdf?.updatedAt || null)}</div>
              <div className="mt-1 text-xs text-slate-600 break-all">Key: {data?.pdf?.key || "—"}</div>
              <div className="mt-2">
                <a
                  className="text-xs font-semibold text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-900"
                  href={`/api/admin/products/${productId}/rating-pdf`}
                  onClick={(e) => {
                    if (!data?.pdf?.key) e.preventDefault();
                  }}
                >
                  PDF herunterladen
                </a>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Gesamt</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                Note: {data?.computed?.overallGrade != null ? data.computed.overallGrade.toFixed(1) : "—"} · {data?.computed?.overallCategory || "—"}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                Punkte: {data?.computed?.overallAverage != null ? data.computed.overallAverage.toFixed(2) : "—"} / 10
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <p className="text-slate-600">Lade…</p>
        ) : (
          <div className="space-y-6">
            {grouped.map(([section, items]) => (
              <section key={section} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">{SECTION_LABEL[section]}</h2>
                  <div className="text-sm text-slate-700">
                    Ergebnis:{" "}
                    <span className="font-semibold">
                      {data?.computed?.sectionAverage?.[section] != null
                        ? data.computed.sectionAverage[section]!.toFixed(2)
                        : "—"}
                    </span>
                    {" · "}
                    <span className="font-semibold">
                      {data?.computed?.sectionGrade?.[section] != null
                        ? data.computed.sectionGrade[section]!.toFixed(1)
                        : "—"}
                    </span>
                    {" · "}
                    <span className="font-semibold">{data?.computed?.sectionCategory?.[section] || "—"}</span>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[820px] border-separate border-spacing-0">
                    <thead>
                      <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        <th className="border-b border-slate-200 pb-2 pr-4">Kriterium</th>
                        <th className="border-b border-slate-200 pb-2 pr-4 w-[160px]">Bewertung (1–10)</th>
                        <th className="border-b border-slate-200 pb-2">Bemerkung</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const v = values[item.id] || { score: null, note: null };
                        return (
                          <tr key={item.id} className="align-top">
                            <td className="border-b border-slate-100 py-3 pr-4 text-sm text-slate-900">{item.label}</td>
                            <td className="border-b border-slate-100 py-3 pr-4">
                              <input
                                type="number"
                                min={1}
                                max={10}
                                step={1}
                                inputMode="numeric"
                                value={v.score ?? ""}
                                disabled={isLocked}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const score = raw === "" ? null : Math.max(1, Math.min(10, Math.round(Number(raw))));
                                  setValues((prev) => {
                                    const prevVal = prev[item.id];
                                    return { ...prev, [item.id]: { score, note: prevVal?.note ?? null } };
                                  });
                                }}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500"
                              />
                            </td>
                            <td className="border-b border-slate-100 py-3">
                              <textarea
                                value={v.note ?? ""}
                                disabled={isLocked}
                                onChange={(e) => {
                                  const note = e.target.value;
                                  setValues((prev) => {
                                    const prevVal = prev[item.id];
                                    return { ...prev, [item.id]: { score: prevVal?.score ?? null, note } };
                                  });
                                }}
                                rows={2}
                                className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
