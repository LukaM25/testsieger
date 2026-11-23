"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

type Pin = { x: number; y: number };

// Positionen der Markierungen in Prozent der Siegel-Fläche
const pins: Pin[] = [
  { x: 101, y: 40 },
  { x: -1, y: 77 },
  { x: 101, y: 82 },
  { x: -1, y: 22 },
];

const items = [
  {
    title: { de: "Gesamtnote", en: "Overall score" },
    text: {
      de: "Die Note ist der gewichtete Durchschnitt aus den Prüfkriterien Verpackung, Verarbeitung, Praxistest und Preis-Leistung. Jedes Kriterium wird mit 1 bis 10 Punkten bewertet.",
      en: "The score is the weighted average of the criteria packaging, workmanship, practical test and value for money. Each criterion is rated from 1 to 10 points.",
    },
  },
  {
    title: { de: "Produkt & Marke", en: "Product & brand" },
    text: {
      de: "Das Siegel nennt genau das geprüfte Produkt und die Marke. So ist die Prüfung eindeutig zugeordnet.",
      en: "The seal names the exact product and brand that were tested, so the test is clearly assigned.",
    },
  },
  {
    title: { de: "QR-Code", en: "QR code" },
    text: {
      de: "Käufer scannen den QR-Code und gelangen zum Prüfbericht. So kann jeder die Bewertung selbst nachvollziehen.",
      en: "Buyers scan the QR code and reach the test report, so anyone can verify the rating themselves.",
    },
  },
  {
    title: { de: "Prüfstelle", en: "Testing body" },
    text: {
      de: "Das Siegel nennt das Deutsche Prüfsiegel Institut als Prüfstelle und den Maßstab: nach DPI Standard geprüft.",
      en: "The seal names the Deutsches Prüfsiegel Institut as the testing body and the standard: tested to the DPI standard.",
    },
  },
];

const CYCLE_MS = 4000;
export default function SiegelErklaert() {
  const { locale } = useLocale();
  const tr = (de: string, en: string) => (locale === "en" ? en : de);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Sanft einblenden, sobald der Abschnitt sichtbar wird
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Erklärungen automatisch durchschalten
  useEffect(() => {
    if (!inView || paused) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % items.length), CYCLE_MS);
    return () => window.clearInterval(id);
  }, [inView, paused]);

  return (
    <section className="bg-white px-6 py-20 sm:py-24" aria-labelledby="siegel-title">
      <div className="mx-auto grid max-w-6xl items-center gap-14 md:grid-cols-2">
        {/* Schwebendes Siegel mit Markierungen */}
        <div className="flex flex-col items-center">
          <div
            ref={stageRef}
            className="relative flex w-full items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 via-slate-50 to-sky-100 px-6 py-16"
            style={{ perspective: "1400px" }}
          >
            <div className="seal-glow pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300/30 blur-3xl" />
            <div
              className={`transition-all duration-1000 ease-out ${inView ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-95 opacity-0"}`}
            >
              <div className="seal-float">
                <div className="seal-sway relative aspect-[1930/2461] w-[min(72vw,280px)]" style={{ transformStyle: "preserve-3d" }}>
                  <Image
                    src="/siegel19.png"
                    alt={tr("Beispiel eines Testsieger-Siegels mit Note 1,4", "Example of a Testsieger seal with score 1.4")}
                    fill
                    sizes="280px"
                    className="object-contain drop-shadow-2xl"
                  />
                  <div
                    aria-hidden
                    className="seal-shine pointer-events-none absolute inset-0"
                    style={{
                      WebkitMaskImage: "url(/siegel19.png)",
                      maskImage: "url(/siegel19.png)",
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      maskPosition: "center",
                    }}
                  />
                  {pins.map((pin, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActive(index)}
                      aria-label={tr(items[index].title.de, items[index].title.en)}
                      className={`absolute z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs font-semibold transition-all duration-500 ${
                        active === index
                          ? "bg-sky-600 text-white shadow-[0_0_0_6px_rgba(14,165,233,0.25)]"
                          : "bg-white/90 text-sky-700 shadow-md ring-1 ring-sky-200"
                      }`}
                      style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                    >
                      {active === index && <span className="pin-pulse absolute inset-0 rounded-full bg-sky-400/50" />}
                      <span className="relative">{index + 1}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="seal-shadow mx-auto mt-6 h-4 w-40 rounded-full bg-slate-900/15 blur-xl" />
            </div>
          </div>
        </div>

        {/* Erklärungen */}
        <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <span className="eyebrow">{tr("Das Siegel erklärt", "The seal explained")}</span>
          <h2 id="siegel-title" className="section-title">
            {tr("Woran Käufer Vertrauen erkennen", "How buyers recognize trust")}
          </h2>
          <ul className="mt-8 space-y-3">
            {items.map((item, index) => {
              const isActive = active === index;
              return (
                <li key={item.title.de}>
                  <button
                    type="button"
                    onClick={() => setActive(index)}
                    className={`relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-all duration-500 ${
                      isActive
                        ? "border-sky-200 bg-white shadow-[0_18px_50px_-30px_rgba(43,64,102,0.45)]"
                        : "border-transparent bg-slate-50 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-500 ${
                          isActive ? "bg-sky-600 text-white" : "bg-white text-slate-400 ring-1 ring-slate-200"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-[#2B4066]">{tr(item.title.de, item.title.en)}</p>
                        <div
                          className={`grid transition-all duration-500 ${
                            isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                          }`}
                        >
                          <p className="body-text overflow-hidden text-sm">{tr(item.text.de, item.text.en)}</p>
                        </div>
                      </div>
                    </div>
                    {isActive && !paused && inView && (
                      <span
                        key={`bar-${active}`}
                        className="seal-progress absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-sky-300 to-sky-600"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
