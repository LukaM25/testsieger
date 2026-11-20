"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Award, Package, ShieldCheck, TrendingUp } from "lucide-react";
import MarketplaceLogos from "@/components/MarketplaceLogos";
import { useLocale } from "@/components/LocaleProvider";

export default function WarumSeller({ onCta }: { onCta?: (e: React.MouseEvent) => void }) {
  const { locale } = useLocale();
  const tr = (de: string, en: string) => (locale === "en" ? en : de);
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const points = [
    { Icon: TrendingUp, title: tr("Mehr Verkäufe", "More sales"), text: tr("Werden Sie zum Bestseller.", "Become the bestseller.") },
    { Icon: ShieldCheck, title: tr("Mehr Vertrauen", "More trust"), text: tr("Keine Kunden an die Konkurrenz verlieren.", "Stop losing customers to competitors.") },
    { Icon: Award, title: tr("Qualität sichtbar", "Quality made visible"), text: tr("Zeigen Sie, was in Ihrem Produkt steckt.", "Show what your product is made of.") },
  ];

  return (
    <section data-animate="section" className="px-6 py-16 sm:py-24" aria-labelledby="warum-title">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="eyebrow">{tr("Für E-Commerce-Seller", "For e-commerce sellers")}</span>
          <h2 id="warum-title" className="section-title">
            {tr("Sichtbares Vertrauen entscheidet.", "Visible trust decides.")}
          </h2>
          <p className="lead mx-auto mt-4 max-w-xl">
            {tr(
              "Kunden vergleichen Dutzende ähnliche Produkte in Sekunden. Ein unabhängiges Siegel gibt den Ausschlag.",
              "Customers compare dozens of similar products in seconds. An independent seal tips the balance."
            )}
          </p>
        </div>

        {/* Vorher / Nachher */}
        <div ref={ref} className="mx-auto mt-14 grid max-w-3xl items-center gap-6 sm:grid-cols-2 sm:gap-10">
          <div
            className={`relative rounded-3xl border border-slate-200 bg-white p-6 text-center transition-all duration-1000 ${
              visible ? "opacity-60 grayscale" : "opacity-100"
            }`}
          >
            <span className="absolute left-4 top-4 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {tr("Ohne Siegel", "Without seal")}
            </span>
            <div className="mx-auto mt-8 flex h-40 w-40 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
              <Package className="h-20 w-20" aria-hidden="true" />
            </div>
            <p className="mt-5 text-sm text-slate-500">{tr("Ein Produkt unter vielen.", "One product among many.")}</p>
          </div>

          <div
            className={`relative rounded-3xl border bg-white p-6 text-center transition-all duration-1000 ${
              visible
                ? "-translate-y-1 border-sky-200 shadow-[0_30px_70px_-35px_rgba(30,58,138,0.55)] sm:scale-[1.05]"
                : "border-slate-200 shadow-none"
            }`}
          >
            <span className="absolute left-4 top-4 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
              {tr("Mit Siegel", "With seal")}
            </span>
            <div className="relative mx-auto mt-8 flex h-40 w-40 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 text-sky-700">
              <Package className="h-20 w-20" aria-hidden="true" />
              <div className={`absolute -bottom-4 -right-6 h-24 w-[4.7rem] ${visible ? "siegel-stamp" : "opacity-0"}`}>
                <div className="seal-float relative h-full w-full">
                  <Image src="/siegel19.png" alt={tr("DPI Prüfsiegel", "DPI test seal")} fill sizes="80px" className="object-contain drop-shadow-xl" />
                </div>
              </div>
            </div>
            <p className="mt-5 text-sm font-semibold text-[#2B4066]">{tr("Geprüft. Das Produkt, das gekauft wird.", "Tested. The product that gets bought.")}</p>
          </div>
        </div>

        {/* 3 Punkte */}
        <ul className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
          {points.map(({ Icon, title, text }, i) => (
            <li
              key={title}
              style={{ transitionDelay: `${300 + i * 150}ms` }}
              className={`group text-center transition-all duration-700 ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
            >
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 text-sky-700 ring-1 ring-sky-100 transition duration-500 group-hover:-translate-y-1 group-hover:rotate-3">
                <Icon className="h-7 w-7" aria-hidden="true" />
              </span>
              <p className="mt-4 text-lg font-semibold text-[#2B4066]">{title}</p>
              <p className="body-text text-sm">{text}</p>
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-12 w-full max-w-4xl px-2 sm:px-10">
          <MarketplaceLogos className="w-full !flex-nowrap justify-between" label={tr("Unterstützte Verkaufskanäle", "Supported sales channels")} />
        </div>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={onCta}
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full px-9 py-4 text-base font-semibold text-white shadow-[0_18px_40px_-18px_rgba(30,58,138,0.7)] transition duration-300 hover:-translate-y-0.5"
            style={{ backgroundImage: "linear-gradient(90deg, #1E3A8A 0%, #2B4066 100%)" }}
          >
            <span aria-hidden className="cta-shimmer pointer-events-none absolute inset-0" />
            <span className="relative">{tr("Heben Sie Ihr Produkt aus der Masse ab", "Make your product stand out")}</span>
            <ArrowRight className="relative h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
