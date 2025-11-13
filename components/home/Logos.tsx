import Image from 'next/image';

const logos = [
  { src: '/images/logos/otto.png', alt: 'OTTO' },
  { src: '/images/logos/amazon.png', alt: 'Amazon' },
  { src: '/images/logos/arbeitsargentour.png', alt: 'Bundesagentur für Arbeit' },
  { src: '/images/logos/kaufland.png', alt: 'Kaufland' },
];

export default function Logos() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-12xl px-12 pb-16 pt-12 sm:pb-24 sm:pt-16">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-70">
          {logos.map((l) => (
            <Image
              key={l.alt}
              src={l.src}
              alt={l.alt}
              width={162}
              height={48}
              className="h-9 w-auto"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
