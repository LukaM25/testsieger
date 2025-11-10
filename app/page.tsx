import Hero from '@/components/home/Hero';
import Intro from '@/components/home/Intro';
import Logos from '@/components/home/Logos';
import Expertise from '@/components/home/Expertise';
import Verfahren from '@/components/home/Verfahren';
import Footer from '@/components/home/Footer';

export default function HomePage() {
  return (
    <main className="bg-white text-gray-900">
      <Hero />
      <Intro />
      <Logos />
      <Expertise />
      <Verfahren />
      <Footer />
    </main>
  );
}
