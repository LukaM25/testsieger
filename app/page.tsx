
import HeroSection from "@/components/HeroSection";

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <section className="max-w-5xl mx-auto px-6 py-16 text-gray-700 leading-relaxed">
        <h2 className="text-2xl font-semibold text-[#2e4053] mb-4">Über uns</h2>
        <p>
          Das Prüfsiegel Zentrum UG steht für objektive Bewertungen, transparente Verfahren und messbare Qualität.
          Unser Leitgedanke <span className="font-medium">„Vertrauen durch Prüfung“</span> ist mehr als ein Slogan – es ist unser Versprechen.
        </p>
      </section>
    </div>
  );
}
