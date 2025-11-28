'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCertificateActions } from '@/hooks/useCertificateActions';
import { CertificatePreviewModal } from '@/components/CertificatePreviewModal';

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
  category?: string | null;
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
    id: string;
    pdfUrl?: string | null;
    qrUrl?: string | null;
    seal_number?: string | null;
    externalReferenceId?: string | null;
    ratingScore?: string | null;
    ratingLabel?: string | null;
    sealUrl?: string | null;
  } | null;
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'PRECHECK': return 'Pre-Check eingereicht';
    case 'PAID': return 'Testgebühr bezahlt';
    case 'TEST_PASSED': return 'Test bestanden';
    case 'IN_REVIEW': return 'Prüfung läuft';
    case 'COMPLETED': return 'Zertifikat erstellt';
    case 'RECEIVED':
    case 'ANALYSIS':
    case 'COMPLETION':
    case 'PASS':
    case 'FAIL': return status.charAt(0) + status.slice(1).toLowerCase();
    default: return status;
  }
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Hook Initialization
  const { handlePreview, previewUrl, isLoading: isPreviewLoading } = useCertificateActions();
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);

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
    // If a regular user session is present, clear it to avoid mixed user/admin state.
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
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

  // Handler for preview click (Parent side)
  const onPreviewClick = async (certId: string) => {
    setActivePreviewId(certId);
    await handlePreview(certId);
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
            Internal Engine Active. Preview certificates before sending.
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
                  // UPDATED: Pass the flexible ID handler
                  onPreview={(id) => onPreviewClick(id)}
                  isPreviewLoading={isPreviewLoading && activePreviewId === (product.certificate?.id || 'temp')}
                />
              ))}
            </section>
          ))
        )}
        {message && <p className="text-sm text-green-700">{message}</p>}
      </div>

      {/* The Modal */}
      <CertificatePreviewModal 
        isOpen={!!previewUrl}
        onClose={() => window.location.reload()} // Reload to clear state/blobs cleanly
        pdfUrl={previewUrl}
        productName="Admin Preview"
      />
    </div>
  );
}

function AdminProductRow({
  product,
  onUpdated,
  onPreview,
  isPreviewLoading
}: {
  product: AdminProduct;
  onUpdated: () => void;
  // UPDATED Type: Now accepts an ID string
  onPreview: (id: string) => void;
  isPreviewLoading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<StatusOption>(
    (product.adminProgress as StatusOption) || 'PRECHECK'
  );
  useEffect(() => {
    setSelectedStatus(product.adminProgress || 'PRECHECK');
  }, [product.adminProgress]);
  
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  
  const [paymentStatusValue, setPaymentStatusValue] = useState<PaymentStatusOption>(
    (product.paymentStatus as PaymentStatusOption) || 'UNPAID'
  );
  const [autoSent, setAutoSent] = useState(false);
  
  useEffect(() => {
    setPaymentStatusValue((product.paymentStatus as PaymentStatusOption) || 'UNPAID');
  }, [product.paymentStatus]);

  const [paymentStatusLoading, setPaymentStatusLoading] = useState(false);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string | null>(null);
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState(false);

  // NEW: Smart Preview Handler (Stops the Reload loop)
  const handleSmartPreview = async () => {
    // 1. If cert exists, call parent immediately
    if (product.certificate?.id) {
      onPreview(product.certificate.id);
      return;
    }

    // 2. If missing, create it first
    setLocalMessage('Erstelle Vorschau-Entwurf...');
    try {
      const res = await fetch('/api/admin/ensure-cert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id })
      });
      const data = await res.json();

      if (data.certificateId) {
        setLocalMessage('Lade Vorschau...');
        // A. Refresh list in background (so it exists next time)
        onUpdated();
        // B. Call parent with NEW ID immediately (No page reload needed)
        onPreview(data.certificateId);
      } else {
        setLocalMessage('Fehler bei Entwurf-Erstellung');
      }
    } catch (e) {
      console.error(e);
      setLocalMessage('Fehler.');
    }
  };

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
      if (selectedStatus === 'PASS' && canSendCertificate && !autoSent) {
        setAutoSent(true);
        await handleSendCertificate({ auto: true });
      }
    } catch (err) {
      console.error(err);
      setLocalMessage('Aktualisierung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  // Allow sending if payment is PAID/MANUAL and workflow is at least IN_REVIEW or PASS selected
  const paymentIsCovered =
    paymentStatusValue === 'PAID' ||
    paymentStatusValue === 'MANUAL' ||
    product.paymentStatus === 'PAID' ||
    product.paymentStatus === 'MANUAL';
  const workflowReady = product.status === 'IN_REVIEW' || product.status === 'COMPLETED' || selectedStatus === 'PASS';
  const canSendCertificate = paymentIsCovered && workflowReady;
  
  const handleSendCertificate = async (opts?: { auto?: boolean }) => {
    if (!canSendCertificate) {
      setLocalMessage('Produkt muss mindestens IN_REVIEW sein oder BEZAHLT, bevor das Zertifikat versendet wird.');
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
      setLocalMessage(opts?.auto ? 'Zertifikat automatisch versendet (Internal Engine).' : 'Zertifikat versendet (Internal Engine).');
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
    ['Kategorie', product.category],
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

  const sheetUrl = `https://docs.google.com/spreadsheets/d/1uwauj30aZ4KpwSHBL3Yi6yB85H_OQypI5ogKuR82KFk/edit?usp=sharing&productId=${product.id}`;

  const handleGenerateWithRating = async () => {
    setLocalMessage(null);
    setGenLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}/generate-cert-with-rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLocalMessage(data.error || 'Zertifikat/ Siegel konnte nicht erstellt werden.');
        return;
      }
      setLocalMessage('Zertifikat & Siegel erstellt.');
      onUpdated();
    } catch (err) {
      console.error(err);
      setLocalMessage('Erstellung fehlgeschlagen.');
    } finally {
      setGenLoading(false);
    }
  };

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
            {product.certificate?.ratingScore && product.certificate?.ratingLabel && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                {product.certificate.ratingScore} · {product.certificate.ratingLabel}
              </span>
            )}
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
              {loading ? '...' : 'Update'}
            </button>

            {/* PREVIEW BUTTON */}
            <button
              type="button"
              onClick={handleSmartPreview}
              disabled={isPreviewLoading}
              className="rounded-lg border border-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 transition hover:bg-blue-50 disabled:opacity-50"
            >
              {isPreviewLoading ? 'Lade...' : 'Vorschau'}
            </button>

            {/* SEND BUTTON */}
            {selectedStatus === 'PASS' && (
              <button
                type="button"
                disabled={sendLoading || !canSendCertificate}
                onClick={() => handleSendCertificate()}
                className="rounded-lg border border-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-70"
              >
                {sendLoading ? 'Sendet...' : canSendCertificate ? 'Send Cert' : 'Warten auf Zahlung'}
              </button>
            )}

            {product.certificate?.pdfUrl && (
              <a
                href={product.certificate.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900 transition hover:bg-slate-50"
              >
                PDF
              </a>
            )}
            {product.certificate?.sealUrl && (
              <a
                href={product.certificate.sealUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-amber-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 transition hover:bg-amber-50"
              >
                Siegel
              </a>
            )}
            <a
              href={sheetUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:bg-slate-50"
            >
              Rating Sheet
            </a>
            <button
              type="button"
              disabled={genLoading}
              onClick={handleGenerateWithRating}
              className="rounded-lg border border-amber-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800 transition hover:bg-amber-50 disabled:opacity-70"
            >
              {genLoading ? 'Erstellt…' : 'Cert & Siegel'}
            </button>
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
            {paymentStatusLoading ? '...' : 'Confirm'}
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
