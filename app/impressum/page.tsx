import TranslationNotice from "@/components/TranslationNotice";

export default function ImpressumPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-gray-700 leading-relaxed">
      <TranslationNotice />
      <h1 className="text-3xl font-semibold text-[#2e4053] mb-4">Impressum</h1>
      <p>Angaben gemäß § 5 DDG:</p>
      <p className="mt-2">
        DPI - Deutsches Prüfsiegel Institut GmbH <br />
        Kirchseestraße 2 <br />
        83666 Waakirchen
      </p>
      <p className="mt-2">
        Vertreten durch die Geschäftsführer: <br />
        Ferdinand Johann Lang <br />
        Sebastian Valentin Lang
      </p>
      <p className="mt-2">
        Kontakt: <br />
        Telefon: 015679 790129 <br />
        E-Mail: <a href="mailto:info@dpi-siegel.de" className="text-[#0a74da] hover:underline">info@dpi-siegel.de</a>
      </p>
      <p className="mt-2">
        Registereintrag: <br />
        Eintragung im Handelsregister. <br />
        Registergericht: Amtsgericht München <br />
        Registernummer: HRB 309712 <br />
        USt-IdNr : DE461330921
      </p>
    </div>
  );
}
