import TranslationNotice from "@/components/TranslationNotice";

export default function DatenschutzPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-gray-700 leading-relaxed">
      <TranslationNotice />
      <h1 className="text-3xl font-semibold text-[#2e4053] mb-4">Datenschutzerklärung</h1>

      <p>
        Der Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen. Wir verarbeiten Ihre Daten daher ausschließlich auf Grundlage der gesetzlichen Bestimmungen (DSGVO, TKG 2003).
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. Verantwortliche Stelle</h2>
      <p>Prüfsiegel Zentrum UG (haftungsbeschränkt)</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. Erhebung und Verarbeitung personenbezogener Daten</h2>
      <p>
        Wir verarbeiten jene personenbezogenen Daten, die Sie uns im Rahmen einer Anfrage, Registrierung oder Bestellung zur Verfügung stellen.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Ihre Rechte</h2>
      <p>
        Sie haben jederzeit das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerruf und Widerspruch.
      </p>

      <p className="mt-6 text-sm text-gray-500">
        Bei Fragen zum Datenschutz wenden Sie sich bitte an:{" "}
        <a href="mailto:testdomain2501@mail2germany.com" className="text-[#0a74da] hover:underline">
          testdomain2501@mail2germany.com
        </a>
      </p>
    </div>
  );
}
