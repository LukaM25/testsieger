
'use client';
import { PackageCard } from '@/components/PackageCard';

export default function Packages() {
  async function choose(plan: string) {
    const res = await fetch('/api/payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) });
    const data = await res.json();
    if (!res.ok) return alert(data.error || 'Fehler');
    window.location.href = data.url;
  }
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <PackageCard title="Basic" price="254€ + 0,99€/Tag" subtitle="DE, 1 Kanal" onSelect={() => choose('BASIC')} />
      <PackageCard title="Premium" price="254€ + 1,59€/Tag" subtitle="EU‑Sprachen, alle Kanäle" onSelect={() => choose('PREMIUM')} />
      <PackageCard title="Lifetime" price="1477€" subtitle="Zertifikat & Bericht, alle Kanäle" onSelect={() => choose('LIFETIME')} />
    </div>
  );
}
