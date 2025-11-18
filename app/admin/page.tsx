'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const STATUS_OPTIONS = [
  { value: 'PRECHECK', label: 'Pre-Check' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'ANALYSIS', label: 'Analysis' },
  { value: 'COMPLETION', label: 'Completion' },
  { value: 'PASS', label: 'Pass' },
  { value: 'FAIL', label: 'Fail' },
] as const;

const PAYMENT_STATUS_OPTIONS = [
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'PAID', label: 'Paid' },
  { value: 'MANUAL', label: 'Manual payment' },
] as const;

type StatusOption = (typeof STATUS_OPTIONS)[number]['value'];
type PaymentStatusOption = (typeof PAYMENT_STATUS_OPTIONS)[number]['value'];

type AdminProduct = {
  id: string;
  name: string;
  brand: string;
  code?: string | null;
  specs?: string | null;
  size?: string | null;
  madeIn?: string | null;
  material?: string | null;
  status: string;
  adminProgress: StatusOption;
  createdAt: string;
  user: {
    name: string;
    company?: string | null;
    email: string;
    address?: string | null;
  };
  paymentStatus: string;
  certificate?: {
    pdfUrl?: string | null;
    qrUrl?: string | null;
    seal_number?: string | null;
    pdfmonkeyDocumentId?: string | null;
  } | null;
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'PRECHECK':
      return 'Pre-Check eingereicht';
    case 'PAID':
      return 'Zahlung erhalten';
    case 'IN_REVIEW':
      return 'Prüfung läuft';
    case 'COMPLETED':
      return 'Abgeschlossen';
    case 'RECEIVED':
    case 'ANALYSIS':
    case 'COMPLETION':
    case 'PASS':
    case 'FAIL':
      return status.charAt(0) + status.slice(1).toLowerCase();
    default:
      return status;
  }
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch('/api/admin/products', { credentials: 'same-origin' });
      if (!res.ok) {
        setBanner(`Fehler beim Laden der Produkte: ${res.status}`);
        return;
      }
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch (err) {
      console.error(err);
      setBanner('Produktliste konnte nicht geladen werden.');
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    if (authed) {
      fetchProducts();
    }
  }, [authed, fetchProducts]);

  const grouped = useMemo(() => {
    return products.reduce<Record<string, AdminProduct[]>>((acc, product) => {
      const date = new Date(product.createdAt).toLocaleDateString('de-DE', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      acc[date] = acc[date] || [];
      acc[date].push(product);
      return acc;
    }, {});
  }, [products]);

  const handleLogin = async () => {
    setMessage(null);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) setAuthed(true);
    else setMessage('Falsches Admin-Passwort');
  };

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <h1 className="mb-6 text-2xl font-semibold">Admin Login</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin-Passwort"
          className="w-full rounded-lg border px-3 py-2"
        />
        <button onClick={handleLogin} className="mt-4 rounded-lg bg-black px-4 py-2 text-white">
          Login
        </button>
        {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Prüfung verwalten</h1>
          <p className="mt-2 text-sm text-slate-500">
            Hier sehen Sie alle eingereichten Produkte, aufgeteilt nach Einreichdatum. Öffnen Sie eine Zeile, um die Pre-Check-Daten einzusehen und den Status über den Dropdown-Button zu aktualisieren.
          </p>
          {banner && <p className="mt-3 text-sm text-rose-600">{banner}</p>}
        </header>

        {loadingProducts ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
            Lade Produkte…
          </div>
        ) : (
          Object.entries(grouped).map(([date, entries]) => (
            <section key={date} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">{date}</h2>
              {entries.map((product) => (
                <AdminProductRow
                  key={product.id}
                  product={product}
                  onUpdated={() => {
                    fetchProducts();
                    setMessage(`Status für ${product.name} aktualisiert.`);
                  }}
                />
              ))}
            </section>
          ))
        )}
        {message && <p className="text-sm text-green-700">{message}</p>}
      </div>
    </div>
  );
}

function AdminProductRow({
  product,
  onUpdated,
}: {
  product: AdminProduct;
  onUpdated: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<StatusOption>(
    (product.adminProgress as StatusOption) || 'PRECHECK'
  );
  useEffect(() => {
    setSelectedStatus(product.adminProgress || 'PRECHECK');
  }, [product.adminProgress]);
  useEffect(() => {
    setPaymentStatusValue((product.paymentStatus as PaymentStatusOption) || 'UNPAID');
  }, [product.paymentStatus]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [paymentStatusValue, setPaymentStatusValue] = useState<PaymentStatusOption>(
    (product.paymentStatus as PaymentStatusOption) || 'UNPAID'
  );
  const [paymentStatusLoading, setPaymentStatusLoading] = useState(false);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string | null>(null);
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const handleUpdate = async () => {
    setLocalMessage(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          status: selectedStatus,
          note: selectedStatus === 'FAIL' ? note : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLocalMessage(data.error || 'Status konnte nicht aktualisiert werden.');
        return;
      }
      setLocalMessage('Status aktualisiert.');
      onUpdated();
    } catch (err) {
      console.error(err);
      setLocalMessage('Aktualisierung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  const canSendCertificate = ['PAID', 'IN_REVIEW'].includes(product.status);
  const handleSendCertificate = async () => {
    if (!canSendCertificate) {
      setLocalMessage('Produkt muss mindestens IN_REVIEW sein, bevor das Zertifikat versendet wird.');
      return;
    }
    setLocalMessage(null);
    setSendLoading(true);
    try {
      const res = await fetch('/api/admin/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLocalMessage(data.error || 'Zertifikat konnte nicht versendet werden.');
        return;
      }
      setLocalMessage('Zertifikat versendet.');
      onUpdated();
    } catch (err) {
      console.error(err);
      setLocalMessage('Senden des Zertifikats fehlgeschlagen.');
    } finally {
      setSendLoading(false);
    }
  };

  const handlePaymentStatusChange = async () => {
    setPaymentStatusMessage(null);
    setPaymentStatusLoading(true);
    try {
      const res = await fetch('/api/admin/payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          status: paymentStatusValue,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPaymentStatusMessage(data.error || 'Payment status konnte nicht gesetzt werden.');
        return;
      }
      setPaymentStatusMessage('Payment status aktualisiert.');
      onUpdated();
    } catch (err) {
      console.error(err);
      setPaymentStatusMessage('Payment status konnte nicht gesetzt werden.');
    } finally {
      setPaymentStatusLoading(false);
    }
  };

  const detailFields = [
    ['Produktname', product.name],
    ['Marke', product.brand],
    ['Hersteller-/Artikelnummer', product.code],
    ['Spezifikationen', product.specs],
    ['Größe / Maße', product.size],
    ['Hergestellt in', product.madeIn],
    ['Material', product.material],
    ['Kundenname', product.user.name],
    ['Firma', product.user.company],
    ['E-Mail', product.user.email],
    ['Adresse', product.user.address],
  ];

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="text-left text-slate-900 md:flex-1"
        >
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-500">
              {statusLabel(product.status)}
            </span>
            <span className="text-lg font-semibold text-slate-900">{product.name}</span>
            <span className="text-sm text-slate-500">{product.brand}</span>
            <span className="text-xs text-slate-400">{new Date(product.createdAt).toLocaleTimeString('de-DE')}</span>
          </div>
        </button>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as StatusOption)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs uppercase tracking-[0.2em]"
            >
              {STATUS_OPTIONS.map((status) => (
                <option
                  key={status.value}
                  value={status.value}
                  disabled={status.value === 'PRECHECK'}
                >
                  {status.label}
                </option>
              ))}
            </select>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleUpdate}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition disabled:opacity-70"
                >
                  {loading ? 'Speichert…' : 'Status aktualisieren'}
                </button>
                {selectedStatus === 'PASS' && (
                  <button
                    type="button"
                    disabled={sendLoading || !canSendCertificate}
                    onClick={handleSendCertificate}
                    className="rounded-lg border border-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900 transition disabled:opacity-70"
                  >
                    {sendLoading ? 'Sendet Zertifikat…' : canSendCertificate ? 'Send Certificate' : 'Warten auf Zahlung'}
                  </button>
                )}
                {product.certificate?.pdfUrl && (
                  <a
                    href={product.certificate.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900 transition hover:bg-slate-50"
                  >
                    PDF herunterladen
                  </a>
                )}
              </div>
            </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold uppercase tracking-[0.3em] text-slate-500">Payment Status</span>
            <select
              value={paymentStatusValue}
              onChange={(e) => setPaymentStatusValue(e.target.value as PaymentStatusOption)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold"
            >
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={paymentStatusLoading}
              onClick={handlePaymentStatusChange}
              className="rounded-lg border border-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900 transition disabled:opacity-70"
            >
              {paymentStatusLoading ? 'Speichert…' : 'Confirm'}
            </button>
          </div>
          {paymentStatusMessage && <p className="mt-1 text-xs text-slate-500">{paymentStatusMessage}</p>}
      </div>
      {selectedStatus === 'FAIL' && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Grund für Ablehnung / benötigte Infos"
          className="mt-3 w-full rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900"
          rows={2}
        />
      )}
      {expanded && (
        <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          {detailFields.map(([label, value]) => (
            <div key={label} className="flex flex-col border-b border-slate-200 pb-2 last:border-b-0 last:pb-0">
              <span className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">{label}</span>
              <span className="text-sm font-semibold text-slate-900">{value || '—'}</span>
            </div>
          ))}
        </div>
      )}
      {localMessage && <p className="mt-3 text-xs text-slate-500">{localMessage}</p>}
    </article>
  );
}
