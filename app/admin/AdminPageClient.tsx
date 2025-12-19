'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CertificatePreviewModal } from '@/components/CertificatePreviewModal';
import { useCertificateActions } from '@/hooks/useCertificateActions';
import AdminHeader from './components/AdminHeader';
import AdminProductRow from './components/AdminProductRow';
import SuperadminPanel from './components/SuperadminPanel';
import { AdminAuthInfo, AdminPermissions, AdminProduct, PaymentStatusOption, StatusOption } from './types';

type ProductsResponse = {
  products?: AdminProduct[];
  total?: number;
  statusCounts?: Record<string, number>;
  nextCursor?: string | null;
  warning?: string;
  error?: string;
};

type ProductPatch = { id: string } & Partial<Omit<AdminProduct, 'id'>>;

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const IDLE_WARN_MS = 60 * 1000;

function mergeProduct(prev: AdminProduct, patch: ProductPatch): AdminProduct {
  const next: AdminProduct = { ...prev, ...patch };

  if (Object.prototype.hasOwnProperty.call(patch, 'user') && patch.user) {
    next.user = { ...prev.user, ...patch.user };
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'certificate')) {
    if (patch.certificate === null) next.certificate = null;
    else if (patch.certificate) next.certificate = { ...(prev.certificate ?? ({} as any)), ...patch.certificate };
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'license')) {
    if (patch.license === null) next.license = null;
    else if (patch.license) next.license = { ...(prev.license ?? ({} as any)), ...patch.license };
  }

  return next;
}

function matchesFilters(
  product: AdminProduct,
  filters: {
    statusFilter: StatusOption | 'ALL';
    paymentFilter: PaymentStatusOption | 'ALL';
  },
) {
  if (filters.statusFilter !== 'ALL') {
    if (product.adminProgress !== filters.statusFilter && product.status !== filters.statusFilter) return false;
  }
  if (filters.paymentFilter !== 'ALL') {
    if (product.paymentStatus !== filters.paymentFilter) return false;
  }
  return true;
}

type AdminPageClientProps = {
  initialAdmin: AdminAuthInfo | null;
};

export default function AdminPageClient({ initialAdmin }: AdminPageClientProps) {
  const [authed, setAuthed] = useState(Boolean(initialAdmin));
  const [adminInfo, setAdminInfo] = useState<AdminAuthInfo | null>(initialAdmin);
  const [idleWarning, setIdleWarning] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusOption | 'ALL'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatusOption | 'ALL'>('ALL');
  const [showSuperControls, setShowSuperControls] = useState(false);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const productsAbortRef = useRef<AbortController | null>(null);
  const warnTimerRef = useRef<number | null>(null);
  const idleWarningRef = useRef(false);
  const role = adminInfo?.role || 'VIEWER';
  const isSuperAdmin = role === 'SUPERADMIN';
  const permissions: AdminPermissions = useMemo(() => {
    const canUpdateStatus = role === 'SUPERADMIN' || role === 'EXAMINER';
    return {
      role,
      canUpdateStatus,
      canFinalizeStatus: role === 'SUPERADMIN',
      canManagePayments: role === 'SUPERADMIN',
      canManageLicense: role === 'SUPERADMIN',
      canGenerateCert: role === 'SUPERADMIN',
      canUploadReport: role === 'SUPERADMIN',
      canSendCompletion: role === 'SUPERADMIN',
    };
  }, [role]);

  const { handlePreview, clearPreview, previewUrl, isLoading: isPreviewLoading } = useCertificateActions();

  const fetchProducts = useCallback(async (opts?: { cursor?: string | null; append?: boolean }) => {
    const append = Boolean(opts?.append);
    if (append) {
      setLoadingMore(true);
    } else {
      productsAbortRef.current?.abort();
      productsAbortRef.current = new AbortController();
      setLoadingProducts(true);
    }
    try {
      const params = new URLSearchParams();
      const q = search.trim();
      if (q) params.set('q', q);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (paymentFilter !== 'ALL') params.set('payment', paymentFilter);
      params.set('limit', '50');
      params.set('signed', '0');
      if (opts?.cursor) params.set('cursor', opts.cursor);

      const res = await fetch(`/api/admin/products?${params.toString()}`, {
        credentials: 'same-origin',
        cache: 'no-store',
        signal: append ? undefined : productsAbortRef.current?.signal,
      });
      if (!res.ok) {
        setBanner(`Fehler beim Laden der Produkte: ${res.status}`);
        return;
      }
      const data = (await res.json()) as ProductsResponse;
      setBanner(data.warning || null);
      setTotalCount(typeof data.total === 'number' ? data.total : null);
      setStatusCounts(data.statusCounts ?? {});
      setNextCursor(data.nextCursor ?? null);
      setProducts((prev) => {
        const incoming = data.products ?? [];
        if (!append) return incoming;
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        for (const item of incoming) {
          if (!seen.has(item.id)) merged.push(item);
        }
        return merged;
      });
    } catch (err) {
      if ((err as any)?.name === 'AbortError') return;
      console.error(err);
      setBanner('Produktliste konnte nicht geladen werden.');
    } finally {
      if (append) setLoadingMore(false);
      else setLoadingProducts(false);
    }
  }, [paymentFilter, search, statusFilter]);

  const fetchProductsRef = useRef(fetchProducts);
  useEffect(() => {
    fetchProductsRef.current = fetchProducts;
  }, [fetchProducts]);

  const refreshProducts = useCallback(() => {
    void fetchProductsRef.current({ cursor: null, append: false });
  }, []);

  const applyProductPatch = useCallback(
    (patch: ProductPatch) => {
      setProducts((prev) => {
        let didUpdate = false;
        const next = prev.flatMap((p) => {
          if (p.id !== patch.id) return [p];
          const merged = mergeProduct(p, patch);
          didUpdate = true;
          if (!matchesFilters(merged, { statusFilter, paymentFilter })) return [];
          return [merged];
        });
        return didUpdate ? next : prev;
      });
    },
    [paymentFilter, statusFilter],
  );

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

  const resetIdleTimers = useCallback(() => {
    if (warnTimerRef.current) window.clearTimeout(warnTimerRef.current);
    if (idleWarningRef.current) {
      idleWarningRef.current = false;
      setIdleWarning(false);
    }
    const warnAfter = Math.max(0, IDLE_TIMEOUT_MS - IDLE_WARN_MS);
    warnTimerRef.current = window.setTimeout(() => {
      idleWarningRef.current = true;
      setIdleWarning(true);
    }, warnAfter);
  }, []);

  useEffect(() => {
    if (!authed) return;
    resetIdleTimers();

    const handleActivity = () => {
      resetIdleTimers();
    };

    const options: AddEventListenerOptions = { passive: true };
    window.addEventListener('mousemove', handleActivity, options);
    window.addEventListener('keydown', handleActivity, options);
    window.addEventListener('scroll', handleActivity, options);
    window.addEventListener('click', handleActivity, options);
    window.addEventListener('touchstart', handleActivity, options);

    return () => {
      if (warnTimerRef.current) window.clearTimeout(warnTimerRef.current);
      window.removeEventListener('mousemove', handleActivity, options);
      window.removeEventListener('keydown', handleActivity, options);
      window.removeEventListener('scroll', handleActivity, options);
      window.removeEventListener('click', handleActivity, options);
      window.removeEventListener('touchstart', handleActivity, options);
    };
  }, [authed, resetIdleTimers]);

  const keepAdminAlive = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/me', { credentials: 'same-origin', cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.admin) {
        setAuthed(true);
        setAdminInfo(data.admin);
      } else {
        setAuthed(false);
        setAdminInfo(null);
      }
    } catch {
      setAuthed(false);
      setAdminInfo(null);
    } finally {
      resetIdleTimers();
    }
  }, [resetIdleTimers]);

  useEffect(() => {
    if (!authed) return;
    fetchProducts({ cursor: null, append: false });
  }, [authed, fetchProducts]);

  useEffect(() => {
    if (!authed) return;
    const timer = window.setTimeout(() => {
      fetchProducts({ cursor: null, append: false });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [authed, fetchProducts, paymentFilter, search, statusFilter]);

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
	    try {
	      const normalizedEmail = email.trim().toLowerCase();
	      const res = await fetch('/api/admin/login', {
	        method: 'POST',
	        headers: { 'Content-Type': 'application/json' },
	        body: JSON.stringify({ email: normalizedEmail, password }),
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

  const onPreviewClick = useCallback(async (certId: string) => {
    setActivePreviewId(certId);
    await handlePreview(certId);
  }, [handlePreview]);

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <h1 className="mb-6 text-2xl font-semibold">Admin Login</h1>
	        <input
	          type="email"
	          value={email}
	          onChange={(e) => setEmail(e.target.value.toLowerCase())}
	          placeholder="Admin-E-Mail"
	          className="mb-3 w-full rounded-lg border px-3 py-2"
	          autoComplete="email"
	          autoCapitalize="none"
	          autoCorrect="off"
	          spellCheck={false}
	          onKeyDown={(e) => {
	            if (e.key === 'Enter') handleLogin();
	          }}
	        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin-Passwort"
          className="w-full rounded-lg border px-3 py-2"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleLogin();
          }}
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
        {idleWarning && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>Sie werden wegen Inaktivität in Kürze automatisch abgemeldet.</span>
              <button
                type="button"
                onClick={keepAdminAlive}
                className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100"
              >
                Angemeldet bleiben
              </button>
            </div>
          </div>
        )}
        <AdminHeader
          isSuperAdmin={isSuperAdmin}
          showSuperControls={showSuperControls}
          onToggleSuper={() => {
            setShowSuperControls((prev) => !prev);
          }}
          onRefresh={refreshProducts}
          shownCount={products.length}
          totalCount={totalCount}
          isLoading={loadingProducts}
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
        ) : products.length === 0 ? (
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
	                  onUpdated={applyProductPatch}
	                  onPreview={onPreviewClick}
	                  isPreviewLoading={isPreviewLoading && activePreviewId === (product.certificate?.id || 'temp')}
	                  permissions={permissions}
	                />
	              ))}
            </section>
          ))
        )}
        {nextCursor ? (
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => fetchProducts({ cursor: nextCursor, append: true })}
              disabled={loadingMore}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingMore ? 'Lädt…' : 'Mehr laden / Load more'}
            </button>
          </div>
        ) : null}
        {message && <p className="text-sm text-green-700">{message}</p>}
      </div>

      <CertificatePreviewModal 
        isOpen={!!previewUrl}
        onClose={() => {
          clearPreview();
          setActivePreviewId(null);
        }}
        pdfUrl={previewUrl}
        productName="Admin Preview"
      />
    </div>
  );
}
