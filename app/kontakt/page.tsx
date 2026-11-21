import Image from 'next/image';
import JsonLd from '@/components/seo/JsonLd';
import { absoluteUrl, breadcrumbJsonLd, pageMetadata } from '@/lib/seo';
import Link from 'next/link';
import { ArrowRight, Clock, Mail, MessageCircle, Phone, ShieldCheck } from 'lucide-react';

export const metadata = pageMetadata({
  title: 'Kontakt: Fragen zu Produkttest, Prüfsiegel und Angebot',
  description:
    'Kontakt zum Deutschen Prüfsiegel Institut: Telefon +49 156 79790129, E-Mail info@dpi-siegel.de. Antwort in der Regel innerhalb von 24 Stunden. Erreichbar Mo bis Fr, 9 bis 17 Uhr.',
  path: '/kontakt',
});

type SP = { sent?: string; error?: string; kategorie?: string; nachricht?: string };
type Props = { searchParams?: Promise<SP> | SP };

const CATEGORIES = [
  { value: 'services', label: 'Frage zu unseren Leistungen' },
  { value: 'process', label: 'Frage zum Prozess' },
  { value: 'quote', label: 'Angebot für mehr als 3 Produkte' },
  { value: 'safety', label: 'Arbeitssicherheit' },
  { value: 'business', label: 'Frage zum Unternehmen' },
];

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-slate-900 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100';
const labelCls = 'block space-y-2 text-sm font-semibold text-slate-800';
const labelTextCls = 'block text-xs uppercase tracking-[0.18em] text-slate-500';

const people = [
  { name: 'Ferdinand Lang', role: 'Geschäftsführer', image: '/ueberuns/ferdinand-lang.jpeg' },
  { name: 'Sebastian Lang', role: 'Geschäftsführer', image: '/ueberuns/sebastian-lang.jpeg' },
];

export default async function KontaktPage({ searchParams }: Props = {}) {
  const sp = await Promise.resolve(searchParams);
  const sent = sp?.sent === '1';
  const error = sp?.error === '1';
  const preselected = CATEGORIES.some((c) => c.value === sp?.kategorie) ? (sp?.kategorie as string) : '';

  return (
    <main className="bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <JsonLd
        data={[
          { '@context': 'https://schema.org', '@type': 'ContactPage', url: absoluteUrl('/kontakt'), name: 'Kontakt', about: { '@id': absoluteUrl('/#organization') } },
          breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'Kontakt', path: '/kontakt' }]),
        ]}
      />
      <section data-animate="section" className="relative isolate mx-auto max-w-6xl px-6 pb-24 pt-16 sm:pt-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(90%_60%_at_15%_0%,#e0f2fe_0%,transparent_55%),radial-gradient(80%_50%_at_90%_-10%,#f0f9ff_0%,transparent_55%)]"
        />

        <div className="max-w-3xl">
          <p className="eyebrow">Kontakt</p>
          <h1 className="text-4xl font-semibold tracking-tight text-[#2B4066] sm:text-5xl">Wir sind für Sie da.</h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Fragen zu Produkttest, Prüfsiegel oder Arbeitssicherheit? Schreiben Sie uns. Wir antworten in der Regel
            innerhalb von 24 Stunden persönlich.
          </p>
        </div>

        {sent && (
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-900">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">Nachricht gesendet.</p>
              <p className="mt-1 text-sm leading-relaxed">
                Vielen Dank. Ihre Nachricht ist bei uns eingegangen. Sie erhalten außerdem eine automatische
                Eingangsbestätigung per E-Mail, und wir melden uns in der Regel innerhalb von 24 Stunden persönlich zurück.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-900">
            <p className="font-semibold">Versand fehlgeschlagen.</p>
            <p className="mt-1 text-sm leading-relaxed">
              Ihre Nachricht konnte gerade nicht versendet werden. Bitte versuchen Sie es erneut oder schreiben Sie
              direkt an info@dpi-siegel.de.
            </p>
          </div>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-start">
          {/* Formular */}
          <form
            method="post"
            action="/api/contact"
            className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_24px_70px_-45px_rgba(43,64,102,0.35)] sm:p-9"
          >
            <div className="grid gap-5 sm:grid-cols-[0.7fr_1.3fr]">
              <label className={labelCls}>
                <span className={labelTextCls}>Anrede</span>
                <select name="gender" required defaultValue="" className={inputCls}>
                  <option value="" disabled>
                    Bitte auswählen
                  </option>
                  <option value="MALE">Herr</option>
                  <option value="FEMALE">Frau</option>
                  <option value="OTHER">Divers</option>
                </select>
              </label>
              <label className={labelCls}>
                <span className={labelTextCls}>Ihr Name</span>
                <input type="text" name="name" required autoComplete="name" className={inputCls} />
              </label>
            </div>

            <label className={labelCls}>
              <span className={labelTextCls}>Ihre E-Mail-Adresse</span>
              <input type="email" name="email" required autoComplete="email" className={inputCls} />
            </label>

            <label className={labelCls}>
              <span className={labelTextCls}>Worum geht es?</span>
              <select name="category" required defaultValue={preselected} className={inputCls}>
                <option value="" disabled>
                  Bitte auswählen
                </option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value} className={c.value === 'safety' ? 'as-only' : undefined}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelCls}>
              <span className={labelTextCls}>Ihre Nachricht</span>
              <textarea name="message" required rows={5} defaultValue={(sp?.nachricht ?? "").slice(0, 500)} className={inputCls} />
            </label>

            <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xs text-xs leading-relaxed text-slate-500">
                Mit dem Absenden stimmen Sie der Verarbeitung Ihrer Angaben gemäß unserer{' '}
                <Link href="/datenschutz" className="font-semibold underline">
                  Datenschutzerklärung
                </Link>{' '}
                zu.
              </p>
              <button
                type="submit"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#16294d] px-7 py-3.5 text-base font-semibold !text-white shadow-[0_18px_34px_-18px_rgba(29,78,216,0.75)] transition hover:-translate-y-0.5 hover:brightness-110"
              >
                Nachricht senden
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </button>
            </div>
          </form>

          {/* Direkt erreichbar */}
          <aside className="space-y-5">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_24px_70px_-45px_rgba(43,64,102,0.35)] sm:p-7">
              <p className="eyebrow !mb-4">Ihre Ansprechpartner</p>
              <div className="flex gap-4">
                {people.map((p) => (
                  <div key={p.name} className="flex-1 text-center">
                    <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full ring-4 ring-sky-50 shadow-md sm:h-28 sm:w-28">
                      <Image src={p.image} alt={p.name} fill sizes="112px" className="object-cover object-top" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-[#2B4066]">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.role}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
                <a href="tel:+4915679790129" className="flex items-center gap-3 font-semibold text-[#2B4066] transition hover:text-sky-700">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                    <Phone className="h-5 w-5" aria-hidden="true" />
                  </span>
                  +49 156 79790129
                </a>
                <a href="mailto:info@dpi-siegel.de" className="flex items-center gap-3 font-semibold text-[#2B4066] transition hover:text-sky-700">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                    <Mail className="h-5 w-5" aria-hidden="true" />
                  </span>
                  info@dpi-siegel.de
                </a>
                <p className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                    <Clock className="h-5 w-5" aria-hidden="true" />
                  </span>
                  Erreichbar Mo–Fr, 9–17 Uhr
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-b from-[#16294d] to-[#0b1730] p-6 text-white shadow-[0_30px_70px_-35px_rgba(11,23,48,0.8)] sm:p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-sky-200 ring-1 ring-white/10">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-xl font-semibold">Direkt loslegen?</h2>
              <p className="mt-1 text-sm text-white/75">
                Sie müssen nicht auf eine Antwort warten. Lassen Sie Ihr Produkt gleich testen.
              </p>
              <Link
                href="/precheck"
                className="group mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold !text-[#16294d] transition hover:bg-slate-100"
              >
                Jetzt Produkt testen lassen
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
