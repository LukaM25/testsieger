"use client";

import { Leaf, Recycle, Package, Sun, ShieldCheck, TrendingDown, Award, Sprout } from "lucide-react";
import { stagger } from "@/lib/animation";
import { useLocale } from "@/components/LocaleProvider";

// Symbole im Fußabdruck (Position in Prozent der Fläche)
const floaters = [
  { Icon: Recycle, x: 38, y: 36, d: 0 },
  { Icon: Package, x: 62, y: 38, d: 0.8 },
  { Icon: Sun, x: 36, y: 68, d: 1.6 },
  { Icon: Leaf, x: 64, y: 70, d: 2.4 },
  { Icon: Sprout, x: 50, y: 83, d: 3.2 },
];

export default function Nachhaltigkeit() {
  const { locale } = useLocale();
  const tr = (de: string, en: string) => (locale === "en" ? en : de);

  const points = [
    {
      Icon: ShieldCheck,
      title: tr("Heben Sie sich von der Masse ab", "Stand out from the crowd"),
      text: tr("mit einem unabhängigen Prüfsiegel, dem Verbraucher vertrauen.", "with an independent test seal that consumers trust."),
    },
    {
      Icon: Leaf,
      title: tr("Zeigen Sie Verantwortung", "Show responsibility"),
      text: tr(
        "für Qualität, Langlebigkeit und einen bewussten Umgang mit Ressourcen.",
        "for quality, durability and a conscious use of resources."
      ),
    },
    {
      Icon: TrendingDown,
      title: tr("Senken Sie CO₂ aktiv", "Actively reduce CO₂"),
      text: tr(
        "indem Sie langlebige Produkte fördern und unnötige Ersatzkäufe reduzieren.",
        "by promoting durable products and reducing unnecessary replacement purchases."
      ),
    },
  ];

  return (
    <section data-animate="section" className="px-6 py-16 sm:py-24" aria-labelledby="nachhaltig-title">
      <div className="mx-auto grid max-w-6xl items-center gap-14 md:grid-cols-[0.85fr_1.15fr]">
        {/* Fußabdruck */}
        <div className="relative mx-auto aspect-[3/5] w-full max-w-[300px]">
          <div className="seal-glow pointer-events-none absolute inset-0 rounded-full bg-emerald-200/30 blur-3xl" />
          <svg viewBox="0 0 300 500" className="relative h-full w-full" fill="none" role="img" aria-label={tr("Fußabdruck mit CO₂", "Footprint with CO₂")}>
            <defs>
              <linearGradient id="fuss-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#d1fae5" />
                <stop offset="55%" stopColor="#e0f2fe" />
                <stop offset="100%" stopColor="#bae6fd" />
              </linearGradient>
            </defs>
            <g fill="url(#fuss-grad)" stroke="#34d399" strokeOpacity="0.55" strokeWidth="3">
              <path d="M150 140 C100 140 70 190 70 250 C70 310 95 340 100 380 C105 420 90 450 110 475 C130 495 175 495 195 470 C215 445 200 410 210 370 C220 330 235 300 235 250 C235 190 200 140 150 140Z" />
              <circle className="fuss-toe" style={{ animationDelay: "0s" }} cx="80" cy="105" r="32" />
              <circle className="fuss-toe" style={{ animationDelay: "0.25s" }} cx="136" cy="78" r="24" />
              <circle className="fuss-toe" style={{ animationDelay: "0.5s" }} cx="178" cy="82" r="21" />
              <circle className="fuss-toe" style={{ animationDelay: "0.75s" }} cx="212" cy="102" r="19" />
              <circle className="fuss-toe" style={{ animationDelay: "1s" }} cx="235" cy="135" r="16" />
            </g>
            <text x="150" y="262" textAnchor="middle" fontSize="64" fontWeight="700" fill="#2B4066" style={{ fontFamily: "inherit" }}>
              CO<tspan fontSize="30" dy="12">2</tspan>
            </text>
          </svg>
          {floaters.map(({ Icon, x, y, d }, i) => (
            <span
              key={i}
              className="vorteil-bob absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-emerald-600 shadow-md ring-1 ring-emerald-100"
              style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}s` }}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
          ))}
        </div>

        {/* Aussage */}
        <div>
          <span className="eyebrow !text-emerald-700/80">{tr("Nachhaltig entscheiden", "Decide sustainably")}</span>
          <h2 id="nachhaltig-title" className="section-title">
            {tr("Wer ", "Whoever buys ")}
            <span className="text-emerald-700">{tr("hochwertige, langlebige Produkte", "high-quality, durable products")}</span>
            {tr(
              " kauft, verbraucht langfristig weniger Ressourcen und vermeidet unnötige Ersatzkäufe.",
              " uses fewer resources in the long run and avoids unnecessary replacement purchases."
            )}
          </h2>
          <p className="lead mt-5">
            {tr("Lassen Sie Ihr Produkt teilhaben – werden Sie ein Teil davon.", "Let your product take part – become part of it.")}
          </p>

          <ul className="mt-8 space-y-5">
            {points.map(({ Icon, title, text }, i) => (
              <li key={title} data-animate="card" style={stagger(i)} className="group flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-sky-50 text-emerald-600 ring-1 ring-emerald-100 transition duration-500 group-hover:-translate-y-0.5 group-hover:rotate-3 group-hover:shadow-md">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-lg font-semibold text-[#2B4066]">{title}</p>
                  <p className="body-text">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <div data-animate="card" style={stagger(3)} className="mt-8 flex items-start gap-3 border-l-2 border-emerald-300/70 pl-4">
            <Package className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
            <p className="body-text text-sm">
              {tr(
                "Im Sinne der Umwelt verzichten wir bewusst auf die Rücksendung eingesandter Testprodukte. So vermeiden wir zusätzlichen Verpackungsmüll und unnötige CO₂-Emissionen durch Hin- und Rückversand.",
                "For the environment, we deliberately do not return submitted test products. This avoids extra packaging waste and unnecessary CO₂ emissions from shipping back and forth."
              )}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-medium text-[#2B4066]">
            <span className="inline-flex items-center gap-2">
              <Sprout className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              {tr("Für Menschen. Für Produkte. Für unseren Planeten.", "For people. For products. For our planet.")}
            </span>
            <span className="inline-flex items-center gap-2">
              <Award className="h-5 w-5 text-sky-600" aria-hidden="true" />
              {tr("Geprüfte Qualität für eine nachhaltige Entscheidung.", "Tested quality for a sustainable decision.")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
