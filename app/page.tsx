import Hero from '@/components/home/Hero';
import Intro from '@/components/home/Intro';
import Logos from '@/components/home/Logos';
import Expertise from '@/components/home/Expertise';
import Sicherheit from '@/components/home/Sicherheit';
import Verfahren from '@/components/home/Verfahren';

export default function HomePage() {
  return (
    <main className="bg-white text-gray-900">
      <Hero />
      <Intro />
      <Logos />
      <Expertise />
      <Sicherheit />
      <Verfahren />
    </main>
  );
}
