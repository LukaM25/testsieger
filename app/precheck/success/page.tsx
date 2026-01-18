import Image from 'next/image';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth';
import { LOCALE_COOKIE, normalizeLocale } from '@/lib/i18n';

export const metadata = {
  title: 'Pre-Check bestanden – Prüfsiegel Zentrum UG',
  description: 'Nächste Schritte nach bestandenem Pre-Check inklusive Testgebühr, Versand und Lizenzplänen.',
};

type Props = {
  searchParams?: { product?: string };
};

export default async function PrecheckSuccessPage({ searchParams }: Props) {
  const jar = await cookies();
  const locale = normalizeLocale(jar.get(LOCALE_COOKIE)?.value);
  const tr = (de: string, en: string) => (locale === 'en' ? en : de);
  const session = await getSession();
  const previewMulti =
    process.env.NODE_ENV !== 'production' &&
    searchParams?.previewMulti === '1' &&
    searchParams?.multiVariant === '2';
  const productName =
    typeof searchParams?.product === 'string' && searchParams.product.trim().length > 0
      ? searchParams.product.trim()
      : null;
  const previewProducts = [
    tr('Kaffeemaschine Pro', 'Coffee Machine Pro'),
    tr('Smart Lampe', 'Smart Lamp'),
    tr('Bürostuhl Ergo', 'Ergo Office Chair'),
  ];

  if (previewMulti) {
    return (
      <main className="bg-slate-950 text-white">
        <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="rounded-3xl bg-slate-900/70 p-8 shadow-2xl ring-1 ring-white/10 md:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
              {tr('Mehrfachzahlung bestätigt', 'Multi-payment confirmed')}
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-white md:text-5xl">
              {tr('Zahlung bestätigt für 3 Produkte', 'Payment confirmed for 3 products')}
            </h1>
            <p className="mt-4 max-w-3xl text-base text-slate-200 md:text-lg">
              {tr(
                'Wir haben die Testgebühr erhalten. Bitte senden Sie alle Produkte gemeinsam an uns. Die Versandadresse und Rechnung kommen per E-Mail.',
                'We’ve received the test fee. Please send all products together. The shipping address and invoice arrive by email.'
              )}
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-[1.3fr,1fr]">
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl md:p-8">
              <h2 className="text-xl font-semibold text-white">
                {tr('Bezahlt für', 'Paid for')}
              </h2>
              <div className="mt-4 grid gap-3">
                {previewProducts.map((name) => (
                  <div key={name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-800/60 px-4 py-3">
                    <span className="text-sm font-semibold text-white">{name}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                      {tr('Bezahlt', 'Paid')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-slate-900 p-6 shadow-xl md:p-8">
              <h2 className="text-xl font-semibold text-white">
                {tr('Versandhinweise', 'Shipping instructions')}
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-200">
                <li>{tr('Alle Produkte gemeinsam versenden.', 'Send all products together.')}</li>
                <li>{tr('Artikelnummer je Produkt beilegen.', 'Include the item code for each product.')}</li>
                <li>{tr('Wir melden uns nach Wareneingang.', 'We’ll notify you after receipt.')}</li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <button className="rounded-full bg-emerald-400 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900">
                  {tr('Zum Dashboard', 'Go to dashboard')}
                </button>
                <button className="rounded-full border border-white/30 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                  {tr('Rechnung anzeigen', 'View invoice')}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const testOptions = [
    {
      title: tr('Produkttest Checkout', 'Product test checkout'),
      price: tr('229 € zzgl. MwSt.', '€229 plus VAT'),
      timeline: tr('14–17 Werktage nach Wareneingang', '14–17 business days after receipt'),
      detail: tr('Standard-Bearbeitung nach Zahlungseingang und Wareneingang.', 'Standard processing once payment and delivery are received.'),
    },
    {
      title: tr('Produkttest Priority', 'Product test priority'),
      price: tr('229 € + 60 € zzgl. MwSt.', '€229 + €60 plus VAT'),
      timeline: tr('4–7 Werktage nach Wareneingang', '4–7 business days after receipt'),
      detail: tr('Beschleunigte Prüfung mit priorisierter Auswertung.', 'Accelerated testing with prioritised reporting.'),
    },
  ];

  const plans = [
    {
      name: 'Basic',
      price: tr('0,99 € / Tag (jährlich)', '€0.99 / day (yearly)'),
      reach: tr('DE · 1 Kanal', 'DE · 1 channel'),
    },
    {
      name: 'Premium',
      price: tr('1,47 € / Tag (jährlich)', '€1.47 / day (yearly)'),
      reach: tr('EU-Sprachen · alle Kanäle', 'EU languages · all channels'),
    },
    {
      name: 'Lifetime',
      price: tr('1466 € einmalig', '€1466 one-time'),
      reach: tr('Zertifikat & Bericht · alle Kanäle', 'Certificate & report · all channels'),
    },
  ];

  const listingShots = [
    { src: '/lampen.png', alt: tr('Produktlisting mit Siegel', 'Product listing with seal') },
    { src: '/images/expertise-produkt.png', alt: tr('Siegel im Marktplatz', 'Seal on marketplace listing') },
    { src: '/images/footer-band.jpg', alt: tr('Detailansicht mit QR', 'Detail view with QR') },
  ];

  return (
    <main className="bg-white">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            {tr('Ergebnis', 'Result')}
          </p>
          <h1 className="text-4xl font-bold text-slate-900">
            {tr('Pre-Check bestanden', 'Pre-check passed')}
          </h1>
          <p className="text-lg text-slate-600">
            {tr(
              'Ihr Produkt ist bereit für den nächsten Schritt. Zahlen Sie jetzt die Testgebühr und senden Sie das Muster an uns.',
              'Your product is ready for the next step. Pay the test fee now and send the sample to us.'
            )}
          </p>
          {productName && (
            <p className="text-sm text-slate-500">
              {tr('Produkt:', 'Product:')} <span className="font-semibold text-slate-700">{productName}</span>
            </p>
          )}
          {session?.email && (
            <p className="text-xs text-slate-500">
              {tr('Bestätigung an', 'Confirmation sent to')} {session.email}
            </p>
          )}
        </div>

        <ol className="mt-12 space-y-8 list-decimal list-inside sm:list-outside sm:pl-6">
          <li className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <div className="text-xl font-semibold text-slate-900">
              {tr('Produkt jetzt an uns senden', 'Send your product to us now')}
            </div>
            <p className="mt-3 text-slate-700">
              {tr(
                'Es wird eine einmalige Testgebühr von 229 € zzgl. MwSt. fällig. Nach der Zahlung erhalten Sie die Rechnung und die Versandadresse per E-Mail.',
                'A one-time test fee of €229 plus VAT is due. After payment you will receive the invoice and the shipping address via email.'
              )}
            </p>
          </li>

          <li className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xl font-semibold text-slate-900">
              {tr('Produktprüfung', 'Product testing')}
            </div>
            <p className="mt-3 text-slate-700">
              {tr(
                'Die Prüfung erfolgt im von Ihnen gewählten Zeitfenster nach Wareneingang.',
                'Testing takes place in your chosen time window after we receive the product.'
              )}
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {testOptions.map((option) => (
                <div
                  key={option.title}
                  className="rounded-2xl border border-amber-200 p-5 shadow-sm"
                  style={{ backgroundColor: '#F8C471' }}
                >
                  <div className="text-lg font-semibold text-slate-900">{option.title}</div>
                  <div className="mt-2 text-sm font-semibold text-slate-800">{option.price}</div>
                  <p className="mt-1 text-sm text-slate-800">{option.timeline}</p>
                  <p className="mt-2 text-sm text-slate-700">{option.detail}</p>
                </div>
              ))}
            </div>
          </li>

          <li className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <div className="text-xl font-semibold text-slate-900">
              {tr('Lizenzgebühren', 'License fees')}
            </div>
            <p className="mt-3 text-slate-700">
              {tr(
                'Lizenzgebühren fallen erst an, wenn das Siegel freigegeben ist und die Testergebnisse vorliegen.',
                'License fees only start once the seal is approved and your test results are ready.'
              )}
            </p>
          </li>

          <li className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xl font-semibold text-slate-900">
              {tr('Lizenzplan auswählen und Siegel erhalten', 'Select a license plan and receive your seal')}
            </div>
            <p className="mt-3 text-slate-700">
              {tr(
                'Wählen Sie nach bestandenem Test den passenden Plan für Ihren Vertriebskanal.',
                'After passing the test, choose the plan that fits your sales channels.'
              )}
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <div key={plan.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <div className="text-lg font-semibold text-slate-900">{plan.name}</div>
                  <div className="mt-2 text-base font-semibold text-slate-800">{plan.price}</div>
                  <p className="mt-2 text-sm text-slate-700">{plan.reach}</p>
                </div>
              ))}
            </div>
          </li>
        </ol>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">
              {tr('Mach dein Listing sichtbar', 'Make your listing stand out')}
            </h2>
            <p className="text-slate-700">
              {tr(
                'Das Prüfsiegel erhöht Sichtbarkeit und Conversion, weil Käufer die Bewertung nachvollziehen können.',
                'The seal increases visibility and conversion because buyers can verify the assessment instantly.'
              )}
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listingShots.map((shot) => (
              <div key={shot.src} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="relative aspect-[4/3]">
                  <Image src={shot.src} alt={shot.alt} fill className="object-cover" />
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-slate-900">{shot.alt}</p>
                  <p className="text-xs text-slate-500">
                    {tr('Beispielhafte Darstellung mit Siegel und QR-Verlinkung.', 'Example display with seal and QR link.')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
