export type PlaceholderContent = {
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  heroImage: string;
  highlights: { title: string; description: string }[];
  timeline: { title: string; description: string }[];
  deliverables: string[];
};

export const placeholderProducts: PlaceholderContent[] = [
  {
    slug: 'service-check',
    name: 'Service Exzellenz Check',
    tagline: 'Messbare Servicequalität vom Erstkontakt bis zur Loyalität.',
    summary:
      'Ein strukturierter Prüfpfad, der aufzeigt, wie konsistent Ihr Team Kunden begeistert – inklusive Touchpoint-Analyse, Mystery Checks und Handlungsempfehlungen.',
    heroImage: '/images/placeholders/hero-fallback.svg',
    highlights: [
      {
        title: 'Touchpoint Radar',
        description:
          'Wir kartieren alle Berührungspunkte und identifizieren kritische Momente der Wahrheit mit klaren Kennzahlen.',
      },
      {
        title: 'Team-Befähigung',
        description:
          'Interviews, Shadowing und Wissens-Checks ergeben ein ehrliches Bild der Service-Reife Ihres Teams.',
      },
      {
        title: 'Erlebniskurve',
        description:
          'Visualisierte Journey mit Ampelsystem für schnelle Priorisierung und eine Roadmap für 90 Tage.',
      },
    ],
    timeline: [
      {
        title: 'Kick-off & Datenaufnahme',
        description: '2 Stunden Remote-Workshop zur Zieldefinition plus Sammlung bestehender Metriken.',
      },
      {
        title: 'Analyse & Mystery Audit',
        description: 'Vor-Ort- oder Remote-Audit mit Testkunden, Interviews und Dokumentenprüfung.',
      },
      {
        title: 'Review & Umsetzungsplan',
        description: 'Präsentation, Scorecard, Maßnahmenplan, und optional Coaching Sessions.',
      },
    ],
    deliverables: [
      'Scorecard mit Benchmarks',
      'Visualisierte Customer Journey',
      'Umsetzungsplan mit Quick-Wins',
    ],
  },
  {
    slug: 'digital-check',
    name: 'Digitalprozess Check',
    tagline: 'Digitale Abläufe, die reibungslos funktionieren und skaliert werden können.',
    summary:
      'Bewertet digitale End-to-End-Prozesse, UX-Flows und Automatisierungsgrad. Ideal für Teams, die wachsende Nachfrage stabil bedienen wollen.',
    heroImage: '/images/placeholders/hero-fallback.svg',
    highlights: [
      {
        title: 'Systeminventur',
        description:
          'Wir schaffen Transparenz über Ihre Tools, Schnittstellen und Verantwortlichkeiten – inklusive Risiken.',
      },
      {
        title: 'Flow Benchmarking',
        description:
          'Vergleich mit Best Practices aus 20+ Projekten, inklusive Engpass-Analyse und Time-to-Value.',
      },
      {
        title: 'Automatisierungs-Score',
        description:
          'Wir bewerten Automatisierungspotenziale und ROI in einer klaren Skala von 0–5.',
      },
    ],
    timeline: [
      {
        title: 'Discover Session',
        description: 'Wir sammeln Use Cases, KPIs und aktuelle Herausforderungen in einem halbtägigen Workshop.',
      },
      {
        title: 'System Mapping',
        description: 'Dokumentation der Prozesse mit BPMN-Light, API-Landschaft und Datenflüssen.',
      },
      {
        title: 'Priorisierte Roadmap',
        description: 'Lieferung eines Maßnahmenplans mit Aufwand/Nutzen-Schnellübersicht.',
      },
    ],
    deliverables: [
      'Prozesslandkarte & Verantwortlichkeits-Matrix',
      'Automatisierungsscore & Quick-Wins',
      '30/60/90 Tage Roadmap',
    ],
  },
  {
    slug: 'nachhaltigkeit-check',
    name: 'Nachhaltigkeits Check',
    tagline: 'Nachhaltigkeit messbar machen und glaubwürdig kommunizieren.',
    summary:
      'Ein pragmatischer Nachhaltigkeits-Review entlang Ihrer Lieferkette, Energie- und Sozialstandards mit Kommunikationsleitfaden.',
    heroImage: '/images/placeholders/hero-fallback.svg',
    highlights: [
      {
        title: 'Impact Screening',
        description:
          'Wir erfassen CO₂-Footprint, Ressourcenverbrauch und soziale Kennzahlen mit einfachen Templates.',
      },
      {
        title: 'Compliance Radar',
        description:
          'Abgleich mit EU-Taxonomie, Lieferkettengesetz und branchenspezifischen Standards.',
      },
      {
        title: 'Story Framework',
        description:
          'Guidelines, wie Sie Fortschritte transparent kommunizieren ohne Greenwashing-Risiko.',
      },
    ],
    timeline: [
      {
        title: 'Scope & Datensichtung',
        description: 'Definition der Materialitätsbereiche und Sammlung vorhandener Nachweise.',
      },
      {
        title: 'Audit & Interviews',
        description: 'Review der Kennzahlen, Lieferantenbefragung und Management-Interviews.',
      },
      {
        title: 'Report & Messaging',
        description: 'Handlungsempfehlungen, Kommunikationsleitfaden und optional Veröffentlichungsvorlage.',
      },
    ],
    deliverables: [
      'Sustainability Scorecard',
      'Stakeholder Messaging Guide',
      'Umsetzungsfahrplan für 6 Monate',
    ],
  },
];
