import { ClipboardCheck, Footprints, Handshake, ShieldCheck, type LucideIcon } from "lucide-react";

const STEPS: { Icon: LucideIcon; title: string; body: string }[] = [
  { Icon: Handshake, title: "Erstgespräch", body: "Kostenlos und unverbindlich. Wir klären Betriebsgröße, Branche und was schon da ist." },
  { Icon: Footprints, title: "Begehung", body: "Wir sehen uns Ihren Betrieb vor Ort an und nehmen den Ist-Zustand auf." },
  { Icon: ClipboardCheck, title: "Maßnahmen", body: "Sie bekommen eine klare Liste: was Pflicht ist, was sinnvoll ist, was Zeit hat." },
  { Icon: ShieldCheck, title: "Betreuung", body: "Wir bleiben Ihr Ansprechpartner, halten Unterlagen aktuell und sind erreichbar." },
];

/** Moderner Ablauf als Zeitleiste mit Icon-Knoten statt Kacheln. Reines CSS. */
export default function AsProcess() {
  return (
    <div className="as-proc relative mt-12">
      <style>{`
        .as-proc .track{position:absolute;left:0;right:0;top:35px;height:2px;background:linear-gradient(90deg,transparent,rgba(148,163,184,.45) 8%,rgba(148,163,184,.45) 92%,transparent)}
        .as-proc .fill{position:absolute;left:12.5%;top:35px;height:2px;width:0;background:linear-gradient(90deg,#1d4ed8,#10b981);border-radius:9999px;animation:pr-fill 2.4s .3s ease-out forwards}
        @keyframes pr-fill{to{width:75%}}
        .as-proc .node{animation:pr-in .6s ease-out both}
        @keyframes pr-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        .as-proc .ico{transition:transform .4s ease,box-shadow .4s ease}
        .as-proc .step:hover .ico{transform:translateY(-4px) scale(1.06);box-shadow:0 18px 30px -14px rgba(29,78,216,.5)}
        .as-proc .halo{animation:pr-halo 3.6s ease-in-out infinite}
        @keyframes pr-halo{0%,100%{opacity:.35;transform:scale(1)}50%{opacity:.8;transform:scale(1.18)}}
        @media (prefers-reduced-motion:reduce){.as-proc .fill{animation:none;width:75%}.as-proc .node,.as-proc .halo{animation:none!important}}
      `}</style>
      <div className="track hidden lg:block" aria-hidden="true" />
      <div className="fill hidden lg:block" aria-hidden="true" />
      <ol className="relative grid gap-10 lg:grid-cols-4 lg:gap-6">
        {STEPS.map(({ Icon, title, body }, i) => (
          <li key={title} className="step node relative flex gap-5 lg:flex-col lg:items-center lg:text-center" style={{ animationDelay: `${0.15 + i * 0.18}s` }}>
            <div className="relative shrink-0">
              <span className="halo absolute inset-0 -m-2 rounded-full bg-[#1d4ed8]/15 blur-md" aria-hidden="true" />
              <span className="ico relative flex h-[70px] w-[70px] items-center justify-center rounded-full border border-slate-200 bg-white text-[#1d4ed8] shadow-[0_14px_30px_-18px_rgba(43,64,102,0.5)]">
                <Icon className="h-7 w-7" strokeWidth={1.6} aria-hidden="true" />
              </span>
              <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#16294d] text-[11px] font-semibold text-white ring-2 ring-white">{i + 1}</span>
            </div>
            <div className="lg:mt-5">
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="mt-1.5 max-w-[260px] text-sm leading-relaxed text-slate-600 lg:mx-auto">{body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
