import Image from 'next/image';

const logos: { src: string; alt: string }[] = [];

export default function Logos() {
  return (
    <section data-animate="section" className="bg-white">
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
    </section>
  );
}
