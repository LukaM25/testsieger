export const metadata = {
  title: 'Allgemeine Geschäftsbedingungen – Prüfsiegel Zentrum UG',
  description:
    'Platzhaltertext für die AGB der Prüfsiegel Zentrum UG mit logisch strukturierten Abschnitten und austauschbaren Paragraphen.',
};

const sections = [
  {
    title: '1. Geltungsbereich',
    body:
      'Diese AGB gelten für alle Verträge zwischen der Prüfsiegel Zentrum UG (haftungsbeschränkt) und ihren Auftraggebern in Bezug auf Prüfleistungen, Zertifizierungen und begleitende Services.',
  },
  {
    title: '2. Vertragsabschluss',
    body:
      'Der Vertrag kommt zustande, sobald das unterschriebene Angebot oder die Buchung über das Kundenportal bestätigt wurde. Individuelle Absprachen sind schriftlich festzuhalten.',
  },
  {
    title: '3. Leistungsumfang',
    body:
      'Der konkrete Leistungsumfang ergibt sich aus dem jeweiligen Angebot. Änderungen des Prüfprogramms während der Laufzeit sind gesondert zu beauftragen.',
  },
  {
    title: '4. Mitwirkungspflichten',
    body:
      'Der Auftraggeber stellt alle notwendigen Informationen, Proben und Zugangsdaten rechtzeitig zur Verfügung. Verzögerungen aufgrund fehlender Mitwirkung verlängern die vereinbarte Frist.',
  },
  {
    title: '5. Vergütung & Zahlungsmodalitäten',
    body:
      'Sofern nicht anders vereinbart, sind Rechnungen innerhalb von 14 Tagen ohne Abzug zur Zahlung fällig. Teilzahlungen richten sich nach dem Projektplan.',
  },
  {
    title: '6. Haftung',
    body:
      'Die Haftung der Prüfsiegel Zentrum UG ist auf Vorsatz und grobe Fahrlässigkeit beschränkt. Für mittelbare Schäden wird nicht gehaftet, sofern nicht zwingende gesetzliche Bestimmungen entgegenstehen.',
  },
  {
    title: '7. Laufzeit und Kündigung',
    body:
      'Verträge laufen für die Dauer des vereinbarten Prüfprojekts. Eine ordentliche Kündigung ist innerhalb von 14 Tagen nach Beauftragung möglich, sofern noch keine Prüfleistungen erbracht wurden.',
  },
  {
    title: '8. Vertraulichkeit',
    body:
      'Beide Parteien verpflichten sich zur vertraulichen Behandlung aller im Rahmen der Zusammenarbeit erhaltenen Informationen. Dies gilt über das Vertragsende hinaus.',
  },
  {
    title: '9. Schlussbestimmungen',
    body:
      'Sollten einzelne Klauseln unwirksam sein, berührt dies die Wirksamkeit der übrigen Bestimmungen nicht. Es gilt deutsches Recht. Gerichtsstand ist Innsbruck.',
  },
];

export default function AgbPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 pb-16 pt-24 text-slate-700">
      <h1 className="text-4xl font-bold text-slate-900">Allgemeine Geschäftsbedingungen</h1>
      <p className="mt-4 text-sm text-slate-500">Stand: {new Date().getFullYear()}</p>
      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-semibold text-slate-900">{section.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
