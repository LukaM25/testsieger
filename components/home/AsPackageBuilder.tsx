"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Lock, Plus } from "lucide-react";
import { EXTRA_PRICES, PACKAGES_PRICING, eur, travelFor, type PkgKey } from "@/lib/arbeitssicherheit/pricing";

type Mod = { id: string; title: string; hint: string; group: "pflicht" | "inkl" | "extra"; recommended?: boolean; inPkg?: PkgKey; onlyPkg?: PkgKey };

const MODULES: Mod[] = [
  { id: "gb", title: "Gefährdungsbeurteilung", hint: "§ 5 ArbSchG", group: "pflicht" },
  { id: "uw", title: "Unterweisungen: Vorlagen und Nachweise", hint: "Planung, Vorlagen und Doku (§ 12 ArbSchG). Sie unterweisen selbst.", group: "pflicht" },
  { id: "sifa", title: "Fachkraft für Arbeitssicherheit", hint: "§ 5 ASiG", group: "pflicht" },
  { id: "ba", title: "Betriebsarzt", hint: "§ 2 ASiG", group: "pflicht" },
  { id: "eh", title: "Erste Hilfe", hint: "§ 10 ArbSchG", group: "pflicht" },
  { id: "bs", title: "Brandschutz und Notfall", hint: "ArbStättV", group: "pflicht" },
  { id: "dguv", title: "DGUV Vorschrift 2 konform", hint: "Sicherheitstechnische Betreuung nach DGUV V2", group: "inkl" },
  { id: "ansprech", title: "Feste Ansprechperson", hint: "Direkter Draht, keine Hotline", group: "inkl" },
  { id: "doku", title: "Dokumentenmappe", hint: "Alle Nachweise digital, griffbereit", group: "inkl" },
  { id: "dash", title: "Digitales Dashboard", hint: "Status auf einen Blick", group: "inkl" },
  { id: "frist", title: "Fristen-Erinnerung per Mail", hint: "Nichts verpassen", group: "inkl" },
    { id: "notfall", title: "Notfall- und Flucht­plan", hint: "Für Ihren Standort", group: "extra", inPkg: "betreuung" },
  { id: "schulung", title: "Unterweisung vor Ort durch uns", hint: "Wir unterweisen Ihr Team persönlich im Betrieb", group: "extra", inPkg: "betreuung" },
  { id: "begehung", title: "Zusätzliche Begehung vor Ort", hint: "Zu den Begehungen im Paket", group: "extra" },
  { id: "banw", title: "Betriebsanweisungen", hint: "Für Ihre Maschinen und Arbeitsmittel, 5 Stück", group: "extra", recommended: true },
  { id: "gefahr", title: "Gefahrstoffverzeichnis", hint: "Pflicht bei Lacken, Klebern, Ölen und Reinigern", group: "extra", recommended: true },
  { id: "pruef", title: "Prüffristen Maschinen, Leitern, Elektro", hint: "Alle Geräte erfasst, Prüftermine im Dashboard (UVV, DGUV V3)", group: "extra", recommended: true },
  { id: "helfer", title: "Ersthelfer und Brandschutzhelfer", hint: "Ausbildungen und Auffrischungen mit Fristen verwaltet", group: "extra" },
  { id: "vorsorge", title: "Arbeitsmedizinische Vorsorge", hint: "Pflicht- und Angebotsvorsorge organisiert und nachverfolgt", group: "extra" },
];

const WHY: Record<string, string> = {
  notfall: "Im Brandfall oder bei einem Unfall muss jeder wissen, wohin. Ein aktueller Plan wird bei Kontrollen und Versicherungsfällen verlangt.",
  schulung: "Wir erklären Ihrem Team die Gefahren direkt am Arbeitsplatz. Das wirkt besser als Papier und ist als Unterweisung nachweisbar.",
  begehung: "Bei mehreren Hallen, Baustellen oder vielen Maschinen reicht eine Begehung pro Jahr oft nicht. Zusätzliche Termine schließen Lücken, bevor etwas passiert.",
  banw: "Für jede Maschine und jeden Gefahrstoff ist eine Betriebsanweisung Pflicht. Ohne sie ist eine Unterweisung nicht vollständig und bei einem Unfall steht der Chef in der Haftung.",
  gefahr: "Wer mit Lacken, Klebern, Ölen oder Reinigern arbeitet, muss ein Gefahrstoffverzeichnis führen. Bei Kontrollen wird es als Erstes verlangt.",
  pruef: "Maschinen, Leitern und Elektrogeräte müssen regelmäßig geprüft werden (UVV, DGUV V3). Fehlt der Nachweis, drohen Bußgelder und bei Unfällen Probleme mit Berufsgenossenschaft und Versicherung.",
  helfer: "Je nach Betriebsgröße sind Ersthelfer Pflicht, und ihre Ausbildung läuft ab. Wir behalten die Fristen im Blick, damit im Notfall immer jemand da ist.",
  vorsorge: "Bei Lärm, Staub, Gefahrstoffen oder schwerer Arbeit muss der Betrieb arbeitsmedizinische Vorsorge veranlassen. Wir halten Termine und Nachweise sauber fest.",
};

const PFLICHT_IDS = MODULES.filter((m) => m.group === "pflicht").map((m) => m.id);
const isLocked = (m: Mod, pkg: PkgKey) => pkg === "enterprise" || m.group !== "extra" || m.inPkg === pkg || m.onlyPkg === pkg;
const isUnavailable = (m: Mod, pkg: PkgKey) => !!m.onlyPkg && m.onlyPkg !== pkg;

export default function AsPackageBuilder({ pkgKey, km, plz, ready, onBlocked }: { pkgKey: PkgKey; km: number | null; plz: string; ready: boolean; onBlocked: () => void }) {
  const pkg = PACKAGES_PRICING[pkgKey];
  const [sel, setSel] = useState<string[]>([]);
  const tier = 0;
  const toggle = (m: Mod) => {
    if (isLocked(m, pkgKey) || isUnavailable(m, pkgKey)) return;
    setSel((s) => (s.includes(m.id) ? s.filter((x) => x !== m.id) : [...s, m.id]));
  };
  const included = useMemo(() => MODULES.filter((m) => isLocked(m, pkgKey)), [pkgKey]);
  const extras = useMemo(() => MODULES.filter((m) => !isLocked(m, pkgKey) && !isUnavailable(m, pkgKey) && sel.includes(m.id)), [sel, pkgKey]);

  const calc = useMemo(() => {
    const tr = travelFor(km);
    const base = pkg.tiers[Math.min(tier, pkg.tiers.length - 1)];
    let monthly = base.monthly;
    let once = pkg.setup;
    let yearly = 0;
    let visits = pkg.visits + (pkgKey === "betreuung" ? 1 : 0);
    const lines: { t: string; v: string }[] = [];
    for (const m of extras) {
      const pr = EXTRA_PRICES[m.id];
      if (!pr) continue;
      if (pr.monthly) monthly += pr.monthly;
      if (pr.once) once += pr.once;
      if (pr.perVisit) { yearly += pr.perVisit; visits += 1; }
      lines.push({ t: m.title, v: pr.label });
    }
    const travel = tr.state === "request" ? null : pkgKey === "enterprise" ? 0 : tr.state === "fee" ? tr.fee * visits : 0;
    if (travel) yearly += travel;
    const firstYear = monthly * 12 + once + yearly;
    return { base, monthly, once, yearly, visits, travel, firstYear, lines, tr };
  }, [extras, pkg, pkgKey, tier, km]);

  const message = `Ich möchte das Paket ${pkg.name} (${calc.base.label}) mit allen gesetzlichen Pflichten anfragen. Im Paket zusätzlich enthalten: ${included.filter((m) => m.group === "extra").map((m) => m.title).join(", ") || "nichts"}. Zusätzlich gewählt: ${extras.map((m) => m.title).join(", ") || "keine Zusätze"}. Entfernung: ${km === null ? "noch nicht berechnet" : `${km} km (PLZ ${plz})`}. Berechnet: ${eur(calc.monthly)} pro Monat und ${eur(calc.once)} einmalig, netto${calc.travel === null ? ", Anfahrt auf Anfrage" : ""}.`;
  const href = `/kontakt?kategorie=safety&nachricht=${encodeURIComponent(message)}`;

  const chip = (m: Mod) => {
    const locked = isLocked(m, pkgKey);
    const off = isUnavailable(m, pkgKey);
    const on = locked || sel.includes(m.id);
    const price = EXTRA_PRICES[m.id]?.label;
    const more = locked && m.group === "extra" && (pkgKey === "enterprise" || (pkgKey === "betreuung" && (m.inPkg === "betreuung" || m.onlyPkg === "betreuung")));
    return (
      <button
        key={m.id}
        type="button"
        aria-pressed={on}
        onClick={() => toggle(m)}
        disabled={locked || off}
        className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition duration-300 ${
          off ? "border-dashed border-slate-200 bg-slate-50/60 opacity-70"
          : on ? `border-[#1d4ed8]/40 bg-[#1d4ed8]/5 shadow-sm ${locked ? "cursor-default" : ""}` : "border-slate-200 bg-white hover:border-slate-300"
        }`}
      >
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition duration-300 ${on ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"}`}>
          {on ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : off ? <Lock className="h-3 w-3" aria-hidden="true" /> : <Plus className="h-3.5 w-3.5" aria-hidden="true" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-900">{m.title}</span>
          <span className="block text-xs text-slate-500">{off ? "Nur im Paket Betreuung" : locked ? m.hint : price}</span>
        </span>
        {!locked && m.recommended && <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">Empfohlen</span>}
        {more && <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">{pkgKey === "enterprise" ? "mehr Umfang" : "mehr als Start"}</span>}
        {locked && !more && <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-label="im Paket enthalten" />}
      </button>
    );
  };

  const chipWithWhy = (m: Mod) => {
    const open = !isLocked(m, pkgKey) && sel.includes(m.id) && WHY[m.id];
    return (
      <div key={m.id} className="flex flex-col">
        {chip(m)}
        {open && (
          <p className="mx-1 mt-1.5 rounded-xl bg-blue-50/70 px-3.5 py-2.5 text-xs leading-relaxed text-slate-700 ring-1 ring-blue-100">
            <span className="font-semibold text-[#2B4066]">Warum das wichtig sein kann: </span>{WHY[m.id]}
          </p>
        )}
      </div>
    );
  };

  const row = (t: string, v: string, strong = false) => (
    <div className={`flex items-baseline justify-between gap-3 py-1.5 text-sm ${strong ? "font-semibold text-white" : "text-white/75"}`}>
      <span>{t}</span><span className="shrink-0 tabular-nums">{v}</span>
    </div>
  );

  const extraList = MODULES.filter((m) => !isLocked(m, pkgKey));
  const visitsText = pkg.visits === 1 ? "1 Begehung" : `${pkg.visits} Begehungen`;

  return (
    <div>
      {/* Im Paket enthalten: alles in einem grünen Rahmen */}
      <div className="overflow-hidden rounded-3xl border-2 border-emerald-400/70 bg-emerald-50/40 shadow-[0_20px_60px_-45px_rgba(5,150,105,0.5)]">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-3.5 text-white">
          <span className="flex items-center gap-2 text-base font-semibold">
            <Check className="h-5 w-5" aria-hidden="true" /> Im Paket {pkg.name} enthalten: Ihr gesetzlicher Rahmen
          </span>
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">{pkgKey === "enterprise" ? `${included.length} Leistungen, Begehungen nach Bedarf` : `${included.length} Leistungen + ${visitsText} pro Jahr`}</span>
        </div>
        <div className="grid gap-2.5 p-5 sm:grid-cols-2 lg:grid-cols-3">{included.map(chip)}</div>
        {pkgKey === "enterprise" && <p className="border-t border-emerald-200/70 px-5 py-3 text-xs text-slate-600">Fair-Use: ein Standort, Erfassung von bis zu 50 Maschinen und Geräten sowie 30 Gefahrstoffen, Begehungen und Unterweisungen vor Ort in angemessenem Umfang, Anfahrt bis 150 km inklusive. Die genauen Grenzen regelt der Vertrag.</p>}
      </div>

      {/* Zusätzlich buchbar */}
      {pkgKey !== "enterprise" && <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3.5">
          <span className="flex items-center gap-2 text-base font-semibold text-[#2B4066]"><Plus className="h-5 w-5 text-[#1d4ed8]" aria-hidden="true" /> Zusätzlich buchbar, nur wenn Sie es brauchen</span>
          <span className="text-xs font-semibold text-slate-500">{extras.length === 0 ? "Nichts gewählt" : `${extras.length} gewählt`}</span>
        </div>
        <div className="grid gap-2.5 p-5 sm:grid-cols-2 lg:grid-cols-3">{extraList.map(chipWithWhy)}</div>
      </div>}

      {/* Schritt 4 */}
      <div className="mt-12">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#16294d] text-sm font-semibold text-white">4</span>
          <h2 className="text-lg font-semibold text-[#2B4066]">Ihr Preis und Ihre Anfrage</h2>
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-blue-900/40 bg-gradient-to-br from-[#16294d] to-[#0b1730] p-6 text-white shadow-[0_30px_70px_-35px_rgba(11,23,48,0.85)] sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Ihr Paket {pkg.name}</p>
              <div className="mt-3 divide-y divide-white/10">
                {row(`Paket ${pkg.name}, monatlich`, eur(calc.base.monthly))}
                {row("Ersteinrichtung, einmalig", eur(pkg.setup))}
                {calc.lines.map((l) => row(l.t, l.v))}
                {pkgKey === "enterprise" && calc.travel !== null ? row(km !== null ? `Anfahrt (${km} km)` : "Anfahrt", "inklusive") : calc.tr.state === "unknown" ? row("Anfahrt", "nach PLZ in Schritt 2") : calc.travel === null ? row("Anfahrt", "auf Anfrage") : calc.travel > 0 ? row(`Anfahrt (${calc.visits} Termin${calc.visits === 1 ? "" : "e"}/Jahr)`, `${eur(calc.travel)} / Jahr`) : row(`Anfahrt (${calc.tr.state === "included" ? calc.tr.km : 0} km)`, "inklusive")}
              </div>
              <p className="mt-3 text-xs text-white/60">
                {pkgKey === "betreuung" ? `Preis für 11 bis 25 Beschäftigte, ab 26 Beschäftigten ${eur(pkg.tiers[pkg.tiers.length - 1].monthly)} pro Monat. ` : ""}Alle Preise netto zuzüglich Umsatzsteuer.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
              <p className="text-sm text-white/70">Ihr Preis</p>
              <p className="mt-1 text-4xl font-semibold tracking-tight">{eur(calc.monthly)}<span className="ml-1.5 text-base font-medium text-white/70">pro Monat</span></p>
              <p className="mt-1 text-sm text-white/70">
                plus {eur(calc.once)} einmalig{calc.yearly > 0 ? `, ${eur(calc.yearly)} jährlich` : ""}
              </p>
              <p className="mt-1 text-xs text-white/55">Im ersten Jahr insgesamt {eur(calc.firstYear)}{calc.travel === null ? " zuzüglich Anfahrt" : ""}, netto.</p>
              {!ready && (
                <p role="alert" className="mt-5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700">
                  Bitte zuerst Schritt 2 ausfüllen: Postleitzahl Ihres Betriebs eingeben.
                </p>
              )}
              <Link
                href={ready ? href : "#schritt-2"}
                onClick={(e) => { if (!ready) { e.preventDefault(); onBlocked(); } }}
                aria-disabled={!ready}
                className="group mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 py-4 text-base font-semibold !text-emerald-950 shadow-[0_18px_34px_-16px_rgba(16,185,129,0.8)] transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-300"
              >
                Jetzt Paket anfragen und rechtliche Mindestanforderungen einhalten
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <ul className="mt-4 space-y-1.5 text-xs text-white/80">
                {["Unverbindlich und kostenlos anfragen", "Festpreis bestätigen wir im Erstgespräch", "Alle gesetzlichen Pflichten abgedeckt"].map((t) => (
                  <li key={t} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden="true" />{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
