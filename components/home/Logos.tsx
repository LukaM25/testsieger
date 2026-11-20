import Image from 'next/image';

type Logo = { src: string; alt: string; scale: number };

const logos: Logo[] = [
  { src: '/images/logos/Edengardenslogo.png', alt: 'Eden Gardens logo', scale: 1.15 },
  { src: '/images/logos/mypawslogo.png', alt: 'My Paws logo', scale: 3.6 },
  { src: '/images/logos/sportstech.png', alt: 'Sportstech logo', scale: 0.65 },
  { src: '/images/logos/KEFIRKO LOGO GREEN TRANSPARENT.PNG', alt: 'Kefirko logo', scale: 2.4 },
  { src: '/images/logos/Bild von 31.05.26, 17.42.png', alt: 'Partner logo', scale: 1 },
];

// Eine Hälfte des Laufbands: Logos doppelt, damit sie auch auf breiten Bildschirmen die Breite füllen.
function LogoRow({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-20 pr-20" aria-hidden={hidden || undefined}>
      {[...logos, ...logos].map((logo, index) => (
        <div
          key={`${logo.src}-${index}`}
          className="flex h-20 w-48 shrink-0 items-center justify-center opacity-60 grayscale transition duration-500 hover:scale-110 hover:opacity-100 hover:grayscale-0"
        >
          <Image
            src={logo.src}
            alt={hidden ? '' : logo.alt}
            width={220}
            height={60}
            className="h-16 w-auto max-w-full object-contain"
            style={{ transform: `scale(${logo.scale})` }}
          />
        </div>
      ))}
    </div>
  );
}

export default function Logos() {
  return (
    <section data-animate="section" className="bg-gradient-to-b from-slate-50 to-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <span className="eyebrow">Vertrauen uns bereits</span>
        <h2 className="section-title">Vertrauenspartner</h2>
      </div>

      <div className="group mt-12 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="marquee-track flex w-max group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          <LogoRow />
          <LogoRow hidden />
        </div>
      </div>
    </section>
  );
}
