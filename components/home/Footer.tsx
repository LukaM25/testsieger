import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-12 border-t bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="text-xl font-semibold">Deutsches Prüf­siegel Institut</div>
            <p className="mt-3 text-sm text-gray-600">
              Unabhängiges, privatwirtschaftliches Prüfinstitut für Verbrauchertests – keine staatliche Institution.
            </p>
            <p className="mt-3 text-xs text-gray-500">© {new Date().getFullYear()} Prüfsiegel Zentrum UG.</p>
          </div>

          <div>
            <div className="text-sm font-semibold">Service</div>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li><Link href="/produkte/produkttest" className="hover:underline">Produktzertifizierung</Link></li>
              <li><Link href="/lizenzen" className="hover:underline">Lizenzsuche</Link></li>
              <li><Link href="/kontakt" className="hover:underline">Kontakt</Link></li>
              <li><Link href="/kundenportal" className="hover:underline">Kundenportal</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold">Das Institut</div>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li><Link href="/precheck" className="hover:underline">Kostenloser Pre-Check</Link></li>
              <li><Link href="/produkte/produkttest" className="hover:underline">Produkt testen lassen</Link></li>
              <li><Link href="/testergebnisse" className="hover:underline">Testergebnisse</Link></li>
              <li><Link href="/verfahren" className="hover:underline">Prüfverfahren</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold">Rechtliches</div>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li><Link href="/impressum" className="hover:underline">Impressum</Link></li>
              <li><Link href="/datenschutz" className="hover:underline">Datenschutz</Link></li>
              <li><Link href="/agb" className="hover:underline">AGB</Link></li>
            </ul>
          </div>
        </div>
      </div>
      {/* subtle band like in the screenshot */}
      <div className="h-24 w-full bg-[url('/images/footer-band.jpg')] bg-cover bg-center opacity-80" />
    </footer>
  );
}
