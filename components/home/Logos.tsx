import Image from 'next/image';

const logos = [
  { src: '/images/logos/otto.png', alt: 'OTTO' },
  { src: '/images/logos/amazon.png', alt: 'Amazon' },
  { src: '/images/logos/arbeitsagentur.svg', alt: 'Bundesagentur für Arbeit' },
  { src: '/images/logos/kaufland.svg', alt: 'Kaufland' },
];

export default function Logos() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 pb-8 pt-6 sm:pb-12 sm:pt-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-10 gap-y-6 opacity-70">
            {logos.map((l) => (
              <Image
                key={l.alt}
                src={l.src}
                alt={l.alt}
                width={120}
                height={36}
                className="h-7 w-auto"
              />
            ))}
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-slate-50/90 px-5 py-4 shadow-sm">
            <Image
              src="/images/logos/siegel.png"
              alt="Testsieger.de Qualitätssiegel"
              width={72}
              height={72}
              className="h-16 w-auto"
            />
            <p className="max-w-xs text-sm text-slate-600">
              Ausgezeichnet mit dem Testsieger.de Qualitätssiegel – geprüfte Seriosität und Transparenz für unsere Partner.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
