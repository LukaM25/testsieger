import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  Clock,
  FileCheck2,
  Footprints,
  Handshake,
  HardHat,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  GraduationCap,
  Wrench,
  Euro,
  Cross,
  type LucideIcon,
} from "lucide-react";
import { PACKAGES_PRICING, eur } from "@/lib/arbeitssicherheit/pricing";
import AsProcess from "@/components/home/AsProcess";
import AsHeroVisual from "@/components/home/AsHeroVisual";
import JsonLd from "@/components/seo/JsonLd";
import { ORG, absoluteUrl, breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";

/**
 * FREIGABE: Die Seite ist bewusst noch nicht öffentlich.
 * - Lokal (npm run dev) ist sie sichtbar.
 * - In Produktion antwortet sie mit 404, solange SHOW_ARBEITSSICHERHEIT nicht auf "1" steht.
 * - Solange sie nicht freigegeben ist, steht sie auf noindex, nicht in der Sitemap und nicht in der Navigation.
 * Freischalten nach Abschluss der SiFa-Ausbildung (Sommer 2027):
 *   1. SHOW_ARBEITSSICHERHEIT=1 in der Umgebung setzen
 *   2. Preise in PACKAGES bestätigen
 *   3. In app/sitemap.ts, components/Navbar.tsx und components/home/Expertise.tsx verlinken
 */
export const dynamic = "force-dynamic";

const LIVE = true; // seit 22.11.2026 freigegeben; false sperrt die Seite wieder

export const metadata = pageMetadata({
  title: "Arbeitssicherheit für Handwerk und kleine Betriebe aus Oberbayern",
  description:
    "Fachkraft für Arbeitssicherheit aus der Praxis: Gefährdungsbeurteilung, Unterweisungen und sicherheitstechnische Betreuung nach DGUV Vorschrift 2 für kleine und mittlere Betriebe. Feste Preise, persönlich, aus dem Tegernseer Tal.",
  path: "/arbeitssicherheit",
  noindex: !LIVE,
});

/* ---------- Inhalte ---------- */

const duties: { Icon: LucideIcon; title: string; law: string; body: string }[] = [
  {
    Icon: ClipboardCheck,
    title: "Gefährdungsbeurteilung",
    law: "§ 5 ArbSchG",
    body: "Alle Gefahren am Arbeitsplatz erfassen, auch psychische Belastungen, daraus Schutzmaßnahmen ableiten und regelmäßig aktualisieren.",
  },
  {
    Icon: GraduationCap,
    title: "Unterweisung",
    law: "§ 12 ArbSchG",
    body: "Beschäftigte regelmäßig, verständlich und in der Arbeitszeit unterweisen. Die Unterweisung wird schriftlich festgehalten.",
  },
  {
    Icon: HardHat,
    title: "Fachkraft und Betriebsarzt",
    law: "ASiG, DGUV Vorschrift 2",
    body: "Eine Fachkraft für Arbeitssicherheit und ein Betriebsarzt werden schriftlich bestellt. Auch bei wenigen Beschäftigten.",
  },
  {
    Icon: Cross,
    title: "Erste Hilfe und Notfall",
    law: "§ 10 ArbSchG",
    body: "Erste Hilfe, Brandschutz und Evakuierung organisieren. Ab zwei Beschäftigten braucht es mindestens einen ausgebildeten Ersthelfer.",
  },
  {
    Icon: FileCheck2,
    title: "Dokumentation",
    law: "§ 6 ArbSchG",
    body: "Ergebnisse, Maßnahmen und Unterweisungen sind nachweisbar zu dokumentieren, zum Beispiel für die Berufsgenossenschaft.",
  },
];

const audiences = [
  "Holzverarbeitung und Schreinerei",
  "Metallbau und Schlosserei",
  "Bau und Ausbau",
  "Handwerksbetriebe",
  "Kleine Produktion und Werkstatt",
  "Handel und Lager",
  "Dienstleister mit Außeneinsatz",
];

const services: { Icon: LucideIcon; title: string; body: string }[] = [
  {
    Icon: ShieldCheck,
    title: "Sicherheitstechnische Betreuung",
    body: "Wir übernehmen die Betreuung als Fachkraft für Arbeitssicherheit nach ASiG und DGUV Vorschrift 2, abgestimmt auf Größe und Branche.",
  },
  {
    Icon: ClipboardCheck,
    title: "Gefährdungsbeurteilung",
    body: "Branchennah erstellt, verständlich aufgebaut und so geschrieben, dass Ihr Team damit arbeiten kann.",
  },
  {
    Icon: Footprints,
    title: "Begehung vor Ort",
    body: "Wir schauen uns Betrieb, Baustelle und Fahrzeuge an und zeigen, was in der Praxis wirklich zählt.",
  },
  {
    Icon: GraduationCap,
    title: "Unterweisungen",
    body: "Vorlagen und Termine für die Pflichtunterweisungen, inklusive Nachweis zum Abhaken und Ablegen.",
  },
  {
    Icon: FileCheck2,
    title: "Betriebsanweisungen und Nachweise",
    body: "Alles, was bei einer Kontrolle oder nach einem Unfall vorzeigbar sein muss, geordnet an einem Ort.",
  },
  {
    Icon: Wrench,
    title: "Beratung im Alltag",
    body: "Neue Maschine, neuer Mitarbeiter, neuer Auftrag: Sie rufen an, wir klären die Sicherheitsfragen dazu.",
  },
];

// TODO Ferdi: Preise bestätigen, bevor die Seite freigegeben wird. Aktuell Vorschläge (Stand 21.11., Mitte zwischen Freelancer und TÜV).
const PACKAGES = [
  {
    name: "Start",
    for: "Kleinstbetriebe bis 10 Beschäftigte",
    price: eur(PACKAGES_PRICING.start.tiers[0].monthly),
    unit: `pro Monat, netto, plus einmalige Ersteinrichtung ${eur(PACKAGES_PRICING.start.setup)}`,
    highlight: false,
    points: [
      "Kostenloses Erstgespräch",
      "Betreuung konform zur DGUV Vorschrift 2",
      "Feste Ansprechperson, Antwort in der Regel in 24 Stunden",
      "Gefährdungsbeurteilung für Ihre Branche",
      "Vorlagen für Unterweisungen und Nachweise",
      "Digitales Dashboard mit Dokumentenmappe und Fristen-Erinnerung per Mail",
      "Eine Begehung pro Jahr, Anfahrt je nach Entfernung",
      "Telefonische und schriftliche Beratung",
    ],
    cta: "Start wählen",
  },
  {
    name: "Betreuung",
    for: "Betriebe mit 11 bis 50 Beschäftigten",
    price: eur(PACKAGES_PRICING.betreuung.tiers[0].monthly),
    unit: `pro Monat, netto, gestaffelt nach Beschäftigten, plus einmalige Ersteinrichtung ${eur(PACKAGES_PRICING.betreuung.setup)}`,
    highlight: true,
    points: [
      "Alles aus Start",
      `${eur(PACKAGES_PRICING.betreuung.tiers[0].monthly)} für 11 bis 25, ${eur(PACKAGES_PRICING.betreuung.tiers[1].monthly)} für 26 bis 50 Beschäftigte`,
      "Zwei Begehungen pro Jahr, Anfahrt je nach Entfernung",
      "Eine Unterweisung pro Jahr durch uns im Betrieb und Notfall- und Fluchtplan inklusive",
    ],
    cta: "Betreuung wählen",
  },
  {
    name: "Enterprise",
    for: "Alles inklusive, bis 50 Beschäftigte",
    price: eur(PACKAGES_PRICING.enterprise.tiers[0].monthly),
    unit: `pro Monat, netto, plus einmalige Ersteinrichtung ${eur(PACKAGES_PRICING.enterprise.setup)}`,
    highlight: false,
    points: [
      "Alles aus Betreuung",
      "Begehungen und Unterweisungen im Betrieb nach Bedarf",
      "Prüffristen, Vorsorge, Ersthelfer und Gefahrstoffverzeichnis inklusive",
      "Betriebsanweisungen, Notfall- und Fluchtplan inklusive",
      "Anfahrt inklusive (bis 150 km)",
    ],
    cta: "Enterprise wählen",
  },
];

const principles: { Icon: LucideIcon; title: string; body: string }[] = [
  {
    Icon: HardHat,
    title: "Aus der Praxis",
    body: "Zehn Jahre Garten- und Landschaftsbau, Meister. Wir kennen Baustelle, Fahrzeug und Zeitdruck.",
  },
  {
    Icon: Euro,
    title: "Feste Preise",
    body: "Sie wissen vorher, was es kostet. Keine Stundenzettel, keine Überraschungen.",
  },
  {
    Icon: Handshake,
    title: "Persönlich",
    body: "Sie haben eine feste Ansprechperson und keine Hotline-Nummer.",
  },
  {
    Icon: BadgeCheck,
    title: "Ehrlich",
    body: "Wir sagen auch, wenn etwas nicht nötig ist. Sicherheit soll helfen, nicht beschäftigen.",
  },
];

const faqs = [
  {
    question: "Brauche ich als kleiner Betrieb eine Fachkraft für Arbeitssicherheit?",
    answer:
      "Ja, sobald Sie Beschäftigte haben. Das Arbeitssicherheitsgesetz verlangt die schriftliche Bestellung einer Fachkraft für Arbeitssicherheit und eines Betriebsarztes, auch bei wenigen Mitarbeitenden. Wie umfangreich die Betreuung sein muss, hängt von Beschäftigtenzahl und Branche ab und wird in der DGUV Vorschrift 2 geregelt. Für kleine Betriebe gibt es je nach Berufsgenossenschaft vereinfachte Modelle.",
  },
  {
    question: "Was gehört zum gesetzlichen Mindestmaß?",
    answer:
      "Dazu gehören eine Gefährdungsbeurteilung, regelmäßige und dokumentierte Unterweisungen, die Bestellung von Fachkraft und Betriebsarzt, Erste Hilfe und Notfallorganisation sowie der Nachweis der getroffenen Maßnahmen. Die Verantwortung bleibt beim Arbeitgeber. Wir helfen Ihnen, diese Pflichten sauber und nachweisbar zu erfüllen.",
  },
  {
    question: "Was unterscheidet Sie von großen Anbietern?",
    answer:
      "Große Anbieter sind auf Konzerne und mehrere Standorte ausgelegt. Für Betriebe mit drei, zwölf oder vierzig Beschäftigten sind deren Angebote oft zu umfangreich, zu teuer oder zu unpersönlich. Wir bauen unser Angebot genau für diese Betriebe: feste Preise, kurze Wege, eine Ansprechperson und Praxiserfahrung aus dem Handwerk.",
  },
  {
    question: "Was kostet die Betreuung?",
    answer:
      "Sie bekommen einen Festpreis, den wir nach einem kostenlosen Erstgespräch festlegen. Als Orientierung: Das Paket Start für Kleinstbetriebe beginnt ab 109 € im Monat, dazu kommt einmalig die Ersteinrichtung ab 390 €. Das Paket Betreuung beginnt ab 199 € im Monat für 11 bis 25 Beschäftigte und ab 299 € im Monat für 26 bis 50 Beschäftigte, jeweils netto. Der genaue Preis hängt von Beschäftigtenzahl, Branche und Gefährdungen ab.",
  },
  {
    question: "Übernehmen Sie die Verantwortung für die Arbeitssicherheit in meinem Betrieb?",
    answer:
      "Nein. Die Verantwortung liegt rechtlich beim Arbeitgeber und lässt sich nicht abgeben. Wir beraten, erstellen Unterlagen, begehen den Betrieb und unterstützen bei der Umsetzung. So haben Sie die Fachkraft, die das Gesetz verlangt, und einen Partner, der Ihnen die Arbeit abnimmt.",
  },
  {
    question: "Wie läuft der Start ab?",
    answer:
      "Sie schreiben uns oder rufen an. Im kostenlosen Erstgespräch klären wir Branche, Betriebsgröße und den aktuellen Stand. Danach folgen Begehung, Maßnahmenliste und die laufende Betreuung. Sie wissen jederzeit, was als Nächstes ansteht.",
  },
  {
    question: "Betreuen Sie auch Betriebe außerhalb von Oberbayern?",
    answer:
      "Unser Schwerpunkt liegt im Tegernseer Tal, im Raum Miesbach und in München. Beratung, Unterlagen und Betreuung können wir auch aus der Ferne leisten. Begehungen vor Ort stimmen wir mit Ihnen individuell ab.",
  },
  {
    question: "Hat das etwas mit dem DPI-Prüfsiegel für Produkte zu tun?",
    answer:
      "Nein. Produkttest und Arbeitssicherheit sind getrennte Leistungen mit eigenen Abläufen. Ein Prüfsiegel sagt nichts über die Arbeitssicherheit eines Betriebs aus, und umgekehrt.",
  },
];

/* ---------- Bausteine ---------- */

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <span className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${light ? "text-sky-200" : "text-sky-700"}`}>
      {children}
    </span>
  );
}

const card =
  "rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_60px_-45px_rgba(43,64,102,0.35)]";

const iconBox =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-sky-100 text-sky-700 ring-1 ring-sky-100";

const primaryBtn =
  "group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#16294d] px-7 py-3.5 text-sm font-semibold !text-white shadow-[0_14px_28px_-16px_rgba(29,78,216,0.7)] transition duration-300 hover:-translate-y-0.5";

export default function ArbeitssicherheitPage() {
  if (process.env.NODE_ENV === "production" && !LIVE) notFound();

  const url = absoluteUrl("/arbeitssicherheit");

  return (
    <main className="bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            "@id": `${url}#service`,
            name: "Arbeitssicherheit und sicherheitstechnische Betreuung für kleine und mittlere Betriebe",
            serviceType: "Fachkraft für Arbeitssicherheit",
            description:
              "Gefährdungsbeurteilung, Unterweisungen, Begehungen und sicherheitstechnische Betreuung nach ASiG und DGUV Vorschrift 2 für Handwerk und kleine Betriebe.",
            url,
            provider: { "@id": absoluteUrl("/#organization") },
            areaServed: [
              { "@type": "AdministrativeArea", name: "Oberbayern" },
              { "@type": "Country", name: "Deutschland" },
            ],
            audience: { "@type": "BusinessAudience", name: "Handwerksbetriebe und kleine Unternehmen" },
          },
          faqJsonLd(faqs, "/arbeitssicherheit"),
          breadcrumbJsonLd([
            { name: "Start", path: "/" },
            { name: "Arbeitssicherheit", path: "/arbeitssicherheit" },
          ]),
        ]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 px-6 py-12 text-white sm:py-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0b1730] to-[#16294d]" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-0 h-80 w-80 animate-pulse rounded-full bg-emerald-500/15 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_440px] lg:gap-12">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              Arbeitssicherheit aus dem Tegernseer Tal
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
              Sicherheit, die <span className="text-emerald-400">Vertrauen</span> schafft.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-200">
              Das ist der rechtliche Mindestrahmen, den Ihr Betrieb erfüllen muss. Wir sind die smarte Lösung, die diese gesetzlichen Pflichten und alle Fristen für Sie einhält: sauber, nachweisbar und ohne Konzern-Bürokratie. Von einer Fachkraft für Arbeitssicherheit, die selbst aus dem Handwerk kommt.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link href="/kontakt?kategorie=safety" className={`${primaryBtn} ring-1 ring-white/30`}>
                Kostenloses Erstgespräch
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <a href="#pakete" className="text-sm font-semibold text-sky-300 hover:underline">
                Pakete und Preise ansehen
              </a>
            </div>
            <ul className="mt-8 grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
              {[
                "Aus der Praxis, Meister im Garten- und Landschaftsbau",
                "Feste Preise, keine Stundenzettel",
                "Persönlich, aus dem Tegernseer Tal",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <AsHeroVisual />
        </div>
      </section>

      {/* Ablauf */}
      <section data-animate="section" className="px-6 pb-4 pt-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <Eyebrow>Ablauf</Eyebrow>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#2B4066]">In vier Schritten zur geregelten Arbeitssicherheit</h2>
          </div>
          <AsProcess />
        </div>
      </section>

      {/* Pflichten */}
      <section data-animate="section" className="px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <Eyebrow>Der rechtliche Rahmen</Eyebrow>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#2B4066]">Was jeder Betrieb mit Beschäftigten erfüllen muss</h2>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">
            Das Arbeitsschutzgesetz gilt für alle Betriebe, unabhängig von Branche und Größe. Fünf Punkte bilden das Mindestmaß. Die Verantwortung dafür liegt beim Arbeitgeber, wir helfen Ihnen, sie sauber umzusetzen.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {duties.map(({ Icon, title, law, body }) => (
              <article key={title} className={`${card} p-6 transition duration-300 hover:-translate-y-1`}>
                <div className="flex items-center justify-between gap-3">
                  <span className={iconBox}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">{law}</span>
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{body}</p>
              </article>
            ))}
            <article className="group/cta relative flex flex-col justify-between overflow-hidden rounded-3xl border border-blue-900/40 bg-gradient-to-b from-[#16294d] to-[#0b1730] p-6 text-white shadow-[0_30px_70px_-35px_rgba(11,23,48,0.8)] transition duration-300 hover:-translate-y-1">
              <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-emerald-400/15 blur-3xl transition duration-700 group-hover/cta:bg-emerald-400/25" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  Für Sie erledigt
                </span>
                <h3 className="mt-3 text-xl font-semibold leading-snug">Wir nehmen Ihnen die Arbeit ab</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">
                  Die Verantwortung bleibt bei Ihnen. Den Papierkram und die Fristen übernehmen wir.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-white/90">
                  {["Unterlagen erstellt und belegt", "Fristen und Unterweisungen im Blick", "Alles griffbereit für Prüfung und BG"].map((t) => (
                    <li key={t} className="flex items-center gap-2.5">
                      <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative mt-6">
                <a
                  href="#pakete"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold !text-[#16294d] shadow-[0_14px_28px_-16px_rgba(0,0,0,0.6)] transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-50"
                >
                  Pakete und Preise ansehen
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </a>
                <p className="mt-2.5 text-center text-xs text-white/60">Feste Preise, unverbindlich anfragen</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Marktlücke */}
      <section data-animate="section" className="px-6 py-14">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          <div>
            <Eyebrow>Unser Platz im Markt</Eyebrow>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#2B4066]">Für Betriebe, die zwischen den Stühlen sitzen</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Große Anbieter sind auf Konzerne und mehrere Standorte ausgelegt. Wer drei, zwölf oder vierzig Leute beschäftigt, bekommt dort oft ein Angebot, das zu groß, zu teuer oder zu unpersönlich ist. Viele kleine Betriebe lassen das Thema dann liegen oder lösen es nur auf dem Papier.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Genau für diese Betriebe haben wir unser Angebot gebaut: verständlich, fair im Preis und mit jemandem am Telefon, der weiß, wie es auf einer Baustelle oder im Betriebshof aussieht.
            </p>
          </div>
          <div className={`${card} p-7`}>
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Das sind unsere Betriebe</h3>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {audiences.map((a) => (
                <li key={a} className="flex items-center gap-2.5 text-[15px] text-slate-700">
                  <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Leistungen */}
      <section data-animate="section" className="px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <Eyebrow>Leistungen</Eyebrow>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#2B4066]">Was wir für Ihren Betrieb übernehmen</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map(({ Icon, title, body }) => (
              <article key={title} className={`${card} p-6 transition duration-300 hover:-translate-y-1`}>
                <span className={iconBox}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Pakete */}
      <section id="pakete" data-animate="section" className="scroll-mt-28 px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <Eyebrow>Pakete und Preise</Eyebrow>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#2B4066]">Feste Preise, die Sie vorher kennen</h2>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">
            Welche Betreuung Ihr Betrieb braucht, hängt von Beschäftigtenzahl und Branche ab. Im kostenlosen Erstgespräch legen wir gemeinsam den Festpreis fest. Nach der Wahl können Sie Ihr Paket noch individuell anpassen.
          </p>
          <div className="mt-8 flex items-start gap-4 rounded-3xl border border-emerald-300/70 bg-gradient-to-r from-emerald-50 to-white p-5 shadow-[0_20px_60px_-45px_rgba(16,185,129,0.6)] sm:items-center sm:p-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-lg font-semibold text-[#2B4066]">In jedem Paket sind die gesetzlichen Mindestanforderungen enthalten</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">
                Jeder Betrieb mit Beschäftigten muss einen gesetzlichen Rahmen einhalten. Genau dieser Rahmen ist in Start und Betreuung fest enthalten, damit Sie rechtlich auf der sicheren Seite sind. Zusätze kommen nur obendrauf.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {PACKAGES.map((p) => (
              <article
                key={p.name}
                className={`flex flex-col rounded-3xl border p-7 transition duration-500 hover:-translate-y-1 ${
                  p.highlight
                    ? "border-blue-900/40 bg-gradient-to-b from-[#16294d] to-[#0b1730] text-white shadow-[0_30px_70px_-35px_rgba(11,23,48,0.8)]"
                    : "border-slate-200/80 bg-white shadow-[0_20px_60px_-45px_rgba(43,64,102,0.35)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className={`text-xl font-semibold ${p.highlight ? "text-white" : "text-[#2B4066]"}`}>{p.name}</h3>
                  {p.highlight && (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-sky-200 ring-1 ring-white/15">
                      Meist gewählt
                    </span>
                  )}
                </div>
                <p className={`mt-1 text-sm ${p.highlight ? "text-white/70" : "text-slate-500"}`}>{p.for}</p>
                <p className={`mt-6 text-3xl font-semibold tracking-tight ${p.highlight ? "text-white" : "text-[#2B4066]"}`}>
                  {p.price !== "Auf Anfrage" && <span className={`mr-1.5 text-sm font-medium ${p.highlight ? "text-white/70" : "text-slate-500"}`}>ab</span>}
                  {p.price}
                </p>
                <p className={`mt-0.5 text-xs ${p.highlight ? "text-white/60" : "text-slate-500"}`}>{p.unit}</p>
                {(
                  <p className={`mt-6 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${p.highlight ? "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/30" : "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"}`}><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />Gesetzliche Mindestanforderungen inklusive</p>
                )}
                <ul className={`mt-3 space-y-2.5`}>
                  {p.points.map((pt) => (
                    <li key={pt} className={`flex items-start gap-2.5 text-sm ${p.highlight ? "text-white/90" : "text-slate-700"}`}>
                      <BadgeCheck className={`mt-0.5 h-5 w-5 shrink-0 ${p.highlight ? "text-emerald-300" : "text-emerald-600"}`} aria-hidden="true" />
                      {pt}
                    </li>
                  ))}
                </ul>
                {p.name !== "Enterprise" && (
                  <p className={`mt-5 rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${p.highlight ? "bg-white/10 text-white/80" : "bg-slate-50 text-slate-600"}`}>
                    <span className="font-semibold">Zusätzlich buchbar:</span> weitere Leistungen. Auswahl und Preise sehen Sie nach der Paketwahl.
                  </p>
                )}
                <div className="mt-auto pt-7">
                  <Link
                    href={`/arbeitssicherheit/paket?p=${p.name.toLowerCase()}`}
                    className={`group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 ${
                      p.highlight ? "bg-white !text-[#16294d] hover:bg-sky-50" : "bg-[#2B4066] !text-white hover:bg-[#1e3050]"
                    }`}
                  >
                    {p.cta}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-5 text-xs leading-relaxed text-slate-500">
            Alle Preise netto zuzüglich Umsatzsteuer. Umfang und Einsatzzeiten richten sich nach Beschäftigtenzahl, Branche und der Regelung Ihrer Berufsgenossenschaft (DGUV Vorschrift 2).
          </p>
        </div>
      </section>

      {/* Person */}
      <section data-animate="section" className="px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <div className={`${card} grid gap-8 overflow-hidden p-6 sm:p-8 md:grid-cols-[220px,1fr] md:items-center`}>
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[220px] overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200/80">
              <Image
                src="/ueberuns/ferdinand-lang.jpeg"
                alt="Ferdinand Lang, Fachkraft für Arbeitssicherheit beim Deutschen Prüfsiegel Institut"
                fill
                sizes="220px"
                className="object-cover"
              />
            </div>
            <div>
              <Eyebrow>Ihr Ansprechpartner</Eyebrow>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#2B4066] sm:text-3xl">Ferdinand Lang</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Fachkraft für Arbeitssicherheit, Meister im Garten- und Landschaftsbau</p>
              <p className="mt-4 text-base leading-8 text-slate-600">
                Ich habe zehn Jahre im Garten- und Landschaftsbau gearbeitet, 2023 den Meister gemacht und kenne den Alltag auf der Baustelle: Zeitdruck, wechselnde Teams, Maschinen, Fahrzeuge. Arbeitssicherheit muss dort funktionieren und nicht nur im Ordner stehen. Dafür stehe ich ein.
              </p>
              <ul className="mt-5 grid gap-2.5 text-sm text-slate-700 sm:grid-cols-2">
                {["Zehn Jahre Garten- und Landschaftsbau", "Meister (2023)", "Fachkraft für Arbeitssicherheit", "Direkter Draht, keine Hotline"].map((t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Prinzipien */}
      <section data-animate="section" className="px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-semibold tracking-tight text-[#2B4066]">Warum Betriebe mit uns arbeiten</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map(({ Icon, title, body }) => (
              <div key={title} className={`${card} p-6 transition duration-300 hover:-translate-y-1`}>
                <Icon className="h-6 w-6 text-sky-600" aria-hidden="true" />
                <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section data-animate="section" className="px-6 py-14">
        <div className="mx-auto max-w-3xl">
          <Eyebrow>Häufige Fragen</Eyebrow>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#2B4066]">Antworten zur Arbeitssicherheit im Betrieb</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((f) => (
              <details key={f.question} className={`group ${card} rounded-2xl`}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
                  <h3 className="text-base font-semibold text-[#2B4066] sm:text-lg">{f.question}</h3>
                  <span aria-hidden="true" className="text-xl text-slate-400 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="px-5 pb-5 leading-7 text-slate-600 sm:px-6 sm:pb-6">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Abschluss */}
      <section data-animate="section" className="px-6 pb-24 pt-10">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-3xl border border-blue-900/40 bg-gradient-to-b from-[#16294d] to-[#0b1730] px-7 py-12 text-white shadow-[0_30px_70px_-35px_rgba(11,23,48,0.8)] sm:px-12">
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
            <div className="relative max-w-2xl">
              <Eyebrow light>Nächster Schritt</Eyebrow>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Klären wir, wo Ihr Betrieb steht.</h2>
              <p className="mt-3 text-base leading-relaxed text-white/80">
                Im kostenlosen Erstgespräch sehen wir gemeinsam, was Pflicht ist, was schon passt und was noch fehlt. Unverbindlich und ohne Fachchinesisch.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link
                  href="/kontakt?kategorie=safety"
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold !text-[#16294d] transition duration-300 hover:-translate-y-0.5 hover:bg-sky-50"
                >
                  Erstgespräch anfragen
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </Link>
                <a href={`tel:${ORG.telephone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 text-sm font-semibold !text-white hover:underline">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {ORG.telephone}
                </a>
                <a href={`mailto:${ORG.email}`} className="inline-flex items-center gap-2 text-sm font-semibold !text-white hover:underline">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  {ORG.email}
                </a>
              </div>
              <p className="mt-6 flex items-center gap-2 text-xs text-white/60">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Antwort in der Regel innerhalb von 24 Stunden, Mo bis Fr, 9 bis 17 Uhr
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
