import { BadgeCheck, Building2, Scale, ShieldCheck } from "lucide-react";

const LAW = ["Arbeitsschutzgesetz (ArbSchG)", "Arbeitssicherheitsgesetz (ASiG)", "DGUV Vorschrift 2", "Arbeitsstättenverordnung"];
const RESULT = ["Pflichten erfüllt", "Alles nachweisbar dokumentiert", "Keine Frist verpasst"];

/** Schnittstelle zwischen Gesetz und Betrieb. Reines CSS, respektiert reduzierte Bewegung. */
export default function AsBridgeGraphic() {
  return (
    <section className="mt-12 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_-45px_rgba(43,64,102,0.35)] sm:p-8">
      <style>{`
        .br-line{position:relative;height:2px;overflow:hidden;background:repeating-linear-gradient(90deg,rgba(29,78,216,.35) 0 6px,transparent 6px 12px)}
        .br-line::after{content:"";position:absolute;top:-2px;left:-30%;width:30%;height:6px;border-radius:9999px;background:linear-gradient(90deg,transparent,rgba(16,185,129,.9),transparent);animation:br-run 2.4s linear infinite}
        @keyframes br-run{to{left:100%}}
        .br-pulse{animation:br-pulse 3.2s ease-in-out infinite}
        @keyframes br-pulse{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.35)}50%{box-shadow:0 0 0 14px rgba(16,185,129,0)}}
        @media (prefers-reduced-motion:reduce){.br-line::after,.br-pulse{animation:none!important}}
      `}</style>
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Warum Sie mit uns sicher sind</p>
      <h3 className="mt-2 text-center text-xl font-semibold tracking-tight text-[#2B4066] sm:text-2xl">Wir sind die Schnittstelle zwischen Gesetz und Ihrem Betrieb</h3>

      <div className="mt-8 grid items-center gap-5 md:grid-cols-[1fr_60px_1fr_60px_1fr]">
        <div className="rounded-2xl bg-slate-50 p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d4ed8]/10 text-[#1d4ed8]"><Scale className="h-5 w-5" aria-hidden="true" /></span>
          <p className="mt-3 font-semibold text-slate-900">Das verlangt das Gesetz</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">{LAW.map((l) => <li key={l}>{l}</li>)}</ul>
        </div>

        <div className="br-line hidden md:block" aria-hidden="true" />

        <div className="br-pulse rounded-2xl bg-gradient-to-b from-[#16294d] to-[#0b1730] p-5 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-300"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span>
          <p className="mt-3 font-semibold">Wir setzen es für Sie um</p>
          <p className="mt-2 text-sm text-white/75">Wir übersetzen die Vorschriften in klare Aufgaben, erledigen sie mit Ihnen und halten die Fristen im Dashboard im Blick.</p>
        </div>

        <div className="br-line hidden md:block" aria-hidden="true" />

        <div className="rounded-2xl bg-emerald-50 p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><Building2 className="h-5 w-5" aria-hidden="true" /></span>
          <p className="mt-3 font-semibold text-slate-900">Ihr Betrieb ist auf der sicheren Seite</p>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
            {RESULT.map((r) => (
              <li key={r} className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />{r}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-slate-500">Die rechtliche Verantwortung bleibt beim Arbeitgeber. Wir sorgen dafür, dass er sie sauber und nachweisbar erfüllen kann.</p>
    </section>
  );
}
