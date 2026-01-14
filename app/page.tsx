import Hero from '@/components/home/Hero';
import Intro from '@/components/home/Intro';
import Logos from '@/components/home/Logos';
import Expertise from '@/components/home/Expertise';
import Sicherheit from '@/components/home/Sicherheit';
import Verfahren from '@/components/home/Verfahren';
import Image from 'next/image';
import { stagger } from '@/lib/animation';

export default function HomePage() {
  return (
    <main className="bg-white text-gray-900">
      <Hero />
      <Intro />
      <Logos />
      <Expertise />
      <Sicherheit />
      <Verfahren />
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
    </main>
  );
}
