'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AdminSummary, AuditEntry } from '../types';

type Props = {
  isOpen: boolean;
};

export default function SuperadminPanel({ isOpen }: Props) {
  const [superTab, setSuperTab] = useState<'admins' | 'audits'>('admins');
  const [admins, setAdmins] = useState<AdminSummary[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [auditsLoading, setAuditsLoading] = useState(false);
  const [auditFilters, setAuditFilters] = useState({ adminId: '', productId: '', action: '' });
  const auditFiltersRef = useRef(auditFilters);
  const [superMessage, setSuperMessage] = useState<string | null>(null);
  const [adminForm, setAdminForm] = useState({
    email: '',
    name: '',
    password: '',
    role: 'EXAMINER' as AdminSummary['role'],
  });

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
    } catch {
      setSuperMessage('Admin-Liste konnte nicht geladen werden.');
    } finally {
      setAdminsLoading(false);
    }
  }, []);

  const fetchAudits = useCallback(async (filters: typeof auditFilters) => {
    setAuditsLoading(true);
    setSuperMessage(null);
    try {
      const params = new URLSearchParams();
      if (filters.adminId.trim()) params.set('adminId', filters.adminId.trim());
      if (filters.productId.trim()) params.set('productId', filters.productId.trim());
      if (filters.action.trim()) params.set('action', filters.action.trim());
      params.set('limit', '100');
      const res = await fetch(`/api/admin/audits?${params.toString()}`, { credentials: 'same-origin' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSuperMessage(data?.error || 'Logs konnten nicht geladen werden.');
        return;
      }
      setAudits(data.audits ?? []);
    } catch {
      setSuperMessage('Logs konnten nicht geladen werden.');
    } finally {
      setAuditsLoading(false);
    }
  }, []);

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
    auditFiltersRef.current = auditFilters;
  }, [auditFilters]);

  useEffect(() => {
    if (isOpen) {
      setSuperTab('admins');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    fetchAdmins();
    fetchAudits(auditFiltersRef.current);
  }, [fetchAdmins, fetchAudits, isOpen]);

  if (!isOpen) return null;

  return (
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
              fetchAudits(auditFiltersRef.current);
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
              onClick={() => fetchAudits(auditFilters)}
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
  );
}
