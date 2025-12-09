'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CertificatePreviewModal } from '@/components/CertificatePreviewModal';
import { useCertificateActions } from '@/hooks/useCertificateActions';
import AdminHeader from './components/AdminHeader';
import AdminProductRow from './components/AdminProductRow';
import SuperadminPanel from './components/SuperadminPanel';
import { AdminPermissions, AdminProduct, AdminSummary, PaymentStatusOption, StatusOption } from './types';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [adminInfo, setAdminInfo] = useState<AdminSummary | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusOption | 'ALL'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatusOption | 'ALL'>('ALL');
  const [showSuperControls, setShowSuperControls] = useState(false);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const isSuperAdmin = adminInfo?.role === 'SUPERADMIN';
  const canUpdateStatus = adminInfo?.role === 'SUPERADMIN' || adminInfo?.role === 'EXAMINER';
  const canFinalizeStatus = isSuperAdmin;
  const canManagePayments = isSuperAdmin;
  const canManageLicense = isSuperAdmin;
  const canGenerateCert = isSuperAdmin;
  const canUploadReport = isSuperAdmin;
  const canSendCompletion = isSuperAdmin;

  const permissions: AdminPermissions = {
    role: adminInfo?.role || 'VIEWER',
    canUpdateStatus,
    canFinalizeStatus,
    canManagePayments,
    canManageLicense,
    canGenerateCert,
    canUploadReport,
    canSendCompletion,
  };

  const { handlePreview, previewUrl, isLoading: isPreviewLoading } = useCertificateActions();

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

  // Clear any mixed user session when visiting admin
  useEffect(() => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/me', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        setAuthed(Boolean(data?.admin));
        setAdminInfo(data?.admin || null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
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
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAuthed(true);
        setAdminInfo(data?.admin || null);
        setEmail('');
        setPassword('');
      } else {
        setMessage(data?.error === 'UNAUTHORIZED' ? 'Keine Berechtigung' : 'Falsche Admin-Zugangsdaten');
      }
    } catch (err) {
      setMessage('Login fehlgeschlagen, bitte später erneut versuchen.');
    }
  };

  const onPreviewClick = async (certId: string) => {
    setActivePreviewId(certId);
    await handlePreview(certId);
  };

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <h1 className="mb-6 text-2xl font-semibold">Admin Login</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Admin-E-Mail"
          className="mb-3 w-full rounded-lg border px-3 py-2"
        />
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
    <div className="min-h-screen bg-slate-950/5 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <AdminHeader
          isSuperAdmin={isSuperAdmin}
          showSuperControls={showSuperControls}
          onToggleSuper={() => {
            setShowSuperControls((prev) => !prev);
          }}
          onRefresh={fetchProducts}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          paymentFilter={paymentFilter}
          onPaymentFilterChange={setPaymentFilter}
          onResetFilters={() => {
            setSearch('');
            setStatusFilter('ALL');
            setPaymentFilter('ALL');
          }}
          statusCounts={statusCounts}
          banner={banner}
        />

        <SuperadminPanel isOpen={isSuperAdmin && showSuperControls} />

        {loadingProducts ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
            Lade Produkte…
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
            Keine Produkte oder Filter-Treffer. Bitte Filter anpassen oder Liste aktualisieren.
          </div>
        ) : (
          Object.entries(grouped).map(([date, entries]) => (
            <section key={date} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">{date}</h2>
                <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Batch: {entries.length}</span>
              </div>
              {entries.map((product) => (
                <AdminProductRow
                  key={product.id}
                  product={product}
                  onUpdated={() => {
                    fetchProducts();
                    setMessage(`Status für ${product.name} aktualisiert.`);
                  }}
                  onPreview={(id) => onPreviewClick(id)}
                  isPreviewLoading={isPreviewLoading && activePreviewId === (product.certificate?.id || 'temp')}
                  permissions={permissions}
                />
              ))}
            </section>
          ))
        )}
        {message && <p className="text-sm text-green-700">{message}</p>}
      </div>

      <CertificatePreviewModal 
        isOpen={!!previewUrl}
        onClose={() => window.location.reload()}
        pdfUrl={previewUrl}
        productName="Admin Preview"
      />
    </div>
  );
}
