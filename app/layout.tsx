import Navbar from "./components/Navbar";
import Footer from "@/components/home/Footer";

export const metadata = {
  title: "Prüfsiegel Zentrum UG",
  description: "Vertrauen durch Prüfung",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="stylesheet" href="/styles/tailwind.css" />
      </head>
      <body className="font-sans antialiased text-gray-900 bg-white">
        <Navbar />
        <main className="min-h-[80vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
