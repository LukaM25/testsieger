import './globals.css';
import Navbar from "./components/Navbar";
import Footer from "@/components/home/Footer";
import type { Metadata } from "next";
import ToolbarClient from "./components/ToolbarClient";
import Script from "next/script";
import { LocaleProvider } from "@/components/LocaleProvider";
import { cookies } from "next/headers";
import { normalizeLocale } from "@/lib/i18n";

const GOOGLE_TAG_MANAGER_ID = "GTM-5Z5ZT5B6";
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
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GOOGLE_TAG_MANAGER_ID}');
          `}
        </Script>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18054519223"
          strategy="afterInteractive"
        />
        <Script id="google-ads-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18054519223');
          `}
        </Script>
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
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GOOGLE_TAG_MANAGER_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <LocaleProvider initialLocale={locale}>
          <Navbar />
          <main className="min-h-[80vh]">{children}</main>
          <Footer />
          {process.env.NODE_ENV === "development" ? <ToolbarClient /> : null}
          <Script src="/scripts/reveal.js" strategy="afterInteractive" />
        </LocaleProvider>
      </body>
    </html>
  );
}
