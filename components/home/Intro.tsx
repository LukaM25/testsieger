"use client";
import { useLocale } from "@/components/LocaleProvider";

export default function Intro() {
  const { locale } = useLocale();
  const copy =
    locale === "en"
      ? {
          title: (
            <>
              What defines the <span className="align-baseline">Seal&nbsp;Institute</span>?
            </>
          ),
          body: 'We are a private testing body and stand for objective evaluations, transparent processes and measurable quality. Our guiding principle "Trust through testing" is our promise.',
        }
      : {
          title: (
            <>
              Was macht das <span className="align-baseline">Prüfsiegel&nbsp;Institut</span> aus?
            </>
          ),
          body: 'Wir sind eine private Prüfstelle und stehen für objektive Bewertungen, transparente Verfahren und messbare Qualität. Unser Leitgedanke „Vertrauen durch Prüfung" ist unser Versprechen.',
        };

  return (
    <section data-animate="section" className="bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-20 sm:py-24 text-center">
        <h2 className="section-title mb-8">
          {copy.title}
        </h2>
        <div className="w-14 h-0.5 rounded-full bg-gradient-to-r from-sky-300 to-sky-600 mx-auto mb-8"></div>
        <p className="lead">
          {copy.body}
        </p>
      </div>
    </section>
  );
}
