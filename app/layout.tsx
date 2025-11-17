import Navbar from "./components/Navbar";
import Footer from "@/components/home/Footer";
import type { Metadata } from "next";
import ToolbarClient from "./components/ToolbarClient";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Prüfsiegel Zentrum UG",
  description: "Vertrauen durch Prüfung",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="no-js">
      <head>
        <link rel="stylesheet" href="/styles/tailwind.css" />
        <link rel="stylesheet" href="/styles/animations.css" />
      </head>
      <body className="font-sans antialiased text-gray-900 bg-white">
        <Navbar />
        <main className="min-h-[80vh]">{children}</main>
        <Footer />
        {process.env.NODE_ENV === "development" ? <ToolbarClient /> : null}
        <Script src="/scripts/reveal.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
