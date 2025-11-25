
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
      <PackageCard title="Basic" price="0,99€/Tag (jährlich)" subtitle="DE, 1 Kanal" onSelect={() => choose('BASIC')} />
      <PackageCard title="Premium" price="1,47€/Tag (jährlich)" subtitle="EU‑Sprachen, alle Kanäle" onSelect={() => choose('PREMIUM')} />
      <PackageCard title="Lifetime" price="1466€ einmalig" subtitle="Zertifikat & Bericht, alle Kanäle" onSelect={() => choose('LIFETIME')} />
    </div>
  );
}
