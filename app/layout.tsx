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

const SITE_DESCRIPTION =
  "Deutsches Prüfsiegel Institut (DPI): Testsieger-Check – mit unserem Qualitätssiegel wird Qualität sichtbar. Praxisnahe Produkttests & Ausbildungs-Check";

export const metadata: Metadata = {
  title: "DPI - Deutsches Prüfsiegel Institut",
  applicationName: "DPI - Deutsches Prüfsiegel Institut",
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "DPI - Deutsches Prüfsiegel Institut",
    description: SITE_DESCRIPTION,
    url: "https://dpi-siegel.de",
    siteName: "Deutsches Prüfsiegel Institut",
    images: [
      {
        url: "https://dpi-siegel.de/icon.png",
        width: 512,
        height: 512,
      },
    ],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("lang")?.value || "de");

  return (
    <html lang={locale} className="no-js">
      <head>
        <link rel="stylesheet" href="/styles/animations.css" />
      
  <link rel="stylesheet" href="/styles/animations.css" />
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Deutsches Prüfsiegel Institut",
        "alternateName": "DPI",
        "url": "https://dpi-siegel.de/"
      })
    }}
  />

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
