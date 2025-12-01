import Image from 'next/image';
import Link from 'next/link';
import { placeholderProducts } from '@/lib/placeholderContent';
import { stagger } from '@/lib/animation';

export const metadata = {
  title: 'Unsere Produkte – Prüfsiegel Zentrum UG',
  description:
    'Überblick über anstehende Prüfsiegel-Produkte mit thematisch passenden Platzhaltern für Inhalte und Assets.',
};

export default function ProductsOverviewPage() {
  return (
    <main className="bg-gray-50 text-gray-900">
      <section data-animate="section" className="relative overflow-hidden bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20 md:flex-row md:items-center">
          <div className="md:w-1/2">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-500">Coming Soon</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
              Prüfsiegel Roadmap
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Wir arbeiten an weiteren Prüfpfaden für Servicequalität, digitale Prozesse und Nachhaltigkeit. Bis die finalen
              Unterlagen aus Foto & PDF vorliegen, nutzen wir strukturierte Platzhaltertexte und illustrative Assets im
              bestehenden Markenstil.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/kontakt"
                className="rounded-xl bg-gray-900 px-5 py-3 text-white shadow-sm transition hover:bg-black"
              >
                Frühzeitigen Zugang anfragen
              </Link>
              <Link
                href="/precheck"
                className="rounded-xl border border-gray-300 px-5 py-3 text-gray-900 transition hover:bg-gray-100"
              >
                Pre-Check starten
              </Link>
            </div>
          </div>
          <div className="relative w-full md:w-1/2">
            <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-slate-900/90 shadow-xl">
              <Image
                src="/placeholder/roadmap.png"
                alt="Abstraktes Prüfpfad-Visual"
                width={1600}
                height={900}
                className="h-full w-full object-cover"
                priority
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent p-6 text-sm text-slate-100">
                Platzhalter-Visual – ersetzt durch hero.jpg aus gelieferten Assets.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-animate="section" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-semibold">Produkt-Skizzen</h2>
        <p className="mt-2 max-w-2xl text-gray-600">
          Jede Karte lässt sich 1:1 mit finalen Texten ersetzen. Highlights, Timeline und Deliverables orientieren sich an der
          bestehenden Tonalität und Struktur des Ausbildung Checks.
        </p>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {placeholderProducts.map((product, idx) => (
            <article
              key={product.slug}
              data-animate="card"
              style={stagger(idx)}
              className="group flex flex-col gap-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
            >
              <div className="overflow-hidden rounded-2xl">
                <Image
                  src={product.heroImage}
                  alt={`${product.name} Placeholder Visual`}
                  width={960}
                  height={540}
                  className="h-48 w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                />
              </div>
              <header>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Platzhalter</p>
                <h3 className="mt-1 text-2xl font-semibold text-slate-900">{product.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{product.tagline}</p>
              </header>
              <p className="text-sm leading-relaxed text-slate-600">{product.summary}</p>
              <div className="grid gap-4 md:grid-cols-2">
                {product.highlights.map((item, i) => (
                  <div
                    key={item.title}
                    data-animate="card"
                    style={stagger(i)}
                    className="rounded-2xl bg-slate-50 p-4 transition duration-300 hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="text-sm font-semibold text-slate-800">{item.title}</div>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">Timeline</div>
                <ol className="mt-2 space-y-3 text-sm text-slate-600">
                  {product.timeline.map((phase, index) => (
                    <li key={phase.title} className="flex gap-3 transition duration-300 hover:-translate-y-0.5">
                      <span className="mt-1 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                        {index + 1}
                      </span>
                      <div>
                        <div className="font-medium text-slate-800">{phase.title}</div>
                        <p className="text-slate-600">{phase.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">Geplante Deliverables</div>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {product.deliverables.map((deliverable) => (
                    <li key={deliverable} className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-medium text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-900/10">
                      {deliverable}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-auto flex flex-wrap gap-3">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-100"
                >
                  Placeholder Briefing anfordern
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition duration-200 hover:-translate-y-0.5 hover:bg-black"
                >
                  Platzhalter sichern
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section data-animate="section" className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 lg:flex-row lg:items-center hidden">
          <div className="lg:w-1/2">
            <h2 className="text-2xl font-semibold text-slate-900">Wie Sie Assets austauschen</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Alle Bilder liegen zentral im Ordner <code className="rounded bg-slate-100 px-1.5 py-0.5">public/images</code>.
              Nutzen Sie einfach denselben Dateinamen, um echte Fotos oder Grafiken über die Platzhalter zu legen. Texte finden Sie
              in <code className="rounded bg-slate-100 px-1.5 py-0.5">lib/placeholderContent.ts</code> und können dort 1:1
              ersetzt werden.
            </p>
          </div>
          <div className="lg:w-1/2">
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 transition duration-300 hover:-translate-y-2 hover:shadow-xl" data-animate="card">
              <div className="flex items-start gap-3">
                <Image
                  src="/images/placeholders/card-fallback.svg"
                  alt="Platzhalter Karte"
                  width={240}
                  height={180}
                  className="h-24 w-32 flex-none rounded-2xl object-cover"
                />
                <div>
                  <div className="font-semibold text-slate-800">Dateibenennung</div>
                  <p>Belassen Sie Dateiendungen (.jpg/.png/.svg). Beim Austausch ändert sich nur das Asset, nicht der Code.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 flex-none place-items-center rounded-full bg-slate-900 text-white">Aa</div>
                <div>
                  <div className="font-semibold text-slate-800">Typografie</div>
                  <p>Folgt dem bestehenden Tailwind-Setup (Inter). Placeholder nutzen ähnliche Hierarchien wie reale Seiten.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 flex-none place-items-center rounded-full bg-slate-200 text-slate-700">#</div>
                <div>
                  <div className="font-semibold text-slate-800">Farbcodes</div>
                  <p>Ausgerichtet an Navy (#1d3557) und Slate-Neutrals für konsistente Brand-Wirkung.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
