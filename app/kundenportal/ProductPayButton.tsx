'use client';

import { useState } from 'react';

const PLANS = [
  { label: 'Basic – 0,99 € / Tag (jährlich)', value: 'BASIC' },
  { label: 'Premium – 1,47 € / Tag (jährlich)', value: 'PREMIUM' },
  { label: 'Lifetime – 1466 € einmalig', value: 'LIFETIME' },
];

type Props = {
  productId: string;
  status: string;
  paymentStatus?: string;
  forceEnabled?: boolean;
};

export default function ProductPayButton({ productId, status, paymentStatus, forceEnabled = false }: Props) {
  const [plan, setPlan] = useState(PLANS[0].value);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const alreadyPaid = paymentStatus === 'PAID' || paymentStatus === 'MANUAL';
  const canPay = (forceEnabled && !alreadyPaid) || ['TEST_PASSED', 'COMPLETED', 'PASS'].includes(status);

  async function handlePay() {
    if (alreadyPaid) {
      setMessage('Bereits bezahlt.');
      return;
    }
    if (!canPay) {
      setMessage('Lizenzpläne werden erst nach bestandenem Test freigeschaltet.');
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
          Lizenzplan
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
        disabled={!canPay || loading || alreadyPaid}
        className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold transition ${
          canPay && !alreadyPaid ? 'bg-slate-900 text-white hover:bg-black' : 'bg-gray-200 text-slate-500 cursor-not-allowed'
        }`}
      >
        {loading
          ? 'Checkout vorbereiten…'
          : alreadyPaid
          ? 'Bereits bezahlt'
          : canPay
          ? 'Zahlung starten'
          : 'Nach Test verfügbar'}
      </button>
      {message && <p className="text-xs text-rose-600">{message}</p>}
    </div>
  );
}
