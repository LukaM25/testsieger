import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { stagger } from '@/lib/animation';
import { normalizeLocale } from '@/lib/i18n';

export const metadata = {
  title: 'Spielplatz Sicherheit – Prüfsiegel Zentrum UG',
  description:
    'DIN EN 1176/1177 konforme Spielplatzprüfungen – zuverlässig, dokumentiert und auditready.',
};

const copyMap = {
  de: {
    heroTitle: <>Geprüfte Spielplatz <span className="text-sky-300">Sicherheit</span></>,
    heroBody:
      'Wir liefern vollumfängliche Spielplatzprüfungen nach DIN EN 1176/1177 – zuverlässig, normkonform und auditready. Mit unserem Prüfprozess sichern Betreiber ihre Anlagen rechtssicher ab und erhöhen die Betriebssicherheit.',
    ctaPrimary: 'Kontakt aufnehmen',
    ctaSecondary: 'Prüfprozess ansehen',
    whyTitle: 'Warum Spielplatz Sicherheit prüfen?',
    whyBody:
      'Sicherheit ist kein Zufall. Wir prüfen dokumentiert, transparent und mit klaren Handlungsempfehlungen, damit Eltern, Betreiber und Behörden Vertrauen haben.',
    bullets: [
      'DIN EN 1176/1177-konforme Prüfungen',
      'Dokumentierte Mängel und klare Handlungsempfehlungen',
      'Transparente Kommunikation mit Betreibern & Behörden',
      'Mehr Rechtssicherheit und Betriebssicherheit',
    ],
    stepsTitle: 'Ablauf',
    steps: [
      { title: 'Pre-Check & Planung', text: 'Kurzbriefing zu Anlage, Baujahr, Unterlagen. Terminierung der Begehung.' },
      { title: 'Vor-Ort Begehung', text: 'Mechanische und sicherheitsrelevante Checks, Fallschutz, Verschleiß, Beschilderung.' },
      { title: 'Bericht & Maßnahmen', text: 'Bewertung, Fotodoku, Priorisierung nach Risiko, klare To-dos.' },
      { title: 'Follow-up & Siegel', text: 'Nachverfolgung der Maßnahmen, Abschlusscheck, Siegel & QR-Verifikation.' },
  ],
  ctaBlockTitle: 'Bereit für eine sichere Anlage?',
  ctaBlockBody: 'Wir planen Ihren Prüfungstermin und begleiten Sie von der Begehung bis zum Siegel.',
  ctaBlockPrimary: 'Termin anfragen',
  ctaBlockSecondary: 'Prüfverfahren ansehen',
  },
  en: {
    heroTitle: <>Tested Playground <span className="text-sky-300">Safety</span></>,
    heroBody:
      'We deliver comprehensive playground inspections per DIN EN 1176/1177—reliable, standards-compliant, and audit-ready. Our process helps operators secure their sites legally and raise operational safety.',
    ctaPrimary: 'Contact us',
    ctaSecondary: 'View testing process',
    whyTitle: 'Why test playground safety?',
    whyBody:
      'Safety is no accident. We test with documentation, transparency, and clear action steps so parents, operators, and authorities trust the site.',
    bullets: [
      'DIN EN 1176/1177 compliant inspections',
      'Documented issues and clear actions',
      'Transparent communication with operators & authorities',
      'More legal certainty and operational safety',
    ],
    stepsTitle: 'Process',
    steps: [
      { title: 'Pre-check & planning', text: 'Briefing on site, year, documentation. Schedule the walkthrough.' },
      { title: 'On-site inspection', text: 'Mechanical and safety checks, impact surfaces, wear, signage.' },
      { title: 'Report & actions', text: 'Assessment, photo documentation, risk-based priorities, clear to-dos.' },
      { title: 'Follow-up & seal', text: 'Track remediation, final check, seal & QR verification.' },
    ],
    ctaBlockTitle: 'Ready for a safer site?',
    ctaBlockBody: 'We schedule your inspection and guide you from walkthrough to seal.',
    ctaBlockPrimary: 'Request a date',
    ctaBlockSecondary: 'See testing process',
  },
} as const;

export default async function SpielplatzSicherheitPage() {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get('lang')?.value || 'de');
  const copy = copyMap[locale];

  return (
    <main className="bg-white text-slate-900">
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 text-white min-h-[70vh] lg:min-h-[75vh] flex items-end">
        <div data-animate="hero-image" className="absolute inset-0">
          <Image
            src="/images/spielplatzHero-v2.png"
            alt="Geprüfte Spielplatz Sicherheit"
            fill
            priority
            className="object-cover object-center brightness-[0.70] scale-x-[-1]"
          />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-16 pt-10 flex justify-start">
          <div className="max-w-2xl rounded-2xl border border-white/15 bg-slate-950/45 backdrop-blur-sm p-6 shadow-[0_18px_50px_-35px_rgba(0,0,0,0.6)] space-y-4 text-left flex flex-col items-start">
            <h1 data-animate="hero-title" className="text-4xl font-bold leading-tight md:text-5xl">
              {copy.heroTitle}
            </h1>
            <p data-animate="hero-text" className="text-lg text-slate-100">
              {copy.heroBody}
            </p>
            <div data-animate="hero-cta" className="flex flex-wrap gap-3">
              <Link
                href="/kontakt"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                {copy.ctaPrimary}
              </Link>
              <Link
                href="/verfahren"
                className="rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 hover:-translate-y-0.5"
              >
                {copy.ctaSecondary}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Warum geprüft */}
      <section data-animate="section" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-brand-text">{copy.whyTitle}</h2>
            <p className="text-slate-700 leading-relaxed">
              {copy.whyBody}
            </p>
            <ul className="space-y-3 text-slate-800">
              {copy.bullets.map((item, i) => (
                <li
                  key={item}
                  data-animate="card"
                  style={stagger(i)}
                  className="flex items-start gap-3 text-base"
                >
                  <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-brand-green" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 shadow-lg" data-animate="card" style={stagger(0)}>
              <Image
                src="/images/expertise_sicherheit.jpeg"
                alt="Spielplatzprüfung"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Ablauf */}
      <section data-animate="section" className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
          <h2 className="text-3xl font-semibold text-brand-text text-center">{copy.stepsTitle}</h2>
          <div className="grid gap-6 md:grid-cols-4">
            {copy.steps.map((s, i) => (
              <div
                key={s.title}
                data-animate="card"
                style={stagger(i)}
                className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {i + 1}
                </div>
                <h3 className="text-lg font-semibold text-brand-text">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section data-animate="section" className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-10 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.35)] text-center">
          <h3 className="text-2xl font-semibold text-brand-text">{copy.ctaBlockTitle}</h3>
          <p className="mt-3 text-slate-700">
            {copy.ctaBlockBody}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/kontakt"
              className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-lg transition duration-200 hover:bg-gray-900 hover:shadow-xl"
            >
              {copy.ctaBlockPrimary}
            </Link>
            <Link
              href="/verfahren"
              className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800 transition duration-200 hover:bg-gray-50"
            >
              {copy.ctaBlockSecondary}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
