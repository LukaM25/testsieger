import Image from 'next/image';

type Props = {
  searchParams?: Promise<{ sent?: string; error?: string }> | { sent?: string; error?: string };
};

export default async function KontaktPage({ searchParams }: Props = {}) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const sent = resolvedSearchParams?.sent === '1';
  const error = resolvedSearchParams?.error === '1';

  return (
    <main className="bg-white text-slate-900">
      <section data-animate="section" className="relative isolate mx-auto max-w-5xl px-6 pt-20 pb-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-10 top-8 h-32 rounded-[32px] bg-gradient-to-r from-[#134074]/8 via-[#1E6091]/8 to-transparent blur-3xl"
        />

        {/* Header */}
        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2 text-xs font-semibold tracking-[0.2em] shadow-md">
            B2B Support
          </div>
          <h1 className="text-4xl font-semibold text-brand-text">Kontakt</h1>
          <p className="text-slate-700 leading-relaxed max-w-3xl">
            Haben Sie Fragen zu unseren Prüfsiegeln oder möchten Sie Ihr Produkt für eine Prüfung anmelden?
            Wir antworten in der Regel innerhalb von 48 Stunden.
          </p>
        </div>

        {sent && (
          <div className="relative mt-8 rounded-3xl border border-emerald-200 bg-emerald-50/90 px-6 py-5 text-emerald-900 shadow-[0_20px_50px_-35px_rgba(5,150,105,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Nachricht gesendet</p>
            <p className="mt-2 text-sm leading-relaxed">
              Vielen Dank. Ihre Nachricht ist bei uns eingegangen. Sie erhalten außerdem eine automatische Eingangsbestätigung per E-Mail, und wir melden uns in der Regel innerhalb von 48 Stunden persönlich zurück.
            </p>
          </div>
        )}

        {error && (
          <div className="relative mt-8 rounded-3xl border border-rose-200 bg-rose-50/90 px-6 py-5 text-rose-900 shadow-[0_20px_50px_-35px_rgba(225,29,72,0.35)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-700">Versand fehlgeschlagen</p>
            <p className="mt-2 text-sm leading-relaxed">
              Ihre Nachricht konnte gerade nicht versendet werden. Bitte versuchen Sie es erneut oder schreiben Sie direkt an info@dpi-siegel.de.
            </p>
          </div>
        )}

        {/* Form — unchanged */}
        <form
          method="post"
          action="/api/contact"
          className="relative mt-10 space-y-5 rounded-3xl border border-slate-200 bg-white/90 p-10 shadow-[0_22px_70px_-40px_rgba(15,23,42,0.4)] backdrop-blur-sm"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-slate-800">
              <span className="uppercase tracking-[0.18em] text-xs text-slate-500">Ihr Name</span>
              <input
                type="text"
                name="name"
                required
                className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-slate-900 shadow-sm focus:border-[#134074] focus:outline-none focus:ring-2 focus:ring-[#134074]/15"
              />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-800">
              <span className="uppercase tracking-[0.18em] text-xs text-slate-500">Ihre E-Mail-Adresse</span>
              <input
                type="email"
                name="email"
                required
                className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-slate-900 shadow-sm focus:border-[#134074] focus:outline-none focus:ring-2 focus:ring-[#134074]/15"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm font-semibold text-slate-800">
            <span className="uppercase tracking-[0.18em] text-xs text-slate-500">Kategorie</span>
            <select
              name="category"
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-slate-900 shadow-sm focus:border-[#134074] focus:outline-none focus:ring-2 focus:ring-[#134074]/15 text-base"
              defaultValue=""
            >
              <option value="" disabled>Bitte auswählen</option>
              <option value="business">Frage zum Unternehmen</option>
              <option value="services">Frage zu unseren Leistungen</option>
              <option value="process">Frage zum Prozess</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-800">
            <span className="uppercase tracking-[0.18em] text-xs text-slate-500">Ihre Nachricht</span>
            <textarea
              name="message"
              required
              rows={5}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-3.5 text-slate-900 shadow-sm focus:border-[#134074] focus:outline-none focus:ring-2 focus:ring-[#134074]/15"
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-sm text-slate-500">Wir melden uns werktags innerhalb von 24 Stunden.</p>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-black px-7 py-3 text-sm font-semibold text-white shadow-lg transition duration-200 hover:bg-gray-900 hover:shadow-xl"
            >
              Nachricht senden
            </button>
          </div>
        </form>

        {/* Image + Phone — below the form */}
        <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-center md:gap-10">
          <div className="relative h-64 w-full overflow-hidden rounded-3xl shadow-lg md:flex-1">
            <Image
              src="/kontakt.jpeg"
              alt="DPI Kontakt"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-4 md:w-64 md:shrink-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Direkt erreichbar
            </p>
            <a
              href="tel:+49XXXXXXXXX"
              className="inline-flex items-center gap-3 text-xl font-semibold text-slate-900 hover:text-[#134074] transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 text-[#134074]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h2.28a1 1 0 01.95.68l1.06 3.18a1 1 0 01-.23 1.05L7.5 9.4a16.06 16.06 0 006.1 6.1l1.49-1.56a1 1 0 011.05-.23l3.18 1.06a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.16 21 3 14.84 3 7V5z" />
              </svg>
              +49 156 79790129
            </a>
            <p className="text-sm text-slate-500">
              Erreichbar Mo–Fr, 9–17 Uhr
            </p>
          </div>
        </div>

      </section>
    </main>
  );
}
