import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: "Produkttest & Prüfsiegel für Amazon-Seller | Deutsches Prüfsiegel Institut (DPI)" },
  description: SITE_DESCRIPTION,
  alternates: { canonical: SITE_URL },
};

import Hero from '@/components/home/Hero';
import { PtAlltag, PtNutzen, PtAblauf, PtPartner, PtCta } from '@/components/home/PtSections';
import Logos from '@/components/home/Logos';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AreaChooser from '@/components/home/AreaChooser';
import { arbeitssicherheitEnabled } from '@/lib/arbeitssicherheit/gate';
import { stagger } from '@/lib/animation';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  if (arbeitssicherheitEnabled()) {
    const area = (await cookies()).get('dpi_area')?.value;
    if (!area) return <AreaChooser />;
    if (area === 'arbeitssicherheit') redirect('/arbeitssicherheit');
  }
  return (
    <main className="bg-white text-gray-900">
      <Hero />
      <Logos />
      <PtAlltag />
      <PtPartner />
      <PtNutzen />
      <PtAblauf />
      <section data-animate="section" className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div
            data-animate="card"
            style={stagger(0)}
            className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 shadow-sm"
          >
            <Image
              src="/start/startseiteunten.jpeg"
              alt="Testsieger Check impression"
              width={1600}
              height={900}
              className="h-auto w-full object-cover"
              priority={false}
            />
          </div>
        </div>
      </section>
      <PtCta />
    </main>
  );
}
