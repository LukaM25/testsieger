import { BadgeCheck, Check } from 'lucide-react';

const CARD =
  'group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 shadow-[0_20px_60px_-45px_rgba(43,64,102,0.35)] transition duration-500 hover:-translate-y-1.5 hover:border-[#1d4ed8]/40 hover:shadow-[0_30px_70px_-40px_rgba(29,78,216,0.45)]';

function SealArt() {
  return (
    <svg viewBox="0 0 200 120" className="h-28 w-full" fill="none" aria-hidden="true">
      <circle className="ac-ring" cx="100" cy="60" r="34" stroke="#1d4ed8" strokeOpacity=".25" />
      <circle className="ac-ring" style={{ animationDelay: '1.4s' }} cx="100" cy="60" r="34" stroke="#1d4ed8" strokeOpacity=".25" />
      <g className="ac-float">
        <path d="M100 22l12 6 13-2 7 11 12 5-1 13 6 11-8 10 0 13-12 4-9 10-12-5-12 5-9-10-12-4 0-13-8-10 6-11-1-13 12-5 7-11 13 2 12-6Z" transform="translate(0 -4) scale(.78) translate(28 10)" fill="#1d4ed8" />
        <path className="ac-tick" d="M80 60l14 14 27-30" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {[[34, 30], [168, 38], [150, 98], [44, 92]].map(([x, y], i) => (
        <circle key={i} className="ac-spark" style={{ animationDelay: `${i * 0.6}s` }} cx={x} cy={y} r="3" fill="#1d4ed8" fillOpacity=".4" />
      ))}
    </svg>
  );
}

function ShieldArt() {
  return (
    <svg viewBox="0 0 200 120" className="h-28 w-full" fill="none" aria-hidden="true">
      <circle className="ac-ring" cx="100" cy="60" r="34" stroke="#059669" strokeOpacity=".3" />
      <circle className="ac-ring" style={{ animationDelay: '1.4s' }} cx="100" cy="60" r="34" stroke="#059669" strokeOpacity=".3" />
      <g className="ac-float">
        <path d="M100 18 134 30v26c0 22-14 36-34 45C80 92 66 78 66 56V30L100 18Z" fill="#059669" />
        <path d="M100 26 126 35v21c0 17-10 28-26 36-16-8-26-19-26-36V35l26-9Z" fill="#052e1f" fillOpacity=".25" />
        <path className="ac-tick" d="M85 58l11 11 21-24" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {[[34, 40], [164, 30], [156, 92], [40, 90]].map(([x, y], i) => (
        <circle key={i} className="ac-spark" style={{ animationDelay: `${i * 0.6}s` }} cx={x} cy={y} r="3" fill="#059669" fillOpacity=".4" />
      ))}
    </svg>
  );
}

const PRODUKT = ['Unabhängiger Produkttest nach festem Prüfsystem', 'Prüfbericht mit nachvollziehbarer Gesamtnote', 'Prüfsiegel für Ihr Amazon-Listing'];
const SAFETY = ['Gesetzlicher Mindestrahmen, Pflichten und Fristen im Blick', 'Digitales Dashboard und Dokumentenmappe', 'Betreut von einer Fachkraft für Arbeitssicherheit'];

export default function AreaChooser() {
  return (
    <main className="relative flex min-h-[80vh] items-center overflow-hidden bg-slate-50 px-4 py-16">
      <style>{`
        .ac-ring{transform-origin:100px 60px;animation:ac-ring 4s ease-out infinite}
        @keyframes ac-ring{0%{transform:scale(.8);opacity:.9}100%{transform:scale(2.3);opacity:0}}
        .ac-float{animation:ac-float 5s ease-in-out infinite}
        @keyframes ac-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        .ac-tick{stroke-dasharray:80;stroke-dashoffset:80;animation:ac-draw 1s .4s ease-out forwards}
        @keyframes ac-draw{to{stroke-dashoffset:0}}
        .ac-spark{animation:ac-spark 3s ease-in-out infinite}
        @keyframes ac-spark{0%,100%{opacity:.2;transform:translateY(0)}50%{opacity:1;transform:translateY(-6px)}}
        .ac-in{opacity:0;transform:translateY(14px);animation:ac-in .7s ease-out forwards}
        @keyframes ac-in{to{opacity:1;transform:none}}
        @media (prefers-reduced-motion:reduce){.ac-ring,.ac-float,.ac-spark,.ac-in{animation:none!important;opacity:1!important;transform:none!important}.ac-tick{animation:none!important;stroke-dashoffset:0!important}}
      `}</style>
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />

      <div className="relative mx-auto w-full max-w-5xl">
        <p className="ac-in text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Deutsches Prüfsiegel Institut</p>
        <h1 className="ac-in mt-3 text-center text-3xl font-semibold tracking-tight text-[#2B4066] sm:text-4xl" style={{ animationDelay: '.1s' }}>Wofür sind Sie hier?</h1>
        <p className="ac-in mx-auto mt-3 max-w-xl text-center text-slate-600" style={{ animationDelay: '.2s' }}>Wählen Sie Ihren Bereich. Die Seite zeigt Ihnen danach nur, was dazu gehört.</p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <a href="/api/area?set=produkttest" className={`${CARD} ac-in`} style={{ animationDelay: '.3s' }}>
            <SealArt />
            <h2 className="mt-4 text-xl font-semibold text-[#2B4066]">Produkttest &amp; Prüfsiegel</h2>
            <p className="mt-1.5 text-sm text-slate-600">Für Amazon-Seller, Hersteller und Händler.</p>
            <ul className="mt-5 flex-1 space-y-2.5 text-sm text-slate-700">
              {PRODUKT.map((t) => (
                <li key={t} className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1d4ed8]" aria-hidden="true" />{t}</li>
              ))}
            </ul>
            <span className="mt-7 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#16294d] px-6 py-3 text-sm font-semibold !text-white shadow-[0_14px_28px_-16px_rgba(29,78,216,0.7)] transition duration-300 group-hover:brightness-110">
              Zum Produkttest →
            </span>
          </a>

          <a href="/api/area?set=arbeitssicherheit" className={`${CARD} ac-in`} style={{ animationDelay: '.4s' }}>
            <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Fachkraft für Arbeitssicherheit
            </span>
            <ShieldArt />
            <h2 className="mt-4 text-xl font-semibold text-[#2B4066]">Arbeitssicherheit</h2>
            <p className="mt-1.5 text-sm text-slate-600">Für Betriebe mit Beschäftigten, vom Handwerk bis zur kleinen Produktion.</p>
            <ul className="mt-5 flex-1 space-y-2.5 text-sm text-slate-700">
              {SAFETY.map((t) => (
                <li key={t} className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />{t}</li>
              ))}
            </ul>
            <span className="mt-7 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-emerald-800 px-6 py-3 text-sm font-semibold !text-white shadow-[0_14px_28px_-16px_rgba(5,150,105,0.7)] transition duration-300 group-hover:brightness-110">
              Zur Arbeitssicherheit →
            </span>
          </a>
        </div>
      </div>
    </main>
  );
}
