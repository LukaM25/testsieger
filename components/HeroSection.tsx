
export default function HeroSection() {
  return (
    <section
      className="relative flex items-center justify-start h-[68vh] md:h-[78vh] bg-cover bg-center"
      style={{ backgroundImage: "url('/handshake.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/30"></div>
      <div className="relative z-10 text-white pl-8 md:pl-16 max-w-xl">
        <h1 className="text-3xl md:text-5xl font-semibold mb-4 drop-shadow-lg">
          Vertrauen durch Prüfung
        </h1>
        <p className="text-lg md:text-xl drop-shadow-md">
          Objektive Bewertungen, transparente Verfahren, messbare Qualität.
        </p>
      </div>
    </section>
  );
}
