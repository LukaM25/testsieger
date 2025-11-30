'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCertificateActions } from '@/hooks/useCertificateActions';
import { CertificatePreviewModal } from '@/components/CertificatePreviewModal';

const STATUS_OPTIONS = [
  { value: 'PRECHECK', label: 'Pre-Check / Pre-check' },
  { value: 'RECEIVED', label: 'Eingegangen / Received' },
  { value: 'ANALYSIS', label: 'Analyse / Analysis' },
  { value: 'COMPLETION', label: 'Abschluss / Completion' },
  { value: 'PASS', label: 'Bestanden / Pass' },
  { value: 'FAIL', label: 'Nicht bestanden / Fail' },
] as const;

const PAYMENT_STATUS_OPTIONS = [
  { value: 'UNPAID', label: 'Unbezahlt / Unpaid' },
  { value: 'PAID', label: 'Bezahlt / Paid' },
  { value: 'MANUAL', label: 'Manuelle Zahlung / Manual payment' },
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
    case 'PRECHECK': return 'Pre-Check eingereicht / Submitted';
    case 'PAID': return 'Testgebühr bezahlt / Paid';
    case 'TEST_PASSED': return 'Test bestanden / Passed';
    case 'IN_REVIEW': return 'Prüfung läuft / In review';
    case 'COMPLETED': return 'Zertifikat erstellt / Certificate issued';
    case 'RECEIVED': return 'Eingegangen / Received';
    case 'ANALYSIS': return 'Analyse / Analysis';
    case 'COMPLETION': return 'Abschluss / Completion';
    case 'PASS': return 'Bestanden / Pass';
    case 'FAIL': return 'Nicht bestanden / Fail';
    default: return status;
  }
};

const STATUS_TONE: Record<string, string> = {
  PRECHECK: 'bg-slate-100 text-slate-700 ring-slate-200',
  PAID: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  TEST_PASSED: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  IN_REVIEW: 'bg-amber-50 text-amber-700 ring-amber-100',
  COMPLETED: 'bg-blue-50 text-blue-700 ring-blue-100',
  RECEIVED: 'bg-sky-50 text-sky-700 ring-sky-100',
  ANALYSIS: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  COMPLETION: 'bg-blue-50 text-blue-700 ring-blue-100',
  PASS: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  FAIL: 'bg-rose-50 text-rose-700 ring-rose-100',
};

const PAYMENT_TONE: Record<string, string> = {
  UNPAID: 'bg-rose-50 text-rose-700 ring-rose-100',
  PAID: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  MANUAL: 'bg-amber-50 text-amber-700 ring-amber-100',
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusOption | 'ALL'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatusOption | 'ALL'>('ALL');

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

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchTerm =
        !term ||
        [p.name, p.brand, p.user.email, p.user.name]
          .filter(Boolean)
          .some((field) => (field || '').toLowerCase().includes(term));
      const matchStatus = statusFilter === 'ALL' || p.adminProgress === statusFilter || p.status === statusFilter;
      const matchPayment = paymentFilter === 'ALL' || p.paymentStatus === paymentFilter;
      return matchTerm && matchStatus && matchPayment;
    });
  }, [products, search, statusFilter, paymentFilter]);

  const statusCounts = useMemo(() => {
    return filteredProducts.reduce<Record<string, number>>((acc, p) => {
      const key = p.status;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [filteredProducts]);

  const grouped = useMemo(() => {
    return filteredProducts.reduce<Record<string, AdminProduct[]>>((acc, product) => {
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
  }, [filteredProducts]);

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
          <div className="mt-4 grid gap-3 md:grid-cols-[1.4fr,1fr,1fr,auto] items-center">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-inner">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Suche Name/Marke/E-Mail · Search name/brand/email"
                className="w-full bg-transparent text-sm text-slate-900 outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusOption | 'ALL')}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
            >
              <option value="ALL">Alle Status · All statuses</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as PaymentStatusOption | 'ALL')}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
            >
              <option value="ALL">Alle Zahlungen · All payments</option>
              {PAYMENT_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
                setPaymentFilter('ALL');
              }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Filter zurücksetzen / Reset
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(statusCounts).length === 0 ? (
              <span className="text-xs text-slate-500">Keine Treffer / No matches</span>
            ) : (
              Object.entries(statusCounts).map(([key, count]) => (
                <span
                  key={key}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${STATUS_TONE[key] ?? 'bg-slate-100 text-slate-700 ring-slate-200'}`}
                >
                  {statusLabel(key)} <span className="text-[11px] font-bold text-slate-800">({count})</span>
                </span>
              ))
            )}
          </div>
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
  const [teamNote, setTeamNote] = useState('');
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
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setStatusMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        body: JSON.stringify({
          productId: product.id,
          message: teamNote.trim() ? teamNote.trim().slice(0, 1000) : undefined,
        }),
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
        body: JSON.stringify({
          message: teamNote.trim() ? teamNote.trim().slice(0, 1000) : undefined,
        }),
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
    <article className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="text-left text-slate-900 md:flex-1"
        >
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold text-slate-900">{product.name}</span>
              <span className="text-sm text-slate-500">{product.brand}</span>
              <span className="text-xs text-slate-400">
                {new Date(product.createdAt).toLocaleTimeString('de-DE')}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatusMenuOpen((o) => !o);
                  }}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ring-1 ${STATUS_TONE[product.status] ?? 'bg-slate-100 text-slate-700 ring-slate-200'}`}
                  aria-haspopup="true"
                  aria-expanded={statusMenuOpen}
                >
                  {statusLabel(product.status)} ▾
                </button>
                {statusMenuOpen && (
                  <div className="absolute left-0 z-20 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                    <div className="text-sm font-semibold text-slate-900">{product.name}</div>
                    <div className="mt-2 flex flex-col gap-2">
                      <a
                        href={product.certificate?.pdfUrl || '#'}
                        target={product.certificate?.pdfUrl ? '_blank' : undefined}
                        rel="noreferrer"
                        className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                          product.certificate?.pdfUrl
                            ? 'bg-slate-900 text-white hover:bg-black'
                            : 'bg-slate-100 text-slate-500 cursor-not-allowed'
                        }`}
                        onClick={(e) => {
                          if (!product.certificate?.pdfUrl) e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        Zertifikat öffnen / Open certificate
                      </a>
                      <a
                        href={product.certificate?.sealUrl || '#'}
                        target={product.certificate?.sealUrl ? '_blank' : undefined}
                        rel="noreferrer"
                        className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                          product.certificate?.sealUrl
                            ? 'bg-amber-600 text-white hover:bg-amber-700'
                            : 'bg-slate-100 text-slate-500 cursor-not-allowed'
                        }`}
                        onClick={(e) => {
                          if (!product.certificate?.sealUrl) e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        Siegel öffnen / Open seal
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ring-1 ${PAYMENT_TONE[paymentStatusValue] ?? 'bg-slate-100 text-slate-700 ring-slate-200'}`}
              >
                Zahlung: {paymentStatusValue === 'PAID' ? 'Bezahlt / Paid' : paymentStatusValue === 'MANUAL' ? 'Manuell / Manual' : 'Offen / Unpaid'}
              </span>
              {product.certificate?.ratingScore && product.certificate?.ratingLabel && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 ring-1 ring-emerald-100">
                  {product.certificate.ratingScore} · {product.certificate.ratingLabel}
                </span>
              )}
            </div>
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
              {loading ? '...' : 'Update / Aktualisieren'}
            </button>

            {/* PREVIEW BUTTON */}
            <button
              type="button"
              onClick={handleSmartPreview}
              disabled={isPreviewLoading}
              className="rounded-lg border border-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 transition hover:bg-blue-50 disabled:opacity-50"
            >
              {isPreviewLoading ? 'Lade...' : 'Vorschau / Preview'}
            </button>

            {/* SEND BUTTON */}
            {selectedStatus === 'PASS' && (
              <button
                type="button"
                disabled={sendLoading || !canSendCertificate}
                onClick={() => handleSendCertificate()}
                className="rounded-lg border border-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-70"
              >
                {sendLoading
                  ? 'Sendet...'
                  : canSendCertificate
                    ? 'Zertifikat senden / Send cert'
                    : 'Warten auf Zahlung / Wait for payment'}
              </button>
            )}

            {product.certificate?.pdfUrl && (
              <a
                href={product.certificate.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900 transition hover:bg-slate-50"
              >
                PDF Bericht / PDF Report
              </a>
            )}
            <a
              href={`/api/admin/products/${product.id}/rating-sheet`}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:bg-slate-50"
            >
              Rating CSV / Bewertung CSV
            </a>
            {product.certificate?.sealUrl && (
              <a
                href={product.certificate.sealUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-amber-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 transition hover:bg-amber-50"
              >
                Siegel / Seal
              </a>
            )}
            <a
              href={sheetUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:bg-slate-50"
            >
              Rating Sheet / Bewertungsblatt
            </a>
            <button
              type="button"
              disabled={genLoading}
              onClick={handleGenerateWithRating}
              className="rounded-lg border border-amber-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800 transition hover:bg-amber-50 disabled:opacity-70"
            >
              {genLoading ? 'Erstellt…' : 'Cert & Siegel / Certificate & Seal'}
            </button>
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-slate-600 mb-1">
            Notiz vom Prüfsiegel Team / Note from the Prüfsiegel Team (optional)
          </label>
          <textarea
            value={teamNote}
            onChange={(e) => setTeamNote(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Kurze Nachricht für den Kunden (wird in die E-Mail eingefügt) / Short note for the customer"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-400 focus:outline-none"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold uppercase tracking-[0.3em] text-slate-500">Payment Status / Zahlungsstatus</span>
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
            {paymentStatusLoading ? '...' : 'Confirm / Bestätigen'}
          </button>
        </div>
        {paymentStatusMessage && <p className="mt-1 text-xs text-slate-500">{paymentStatusMessage}</p>}
      </div>

      {selectedStatus === 'FAIL' && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Grund für Ablehnung / benötigte Infos · Reason for rejection / needed info"
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
