import './globals.css';
import Navbar from "./components/Navbar";
import Footer from "@/components/home/Footer";
import type { Metadata } from "next";
import ToolbarClient from "./components/ToolbarClient";
import Script from "next/script";
import { LocaleProvider } from "@/components/LocaleProvider";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { cookies } from "next/headers";
import { normalizeLocale } from "@/lib/i18n";
import JsonLd from "@/components/seo/JsonLd";
import { OG_IMAGE, ORG, SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Produkttest & Prüfsiegel für Amazon-Seller | Deutsches Prüfsiegel Institut (DPI)",
    template: "%s | DPI",
  },
  applicationName: "DPI - Deutsches Prüfsiegel Institut",
  description: SITE_DESCRIPTION,
  keywords: [
    "Produkttest",
    "Prüfsiegel",
    "Testsiegel Amazon",
    "Produkt testen lassen",
    "Prüfsiegel für Amazon Seller",
    "Produktprüfung",
    "Prüfbericht QR-Code",
    "Vertrauen Conversion Produktseite",
    "Deutsches Prüfsiegel Institut",
    "Produkttest Oberbayern",
  ],
  authors: [{ name: "Deutsches Prüfsiegel Institut" }],
  creator: "Deutsches Prüfsiegel Institut",
  publisher: "DPI - Deutsches Prüfsiegel Institut GmbH",
  category: "Produktprüfung",
  alternates: { canonical: SITE_URL },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1 },
  },
  formatDetection: { telephone: true, email: true, address: true },
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    title: "Produkttest & Prüfsiegel für Amazon-Seller | DPI",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Produkttest & Prüfsiegel für Amazon-Seller | DPI",
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  other: {
    "geo.region": "DE-BY",
    "geo.placename": "Waakirchen, Landkreis Miesbach, Oberbayern",
    "content-language": "de",
  },
};

const orgId = `${SITE_URL}/#organization`;
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "ProfessionalService"],
      "@id": orgId,
      name: SITE_NAME,
      alternateName: ["DPI", ORG.legalName],
      legalName: ORG.legalName,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: ORG.logo },
      image: absoluteUrl("/siegel19.png"),
      description: SITE_DESCRIPTION,
      email: ORG.email,
      telephone: ORG.telephone,
      vatID: ORG.vatId,
      address: {
        "@type": "PostalAddress",
        streetAddress: ORG.street,
        postalCode: ORG.postalCode,
        addressLocality: ORG.city,
        addressRegion: ORG.region,
        addressCountry: ORG.country,
      },
      areaServed: [
        { "@type": "Country", name: "Deutschland" },
        { "@type": "AdministrativeArea", name: "Oberbayern" },
        { "@type": "AdministrativeArea", name: "Landkreis Miesbach" },
        { "@type": "Place", name: "Tegernsee-Region" },
      ],
      founder: [
        { "@type": "Person", name: "Ferdinand Lang", jobTitle: "Geschäftsführer" },
        { "@type": "Person", name: "Sebastian Lang", jobTitle: "Geschäftsführer" },
      ],
      knowsAbout: [
        "Produkttest",
        "Prüfsiegel",
        "Prüfbericht",
        "Amazon-Produktseiten",
        "Vertrauen und Conversion im E-Commerce",
      ],
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer service",
          email: ORG.email,
          telephone: ORG.telephone,
          availableLanguage: ["de", "en"],
          areaServed: "DE",
          hoursAvailable: { "@type": "OpeningHoursSpecification", dayOfWeek: weekdays, opens: "09:00", closes: "17:00" },
        },
      ],
      openingHoursSpecification: { "@type": "OpeningHoursSpecification", dayOfWeek: weekdays, opens: "09:00", closes: "17:00" },
      geo: { "@type": "GeoCoordinates", latitude: ORG.geo.latitude, longitude: ORG.geo.longitude },
      slogan: "Produkttest & Prüfsiegel nach transparenten Kriterien",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      alternateName: "DPI",
      inLanguage: "de-DE",
      publisher: { "@id": orgId },
    },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("lang")?.value || "de");

  return (
    <html lang={locale} className="no-js">
      <head>
        <link rel="stylesheet" href="/styles/animations.css" />
        <JsonLd data={siteJsonLd} />
      </head>
      <body className="font-sans antialiased bg-brand-surface text-brand-text">
        <LocaleProvider initialLocale={locale}>
          <AnalyticsTracker />
          <Navbar />
          <main className="min-h-[80vh]">{children}</main>
          <Footer />
          <CookieConsentBanner />
          {process.env.NODE_ENV === "development" ? <ToolbarClient /> : null}
          <Script src="/scripts/reveal.js" strategy="afterInteractive" />
        </LocaleProvider>
      </body>
    </html>
  );
}
