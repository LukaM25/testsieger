"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, MapPin } from "lucide-react";
import AsPackageBuilder from "./AsPackageBuilder";
import AsBridgeGraphic from "./AsBridgeGraphic";
import { INCLUDED_KM, MAX_KM, PACKAGES_PRICING, RATE_PER_EXTRA_KM, eur, travelFor, type PkgKey } from "@/lib/arbeitssicherheit/pricing";

const OPTIONS: { key: PkgKey; label: string; sub: string }[] = [
  { key: "start", label: "Bis 10 Beschäftigte", sub: "Paket Start" },
  { key: "betreuung", label: "11 bis 50 Beschäftigte", sub: "Paket Betreuung" },
  { key: "enterprise", label: "Alles inklusive", sub: "Paket Enterprise" },
];

export function StepBadge({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#16294d] text-sm font-semibold text-white">{n}</span>
      <h2 className="text-lg font-semibold text-[#2B4066]">{children}</h2>
    </div>
  );
}

export default function AsPackageWizard({ initial }: { initial: PkgKey | null }) {
  const [pkgKey, setPkgKey] = useState<PkgKey | null>(initial);
  const chosen = pkgKey ? PACKAGES_PRICING[pkgKey] : null;
  const [plz, setPlz] = useState("");
  const [km, setKm] = useState<number | null>(null);
  const [place, setPlace] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!/^\d{5}$/.test(plz)) { setKm(null); setPlace(""); setErr(null); return; }
    const ctrl = new AbortController();
    setLoading(true);
    setErr(null);
    fetch(`/api/arbeitssicherheit/distance?plz=${plz}`, { signal: ctrl.signal })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d?.error || "Fehler");
        setKm(d.km);
        setPlace(d.place || "");
      })
      .catch((e) => { if (e.name !== "AbortError") { setKm(null); setPlace(""); setErr(e.message || "Fehler"); } })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [plz]);

  const tr = travelFor(km);
  const [showErr, setShowErr] = useState(false);
  const step2 = useRef<HTMLDivElement>(null);
  const plzInput = useRef<HTMLInputElement>(null);
  const ready = !!pkgKey && km !== null;
  const missing = showErr && km === null && !loading;
  const blocked = () => {
    setShowErr(true);
    step2.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => plzInput.current?.focus({ preventScroll: true }), 400);
  };

  return (
    <div className="mt-8">
      <StepBadge n={1}>Wie viele Beschäftigte hat Ihr Betrieb?</StepBadge>
      <div className="grid gap-4 md:grid-cols-3" role="radiogroup" aria-label="Beschäftigtenzahl">
        {OPTIONS.map((o) => {
          const p = PACKAGES_PRICING[o.key];
          const active = pkgKey === o.key;
          const low = p.tiers[0].monthly;
          const high = p.tiers[p.tiers.length - 1].monthly;
          return (
            <button
              key={o.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setPkgKey(o.key)}
              className={`relative rounded-3xl border p-6 text-left transition duration-300 ${
                active
                  ? "border-blue-900/40 bg-gradient-to-b from-[#16294d] to-[#0b1730] text-white shadow-[0_30px_70px_-35px_rgba(11,23,48,0.8)] ring-2 ring-emerald-400/70"
                  : "border-slate-200/80 bg-white text-slate-800 shadow-[0_20px_60px_-45px_rgba(43,64,102,0.35)] hover:-translate-y-0.5"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className={`text-2xl font-semibold tracking-tight ${active ? "text-white" : "text-[#2B4066]"}`}>{o.label}</span>
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${active ? "bg-emerald-400 text-emerald-950" : "border border-slate-300"}`}>
                  {active && <Check className="h-4 w-4" aria-hidden="true" />}
                </span>
              </div>
              <p className={`mt-1 text-sm font-semibold ${active ? "text-emerald-300" : "text-[#1d4ed8]"}`}>{o.sub}</p>
              <p className={`mt-4 text-3xl font-semibold tracking-tight ${active ? "text-white" : "text-[#2B4066]"}`}>
                {eur(low)}{high !== low && <span className="text-xl"> bis {eur(high)}</span>}
                <span className={`ml-1.5 text-sm font-medium ${active ? "text-white/70" : "text-slate-500"}`}>pro Monat, netto</span>
              </p>
              <p className={`mt-1 text-xs ${active ? "text-white/60" : "text-slate-500"}`}>plus einmalige Ersteinrichtung {eur(p.setup)}</p>
              <p className={`mt-3 text-sm ${active ? "text-white/90" : "text-slate-700"}`}>
                {o.key === "start"
                  ? "Alles DGUV-Vorschrift-2-konform: feste Ansprechperson, 1 Begehung pro Jahr, alle gesetzlichen Pflichten, Dashboard mit Dokumentenmappe, Fristen-Erinnerung."
                  : o.key === "enterprise"
                  ? "Alles drin, nichts extra: Begehungen und Unterweisungen nach Bedarf, Prüffristen, Vorsorge, Ersthelfer, alle Unterlagen und Anfahrt, bis 50 Beschäftigte."
                  : "Mehr Umfang: 2 Begehungen pro Jahr, eine Unterweisung pro Jahr durch uns im Betrieb und Notfall- und Fluchtplan inklusive."}
              </p>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-slate-500">
        Mehr als 50 Beschäftigte oder mehrere Standorte? Dann machen wir ein <Link href="/kontakt?kategorie=safety" className="font-semibold text-[#1d4ed8] hover:underline">individuelles Angebot</Link>.
      </p>

      {chosen && pkgKey ? (
        <div className="mt-10" id="schritt-2" ref={step2}>
          <StepBadge n={2}>Wie weit ist Ihr Betrieb von uns entfernt?</StepBadge>
          <div className={`rounded-3xl border bg-white p-6 shadow-[0_20px_60px_-45px_rgba(43,64,102,0.35)] transition ${missing ? "border-rose-400 ring-4 ring-rose-100" : "border-slate-200/80"}`}>
            <div className="grid gap-6 md:grid-cols-[280px_1fr] md:items-center">
              <label className="block text-sm font-semibold text-slate-700">
                Postleitzahl Ihres Betriebs
                <div className="relative mt-2">
                  <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    ref={plzInput}
                    aria-invalid={missing}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={5}
                    value={plz}
                    onChange={(e) => setPlz(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    placeholder="z. B. 83703"
                    className={`w-full rounded-xl border ${missing ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-slate-50"} py-3 pl-10 pr-3.5 text-base text-slate-900 outline-none transition focus:border-[#1d4ed8]/50 focus:bg-white focus:ring-4 focus:ring-[#1d4ed8]/10`}
                  />
                </div>
                {missing ? <span className="mt-1.5 block text-sm font-semibold text-rose-600">Pflichtfeld: bitte 5-stellige Postleitzahl eingeben.</span> : <span className="mt-1.5 block text-xs font-normal text-slate-500">Wir berechnen die Strecke automatisch.</span>}
              </label>

              <div aria-live="polite">
                {loading && <p className="text-sm text-slate-500">Strecke wird berechnet…</p>}
                {err && !loading && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{err}</p>}
                {!loading && !err && km === null && (
                  <p className="text-sm text-slate-500">Bis {INCLUDED_KM} km sind in jedem Paket inklusive. Darüber kostet jeder Kilometer extra, je Vor-Ort-Termin.</p>
                )}
                {!loading && !err && km !== null && (
                  <div>
                    <p className="text-sm text-slate-600">
                      Ihr Betrieb{place ? ` in ${place}` : ""} ist ca. <span className="text-xl font-semibold text-[#2B4066]">{km} km</span> von uns entfernt (Tegernseer Tal).
                    </p>
                    <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                      <div className="flex h-full" style={{ width: `${Math.min(100, (km / Math.max(km, INCLUDED_KM * 2)) * 100)}%`, transition: "width .6s ease" }}>
                        <div className="h-full bg-emerald-500" style={{ width: `${(Math.min(km, INCLUDED_KM) / km) * 100}%` }} />
                        {km > INCLUDED_KM && <div className="h-full flex-1 bg-amber-400" />}
                      </div>
                    </div>
                    <p className={`mt-3 inline-flex rounded-full px-3.5 py-1.5 text-sm font-semibold ${tr.state === "included" || (tr.state === "fee" && pkgKey === "enterprise") ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"}`}>
                      {tr.state === "included" && `Anfahrt inklusive (bis ${INCLUDED_KM} km)`}
                      {tr.state === "fee" && pkgKey === "enterprise" && `Anfahrt inklusive (${km} km, im Paket Enterprise enthalten)`}
                      {tr.state === "fee" && pkgKey !== "enterprise" && `Anfahrt ${eur(tr.fee)} je Termin (${km - INCLUDED_KM} km über ${INCLUDED_KM} km inklusive)`}
                      {tr.state === "request" && `Über ${MAX_KM} km: Anfahrt auf Anfrage`}
                    </p>
                    {tr.state === "fee" && pkgKey !== "enterprise" && (
                      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3">
                        <p className="text-sm font-semibold text-emerald-800">Anfahrt ist nur im Paket Enterprise inklusive.</p>
                        <button type="button" onClick={() => setPkgKey("enterprise")} className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700">Zu Enterprise wechseln</button>
                      </div>
                    )}
                    {tr.state === "fee" && pkgKey !== "enterprise" && <p className="mt-2 text-xs text-slate-500">{RATE_PER_EXTRA_KM.toLocaleString("de-DE", { style: "currency", currency: "EUR" })} je Kilometer über {INCLUDED_KM} km, Hin- und Rückfahrt eingerechnet, netto.</p>}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-10">
            <StepBadge n={3}>Leistungen wählen</StepBadge>
            <AsPackageBuilder key={pkgKey} pkgKey={pkgKey} km={km} plz={plz} ready={ready} onBlocked={blocked} />
          </div>
          <AsBridgeGraphic />
        </div>
      ) : (
        <p className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-5 py-6 text-center text-sm text-slate-500">
          Wählen Sie oben Ihre Beschäftigtenzahl. Danach schalten wir das passende Paket frei.
        </p>
      )}
    </div>
  );
}
