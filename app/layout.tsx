import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "./components/Footer";
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'Prüfsiegel Zentrum UG',
  description: 'Vertrauen durch Prüfung',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={inter.variable}>
      <body className="font-sans antialiased text-gray-900 bg-white">
        <Navbar />
        <main className="pt-14 min-h-[80vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
