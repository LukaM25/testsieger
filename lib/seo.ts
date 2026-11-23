import type { Metadata } from 'next';

export const SITE_URL = 'https://dpi-siegel.de';
export const SITE_NAME = 'Deutsches Prüfsiegel Institut';
export const SITE_SHORT = 'DPI';
export const SITE_TAGLINE = 'Produkttest & Prüfsiegel für Amazon-Seller, Hersteller und Händler';
export const SITE_DESCRIPTION =
  'Das Deutsche Prüfsiegel Institut (DPI) prüft Produkte nach transparenten Kriterien und vergibt ein Prüfsiegel mit Prüfbericht und QR-Code. Testgebühr ab 179 € netto. Sitz in Oberbayern (Landkreis Miesbach).';

export const ORG = {
  legalName: 'DPI - Deutsches Prüfsiegel Institut GmbH',
  email: 'info@dpi-siegel.de',
  telephone: '+49 156 79790129',
  street: 'Kirchseestraße 2',
  postalCode: '83666',
  city: 'Waakirchen',
  region: 'Bayern',
  country: 'DE',
  vatId: 'DE461330921',
  // Sitz der GmbH (Impressum): Waakirchen, Landkreis Miesbach
  geo: { latitude: 47.77, longitude: 11.72 },
  logo: `${SITE_URL}/dpilogo-v3.png`,
};

export const absoluteUrl = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

export const OG_IMAGE = {
  url: `${SITE_URL}/opengraph-image`,
  width: 1200,
  height: 630,
  alt: 'Deutsches Prüfsiegel Institut: Produkttest & Prüfsiegel für Amazon-Seller',
};

/** Einheitliche Metadaten pro Seite: Title, Description, Canonical, Open Graph, Twitter. */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  type?: 'website' | 'article';
}): Metadata {
  const url = absoluteUrl(opts.path);
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      type: opts.type ?? 'website',
      url,
      title: opts.title,
      description: opts.description,
      siteName: SITE_NAME,
      locale: 'de_DE',
      images: [OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', title: opts.title, description: opts.description, images: [OG_IMAGE.url] },
    ...(opts.noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

export const breadcrumbJsonLd = (items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

export const faqJsonLd = (items: { question: string; answer: string }[], path: string) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${absoluteUrl(path)}#faq`,
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
});

/** Lizenzpläne (netto, pro Produkt). Bei Preisänderungen hier UND auf /pakete anpassen. */
export const LICENSE_PLANS = [
  {
    key: 'basic',
    name: 'Basic',
    price: '177.00',
    billing: 'P1Y' as string | null,
    description: 'Prüfsiegel-Lizenz für einen Verkaufskanal und eine Sprache (Deutsch), 12 Monate Laufzeit, inklusive Siegel, Zertifikat und Prüfbericht.',
  },
  {
    key: 'premium',
    name: 'Premium',
    price: '225.00',
    billing: 'P1Y' as string | null,
    description: 'Prüfsiegel-Lizenz für alle Verkaufskanäle und alle Sprachen, 12 Monate Laufzeit, inklusive Siegel, Zertifikat und Prüfbericht.',
  },
  {
    key: 'lifetime',
    name: 'Lifetime',
    price: '689.00',
    billing: null as string | null,
    description: 'Prüfsiegel-Lizenz für alle Verkaufskanäle und alle Sprachen als Einmalzahlung ohne Folgekosten, inklusive Siegel, Zertifikat und Prüfbericht.',
  },
];

export const licensePlansJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  '@id': `${absoluteUrl('/pakete')}#lizenzplaene`,
  name: 'Lizenzpläne für das DPI-Prüfsiegel',
  itemListElement: LICENSE_PLANS.map((plan, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'Product',
      '@id': `${absoluteUrl('/pakete')}#${plan.key}`,
      name: `DPI-Prüfsiegel Lizenz ${plan.name}`,
      description: plan.description,
      brand: { '@type': 'Brand', name: SITE_SHORT },
      category: 'Prüfsiegel-Lizenz',
      url: absoluteUrl('/pakete'),
      offers: {
        '@type': 'Offer',
        price: plan.price,
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        url: absoluteUrl('/pakete'),
        seller: { '@id': absoluteUrl('/#organization') },
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: plan.price,
          priceCurrency: 'EUR',
          valueAddedTaxIncluded: false,
          ...(plan.billing ? { billingDuration: plan.billing } : {}),
          unitText: 'pro Produkt',
        },
      },
    },
  })),
});

export const jobPostingJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'JobPosting',
  '@id': `${absoluteUrl('/karriere')}#praktikum`,
  title: 'Praktikum (m/w/d) Produktprüfung & Kundenservice',
  description:
    '<p>Praktikum beim Deutschen Prüfsiegel Institut. Du prüfst Produkte nach unseren festen Kriterien, bereitest Prüfberichte vor und begleitest Kundenanfragen von Händlern.</p>' +
    '<p><strong>Einarbeitung und Schulung:</strong> feste Ansprechperson, Schulung zum Testsieger-Check-System (Kriterien, gewichtete Bewertung, Siegel-Logik), Lernen an echten Fällen mit regelmäßigem Feedback.</p>' +
    '<p><strong>Das bringst du mit:</strong> Sorgfalt, Spaß an Produkten und Qualität, verständliche Kommunikation, Zuverlässigkeit, gutes Deutsch. Kein Vorwissen nötig.</p>',
  datePosted: '2026-11-20',
  employmentType: 'INTERN',
  directApply: false,
  hiringOrganization: {
    '@type': 'Organization',
    name: ORG.legalName,
    sameAs: SITE_URL,
    logo: ORG.logo,
  },
  jobLocation: {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      streetAddress: ORG.street,
      postalCode: ORG.postalCode,
      addressLocality: ORG.city,
      addressRegion: ORG.region,
      addressCountry: ORG.country,
    },
  },
  url: absoluteUrl('/karriere'),
});

export const howToJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  '@id': `${absoluteUrl('/pruefverfahren')}#ablauf`,
  name: 'So läuft der Produkttest beim Deutschen Prüfsiegel Institut ab',
  description: 'Vom kostenlosen Pre-Check bis zum Prüfsiegel für die Produktseite in vier Schritten.',
  step: [
    { '@type': 'HowToStep', position: 1, name: 'Pre-Check ausfüllen', text: 'Kostenlos und in rund 3 Minuten prüfen wir vorab, ob das Produkt in Frage kommt.' },
    { '@type': 'HowToStep', position: 2, name: 'Produkt einsenden', text: 'Nach Zahlung der Testgebühr erhalten Sie Versandadresse und Rechnung und senden das Produkt ein.' },
    { '@type': 'HowToStep', position: 3, name: 'Testsieger Check', text: 'Wir prüfen das Produkt nach festem Standard und erstellen einen transparenten Prüfbericht.' },
    { '@type': 'HowToStep', position: 4, name: 'Lizenzplan wählen', text: 'Erst nach bestandener Prüfung wählen Sie den Lizenzplan für das Prüfsiegel.' },
  ],
});
