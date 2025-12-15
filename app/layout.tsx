import './globals.css';
import Navbar from "./components/Navbar";
import Footer from "@/components/home/Footer";
import type { Metadata } from "next";
import ToolbarClient from "./components/ToolbarClient";
import Script from "next/script";
import { LocaleProvider } from "@/components/LocaleProvider";
import { cookies } from "next/headers";
import { normalizeLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Prüfsiegel Zentrum UG",
  description: "Vertrauen durch Prüfung",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("lang")?.value || "de");

  return (
    <html lang={locale} className="no-js">
      <head>
        
        <link rel="stylesheet" href="/styles/animations.css" />
      </head>
      <body className="font-sans antialiased bg-brand-surface text-brand-text">
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
