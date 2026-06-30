'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

type DetailsForm = {
  company: string;
  addressStreet: string;
  addressNumber: string;
  addressPostal: string;
  addressCity: string;
  addressCountry: string;
  addressLine2: string;
  dimensionLength: string;
  dimensionWidth: string;
  dimensionHeight: string;
  madeIn: string;
  material: string;
};

const MADE_IN_OPTIONS = [
  'Deutschland',
  'Österreich',
  'Schweiz',
  'Niederlande',
  'Polen',
  'Frankreich',
  'Italien',
  'Spanien',
  'Vereinigtes Königreich',
  'USA',
  'China',
  'Indien',
  'Vietnam',
  'Türkei',
  'Sonstiges',
];

const emptyForm: DetailsForm = {
  company: '',
  addressStreet: '',
  addressNumber: '',
  addressPostal: '',
  addressCity: '',
  addressCountry: 'Deutschland',
  addressLine2: '',
  dimensionLength: '',
  dimensionWidth: '',
  dimensionHeight: '',
  madeIn: '',
  material: '',
};

export default function PrecheckDetailsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams?.get('productId') || '';
  const [form, setForm] = useState<DetailsForm>(emptyForm);
  const [product, setProduct] = useState<{ name: string; brand: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof DetailsForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!productId) {
        setError('Produkt nicht gefunden.');
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/precheck/details?productId=${encodeURIComponent(productId)}`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/precheck/details?productId=${productId}`)}`);
        return;
      }
      if (!res.ok || !data?.ok) {
        setError('Produktdetails konnten nicht geladen werden.');
        setLoading(false);
        return;
      }
      setProduct({ name: data.product.name, brand: data.product.brand });
      setForm({
        company: data.user.company || '',
        addressStreet: data.user.addressStreet || '',
        addressNumber: data.user.addressNumber || '',
        addressPostal: data.user.addressPostal || '',
        addressCity: data.user.addressCity || '',
        addressCountry: data.user.addressCountry || 'Deutschland',
        addressLine2: data.user.addressLine2 || '',
        dimensionLength: data.product.dimensionLength || '',
        dimensionWidth: data.product.dimensionWidth || '',
        dimensionHeight: data.product.dimensionHeight || '',
        madeIn: data.product.madeIn || '',
        material: data.product.material || '',
      });
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [productId, router]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/precheck/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, ...form }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setError('Bitte prüfen Sie die Angaben.');
        return;
      }
      router.push(data.redirect || `/precheck?productId=${productId}`);
    } catch {
      setError('Details konnten nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
      <section className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        {loading ? (
          <p className="text-sm text-slate-600">Details werden geladen...</p>
        ) : error && !product ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Details nicht verfügbar</h1>
            <p className="text-sm text-slate-600">{error}</p>
            <Link href="/precheck" className="inline-flex rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white">
              Zum Pre-Check
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Angaben ergänzen</p>
              <h1 className="mt-2 text-2xl font-semibold">Pre-Check vorbereiten</h1>
              {product && (
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Produkt: <strong>{product.name}</strong>
                  <br />
                  Marke: {product.brand}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Unternehmen & Adresse</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="md:col-span-2">
                  <span className="text-sm font-medium text-slate-800">Firma</span>
                  <input
                    value={form.company}
                    onChange={(event) => update('company', event.target.value)}
                    required
                    autoComplete="organization"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <label>
                  <span className="text-sm font-medium text-slate-800">Straße</span>
                  <input
                    value={form.addressStreet}
                    onChange={(event) => update('addressStreet', event.target.value)}
                    required
                    autoComplete="address-line1"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <label>
                  <span className="text-sm font-medium text-slate-800">Hausnummer</span>
                  <input
                    value={form.addressNumber}
                    onChange={(event) => update('addressNumber', event.target.value)}
                    required
                    autoComplete="address-line1"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <label>
                  <span className="text-sm font-medium text-slate-800">PLZ</span>
                  <input
                    value={form.addressPostal}
                    onChange={(event) => update('addressPostal', event.target.value)}
                    required
                    autoComplete="postal-code"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <label>
                  <span className="text-sm font-medium text-slate-800">Ort</span>
                  <input
                    value={form.addressCity}
                    onChange={(event) => update('addressCity', event.target.value)}
                    required
                    autoComplete="address-level2"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <label>
                  <span className="text-sm font-medium text-slate-800">Land</span>
                  <input
                    value={form.addressCountry}
                    onChange={(event) => update('addressCountry', event.target.value)}
                    required
                    autoComplete="country-name"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <label>
                  <span className="text-sm font-medium text-slate-800">Adresszusatz</span>
                  <input
                    value={form.addressLine2}
                    onChange={(event) => update('addressLine2', event.target.value)}
                    autoComplete="address-line2"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Produktdetails</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2 grid gap-3 sm:grid-cols-3">
                  <label>
                    <span className="text-sm font-medium text-slate-800">Länge (cm)</span>
                    <input
                      value={form.dimensionLength}
                      onChange={(event) => update('dimensionLength', event.target.value)}
                      required
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </label>
                  <label>
                    <span className="text-sm font-medium text-slate-800">Breite (cm)</span>
                    <input
                      value={form.dimensionWidth}
                      onChange={(event) => update('dimensionWidth', event.target.value)}
                      required
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </label>
                  <label>
                    <span className="text-sm font-medium text-slate-800">Höhe (cm)</span>
                    <input
                      value={form.dimensionHeight}
                      onChange={(event) => update('dimensionHeight', event.target.value)}
                      required
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </label>
                </div>
                <label>
                  <span className="text-sm font-medium text-slate-800">Hergestellt in</span>
                  <select
                    value={form.madeIn}
                    onChange={(event) => update('madeIn', event.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="">Bitte auswählen</option>
                    {MADE_IN_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="text-sm font-medium text-slate-800">Material</span>
                  <input
                    value={form.material}
                    onChange={(event) => update('material', event.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-black px-4 py-3 font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
            >
              {saving ? 'Wird gespeichert...' : 'Speichern und zum Pre-Check'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
