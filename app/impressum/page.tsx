import TranslationNotice from "@/components/TranslationNotice";

export default function ImpressumPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-gray-700 leading-relaxed">
      <TranslationNotice />
      <h1 className="text-3xl font-semibold text-[#2e4053] mb-4">Impressum</h1>
      <p>Angaben gemäß § 5 TMG:</p>
      <p className="mt-2">
        Prüfsiegel Zentrum UG (haftungsbeschränkt) <br />
        Musterstraße 12 <br />
        6020 Innsbruck <br />
        Österreich
      </p>
      <p className="mt-2">
        Vertreten durch: <br />
        Etwas Müller
      </p>
      <p className="mt-2">
        Kontakt: <br />
        E-Mail: <a href="mailto:testdomain2501@mail2germany.com" className="text-[#0a74da] hover:underline">testdomain2501@mail2germany.com</a>
      </p>
      <p className="mt-2">USt-ID: ATU12345678</p>
      <p className="mt-8 text-sm text-gray-500">
        Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV: Etwas Müller
      </p>
    </div>
  );
}
