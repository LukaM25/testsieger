import Link from 'next/link';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from '@/lib/seo';
import { ArrowRight, HardHat, ShieldCheck, type LucideIcon } from 'lucide-react';

export const metadata = pageMetadata({
  title: 'FAQ: Produkttest, Prüfsiegel, Kosten und Arbeitssicherheit',
  description:
    'Antworten auf häufige Fragen: Was kostet der Produkttest, wie lange dauert die Prüfung, was erhalte ich nach bestandener Prüfung und wie läuft Arbeitssicherheit ab?',
  path: '/faq',
});

type Faq = { question: string; answer: string };

const produkttest: Faq[] = [
  {
    question: 'Was genau wird geprüft?',
    answer:
      'Wir prüfen Konsumprodukte anhand klar definierter und transparenter Prüfkriterien nach DPI-Standard. Abhängig von der Produktkategorie bewerten wir unter anderem Verarbeitung, Funktion, Sicherheit, Praxistauglichkeit und Dokumentation.',
  },
  {
    question: 'Was kostet der Produkttest?',
    answer:
      'Für den Prüfaufwand fällt eine einmalige Testgebühr von 179 € netto pro Produkt an. Bei 2 Produkten sparen Sie 20 %, ab 3 Produkten 30 %. Den Lizenzplan wählen Sie erst nach bestandener Prüfung.',
  },
  {
    question: 'Muss ich mich vorher anmelden?',
    answer:
      'Nein. Sie können Ihr Produkt direkt testen lassen: Produktdaten eingeben, Testgebühr zahlen, fertig. Ihr Konto legen wir automatisch an. Nach der Zahlung erhalten Sie Ihre Zugangsdaten für das Kundendashboard per E-Mail.',
  },
  {
    question: 'Was ist der kostenlose Pre-Check?',
    answer:
      'Der Pre-Check ist der kostenlose erste Schritt, bevor Sie Ihr Produkt an uns senden. Wenn Sie sofort starten möchten, können Sie auch direkt testen lassen.',
  },
  {
    question: 'Wie lange dauert eine Prüfung?',
    answer:
      'Nach Eingang des Produkts dauert ein vollständiger Produkttest inklusive Prüfbericht und Zertifikat in der Regel 14 bis 21 Tage. Mit dem Prioritäts-Service kann sich die Bearbeitungszeit verkürzen.',
  },
  {
    question: 'Was passiert, wenn ein Produkt die Prüfung nicht besteht?',
    answer:
      'Sie erhalten eine klare Rückmeldung zu den nicht erfüllten Punkten. Anschließend können Sie das Produkt anpassen und erneut kostenlos zur Prüfung einreichen. Ein Prüfsiegel wird erst nach bestandener Prüfung vergeben.',
  },
  {
    question: 'Was erhalte ich nach bestandener Prüfung?',
    answer:
      'Sie erhalten das Testergebnis, einen detaillierten Prüfbericht, ein Zertifikat und das Prüfsiegel als PNG-Datei. Danach wählen Sie den passenden Lizenzplan für die vereinbarte Nutzung.',
  },
  {
    question: 'Wie wird bewertet und ab welcher Note gibt es das Prüfsiegel?',
    answer:
      'Wir bewerten vier Kriterien: Produktschutz und Verpackung, Verarbeitung und Erscheinungsbild, Praxistest sowie Preis-Leistung und Nutzerstimmen. Daraus ergibt sich ein gewichteter Durchschnitt als Schulnote von 1,0 bis 6,0. Zertifikat und Prüfsiegel gibt es ab Note 3,0, das entspricht 64 % der möglichen Punkte. Schlechter bewertete Produkte erhalten kein Siegel.',
  },
  {
    question: 'Was kosten die Lizenzpläne für das Prüfsiegel?',
    answer:
      'Basic kostet 177 € pro Jahr (ein Verkaufskanal, Sprache Deutsch), Premium 225 € pro Jahr (alle Verkaufskanäle und Sprachen), Lifetime 689 € einmalig ohne Folgekosten. Alle Preise gelten netto pro Produkt. Ab 2 Produkten gibt es 20 % Rabatt, ab 3 Produkten 30 %. Der Lizenzplan wird erst nach bestandener Prüfung gewählt.',
  },
  {
    question: 'Wo sitzt das Deutsche Prüfsiegel Institut und für wen prüfen Sie?',
    answer:
      'Das DPI hat seinen Sitz in Waakirchen im Landkreis Miesbach in Oberbayern. Wir prüfen Produkte von Amazon-Sellern, Herstellern und Händlern in ganz Deutschland. Die Beauftragung läuft online, das Produkt senden Sie uns per Post zu.',
  },
  {
    question: 'Warum gibt es eine jährliche Lizenz?',
    answer:
      'Die Jahreslizenz stellt sicher, dass Produkt und Prüfsiegel aktuell bleiben und das Siegel ausschließlich im vereinbarten Rahmen verwendet wird. Ohne aktive Lizenz endet das Nutzungsrecht.',
  },
  {
    question: 'Was passiert nach einer Kündigung?',
    answer:
      'Nach dem Ende des Gültigkeitszeitraums erlischt das Nutzungsrecht. Das Prüfsiegel muss dann aus Verpackungen, Webseiten und weiteren Marketingkanälen entfernt werden.',
  },
];

const arbeitssicherheit: Faq[] = [
  {
    question: 'Was bieten Sie im Bereich Arbeitssicherheit an?',
    answer:
      'Wir unterstützen Unternehmen dabei, Risiken am Arbeitsplatz sichtbar zu machen und Arbeitssicherheit praxisnah und nachvollziehbar zu dokumentieren, orientiert an den Vorgaben der DGUV.',
  },
  {
    question: 'Für wen ist das Angebot gedacht?',
    answer:
      'Für Betriebe, die ihre Arbeitssicherheit strukturiert aufstellen oder verbessern möchten. Sprechen Sie uns an, wir klären gemeinsam, was in Ihrem Betrieb sinnvoll ist.',
  },
  {
    question: 'Wie läuft die Zusammenarbeit ab?',
    answer:
      'Sie nehmen über das Kontaktformular Kontakt mit uns auf. Wir klären Ihren Bedarf in einem kurzen Gespräch und erstellen Ihnen anschließend ein individuelles Angebot.',
  },
  {
    question: 'Was kostet Arbeitssicherheit bei Ihnen?',
    answer:
      'Das hängt von Betriebsgröße und Umfang ab. Deshalb gibt es keine Pauschalpreise: Nach einem kurzen Gespräch erhalten Sie ein individuelles Angebot.',
  },
  {
    question: 'Hat Arbeitssicherheit etwas mit dem Prüfsiegel zu tun?',
    answer:
      'Nein. Produkttest und Arbeitssicherheit sind getrennte Leistungen mit eigenen Abläufen. Ein Prüfsiegel sagt nichts über die Arbeitssicherheit eines Betriebs aus, und umgekehrt.',
  },
];

function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details
          key={item.question}
          className="group rounded-2xl border border-slate-200/80 bg-white shadow-[0_20px_60px_-45px_rgba(43,64,102,0.35)]"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
            <h3 className="text-base font-semibold text-[#2B4066] sm:text-lg">{item.question}</h3>
            <span aria-hidden="true" className="text-xl text-slate-400 transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="px-5 pb-5 leading-7 text-slate-600 sm:px-6 sm:pb-6">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

function Section({
  id,
  Icon,
  eyebrow,
  title,
  lead,
  items,
}: {
  id: string;
  Icon: LucideIcon;
  eyebrow: string;
  title: string;
  lead: string;
  items: Faq[];
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="mb-6 flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 text-sky-700 ring-1 ring-sky-100">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700/80">{eyebrow}</p>
          <h2 className="text-2xl font-semibold tracking-tight text-[#2B4066] sm:text-3xl">{title}</h2>
          <p className="mt-1 text-slate-600">{lead}</p>
        </div>
      </div>
      <FaqList items={items} />
    </section>
  );
}

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <JsonLd
        data={[
          faqJsonLd([...produkttest, ...arbeitssicherheit], '/faq'),
          breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'FAQ', path: '/faq' }]),
        ]}
      />
      <section className="border-b border-slate-200/70 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-14 text-center sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-700/80">FAQ</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#2B4066] sm:text-5xl">Häufig gestellte Fragen</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Wählen Sie Ihr Thema. Produkttest und Arbeitssicherheit sind getrennte Leistungen.
          </p>
          <div className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-2">
            {[
              { href: '#produkttest', Icon: ShieldCheck, label: 'Produkttest', sub: 'Prüfung, Siegel, Lizenz' },
              { href: '#arbeitssicherheit', Icon: HardHat, label: 'Arbeitssicherheit', sub: 'Beratung für Betriebe' },
            ].map(({ href, Icon, label, sub }) => (
              <a
                key={href}
                href={href}
                className={`${href === '#arbeitssicherheit' ? 'as-only ' : ''}group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-[0_20px_60px_-45px_rgba(43,64,102,0.35)] transition duration-300 hover:-translate-y-0.5 hover:border-sky-300`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-sky-100 text-sky-700 ring-1 ring-sky-100">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="flex-1">
                  <span className="block font-semibold text-[#2B4066]">{label}</span>
                  <span className="block text-sm text-slate-500">{sub}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-16 px-6 py-16">
        <Section
          id="produkttest"
          Icon={ShieldCheck}
          eyebrow="Produkttest"
          title="Produkttest & Prüfsiegel"
          lead="Alles zu Prüfung, Kosten, Siegel und Lizenz."
          items={produkttest}
        />

        <div className="as-only space-y-16">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          <Section
            id="arbeitssicherheit"
            Icon={HardHat}
            eyebrow="Arbeitssicherheit"
            title="Arbeitssicherheit"
            lead="Unterstützung für Betriebe, individuell und auf Anfrage."
            items={arbeitssicherheit}
          />
        </div>

        <div className="rounded-3xl bg-gradient-to-b from-[#16294d] to-[#0b1730] px-6 py-8 text-center text-white sm:px-10">
          <h2 className="text-2xl font-semibold">Ihre Frage ist noch offen?</h2>
          <p className="mt-3 text-white/75">Unser Team hilft Ihnen gerne persönlich weiter.</p>
          <Link
            href="/kontakt"
            className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold !text-[#16294d] transition hover:bg-slate-100"
          >
            Kontakt aufnehmen
          </Link>
        </div>
      </div>
    </div>
  );
}
