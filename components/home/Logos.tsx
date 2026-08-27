import Image from 'next/image';

type Logo = { src: string; alt: string; size?: 'large' | 'larger' | 'reduced' };

const logos: Logo[] = [
  { src: '/images/logos/Edengardenslogo.png', alt: 'Eden Gardens logo', size: 'large' },
  { src: '/images/logos/mypawslogo.png', alt: 'My Paws logo', size: 'larger' },
  { src: '/images/logos/sportstech.png', alt: 'Sportstech logo', size: 'reduced' },
  { src: '/images/logos/KEFIRKO LOGO GREEN TRANSPARENT.PNG', alt: 'Kefirko logo', size: 'large' },
  { src: '/images/logos/Bild von 31.05.26, 17.42.png', alt: 'Partner logo', size: 'large' },
];

export default function Logos() {
  return (
    <section data-animate="section" className="bg-white">
      <div className="flex justify-center">
        <div className="inline-flex w-full flex-col items-center gap-10 px-4 py-6">
          <div className="text-center">
            <h2 className="text-3xl font-semibold uppercase tracking-[0.2em] text-brand-text sm:text-4xl">
              Vertrauenspartner
            </h2>
          </div>
          <div className="flex w-full flex-nowrap items-center justify-center gap-12 py-5 opacity-80">
            {logos.map((logo) => (
              <Image
                key={logo.src}
                src={logo.src}
                alt={logo.alt}
                width={220}
                height={60}
                className={`h-16 w-auto flex-shrink-0 ${
                  logo.size === 'reduced'
                    ? 'scale-[1.035]'
                    : logo.size === 'larger'
                    ? 'scale-[1.265]'
                    : logo.size === 'large'
                      ? 'scale-[1.15]'
                      : 'scale-90'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
