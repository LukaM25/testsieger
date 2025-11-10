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
      <div className="mx-auto max-w-6xl px-6 pb-6 sm:pb-10">
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
      </div>
    </section>
  );
}
