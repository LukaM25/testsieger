'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CertificatePreviewModal } from '@/components/CertificatePreviewModal';
import { useCertificateActions } from '@/hooks/useCertificateActions';
import AdminHeader from './components/AdminHeader';
import AdminProductRow from './components/AdminProductRow';
import AnalyticsPanel from './components/AnalyticsPanel';
import SuperadminPanel from './components/SuperadminPanel';
import CreateCustomerDialog from './components/CreateCustomerDialog';
import { AdminAuthInfo, AdminCustomerSummary, AdminPermissions, AdminProduct, PaymentStatusOption, StatusOption } from './types';
import { formatContactName } from '@/lib/name';

type ProductsResponse = {
  products?: AdminProduct[];
  total?: number;
  statusCounts?: Record<string, number>;
  nextCursor?: string | null;
  warning?: string;
  error?: string;
};

type ProductPatch = { id: string } & Partial<Omit<AdminProduct, 'id'>>;

const IDLE_TIMEOUT_MS = 12 * 60 * 60 * 1000;
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
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  const [presetCustomer, setPresetCustomer] = useState<AdminCustomerSummary | null>(null);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const productsAbortRef = useRef<AbortController | null>(null);
  const didInitialProductsFetchRef = useRef(false);
  const lastFetchedProductsKeyRef = useRef<string | null>(null);
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
    if (!authed) {
      didInitialProductsFetchRef.current = false;
      lastFetchedProductsKeyRef.current = null;
      return;
    }
    if (didInitialProductsFetchRef.current) return;
    didInitialProductsFetchRef.current = true;
    lastFetchedProductsKeyRef.current = JSON.stringify({ search, statusFilter, paymentFilter });
    fetchProducts({ cursor: null, append: false });
  }, [authed, fetchProducts, paymentFilter, search, statusFilter]);

  useEffect(() => {
    if (!authed || !didInitialProductsFetchRef.current) return;
    const productsKey = JSON.stringify({ search, statusFilter, paymentFilter });
    if (lastFetchedProductsKeyRef.current === productsKey) return;
    const timer = window.setTimeout(() => {
      lastFetchedProductsKeyRef.current = productsKey;
      fetchProducts({ cursor: null, append: false });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [authed, fetchProducts, paymentFilter, search, statusFilter]);

  const grouped = useMemo(() => {
    return products.reduce<Record<string, Record<string, { user: AdminProduct['user']; items: AdminProduct[] }>>>(
      (acc, product) => {
        const date = new Date(product.createdAt).toLocaleDateString('de-DE', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        if (!acc[date]) acc[date] = {};
        const userKey = product.user.email || product.user.name;
        if (!acc[date][userKey]) acc[date][userKey] = { user: product.user, items: [] };
        acc[date][userKey].items.push(product);
        return acc;
      },
      {},
    );
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
      <div className="flex min-h-[80vh] items-center justify-center bg-slate-50 px-4 py-12">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="w-full max-w-sm rounded-3xl border border-slate-200/80 bg-white p-8 shadow-[0_30px_80px_-50px_rgba(43,64,102,0.5)]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">DPI Admin</p>
          <h1 className="mt-2 text-2xl font-semibold text-[#2B4066]">Anmelden</h1>
          <label className="mt-6 block text-xs font-semibold text-slate-600">
            E-Mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#1d4ed8]/50 focus:bg-white focus:ring-4 focus:ring-[#1d4ed8]/10"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>
          <label className="mt-4 block text-xs font-semibold text-slate-600">
            Passwort
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#1d4ed8]/50 focus:bg-white focus:ring-4 focus:ring-[#1d4ed8]/10"
              autoComplete="current-password"
            />
          </label>
          <button
            type="submit"
            className="mt-6 w-full rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#16294d] px-4 py-3 text-sm font-semibold !text-white shadow-sm transition hover:brightness-110"
          >
            Anmelden
          </button>
          {message && <p className="mt-4 text-sm text-rose-600" role="alert">{message}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-20 pt-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {idleWarning && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-xl" role="alert">
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
          onCreateCustomer={() => setCreateCustomerOpen(true)}
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

        <SuperadminPanel
          isOpen={isSuperAdmin && showSuperControls}
          onProductsCreated={refreshProducts}
          presetCustomer={presetCustomer}
        />

        <CreateCustomerDialog
          open={createCustomerOpen}
          onClose={() => setCreateCustomerOpen(false)}
          onCreateProduct={(customer) => {
            setPresetCustomer(customer);
            setShowSuperControls(true);
            window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
          }}
        />

        <AnalyticsPanel />

        {loadingProducts && products.length === 0 ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-3xl border border-slate-200/70 bg-white" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
            <p className="text-base font-semibold text-[#2B4066]">Keine Treffer</p>
            <p className="mt-1 text-sm text-slate-500">Passe Suche oder Filter an, oder aktualisiere die Liste.</p>
          </div>
        ) : (
          <div className={`space-y-8 transition-opacity duration-200 ${loadingProducts ? 'opacity-60' : 'opacity-100'}`}>
            {Object.entries(grouped).map(([date, userGroups]) => {
              const totalEntries = Object.values(userGroups).reduce((sum, group) => sum + group.items.length, 0);
              return (
                <section key={date} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold text-[#2B4066]">{date}</h2>
                    <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-600">{totalEntries}</span>
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>
                  {Object.entries(userGroups).map(([userKey, group]) => {
                    const userDisplayName = formatContactName(group.user.name, group.user.gender, group.user.email);
                    const title = group.user.company ? `${group.user.company} · ${userDisplayName}` : userDisplayName;
                    const initial = (group.user.company || group.user.name || '?').trim().charAt(0).toUpperCase();
                    return (
                      <details
                        key={userKey}
                        open
                        className="group rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_60px_-45px_rgba(43,64,102,0.35)]"
                      >
                        <summary className="flex cursor-pointer list-none items-center gap-4 rounded-3xl p-4 transition hover:bg-slate-50/70 [&::-webkit-details-marker]:hidden">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1d4ed8] to-[#16294d] text-sm font-semibold text-white">
                            {initial}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-900">{title}</span>
                            <span className="block truncate text-xs text-slate-500">{group.user.email}</span>
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-600">
                            {group.items.length} {group.items.length === 1 ? 'Produkt' : 'Produkte'}
                          </span>
                          <svg viewBox="0 0 20 20" className="h-4 w-4 text-slate-400 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                            <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </summary>
                        <div className="space-y-3 border-t border-slate-100 p-4">
                          {group.items.map((product) => (
                            <AdminProductRow
                              key={product.id}
                              product={product}
                              onUpdated={applyProductPatch}
                              onPreview={onPreviewClick}
                              isPreviewLoading={isPreviewLoading && activePreviewId === (product.certificate?.id || 'temp')}
                              permissions={permissions}
                            />
                          ))}
                        </div>
                      </details>
                    );
                  })}
                </section>
              );
            })}
          </div>
        )}
        {nextCursor ? (
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => fetchProducts({ cursor: nextCursor, append: true })}
              disabled={loadingMore}
              className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-[#2B4066] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingMore ? 'Lädt…' : 'Mehr laden'}
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
