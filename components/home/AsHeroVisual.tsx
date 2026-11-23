"use client";

// Links und rechts je drei Pflichten, y-Mitte in px (Container 380 x 300)
const LEFT = [
  { t: "Gefährdungs­beurteilung", y: 44 },
  { t: "Unterweisung", y: 150 },
  { t: "Fachkraft für Arbeits­sicherheit", y: 256 },
];
const RIGHT = [
  { t: "Betriebsarzt", y: 44 },
  { t: "Erste Hilfe", y: 150 },
  { t: "Brandschutz", y: 256 },
];

/** Schutzschild in der Mitte, die sechs gesetzlichen Pflichten rundherum. Reines CSS, respektiert reduzierte Bewegung. */
export default function AsHeroVisual() {
  return (
    <div className="as-hero mx-auto hidden w-[380px] md:block"
      style={{ zoom: 1.15 }}>
      <style>{`
        .as-hero .stage{position:relative;height:300px}
        .as-hero .ring{position:absolute;left:50%;top:50%;width:110px;height:110px;margin:-55px 0 0 -55px;border-radius:9999px;border:1px solid rgba(52,211,153,.45);animation:as-ring 3.6s ease-out infinite}
        .as-hero .ring:nth-of-type(2){animation-delay:1.2s}.as-hero .ring:nth-of-type(3){animation-delay:2.4s}
        @keyframes as-ring{0%{transform:scale(.7);opacity:.8}100%{transform:scale(1.9);opacity:0}}
        .as-hero .shield{position:absolute;left:50%;top:50%;margin:-52px 0 0 -52px;animation:as-float 5s ease-in-out infinite;filter:drop-shadow(0 18px 30px rgba(16,185,129,.35))}
        @keyframes as-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .as-hero .tick{stroke-dasharray:90;stroke-dashoffset:90;animation:as-draw 1s .4s ease-out forwards}
        @keyframes as-draw{to{stroke-dashoffset:0}}
        .as-hero .line{stroke:rgba(52,211,153,.55);stroke-width:1.2;stroke-dasharray:4 5;animation:as-dash 1.6s linear infinite;opacity:0;animation-fill-mode:both}
        @keyframes as-dash{to{stroke-dashoffset:-18}}
        .as-hero .item{position:absolute;width:122px;margin-top:-20px;opacity:0;transform:scale(.92);animation:as-in .55s ease-out forwards}
        @keyframes as-in{to{opacity:1;transform:none}}
        .as-hero .dot{transform:scale(0);animation:as-pop .4s ease-out forwards}
        @keyframes as-pop{60%{transform:scale(1.25)}100%{transform:scale(1)}}
        @media (prefers-reduced-motion:reduce){.as-hero *{animation:none!important;opacity:1!important;transform:none!important;stroke-dashoffset:0!important}}
      `}</style>

      <div className="stage" aria-hidden="true">
        <span className="ring" /><span className="ring" /><span className="ring" />
        <svg className="absolute inset-0" width="380" height="300" viewBox="0 0 380 300" fill="none">
          {LEFT.map((c, i) => (
            <path key={c.t} className="line" d={`M 130 ${c.y} Q 160 ${c.y} 150 150`} style={{ animationDelay: `${0.9 + i * 0.3}s, 0s`, opacity: 1 }} />
          ))}
          {RIGHT.map((c, i) => (
            <path key={c.t} className="line" d={`M 250 ${c.y} Q 220 ${c.y} 230 150`} style={{ animationDelay: `${1.05 + i * 0.3}s, 0s`, opacity: 1 }} />
          ))}
        </svg>
        <svg className="shield" width="104" height="104" viewBox="0 0 220 220" fill="none">
          <defs>
            <linearGradient id="as-g" x1="40" y1="20" x2="180" y2="200" gradientUnits="userSpaceOnUse">
              <stop stopColor="#34d399" /><stop offset="1" stopColor="#047857" />
            </linearGradient>
          </defs>
          <path d="M110 14 188 42v58c0 50-32 82-78 102C64 182 32 150 32 100V42L110 14Z" fill="url(#as-g)" />
          <path d="M110 30 174 52v48c0 41-26 67-64 84-38-17-64-43-64-84V52l64-22Z" fill="#0b1730" fillOpacity=".35" />
          <path className="tick" d="M76 108l24 24 46-52" stroke="#fff" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {[...LEFT.map((c) => ({ ...c, side: "left" as const })), ...RIGHT.map((c) => ({ ...c, side: "right" as const }))].map((c, i) => (
          <div
            key={c.t}
            className="item flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-2.5 py-2 text-[11px] font-medium leading-tight text-white backdrop-blur"
            style={{ top: c.y, [c.side]: 0, animationDelay: `${0.7 + i * 0.25}s` }}
          >
            <span className="dot flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-400" style={{ animationDelay: `${1 + i * 0.25}s` }}>
              <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5.2l2 2 4-4.4" stroke="#052e1f" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            {c.t}
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-xs leading-relaxed text-slate-300">
        <span className="as-shine font-semibold">Rechtlicher Mindestrahmen:</span> Diese sechs Pflichten verlangt der Gesetzgeber. Wir halten sie für Sie ein, mit allen Fristen.
      </p>
    </div>
  );
}
