export default function KontaktPage() {
  return (
    <main className="bg-white text-slate-900">
      <section data-animate="section" className="relative isolate mx-auto max-w-5xl px-6 pt-20 pb-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-10 top-8 h-32 rounded-[32px] bg-gradient-to-r from-[#134074]/8 via-[#1E6091]/8 to-transparent blur-3xl"
        />
        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2 text-xs font-semibold tracking-[0.2em] shadow-md">
            B2B Support
          </div>
          <h1 className="text-4xl font-semibold text-brand-text">Kontakt</h1>
          <p className="text-slate-700 leading-relaxed max-w-3xl">
            Haben Sie Fragen zu unseren Prüfsiegeln oder möchten Sie Ihr Produkt für eine Prüfung anmelden?
            Wir antworten in der Regel innerhalb eines Werktags.
          </p>
        </div>

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
              <option value="" disabled>
                Bitte auswählen
              </option>
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
      </section>
    </main>
  );
}
