"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

type Step = {
  icon: string;
  title: { de: string; en: string };
  text: { de: string; en: string };
};

const steps: Step[] = [
  {
    icon: "/images/ablauf/1free.PNG",
    title: { de: "Kostenloser Pre-Check", en: "Free pre-check" },
    text: {
      de: "Sie geben Ihre Produktdaten in rund 3 Minuten ein. Wir prüfen vorab, ob Ihr Produkt für eine Prüfung in Frage kommt. Kostenlos.",
      en: "You enter your product details in about 3 minutes. We check up front whether your product qualifies for testing. Free of charge.",
    },
  },
  {
    icon: "/images/ablauf/3liefer.PNG",
    title: { de: "Produkt an uns senden", en: "Send product to us" },
    text: {
      de: "Nach bestandenem Pre-Check schicken Sie uns das Produkt. Für den Prüfungsaufwand und die Zertifikate fällt eine einmalige Testgebühr an.",
      en: "After passing the pre-check, you send us the product. A one-time test fee covers the testing effort and the certificates.",
    },
  },
  {
    icon: "/images/ablauf/2lizenz.PNG",
    title: { de: "Lizenzplan auswählen", en: "Choose license plan" },
    text: {
      de: "Sie wählen den Plan, der zu Ihren Verkaufskanälen passt. Lizenzpläne werden von Ihnen nur für bestandene Produkte aktiviert.",
      en: "You choose the plan that fits your sales channels. License plans are only activated by you for products that passed.",
    },
  },
  {
    icon: "/images/ablauf/4testergebnis.PNG",
    title: { de: "Testergebnis & Siegel erhalten", en: "Receive test result & seal" },
    text: {
      de: "Sie erhalten Prüfbericht, Zertifikat und Ihr Siegel mit QR-Code. Damit machen Sie Ihr Produkt für Käufer sichtbar vertrauenswürdig.",
      en: "You receive the test report, certificate and your seal with QR code, making your product visibly trustworthy to buyers.",
    },
  },
];

export default function AblaufTimeline() {
  const { locale } = useLocale();
  const tr = (de: string, en: string) => (locale === "en" ? en : de);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setProgress(1);
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const p = (window.innerHeight * 0.7 - rect.top) / rect.height;
      setProgress(Math.min(1, Math.max(0, p)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const fill = Math.min(1, Math.max(0, (progress - 0.08) / 0.8));

  return (
    <section
      ref={sectionRef}
      className="bg-gradient-to-b from-white to-slate-50 px-6 py-20 sm:py-24"
      aria-labelledby="ablauf-title"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="eyebrow">{tr("In 4 Schritten", "In 4 steps")}</span>
          <h2 id="ablauf-title" className="section-title">
            {tr("So kommen Sie zu Ihrem Siegel", "How you get your seal")}
          </h2>
          <p className="lead mt-4">
            {tr(
              "Vom kostenlosen Pre-Check bis zum fertigen Siegel: klar, digital und nachvollziehbar.",
              "From the free pre-check to your finished seal: clear, digital and traceable."
            )}
          </p>
        </div>

        <div className="relative">
          {/* Linie Desktop (waagrecht) */}
          <div className="absolute left-[12.5%] right-[12.5%] top-8 hidden h-0.5 rounded-full bg-slate-200 md:block">
            <div
              className="h-full origin-left rounded-full bg-gradient-to-r from-sky-300 to-sky-600"
              style={{ transform: `scaleX(${fill})` }}
            />
          </div>
          {/* Linie Mobil (senkrecht) */}
          <div className="absolute bottom-8 left-8 top-8 w-0.5 -translate-x-1/2 rounded-full bg-slate-200 md:hidden">
            <div
              className="h-full origin-top rounded-full bg-gradient-to-b from-sky-300 to-sky-600"
              style={{ transform: `scaleY(${fill})` }}
            />
          </div>

          <ol className="relative grid gap-10 md:grid-cols-4 md:gap-6">
            {steps.map((step, index) => {
              const active = progress >= 0.08 + (index / steps.length) * 0.8;
              return (
                <li
                  key={step.title.de}
                  className="flex gap-5 md:h-full md:flex-col md:items-center md:gap-0 md:text-center"
                >
                  <span
                    className={`relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border text-lg font-semibold transition-all duration-700 ${
                      active
                        ? "scale-100 border-sky-500 bg-sky-600 text-white shadow-[0_14px_30px_-12px_rgba(2,132,199,0.7)]"
                        : "scale-90 border-slate-200 bg-white text-slate-400"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div
                    className={`rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_18px_50px_-35px_rgba(43,64,102,0.35)] transition-all duration-700 md:mt-8 md:w-full md:flex-1 ${
                      active ? "translate-y-0 opacity-100" : "translate-y-4 opacity-40"
                    }`}
                  >
                    <Image
                      src={step.icon}
                      alt=""
                      width={72}
                      height={72}
                      className="mb-4 h-14 w-14 object-contain md:mx-auto"
                    />
                    <h3 className="card-title !mb-2">{tr(step.title.de, step.title.en)}</h3>
                    <p className="body-text text-sm">{tr(step.text.de, step.text.en)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
