import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import JsonLd from "@/components/seo/JsonLd";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Über uns: Produkttest & Arbeitssicherheit aus Oberbayern",
  description:
    "Deutsches Prüfsiegel Institut aus Waakirchen in Oberbayern: Sebastian Lang verantwortet Produkttests und Prüfsiegel, Ferdinand Lang baut die Arbeitssicherheit nach DGUV auf.",
  path: "/ueber-uns",
});

const team = [
  {
    id: "sebastian-lang",
    name: "Sebastian Lang",
    role: "Produkttest & Prüfsiegel",
    image: "/ueberuns/sebastian-lang.jpeg",
    alt: "Sebastian Lang, Geschäftsführer des Deutschen Prüfsiegel Instituts, verantwortlich für Produkttests",
    body: "Sebastian steht für technische Genauigkeit und industrielle Standards. Als Feinwerker im Maschinenbau mit Erfahrung in Qualitätssicherung und technischer Abnahme, unter anderem bei der Kinshofer GmbH, kennt er die Bedeutung fehlerfreier Prozesse bis ins Detail. Er verantwortet beim DPI den kompletten Produkttest: von den Prüfkriterien über die Prüfung bis zum Bericht und Siegel.",
    points: ["Feinwerker im Maschinenbau", "Qualitätssicherung & technische Abnahme", "Verantwortlich für Prüfkriterien und Prüfberichte"],
  },
  {
    id: "ferdinand-lang",
    name: "Ferdinand Lang",
    role: "Arbeitssicherheit",
    image: "/ueberuns/ferdinand-lang.jpeg",
    alt: "Ferdinand Lang, Geschäftsführer des Deutschen Prüfsiegel Instituts, verantwortlich für Arbeitssicherheit",
    body: "Ferdinand ist gelernter Garten- und Landschaftsbauer mit Meisterabschluss in Management und Gestaltung und einem Abschluss als Wirtschafter (Landshut). Aus zehn Jahren Praxis weiß er, wo im Betriebsalltag die sicherheitsrelevanten Details liegen. Beim DPI verantwortet er die Arbeitssicherheit und absolviert dafür derzeit die Ausbildung zur Fachkraft für Arbeitssicherheit (SiFa) nach den Vorgaben der DGUV. Der Abschluss ist für Sommer 2027 vorgesehen.",
    points: ["Meister im Garten- und Landschaftsbau", "In Ausbildung zur Fachkraft für Arbeitssicherheit (SiFa), DGUV", "Praxiserfahrung aus 10 Jahren im Handwerk"],
  },
];

const principles = [
  { title: "Aus der Praxis", body: "Wir bewerten nicht nach reinen Labormaßstäben, sondern danach, was im echten Einsatz zählt: Funktion, Sicherheit und Qualität." },
  { title: "Nachvollziehbar", body: "Feste Kriterien und dokumentierte Ergebnisse, damit jede Bewertung verständlich und überprüfbar bleibt." },
  { title: "Ehrlich", body: "Wir sagen klar, was gut ist und was fehlt. Ein Siegel gibt es nur, wenn die Prüfung bestanden ist." },
  { title: "Persönlich", body: "Sie sprechen direkt mit uns Gründern. Der letzte Blick auf jeden Bericht kommt von uns." },
];

const personJsonLd = (id: string, name: string, jobTitle: string, description: string, image: string, knowsAbout: string[]) => ({
  "@type": "Person",
  "@id": `${absoluteUrl("/ueber-uns")}#${id}`,
  name,
  jobTitle,
  description,
  image: absoluteUrl(image),
  url: absoluteUrl("/ueber-uns"),
  worksFor: { "@id": absoluteUrl("/#organization") },
  knowsAbout,
});

export default function UeberUnsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": `${absoluteUrl("/ueber-uns")}#aboutpage`,
        url: absoluteUrl("/ueber-uns"),
        name: "Über das Deutsche Prüfsiegel Institut",
        inLanguage: "de-DE",
        about: { "@id": absoluteUrl("/#organization") },
        mainEntity: [
          { "@id": `${absoluteUrl("/ueber-uns")}#sebastian-lang` },
          { "@id": `${absoluteUrl("/ueber-uns")}#ferdinand-lang` },
        ],
      },
      personJsonLd(
        "sebastian-lang",
        "Sebastian Lang",
        "Geschäftsführer, Produkttest und Prüfsiegel",
        "Feinwerker im Maschinenbau mit Erfahrung in Qualitätssicherung und technischer Abnahme. Verantwortet beim DPI Produkttests und Prüfsiegel.",
        "/ueberuns/sebastian-lang.jpeg",
        ["Produkttest", "Qualitätssicherung", "Technische Abnahme", "Prüfsiegel"],
      ),
      personJsonLd(
        "ferdinand-lang",
        "Ferdinand Lang",
        "Geschäftsführer, Arbeitssicherheit",
        "Gelernter Garten- und Landschaftsbauer mit Meisterabschluss, in Ausbildung zur Fachkraft für Arbeitssicherheit nach den Vorgaben der DGUV. Verantwortet beim DPI die Arbeitssicherheit.",
        "/ueberuns/ferdinand-lang.jpeg",
        ["Arbeitssicherheit", "DGUV", "Garten- und Landschaftsbau", "Gefährdungsbeurteilung"],
      ),
    ],
  };

  return (
    <main className="bg-gradient-to-b from-slate-50 via-white to-sky-50/50 text-slate-900">
      <JsonLd
        data={[
          jsonLd,
          breadcrumbJsonLd([
            { name: "Start", path: "/" },
            { name: "Über uns", path: "/ueber-uns" },
          ]),
        ]}
      />

      {/* Hero */}
      <section data-animate="section" className="relative overflow-hidden px-6 pb-14 pt-16 sm:pt-20">
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="relative mx-auto max-w-4xl">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700 ring-1 ring-sky-100">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              Waakirchen, Oberbayern
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-[#2B4066] sm:text-5xl">
              Über das Deutsche Prüfsiegel Institut
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              Zwei Brüder, zwei Fachgebiete: <strong className="font-semibold text-slate-800">Sebastian Lang</strong> verantwortet Produkttests und Prüfsiegel, <strong className="font-semibold text-slate-800">Ferdinand Lang</strong> baut die Arbeitssicherheit auf. Beides mit demselben Anspruch: Prüfungen aus der Praxis, nachvollziehbar und ehrlich.
            </p>
          </div>
        </div>
      </section>

      {/* Team */}
      <section data-animate="section" className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">Das Team</span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#2B4066]">Wer hinter dem DPI steht</h2>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">
            Wir sind die im oberbayerischen Tegernsee geborenen Brüder Ferdinand und Sebastian Lang und leiten das Deutsche Prüfsiegel Institut gemeinsam.
          </p>
          <div className="mt-10 grid gap-8">
            {team.map((m, idx) => (
              <article key={m.id} id={m.id} className="scroll-mt-24 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(43,64,102,0.35)] sm:p-8">
                <div className="grid items-center gap-8 md:grid-cols-[0.8fr,1.2fr] md:gap-10">
                  <div className={idx % 2 === 0 ? "" : "md:order-2"}>
                    <div className="relative mx-auto aspect-[3/4] w-full max-w-[340px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-lg ring-1 ring-slate-200/60">
                      <Image src={m.image} alt={m.alt} fill sizes="(min-width: 768px) 340px, 80vw" className="object-cover" />
                    </div>
                  </div>
                  <div className={idx % 2 === 0 ? "" : "md:order-1"}>
                    <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700 ring-1 ring-sky-100">{m.role}</span>
                    <h3 className="mt-3 text-2xl font-semibold text-[#2B4066]">{m.name}</h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{m.body}</p>
                    <ul className="mt-5 space-y-2.5">
                      {m.points.map((p) => (
                        <li key={p} className="flex items-start gap-2.5 text-sm text-slate-700">
                          <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Vision */}
      <section data-animate="section" className="px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">Unsere Vision</span>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#2B4066]">Qualität und Sicherheit, die man nachvollziehen kann</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Das DPI entstand aus eigener Erfahrung: Wir kommen aus der Praxis, vom Garten- und Landschaftsbau über Maschinenbau und Qualitätssicherung bis zur eigenen Produktentwicklung. Dabei haben wir gelernt, wie viel an sauberer Arbeit hängt, ob bei einem Produkt oder an einem Arbeitsplatz.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Unsere Vision ist ein Standard, dem man vertrauen kann. Gute Produkte sollen sich von der Masse abheben, und Betriebe sollen sicher arbeiten, ohne dass Sicherheit zur Papierpflicht wird. Beides gehört für uns zusammen: Qualität und Sicherheit, ehrlich geprüft und verständlich dokumentiert.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Deshalb arbeiten wir unabhängig, praxisnah und mit persönlicher Verantwortung. Was unser Haus verlässt, haben wir selbst geprüft.
            </p>
          </div>
        </div>
      </section>

      {/* Prinzipien */}
      <section data-animate="section" className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-semibold tracking-tight text-[#2B4066]">Warum DPI?</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map((p) => (
              <div key={p.title} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_-45px_rgba(43,64,102,0.35)] transition duration-300 hover:-translate-y-1">
                <ShieldCheck className="h-6 w-6 text-sky-600" aria-hidden="true" />
                <h3 className="mt-3 font-semibold text-slate-900">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Abschluss-CTA */}
      <section data-animate="section" className="px-6 pb-20 pt-6">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-b from-[#16294d] to-[#0b1730] p-8 text-center text-white shadow-[0_30px_70px_-35px_rgba(11,23,48,0.8)] sm:p-12">
          <h2 className="text-2xl font-semibold sm:text-3xl">Sprechen Sie mit uns</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            Ob Produkttest für Ihre Amazon-Produktseite oder Arbeitssicherheit für Ihren Betrieb: Wir melden uns persönlich bei Ihnen. Sitz: Kirchseestraße 2, 83666 Waakirchen, Landkreis Miesbach.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/kontakt" className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold !text-[#16294d] transition duration-300 hover:-translate-y-0.5 hover:bg-sky-50">
              Zum Kontaktformular
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
