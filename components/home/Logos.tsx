'use client';

import Image from 'next/image';

type Logo = { src: string; alt: string; size?: 'large' | 'larger' };

const logos: Logo[] = [
  { src: '/images/logos/Edengardenslogo.png', alt: 'Eden Gardens logo', size: 'large' },
  { src: '/images/logos/mypawslogo.png', alt: 'My Paws logo', size: 'larger' },
  { src: '/images/logos/row-1-column-1.png', alt: 'Partner logo 1' },
  { src: '/images/logos/row-1-column-2.png', alt: 'Partner logo 2' },
  { src: '/images/logos/row-1-column-3.png', alt: 'Partner logo 3' },
  { src: '/images/logos/row-2-column-1.png', alt: 'Partner logo 4' },
  { src: '/images/logos/row-2-column-2.png', alt: 'Partner logo 5' },
  { src: '/images/logos/row-3-column-3.png', alt: 'Partner logo 6' },
];

export default function Logos() {
  const loopedLogos = [...logos, ...logos];

  return (
    <section data-animate="section" className="bg-white">
      <div className="flex justify-center">
        <div className="inline-flex flex-col items-center px-4 py-6 gap-6 w-full overflow-hidden">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-text">
              Vertrauenspartner
            </p>
          </div>
          <div className="relative w-full overflow-hidden">
            <div className="flex items-center gap-12 opacity-80 animate-logo-marquee">
              {loopedLogos.map((l, idx) => (
                <Image
                  key={`${l.alt}-${idx}`}
                  src={l.src}
                  alt={l.alt}
                  width={220}
                  height={80}
                  className={`h-16 w-auto flex-shrink-0 ${
                    l.size === 'larger'
                      ? 'scale-[1.265]'
                      : l.size === 'large'
                        ? 'scale-[1.15]'
                        : 'scale-90'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes logo-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-logo-marquee {
          width: 200%;
          animation: logo-marquee 30s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-logo-marquee {
            animation: none;
            transform: translateX(0);
          }
        }
      `}</style>
    </section>
  );
}
