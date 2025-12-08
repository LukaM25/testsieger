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
    reportUrl?: string | null;
  } | null;
  license?: {
    id: string;
    plan: string;
    status: string;
    licenseCode?: string | null;
    startsAt?: string | null;
    expiresAt?: string | null;
    paidAt?: string | null;
    stripeSubId?: string | null;
    stripePriceId?: string | null;
  } | null;
};

type AdminSummary = {
  id: string;
  email: string;
  name: string;
  role: 'VIEWER' | 'EXAMINER' | 'SUPERADMIN';
  active: boolean;
  revokedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type AuditEntry = {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  productId?: string | null;
  payload?: any;
  createdAt: string;
  admin: { id: string; name: string; email: string };
  product?: { id: string; name: string; brand: string | null };
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
  const [superTab, setSuperTab] = useState<'admins' | 'audits'>('admins');
  const [admins, setAdmins] = useState<AdminSummary[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [auditsLoading, setAuditsLoading] = useState(false);
  const [auditFilters, setAuditFilters] = useState({ adminId: '', productId: '', action: '' });
  const [superMessage, setSuperMessage] = useState<string | null>(null);
  const [adminForm, setAdminForm] = useState({ email: '', name: '', password: '', role: 'EXAMINER' as AdminSummary['role'] });
  const isSuperAdmin = adminInfo?.role === 'SUPERADMIN';
  const canUpdateStatus = adminInfo?.role === 'SUPERADMIN' || adminInfo?.role === 'EXAMINER';
  const canFinalizeStatus = isSuperAdmin;
  const canManagePayments = isSuperAdmin;
  const canManageLicense = isSuperAdmin;
  const canGenerateCert = isSuperAdmin;
  const canUploadReport = isSuperAdmin;
  const canSendCompletion = isSuperAdmin;

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

  const fetchAdmins = useCallback(async () => {
    setAdminsLoading(true);
    setSuperMessage(null);
    try {
      const res = await fetch('/api/admin/admins', { credentials: 'same-origin' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSuperMessage(data?.error || 'Admin-Liste konnte nicht geladen werden.');
        return;
      }
      setAdmins(data.admins ?? []);
    } catch (err) {
      setSuperMessage('Admin-Liste konnte nicht geladen werden.');
    } finally {
      setAdminsLoading(false);
    }
  }, []);

  const fetchAudits = useCallback(async () => {
    setAuditsLoading(true);
    setSuperMessage(null);
    try {
      const params = new URLSearchParams();
      if (auditFilters.adminId.trim()) params.set('adminId', auditFilters.adminId.trim());
      if (auditFilters.productId.trim()) params.set('productId', auditFilters.productId.trim());
      if (auditFilters.action.trim()) params.set('action', auditFilters.action.trim());
      params.set('limit', '100');
      const res = await fetch(`/api/admin/audits?${params.toString()}`, { credentials: 'same-origin' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSuperMessage(data?.error || 'Logs konnten nicht geladen werden.');
        return;
      }
      setAudits(data.audits ?? []);
    } catch (err) {
      setSuperMessage('Logs konnten nicht geladen werden.');
    } finally {
      setAuditsLoading(false);
    }
  }, [auditFilters]);

  const createAdmin = useCallback(async () => {
    setSuperMessage(null);
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(adminForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSuperMessage(data?.error || 'Admin konnte nicht angelegt werden.');
        return;
      }
      setAdminForm({ email: '', name: '', password: '', role: 'EXAMINER' });
      await fetchAdmins();
      setSuperMessage('Admin angelegt.');
    } catch {
      setSuperMessage('Admin konnte nicht angelegt werden.');
    }
  }, [adminForm, fetchAdmins]);

  const updateAdmin = useCallback(
    async (id: string, payload: Partial<{ role: AdminSummary['role']; active: boolean; password: string }>) => {
      setSuperMessage(null);
      try {
        const res = await fetch(`/api/admin/admins/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setSuperMessage(data?.error || 'Update fehlgeschlagen.');
          return;
        }
        await fetchAdmins();
        setSuperMessage('Gespeichert.');
      } catch {
        setSuperMessage('Update fehlgeschlagen.');
      }
    },
    [fetchAdmins],
  );

  useEffect(() => {
    // If a regular user session is present, clear it to avoid mixed user/admin state.
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
        <header className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-900/5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Admin Control</p>
              <h1 className="text-3xl font-bold text-slate-900">Zertifikats-Workflow steuern</h1>
              <p className="mt-2 text-sm text-slate-600">
                Suche, filtere, aktualisiere Status und verschicke Zertifikate mit klar beschrifteten Aktionen.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    const next = !showSuperControls;
                    setShowSuperControls(next);
                    setSuperTab('admins');
                    if (next) {
                      fetchAdmins();
                      fetchAudits();
                    }
                  }}
                  className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 shadow-sm transition hover:bg-indigo-100"
                >
                  Superadmin Controls
                </button>
              )}
              <button
                type="button"
                onClick={fetchProducts}
                className="rounded-xl border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
              >
                Liste aktualisieren / Refresh list
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1.4fr,1fr,1fr,auto] items-center">
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
              Filter zurücksetzen / Reset filters
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
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

        {isSuperAdmin && showSuperControls && (
          <section className="space-y-4 rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-indigo-500">Superadmin</p>
                <h2 className="text-xl font-bold text-slate-900">Konten & Logs</h2>
              </div>
              <div className="flex gap-2">
                <button
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${superTab === 'admins' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                  onClick={() => setSuperTab('admins')}
                >
                  Admins
                </button>
                <button
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${superTab === 'audits' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                  onClick={() => {
                    setSuperTab('audits');
                    fetchAudits();
                  }}
                >
                  Audit-Log
                </button>
              </div>
            </div>
            {superMessage && <p className="text-sm text-indigo-800">{superMessage}</p>}

            {superTab === 'admins' && (
              <div className="space-y-4">
                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-5">
                  <input
                    value={adminForm.email}
                    onChange={(e) => setAdminForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="E-Mail"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    value={adminForm.name}
                    onChange={(e) => setAdminForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Name"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    value={adminForm.password}
                    onChange={(e) => setAdminForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Passwort (min. 8 Zeichen)"
                    type="password"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <select
                    value={adminForm.role}
                    onChange={(e) => setAdminForm((f) => ({ ...f, role: e.target.value as AdminSummary['role'] }))}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="VIEWER">ÜBERSICHT / VIEWER</option>
                    <option value="EXAMINER">PRÜFER / EXAMINER</option>
                    <option value="SUPERADMIN">SUPERADMIN</option>
                  </select>
                  <button
                    type="button"
                    onClick={createAdmin}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                  >
                    Admin anlegen
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-slate-700">Name / E-Mail</th>
                        <th className="px-4 py-2 text-left font-semibold text-slate-700">Rolle</th>
                        <th className="px-4 py-2 text-left font-semibold text-slate-700">Aktiv</th>
                        <th className="px-4 py-2 text-left font-semibold text-slate-700">Letzter Login</th>
                        <th className="px-4 py-2 text-left font-semibold text-slate-700">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {adminsLoading ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-slate-500">Lade Admins…</td>
                        </tr>
                      ) : admins.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-slate-500">Keine Admins vorhanden.</td>
                        </tr>
                      ) : (
                        admins.map((adm) => (
                          <tr key={adm.id}>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-900">{adm.name}</div>
                              <div className="text-xs text-slate-600">{adm.email}</div>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={adm.role}
                                onChange={(e) => updateAdmin(adm.id, { role: e.target.value as AdminSummary['role'] })}
                                className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                              >
                                <option value="VIEWER">ÜBERSICHT / VIEWER</option>
                                <option value="EXAMINER">PRÜFER / EXAMINER</option>
                                <option value="SUPERADMIN">SUPERADMIN</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={adm.active && !adm.revokedAt}
                                  onChange={(e) => updateAdmin(adm.id, { active: e.target.checked })}
                                />
                                {adm.active && !adm.revokedAt ? 'Aktiv' : 'Deaktiviert'}
                              </label>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600">
                              {adm.lastLoginAt ? new Date(adm.lastLoginAt).toLocaleString() : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                onClick={() => {
                                  const pwd = window.prompt('Neues Passwort (min. 8 Zeichen):');
                                  if (pwd && pwd.length >= 8) {
                                    updateAdmin(adm.id, { password: pwd });
                                  }
                                }}
                              >
                                Passwort zurücksetzen
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {superTab === 'audits' && (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-[1fr,1fr,1fr,auto]">
                  <input
                    value={auditFilters.adminId}
                    onChange={(e) => setAuditFilters((f) => ({ ...f, adminId: e.target.value }))}
                    placeholder="Filter: Admin-ID"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    value={auditFilters.productId}
                    onChange={(e) => setAuditFilters((f) => ({ ...f, productId: e.target.value }))}
                    placeholder="Filter: Produkt-ID"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    value={auditFilters.action}
                    onChange={(e) => setAuditFilters((f) => ({ ...f, action: e.target.value }))}
                    placeholder="Filter: Aktion (z.B. PRODUCT_STATUS_UPDATE)"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={fetchAudits}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black"
                  >
                    Logs laden
                  </button>
                </div>

                <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {auditsLoading ? (
                    <p className="text-sm text-slate-600">Lade Logs…</p>
                  ) : audits.length === 0 ? (
                    <p className="text-sm text-slate-600">Keine Einträge.</p>
                  ) : (
                    audits.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-semibold text-slate-900">{log.action}</div>
                          <div className="text-xs text-slate-500">
                            {new Date(log.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-xs text-slate-700">
                          Admin: {log.admin.name} ({log.admin.email})
                          {log.product ? ` · Produkt: ${log.product.name} (${log.product.id})` : ''}
                        </div>
                        {log.payload && (
                          <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900/90 p-2 text-[11px] text-slate-50">
                            {JSON.stringify(log.payload, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {loadingProducts ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
            Lade Produkte…
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
                  permissions={{
                    role: adminInfo?.role || 'VIEWER',
                    canUpdateStatus,
                    canFinalizeStatus,
                    canManagePayments,
                    canManageLicense,
                    canGenerateCert,
                    canUploadReport,
                    canSendCompletion,
                  }}
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

function AdminProductRow({
  product,
  onUpdated,
  onPreview,
  isPreviewLoading,
  permissions,
}: {
  product: AdminProduct;
  onUpdated: () => void;
  // UPDATED Type: Now accepts an ID string
  onPreview: (id: string) => void;
  isPreviewLoading: boolean;
  permissions: {
    role: 'VIEWER' | 'EXAMINER' | 'SUPERADMIN';
    canUpdateStatus: boolean;
    canFinalizeStatus: boolean;
    canManagePayments: boolean;
    canManageLicense: boolean;
    canGenerateCert: boolean;
    canUploadReport: boolean;
    canSendCompletion: boolean;
  };
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
  const [licenseSaving, setLicenseSaving] = useState(false);

  const [licensePlan, setLicensePlan] = useState<string>(product.license?.plan || 'BASIC');
  const [licenseStatus, setLicenseStatus] = useState<string>(product.license?.status || 'PENDING');
  const [licenseCode, setLicenseCode] = useState<string>(product.license?.licenseCode || '');
  const [licenseStart, setLicenseStart] = useState<string>(
    product.license?.startsAt ? product.license.startsAt.slice(0, 10) : ''
  );
  const [licenseEnd, setLicenseEnd] = useState<string>(
    product.license?.expiresAt ? product.license.expiresAt.slice(0, 10) : ''
  );
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const reportInputRef = useRef<HTMLInputElement | null>(null);
  const allowedStatuses = STATUS_OPTIONS;
  const expiresInDays = useMemo(() => {
    if (!product.license?.expiresAt) return null;
    const diff = new Date(product.license.expiresAt).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [product.license?.expiresAt]);

  useEffect(() => {
    setLicensePlan(product.license?.plan || 'BASIC');
    setLicenseStatus(product.license?.status || 'PENDING');
    setLicenseCode(product.license?.licenseCode || '');
    setLicenseStart(product.license?.startsAt ? product.license.startsAt.slice(0, 10) : '');
    setLicenseEnd(product.license?.expiresAt ? product.license.expiresAt.slice(0, 10) : '');
  }, [product.license]);

  useEffect(() => {
    setReportMessage(null);
    setReportFile(null);
    if (reportInputRef.current) reportInputRef.current.value = '';
  }, [product.id, product.certificate?.reportUrl, product.certificate?.pdfUrl]);

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
    if (!permissions.canUpdateStatus) {
      setLocalMessage('Keine Berechtigung für Status-Updates.');
      return;
    }
    if (!permissions.canFinalizeStatus && (selectedStatus === 'PASS' || selectedStatus === 'FAIL')) {
      setLocalMessage('PASS/FAIL nur für Superadmin.');
      return;
    }
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
      if (selectedStatus === 'PASS' && !autoSent) {
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

  const handleSaveLicense = async () => {
    if (!permissions.canManageLicense) {
      setLocalMessage('Keine Berechtigung für Lizenzen.');
      return;
    }
    setLicenseSaving(true);
    setLocalMessage(null);
    try {
      const res = await fetch('/api/admin/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          plan: licensePlan,
          status: licenseStatus,
          licenseCode: licenseCode || undefined,
          startsAt: licenseStart || undefined,
          expiresAt: licensePlan === 'LIFETIME' ? null : licenseEnd || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLocalMessage(data.error || 'Lizenz konnte nicht gespeichert werden.');
        return;
      }
      setLocalMessage('Lizenz gespeichert.');
      onUpdated();
    } catch (err) {
      console.error(err);
      setLocalMessage('Fehler beim Speichern der Lizenz.');
    } finally {
      setLicenseSaving(false);
    }
  };

  const handleSendCertificate = async (opts?: { auto?: boolean }) => {
    if (!permissions.canGenerateCert) {
      setLocalMessage('Keine Berechtigung zum Generieren.');
      return;
    }
    setLocalMessage(null);
    setSendLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}/generate-cert-with-rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sendEmail: false,
          message: teamNote.trim() ? teamNote.trim().slice(0, 1000) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLocalMessage(data.error || 'Zertifikat konnte nicht erstellt werden.');
        return;
      }
      setLocalMessage('Zertifikat generiert.');
      onUpdated();
    } catch (err) {
      console.error(err);
      setLocalMessage('Erstellung fehlgeschlagen.');
    } finally {
      setSendLoading(false);
    }
  };

  const handlePaymentStatusChange = async () => {
    if (!permissions.canManagePayments) {
      setPaymentStatusMessage('Keine Berechtigung für Zahlungsstatus.');
      return;
    }
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
  const canAccessRatings = permissions.canUpdateStatus;
  const canAccessAssets = permissions.role !== 'VIEWER';

  const handleGenerateWithRating = async () => {
    if (!permissions.canGenerateCert) {
      setLocalMessage('Keine Berechtigung zum Generieren.');
      return;
    }
    setLocalMessage(null);
    setGenLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}/generate-cert-with-rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sendEmail: false,
          message: teamNote.trim() ? teamNote.trim().slice(0, 1000) : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLocalMessage(data.error || 'Siegel konnte nicht erstellt werden.');
        return;
      }
      setLocalMessage('Siegel generiert.');
      onUpdated();
    } catch (err) {
      console.error(err);
      setLocalMessage('Erstellung fehlgeschlagen.');
    } finally {
      setGenLoading(false);
    }
  };

  const handleReportUpload = async () => {
    if (!permissions.canUploadReport) {
      setReportMessage('Keine Berechtigung zum Hochladen.');
      return;
    }
    if (!reportFile) {
      setReportMessage('Bitte einen PDF-Prüfbericht auswählen.');
      return;
    }
    setReportMessage(null);
    setUploadingReport(true);
    try {
      const form = new FormData();
      form.append('report', reportFile);
      form.append('productId', product.id);
      const res = await fetch(`/api/admin/products/${product.id}/upload-report`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReportMessage(data.error || 'Upload fehlgeschlagen.');
        return;
      }
      setReportMessage('Prüfbericht gespeichert.');
      setReportFile(null);
      if (reportInputRef.current) reportInputRef.current.value = '';
      onUpdated();
    } catch (err) {
      console.error(err);
      setReportMessage('Upload fehlgeschlagen.');
    } finally {
      setUploadingReport(false);
    }
  };

  const flowSteps: { key: StatusOption; label: string }[] = [
    { key: 'PRECHECK', label: 'Pre-Check' },
    { key: 'RECEIVED', label: 'Eingang' },
    { key: 'ANALYSIS', label: 'Analyse' },
    { key: 'COMPLETION', label: 'Abschluss' },
    { key: 'PASS', label: 'Bestanden' },
    { key: 'FAIL', label: 'Nicht bestanden' },
  ];
  const currentKey = (product.adminProgress as StatusOption) || (product.status as StatusOption);
  const currentIdx = Math.max(
    0,
    flowSteps.findIndex((s) => s.key === currentKey),
  );

  return (
    <article className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold text-slate-900">{product.name}</span>
              <span className="text-sm text-slate-500">{product.brand}</span>
              <span className="text-xs text-slate-400">{new Date(product.createdAt).toLocaleTimeString('de-DE')}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ring-1 ${STATUS_TONE[product.status] ?? 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
                Status: {statusLabel(product.status)}
              </span>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ring-1 ${PAYMENT_TONE[paymentStatusValue] ?? 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
                Zahlung: {paymentStatusValue === 'PAID' ? 'Bezahlt' : paymentStatusValue === 'MANUAL' ? 'Manuell' : 'Offen'}
              </span>
              {product.license ? (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700 ring-1 ring-blue-100">
                  Lizenz: {product.license.plan} · {product.license.status}
                  {product.license.expiresAt
                    ? ` · gültig bis ${new Date(product.license.expiresAt).toLocaleDateString('de-DE')}`
                    : ' · Lifetime'}
                  {typeof expiresInDays === 'number' ? ` · ${expiresInDays} Tage` : ''}
                </span>
              ) : null}
              {product.certificate?.ratingScore && product.certificate?.ratingLabel && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 ring-1 ring-emerald-100">
                  {product.certificate.ratingScore} · {product.certificate.ratingLabel}
                </span>
              )}
              {product.certificate?.seal_number && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700 ring-1 ring-slate-200">
                  Siegel: {product.certificate.seal_number}
                </span>
              )}
            </div>

          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:bg-slate-50"
            >
              {expanded ? 'Details ausblenden / Hide details' : 'Details anzeigen / Show details'}
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Flow</h3>
              <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Phasen</span>
            </div>
            <div className="mt-3 grid gap-2">
              {flowSteps.map((step, idx) => {
                const state = idx < currentIdx ? 'done' : idx === currentIdx ? 'current' : 'upcoming';
                const style =
                  state === 'done'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : state === 'current'
                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : 'bg-white text-slate-500 border border-slate-200';
                return (
                  <div
                    key={step.key}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold ${style}`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                        state === 'done'
                          ? 'bg-emerald-600 text-white'
                          : state === 'current'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span>{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Workflow-Schritte</h3>
              <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Update & Versand</span>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">Status setzen</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as StatusOption)}
                disabled={!permissions.canUpdateStatus}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] disabled:opacity-60"
              >
                {allowedStatuses.map((status) => (
                  <option
                    key={status.value}
                    value={status.value}
                    disabled={
                      status.value === 'PRECHECK' ||
                      (!permissions.canFinalizeStatus && (status.value === 'PASS' || status.value === 'FAIL'))
                    }
                  >
                    {status.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={loading || !permissions.canUpdateStatus}
                onClick={handleUpdate}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-black disabled:opacity-70"
              >
                {loading ? 'Status wird gespeichert…' : 'Status speichern / Save status'}
              </button>

              <button
                type="button"
                disabled={sendLoading || !permissions.canGenerateCert}
                onClick={() => handleSendCertificate()}
                className="rounded-lg border border-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-70"
              >
                {sendLoading ? 'Zertifikat wird generiert…' : 'Zertifikat generieren'}
              </button>

              <button
                type="button"
                disabled={genLoading || !permissions.canGenerateCert}
                onClick={handleGenerateWithRating}
                className="rounded-lg border border-amber-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800 transition hover:bg-amber-50 disabled:opacity-70"
              >
                {genLoading ? 'Siegel wird generiert…' : 'Siegel generieren'}
              </button>

              <p className="text-xs text-slate-500">
                Hinweis: Der Versand an den Kunden erfolgt erst über die Aktion &ldquo;Completion – Send all Files&rdquo;.
              </p>

            <button
              type="button"
              disabled={sendLoading || !permissions.canSendCompletion}
              onClick={async () => {
                if (!permissions.canSendCompletion) {
                  setLocalMessage('Keine Berechtigung für Completion-Versand.');
                  return;
                }
                setSendLoading(true);
                setLocalMessage(null);
                try {
                  const res = await fetch('/api/admin/complete-license', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ productId: product.id }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      setLocalMessage(data.error || 'Senden fehlgeschlagen.');
                    } else {
                      setLocalMessage('Completion-Email mit allen Dateien gesendet.');
                    }
                  } catch (err) {
                    console.error(err);
                    setLocalMessage('Senden fehlgeschlagen.');
                  } finally {
                    setSendLoading(false);
                    onUpdated();
                  }
                }}
              className="rounded-lg border border-emerald-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800 transition hover:bg-emerald-50 disabled:opacity-70"
            >
              {sendLoading ? 'Sende…' : 'Completion – Send all Files'}
            </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Assets & Downloads</h3>
              <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Links</span>
            </div>
            <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">Prüfbericht hochladen</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {product.certificate?.reportUrl ? 'Upload vorhanden' : 'Noch kein Upload'}
                </span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  ref={reportInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setReportFile(e.target.files?.[0] ?? null)}
                  disabled={!permissions.canUploadReport}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-[11px] file:font-semibold file:uppercase file:tracking-[0.18em] file:text-white disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={handleReportUpload}
                  disabled={!reportFile || uploadingReport || !permissions.canUploadReport}
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-emerald-800 disabled:opacity-70"
                >
                  {uploadingReport ? 'Lade hoch...' : 'Prüfbericht hochladen'}
                </button>
              </div>
              {reportMessage && <p className="text-xs text-slate-500">{reportMessage}</p>}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <a
                href={product.certificate?.pdfUrl && canAccessAssets ? `/api/certificates/${product.id}/download` : '#'}
                target={product.certificate?.pdfUrl && canAccessAssets ? '_blank' : undefined}
                rel="noreferrer"
                className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                  product.certificate?.pdfUrl && canAccessAssets
                    ? 'border border-slate-900 text-slate-900 hover:bg-slate-50'
                    : 'border border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                onClick={(e) => {
                  if (!product.certificate?.pdfUrl || !canAccessAssets) e.preventDefault();
                }}
              >
                Prüfbericht öffnen
              </a>
              {product.certificate?.reportUrl ? (
                <a
                  href={canAccessAssets ? product.certificate.reportUrl : '#'}
                  target={canAccessAssets ? '_blank' : undefined}
                  rel="noreferrer"
                  onClick={(e) => {
                    if (!canAccessAssets) e.preventDefault();
                  }}
                  className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                    canAccessAssets
                      ? 'border border-emerald-700 text-emerald-800 hover:bg-emerald-50'
                      : 'border border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Hochgeladener Prüfbericht
                </a>
              ) : (
                <div className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Kein Upload vorhanden
                </div>
              )}
              <a
                href={product.certificate?.sealUrl && canAccessAssets ? product.certificate.sealUrl : '#'}
                target={product.certificate?.sealUrl && canAccessAssets ? '_blank' : undefined}
                rel="noreferrer"
                className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                  product.certificate?.sealUrl && canAccessAssets
                    ? 'border border-amber-700 text-amber-800 hover:bg-amber-50'
                    : 'border border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                onClick={(e) => {
                  if (!product.certificate?.sealUrl || !canAccessAssets) e.preventDefault();
                }}
              >
                Siegel öffnen
              </a>
              <a
                href={canAccessRatings ? `/api/admin/products/${product.id}/rating-sheet` : '#'}
                onClick={(e) => {
                  if (!canAccessRatings) e.preventDefault();
                }}
                className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                  canAccessRatings
                    ? 'border border-slate-300 text-slate-800 hover:bg-slate-50'
                    : 'border border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Rating CSV herunterladen
              </a>
              <a
                href={canAccessRatings ? sheetUrl : '#'}
                target={canAccessRatings ? '_blank' : undefined}
                rel="noreferrer"
                onClick={(e) => {
                  if (!canAccessRatings) e.preventDefault();
                }}
                className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                  canAccessRatings
                    ? 'border border-slate-300 text-slate-800 hover:bg-slate-50'
                    : 'border border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Bewertungsblatt öffnen
              </a>
              {product.license?.licenseCode && (
                <div className="col-span-2 flex flex-col rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700">
                  <span>Lizenzcode</span>
                  <span className="font-mono text-[11px] normal-case text-slate-900">{product.license.licenseCode}</span>
                  {product.license.expiresAt ? (
                    <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      gültig bis {new Date(product.license.expiresAt).toLocaleDateString('de-DE')}
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Lifetime</span>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">Payment Status setzen</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={paymentStatusValue}
                  onChange={(e) => setPaymentStatusValue(e.target.value as PaymentStatusOption)}
                  disabled={!permissions.canManagePayments}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-60"
                >
                  {PAYMENT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={paymentStatusLoading || !permissions.canManagePayments}
                  onClick={handlePaymentStatusChange}
                  className="rounded-lg border border-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900 transition hover:bg-slate-50 disabled:opacity-70"
                >
                  {paymentStatusLoading ? 'Speichere…' : 'Zahlstatus speichern'}
                </button>
              </div>
              {paymentStatusMessage && <p className="text-xs text-slate-500">{paymentStatusMessage}</p>}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">Lizenz verwalten</span>
              {product.license?.stripeSubId && (
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">
                  StripeSub: {product.license.stripeSubId}
                </span>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
                Plan
                <select
                  value={licensePlan}
                  onChange={(e) => setLicensePlan(e.target.value)}
                  disabled={!permissions.canManageLicense}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-60"
                >
                  <option value="BASIC">BASIC</option>
                  <option value="PREMIUM">PREMIUM</option>
                  <option value="LIFETIME">LIFETIME</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
                Status
                <select
                  value={licenseStatus}
                  onChange={(e) => setLicenseStatus(e.target.value)}
                  disabled={!permissions.canManageLicense}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-60"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="EXPIRED">EXPIRED</option>
                  <option value="CANCELED">CANCELED</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
                Start
                <input
                  type="date"
                  value={licenseStart}
                  onChange={(e) => setLicenseStart(e.target.value)}
                  disabled={!permissions.canManageLicense}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-60"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
                Ablauf
                <input
                  type="date"
                  value={licensePlan === 'LIFETIME' ? '' : licenseEnd}
                  onChange={(e) => setLicenseEnd(e.target.value)}
                  disabled={licensePlan === 'LIFETIME' || !permissions.canManageLicense}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-70"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700 sm:col-span-2">
                Lizenzcode
                <input
                  type="text"
                  value={licenseCode}
                  onChange={(e) => setLicenseCode(e.target.value)}
                  disabled={!permissions.canManageLicense}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-60"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                disabled={licenseSaving || !permissions.canManageLicense}
                onClick={handleSaveLicense}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-emerald-800 disabled:opacity-70"
              >
                {licenseSaving ? 'Speichere Lizenz…' : 'Lizenz speichern'}
              </button>
              {product.license?.expiresAt && (
                <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  {expiresInDays != null ? `${expiresInDays} Tage übrig` : ''}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <label className="block text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-slate-600 mb-2">
              Notiz an den Kunden (optional) / Customer note
            </label>
            <textarea
              value={teamNote}
              onChange={(e) => setTeamNote(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Kurze Nachricht für den Kunden (wird in die E-Mail eingefügt) / Short note for the customer"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-400 focus:outline-none"
            />
          </div>
        </div>



        {selectedStatus === 'FAIL' && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <label className="block text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-rose-700 mb-2">
              Grund für Ablehnung / Rejection reason
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Grund für Ablehnung / benötigte Infos · Reason for rejection / needed info"
              className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs text-rose-900"
              rows={2}
            />
          </div>
        )}

        {expanded && (
          <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            {detailFields.map(([label, value]) => (
              <div key={label} className="flex flex-col border-b border-slate-200 pb-2 last:border-b-0 last:pb-0">
                <span className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">{label}</span>
                <span className="text-sm font-semibold text-slate-900">{value || '—'}</span>
              </div>
            ))}
          </div>
        )}

        {localMessage && <p className="text-xs text-slate-500">{localMessage}</p>}
      </div>
    </article>
  );
}
