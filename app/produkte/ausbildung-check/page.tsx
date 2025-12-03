import Link from 'next/link';
import { stagger } from '@/lib/animation';

export const metadata = {
  title: 'Ausbildung Check – Prüfsiegel Zentrum UG',
  description:
    'Transparente Bewertung von Ausbildungsplätzen: Praxisnähe, Betreuung, Erfolgsquote – objektiv geprüft.',
};

export default function AusbildungCheckPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 text-white min-h-[70vh] lg:min-h-[80vh] flex items-end">
        <div data-animate="hero-image" className="absolute inset-0 isolate">
          <video
            autoPlay
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover object-[center_40%] brightness-90"
          >
            <source src="/videos/ausbildung.mp4" type="video/mp4" />
          </video>
        </div>
        <div
          aria-hidden
          className="absolute inset-0 bg-slate-950/20"
        />
        <div data-animate="section" className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20 pt-8 sm:pt-10 flex justify-end">
          <div className="inline-block max-w-lg rounded-2xl border border-white/12 bg-slate-950/35 backdrop-blur-sm p-5 md:p-6 shadow-[0_20px_50px_-35px_rgba(0,0,0,0.75)] transform -translate-y-[20px] transition duration-300 hover:-translate-y-[26px] hover:scale-[1.01]">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Ausbildung&nbsp;Check
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-gray-100">
              Wir bewerten Ausbildungsbetriebe nach klaren, transparenten Kriterien.
              Ziel: verlässliche Orientierung für Bewerber und messbare Qualität für Betriebe.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/produkte/produkt-test"
                className="rounded-lg bg-white/95 px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-white"
              >
                Jetzt kostenloser Pre-Check
              </Link>
              <Link
                href="/kontakt"
                className="rounded-lg border border-white/40 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white hover:bg-white/10"
              >
                Kontakt aufnehmen
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophie & Hintergrund */}
      <section data-animate="section" className="mx-auto max-w-6xl px-6 py-16">
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-brand-text">Philosophie &amp; Hintergrund des Siegels</h2>
            <p className="text-gray-700 leading-relaxed italic">
              Der Ausbildungs-Check ist ein Wegweiser für angehende Auszubildende. Er macht sichtbar, welche Betriebe nicht nur fachlich stark sind, sondern auch ein strukturiertes, menschliches und klar geführtes Ausbildungsumfeld bieten.
            </p>
          </div>

          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
            <ul className="space-y-4 text-gray-800 text-lg">
              {[
                { title: 'Wertschätzender Umgang', icon: '/ausbildung_assets/umgang.PNG' },
                { title: 'Transparente Abläufe', icon: '/ausbildung_assets/transparente_ablaufe.PNG' },
                { title: 'Saubere Einführung', icon: '/ausbildung_assets/saubere_efinfurung.PNG' },
                { title: 'Struktur', icon: '/ausbildung_assets/struktur.PNG' },
              ].map((item, i) => (
                <li
                  key={item.title}
                  data-animate="card"
                  style={stagger(i)}
                  className="flex items-center gap-4 text-base"
                >
                  <img src={item.icon} alt={item.title} className="h-10 w-10 object-contain shrink-0" />
                  <span>{item.title}</span>
                </li>
              ))}
            </ul>

            <div className="relative">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-gray-100 shadow-md" data-animate="card" style={stagger(0)}>
                <img
                  src="/ausbildung_assets/roadmap_ausbildung.jpeg"
                  alt="Ausbildungs-Check Roadmap"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vorteile */}
      <section data-animate="section" className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 space-y-4">
          <h2 className="text-3xl font-semibold text-brand-text">Ihr Vorteil als Zertifizierte Top Ausbilder</h2>
          <p className="text-gray-700">
            Unser Prüfsiegel signalisiert auf Ihrer Karriere-Seite, in Stellenanzeigen und auf Social Media sofort:
          </p>
          <p className="font-semibold italic text-gray-800">Hier wird Ausbildung und Einstieg ins Berufsleben gelebt.</p>

          <div className="mt-8 space-y-6">
            {[
              { title: 'Sichtbarkeit', icon: '/ausbildung_assets/sichtbarkeit.PNG' },
              { title: 'Wettbewerbsvorteil', icon: '/ausbildung_assets/wettbewerbsvorteil.PNG' },
              { title: 'Vertrauen', icon: '/ausbildung_assets/vertrauen_badge.PNG' },
            ].map((item, i) => (
              <div
                key={item.title}
                data-animate="card"
                style={stagger(i)}
                className="flex w-full max-w-xl flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 mx-auto px-5 py-4 text-left rounded-xl bg-white shadow-sm shadow-brand-dark/5"
              >
                <div className="flex items-center gap-4 sm:gap-5">
                  <img
                    src={item.icon}
                    alt={item.title}
                    style={{ width: 110, height: 110 }}
                    className="object-contain shrink-0"
                  />
                  <span className="text-2xl sm:text-3xl font-semibold text-brand-text leading-tight">{item.title}</span>
                </div>
                <img
                  src="/checkmark.png"
                  alt="Check"
                  style={{ width: 32, height: 32 }}
                  className="object-contain opacity-100"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ablauf */}
      <section data-animate="section" className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl font-semibold text-brand-text">Ablauf</h2>
          <div className="mt-8 flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-center gap-7">
              {[
                { label: 'Kostenloser Pre-Check', src: '/images/ablauf/1free.PNG' },
                { label: 'Betriebsbegehung', src: '/ausbildung_assets/betriebsgehnung.PNG' },
                { label: 'Lizenzplan auswählen', src: '/images/ablauf/3liefer.PNG' },
                { label: 'Testergebnis & Siegel erhalten', src: '/images/ablauf/4testergebnis.PNG' },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-5">
                  <div
                    data-animate="card"
                    style={stagger(i)}
                    className="flex w-52 flex-col items-center rounded-xl bg-white px-7 py-6"
                  >
                    <img src={step.src} alt={step.label} className="h-24 w-24 object-contain" />
                    <span className="mt-3 text-[12px] font-semibold uppercase tracking-wide text-gray-800 text-center leading-tight">
                      {step.label}
                    </span>
                  </div>
                  {i < 3 && (
                    <div className="flex h-full items-center justify-center px-1 self-stretch" aria-hidden>
                      <span className="text-3xl font-semibold text-gray-500 flex items-center h-full">→</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-white text-xl font-semibold shadow-sm" aria-hidden>
                ↓
              </div>
            </div>
            <div className="flex justify-center">
              <div
                className="inline-flex items-center justify-center rounded-full border border-gray-200 px-10 py-[28px] text-xl font-semibold text-gray-800"
                style={{ transform: 'scale(1.05)', marginTop: '0.5rem' }}
              >
                Listung unter Top Ausbildungsbetriebe nach Berufsgruppe auf DPI
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bild */}
      <section data-animate="section" className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="overflow-hidden rounded-xl shadow-md" data-animate="card" style={stagger(0)}>
            <img
              src="/images/expertise_training.jpeg"
              alt="Ausbildungsteam bei der Arbeit"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Lizenzplan */}
      <section data-animate="section" className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl font-semibold text-brand-text">Lizenzplan</h2>
          <p className="mt-3 text-gray-700">Kosten fallen erst nach Besichtigung der Ausbildungsstelle an</p>

          <div className="mt-8 flex flex-col items-center gap-4">
            <div
              data-animate="card"
              style={stagger(0)}
              className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white/90 px-10 py-8 text-center shadow-[0_18px_50px_-35px_rgba(15,23,42,0.35)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_22px_60px_-34px_rgba(15,23,42,0.4)]"
            >
              <p className="text-base font-medium text-gray-800">Grundgebühr für Anreise &amp; Begehung</p>
              <p className="text-lg font-semibold text-gray-900">344€ zzgl Mwst</p>
            </div>
            <div className="text-3xl font-semibold text-gray-700">+</div>
            <div
              data-animate="card"
              style={stagger(1)}
              className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white/90 px-10 py-8 text-center shadow-[0_18px_50px_-35px_rgba(15,23,42,0.35)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_22px_60px_-34px_rgba(15,23,42,0.4)]"
            >
              <p className="text-base font-medium text-gray-800">Lizenznutzung Siegelvergabe, Prüfbericht, DPI Listing</p>
              <p className="text-lg font-semibold text-gray-900">1,22€/ Tag zzgl Mwst</p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/produkte/produkt-test?precheck=open#precheck"
              className="grid place-items-center rounded-full bg-black px-10 py-4 text-base font-semibold text-white shadow-lg transition duration-200 hover:bg-gray-900 hover:shadow-xl text-center"
            >
              Zum Kostenloser Pre-Check
            </Link>
            <Link
              href="/kontakt"
              className="rounded-full border border-gray-300 px-6 py-3 text-base font-semibold text-gray-800 shadow-sm transition duration-200 hover:bg-gray-50 hover:shadow-md"
            >
              Kontakt aufnehmen
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
