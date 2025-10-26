
'use client';
import { useState } from 'react';

export default function PrecheckPage() {
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const res = await fetch('/api/precheck', { method: 'POST', body: form });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return alert(data.error || 'Fehler');
    window.location.href = '/packages';
  }
  return (
    <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
      <div className="card space-y-3">
        <h2 className="text-xl font-semibold">Persönliche Daten</h2>
        <input name="name" placeholder="Name" className="border p-2 rounded w-full" required />
        <input name="company" placeholder="Firma" className="border p-2 rounded w-full" />
        <input type="email" name="email" placeholder="E‑Mail" className="border p-2 rounded w-full" required />
        <input name="address" placeholder="Adresse" className="border p-2 rounded w-full" />
        <input type="password" name="password" placeholder="Passwort" className="border p-2 rounded w-full" required />
      </div>
      <div className="card space-y-3">
        <h2 className="text-xl font-semibold">Produktdaten</h2>
        <input name="productName" placeholder="Produktname" className="border p-2 rounded w-full" required />
        <input name="brand" placeholder="Markenname" className="border p-2 rounded w-full" required />
        <input name="code" placeholder="Hersteller/Artikelnummer" className="border p-2 rounded w-full" />
        <input name="specs" placeholder="Spezifikationen" className="border p-2 rounded w-full" />
        <input name="size" placeholder="Verpackungsgröße/Maße" className="border p-2 rounded w-full" />
        <input name="madeIn" placeholder="Fertigungsland" className="border p-2 rounded w-full" />
        <input name="material" placeholder="Hauptmaterial" className="border p-2 rounded w-full" />
        <button className="btn btn-primary w-full" disabled={loading}>{loading ? 'Wird gesendet…' : 'Jetzt starten'}</button>
      </div>
    </form>
  );
}
