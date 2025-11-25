
'use client';


import { PackageCard } from '@/components/PackageCard';
import { usePrecheckEligibility } from '@/hooks/usePrecheckEligibility';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Packages() {
  const router = useRouter();
  const { hasPrecheck, paidAndPassed, loading } = usePrecheckEligibility();
  const [notice, setNotice] = useState<string | null>(null);
  const disabledLabel = 'Pre-Check + Grundgebühr + Prüfung nötig';

  async function choose(plan: string) {
    const res = await fetch('/api/payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) });
    const data = await res.json();
    if (!res.ok) return alert(data.error || 'Fehler');
    window.location.href = data.url;
  }

  const handleGuardedSelect = (plan: string) => {
    if (!hasPrecheck || !paidAndPassed) {
      setNotice('Bitte Pre-Check abschließen, Grundgebühr bezahlen und Prüfung abwarten. Weiterleitung zum Formular.');
      router.push('/produkte/produkt-test');
      return;
    }
    choose(plan);
  };
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {notice && <p className="md:col-span-3 text-sm text-amber-700">{notice}</p>}
      <PackageCard title="Basic" price="0,99€/Tag (jährlich)" subtitle="DE, 1 Kanal" onSelect={() => handleGuardedSelect('BASIC')} disabled={!hasPrecheck || !paidAndPassed || loading} disabledLabel={disabledLabel} onDisabledClick={() => {
        setNotice('Bitte Pre-Check abschließen, Grundgebühr bezahlen und Prüfung abwarten. Weiterleitung zum Formular.');
        router.push('/produkte/produkt-test');
      }} />
      <PackageCard title="Premium" price="1,47€/Tag (jährlich)" subtitle="EU‑Sprachen, alle Kanäle" onSelect={() => handleGuardedSelect('PREMIUM')} disabled={!hasPrecheck || !paidAndPassed || loading} disabledLabel={disabledLabel} onDisabledClick={() => {
        setNotice('Bitte Pre-Check abschließen, Grundgebühr bezahlen und Prüfung abwarten. Weiterleitung zum Formular.');
        router.push('/produkte/produkt-test');
      }} />
      <PackageCard title="Lifetime" price="1466€ einmalig" subtitle="Zertifikat & Bericht, alle Kanäle" onSelect={() => handleGuardedSelect('LIFETIME')} disabled={!hasPrecheck || !paidAndPassed || loading} disabledLabel={disabledLabel} onDisabledClick={() => {
        setNotice('Bitte Pre-Check abschließen, Grundgebühr bezahlen und Prüfung abwarten. Weiterleitung zum Formular.');
        router.push('/produkte/produkt-test');
      }} />
    </div>
  );
}
