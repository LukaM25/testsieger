"use client";
import { useLocale } from "@/components/LocaleProvider";

export default function Intro() {
  const { locale } = useLocale();
  const copy = locale === "en"
    ? {
        title: <>What defines the <span className="align-baseline">Seal&nbsp;Institute</span>?</>,
        body:
          'We are a private testing body and stand for objective evaluations, transparent processes and measurable quality. Our guiding principle “Trust through testing” is our promise.',
      }
    : {
        title: <>Was macht das <span className="align-baseline">Prüfsiegel&nbsp;Institut</span> aus?</>,
        body:
          'Wir sind eine private Prüfstelle und stehen für objektive Bewertungen, transparente Verfahren und messbare Qualität. Unser Leitgedanke „Vertrauen durch Prüfung“ ist unser Versprechen.',
      };
  return (
    <section data-animate="section" className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {copy.title}
        </h2>
        <p className="mt-4 max-w-4xl text-gray-700 leading-relaxed">
          {copy.body}
        </p>
      </div>
    </section>
  );
}
