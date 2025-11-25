'use client';
import { PackageCard } from '@/components/PackageCard';

export default function Packages() {
  async function choose(plan: string) {
    const res = await fetch('/api/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || 'Fehler');
    window.location.href = data.url;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 pt-20 pb-16">
      <h1 className="text-3xl font-semibold text-[#2e4053]">Lizenzpläne</h1>
      <p className="text-gray-600 mt-2">Wählen Sie Ihren Plan für das Prüfsiegel.</p>

      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <PackageCard
          title="Basic"
          price="0,99€/Tag (jährlich)"
          subtitle="DE, 1 Kanal"
          onSelect={() => choose('BASIC')}
        />
        <PackageCard
          title="Premium"
          price="1,47€/Tag (jährlich)"
          subtitle="EU-Sprachen, alle Kanäle"
          onSelect={() => choose('PREMIUM')}
        />
        <PackageCard
          title="Lifetime"
          price="1466€ einmalig"
          subtitle="Zertifikat & Bericht, alle Kanäle"
          onSelect={() => choose('LIFETIME')}
        />
      </div>
    </div>
  );
}
