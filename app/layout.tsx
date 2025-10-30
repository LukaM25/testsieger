import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "./components/Footer";


export const metadata = {
  title: "Prüfsiegel Zentrum UG",
  description: "Vertrauen durch Prüfung – Offizielle Prüfsiegel Zertifizierung.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="bg-[#f8f8f8] text-gray-900">
        <Navbar />
        <main className="pt-14 min-h-[80vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
