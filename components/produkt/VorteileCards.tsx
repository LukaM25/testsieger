"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

const advantages = [
  {
    src: "/images/iconen/sichtbarkeit.png",
    label: { de: "Erhöht Sichtbarkeit", en: "Increases visibility" },
    text: {
      de: "Das Siegel fällt im Angebot sofort auf und schafft Aufmerksamkeit.",
      en: "The seal stands out in your listing and draws attention right away.",
    },
  },
  {
    src: "/images/iconen/conversion.png",
    label: { de: "Steigert Conversion Rate", en: "Boosts conversion rate" },
    text: {
      de: "Geprüfte Qualität gibt Käufern den letzten Anstoß zur Kaufentscheidung.",
      en: "Verified quality gives buyers the final push to purchase.",
    },
  },
  {
    src: "/images/iconen/marketingausgaben.png",
    label: { de: "Senkt Marketingausgaben", en: "Reduces marketing spend" },
    text: {
      de: "Mehr Vertrauen pro Klick: Sie holen aus Ihrem Werbebudget mehr heraus.",
      en: "More trust per click: you get more out of your ad budget.",
    },
  },
];

export default function VorteileCards() {
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
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-gradient-to-b from-white to-slate-50 px-6 py-20 sm:py-24" aria-labelledby="vorteil-title">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="eyebrow">{tr("Klar & strukturiert", "Clear & structured")}</span>
          <h2 id="vorteil-title" className="section-title">
            {tr("Ihr Vorteil", "Your benefit")}
          </h2>
          <div
            className={`mx-auto mt-5 h-px bg-gradient-to-r from-transparent via-sky-300 to-transparent transition-all duration-1000 ${
              visible ? "w-40 opacity-100" : "w-0 opacity-0"
            }`}
          />
        </div>

        <div ref={ref} className="mt-14 grid gap-6 md:grid-cols-3 md:gap-8">
          {advantages.map((item, i) => (
            <div
              key={item.label.de}
              style={{ transitionDelay: `${i * 160}ms` }}
              className={`group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-[0_20px_60px_-35px_rgba(43,64,102,0.35)] transition-all duration-[900ms] ease-out hover:-translate-y-2 hover:shadow-[0_30px_70px_-30px_rgba(43,64,102,0.45)] ${
                visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
              }`}
            >
              <span className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-sky-100/70 blur-2xl transition-transform duration-700 group-hover:scale-150" />

              <span
                className={`vorteil-check absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-sky-100 ${
                  visible ? "is-in" : ""
                }`}
                style={{ animationDelay: `${600 + i * 160}ms` }}
              >
                <Image src="/checkmark.png" alt="" width={24} height={24} className="h-5 w-5 object-contain" />
              </span>

              <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
                <span className="vorteil-halo absolute inset-0 rounded-full bg-sky-100/80" style={{ animationDelay: `${i * 700}ms` }} />
                <div className="vorteil-bob relative" style={{ animationDelay: `${i * 500}ms` }}>
                  <Image
                    src={item.src}
                    alt={tr(item.label.de, item.label.en)}
                    width={96}
                    height={96}
                    className="h-20 w-20 object-contain transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              </div>

              <h3 className="card-title relative mt-6 !mb-3">{tr(item.label.de, item.label.en)}</h3>
              <p className="body-text relative text-sm">{tr(item.text.de, item.text.en)}</p>

              <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-gradient-to-r from-sky-300 to-sky-600 transition-transform duration-700 group-hover:scale-x-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
