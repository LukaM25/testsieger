'use client';

import { useState } from 'react';

const PLANS = [
  { label: 'Basic', value: 'BASIC' },
  { label: 'Premium', value: 'PREMIUM' },
  { label: 'Lifetime', value: 'LIFETIME' },
];

type Props = {
  productId: string;
  status: string;
};

export default function ProductPayButton({ productId, status }: Props) {
  const [plan, setPlan] = useState(PLANS[0].value);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canPay = status === 'PRECHECK';

  async function handlePay() {
    if (!canPay) {
      setMessage('Produkt muss vorher freigegeben werden.');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, productId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setMessage(data.error || 'Zahlung konnte nicht gestartet werden.');
        return;
      }
      window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`plan-${productId}`} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Plan
        </label>
        <select
          id={`plan-${productId}`}
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          disabled={!canPay || loading}
          className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
        >
          {PLANS.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={handlePay}
        disabled={!canPay || loading}
        className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold transition ${
          canPay ? 'bg-slate-900 text-white hover:bg-black' : 'bg-gray-200 text-slate-500 cursor-not-allowed'
        }`}
      >
        {loading ? 'Checkout vorbereiten…' : canPay ? 'Zahlung starten' : 'Noch nicht verfügbar'}
      </button>
      {message && <p className="text-xs text-rose-600">{message}</p>}
    </div>
  );
}
