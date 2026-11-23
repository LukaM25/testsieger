import Link from 'next/link';

/** Umschalter zwischen den beiden Admin-Bereichen. Beide sind vollständig getrennt. */
export default function AreaSwitch({ active }: { active: 'produkttest' | 'arbeitssicherheit' }) {
  const items = [
    { id: 'produkttest', label: 'Produkttest', href: '/admin' },
    { id: 'arbeitssicherheit', label: 'Arbeitssicherheit', href: '/admin/arbeitssicherheit' },
  ] as const;
  return (
    <nav aria-label="Bereich" className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
      {items.map((i) => (
        <Link
          key={i.id}
          href={i.href}
          aria-current={active === i.id ? 'page' : undefined}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            active === i.id ? 'bg-[#16294d] !text-white shadow-sm' : 'text-slate-600 hover:text-[#2B4066]'
          }`}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
