import Image from 'next/image';

type Logo = { src: string; alt: string; scale: number };

const logos: Logo[] = [
  { src: '/images/logos/Edengardenslogo.png', alt: 'Eden Gardens logo', scale: 1.15 },
  { src: '/images/logos/mypawslogo.png', alt: 'My Paws logo', scale: 3.6 },
  { src: '/images/logos/sportstech.png', alt: 'Sportstech logo', scale: 0.65 },
  { src: '/images/logos/KEFIRKO LOGO GREEN TRANSPARENT.PNG', alt: 'Kefirko logo', scale: 2.4 },
  { src: '/images/logos/Bild von 31.05.26, 17.42.png', alt: 'Partner logo', scale: 1 },
];

const placements = [
  'lg:col-span-2 lg:col-start-1',
  'lg:col-span-2 lg:col-start-3',
  'lg:col-span-2 lg:col-start-5',
  'lg:col-span-2 lg:col-start-2',
  'sm:col-span-2 lg:col-span-2 lg:col-start-4',
];

export default function Logos() {
  return (
    <section data-animate="section" className="bg-white">
      <div className="flex justify-center">
        <div className="inline-flex w-full flex-col items-center gap-10 px-4 py-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
              Vertrauenspartner
            </h2>
          </div>
          <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-x-12 gap-y-10 py-5 opacity-80 sm:grid-cols-2 lg:grid-cols-6">
            {logos.map((logo, index) => (
              <div
                key={logo.src}
                className={`flex h-20 min-w-0 items-center justify-center ${placements[index]}`}
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={220}
                  height={60}
                  className="h-16 w-auto max-w-full object-contain"
                  style={{ transform: `scale(${logo.scale})` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
