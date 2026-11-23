'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { BERUFSGENOSSENSCHAFTEN, INDUSTRIES, LEGAL_FORMS } from '@/lib/arbeitssicherheit/options';
import type { AdminCustomerSummary } from '../types';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Wird nach erfolgreichem Anlegen aufgerufen, damit z. B. direkt ein Produkt angelegt werden kann. */
  onCreateProduct: (customer: AdminCustomerSummary) => void;
  /** Wenn gesetzt, ist der Bereich fest vorgegeben und nicht wählbar. */
  fixedArea?: Area;
};

type Area = 'PRODUKTTEST' | 'ARBEITSSICHERHEIT';

const EMPTY = {
  firstName: '',
  lastName: '',
  email: '',
  company: '',
  gender: '' as '' | 'MALE' | 'FEMALE' | 'OTHER',
  street: '',
  houseNumber: '',
  postalCode: '',
  city: '',
  sendInvite: true,
  legalForm: '',
  industry: '',
  employees: '',
  locations: '1',
  bg: '',
  phone: '',
};

type Created = { user: AdminCustomerSummary; inviteSent: boolean; inviteUrl: string; organizationId?: string | null };

const input =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1d4ed8]/50 focus:bg-white focus:ring-4 focus:ring-[#1d4ed8]/10';

export default function CreateCustomerDialog({ open, onClose, onCreateProduct, fixedArea }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [areaState, setAreaState] = useState<Area>(fixedArea ?? 'PRODUKTTEST');
  const area: Area = fixedArea ?? areaState;
  const isAs = area === 'ARBEITSSICHERHEIT';
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setError(null);
      setCreated(null);
      setCopied(false);
      setAreaState(fixedArea ?? 'PRODUKTTEST');
      setTimeout(() => firstRef.current?.focus(), 50);
    }
  }, [open, fixedArea]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const set = (k: keyof typeof EMPTY, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          company: form.company,
          gender: form.gender || null,
          street: form.street,
          houseNumber: form.houseNumber,
          postalCode: form.postalCode,
          city: form.city,
          sendInvite: form.sendInvite,
          area,
          org: isAs
            ? { legalForm: form.legalForm || null, industry: form.industry, employees: Number(form.employees), locations: Number(form.locations) || 1, bg: form.bg || null, phone: form.phone || null }
            : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error === 'UNAUTHORIZED' ? 'Keine Berechtigung.' : data?.error || 'Anlegen fehlgeschlagen.');
        return;
      }
      setCreated(data as Created);
    } catch {
      setError('Anlegen fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Zwischenablage nicht verfügbar */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="new-customer-title">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl">
        {created ? (
          <div>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-xl text-emerald-600" aria-hidden>✓</span>
            <h2 id="new-customer-title" className="mt-4 text-xl font-semibold text-[#2B4066]">Kunde angelegt</h2>
            <p className="mt-1 text-sm text-slate-600">
              {created.user.name}
              {created.user.company ? ` · ${created.user.company}` : ''} ({created.user.email})
            </p>
            <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {created.inviteSent
                ? 'Die Willkommens-Mail ist unterwegs. Der Kunde legt darüber sein Passwort fest. Der Link ist 7 Tage gültig.'
                : 'Es wurde keine E-Mail verschickt. Du kannst den Link unten selbst weitergeben. Er ist 7 Tage gültig.'}
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 pl-3">
              <input readOnly value={created.inviteUrl} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 bg-transparent text-xs text-slate-600 outline-none" aria-label="Einladungslink" />
              <button type="button" onClick={copy} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#2B4066] shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
                {copied ? 'Kopiert' : 'Kopieren'}
              </button>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Fertig
              </button>
              {created.organizationId ? (
                <Link
                  href={`/admin/arbeitssicherheit/${created.organizationId}`}
                  className="rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#16294d] px-5 py-2.5 text-sm font-semibold !text-white shadow-sm hover:brightness-110"
                >
                  Betrieb öffnen
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onCreateProduct(created.user);
                    onClose();
                  }}
                  className="rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#16294d] px-5 py-2.5 text-sm font-semibold !text-white shadow-sm hover:brightness-110"
                >
                  Produkt für diesen Kunden anlegen
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Kunden</p>
                <h2 id="new-customer-title" className="mt-1 text-xl font-semibold text-[#2B4066]">{isAs ? 'Betrieb anlegen' : 'Kunde anlegen'}</h2>
              </div>
              <button type="button" onClick={onClose} aria-label="Schließen" className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">×</button>
            </div>

            {!fixedArea && (
              <div className="mt-5 inline-flex rounded-full border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Bereich">
                {(['PRODUKTTEST', 'ARBEITSSICHERHEIT'] as Area[]).map((a) => (
                  <button
                    key={a}
                    type="button"
                    aria-pressed={area === a}
                    onClick={() => setAreaState(a)}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${area === a ? 'bg-white text-[#2B4066] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    {a === 'PRODUKTTEST' ? 'Produkttest' : 'Arbeitssicherheit'}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-600">
                Vorname
                <input ref={firstRef} required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} className={input} autoComplete="off" />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Nachname
                <input required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} className={input} autoComplete="off" />
              </label>
              <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
                E-Mail
                <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value.toLowerCase())} className={input} autoComplete="off" autoCapitalize="none" spellCheck={false} />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                {isAs ? 'Firma' : <>Firma <span className="font-normal text-slate-400">(optional)</span></>}
                <input required={isAs} value={form.company} onChange={(e) => set('company', e.target.value)} className={input} autoComplete="off" />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Anrede <span className="font-normal text-slate-400">(optional)</span>
                <select value={form.gender} onChange={(e) => set('gender', e.target.value)} className={input}>
                  <option value="">Keine Angabe</option>
                  <option value="MALE">Herr</option>
                  <option value="FEMALE">Frau</option>
                  <option value="OTHER">Divers</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Straße
                <input value={form.street} onChange={(e) => set('street', e.target.value)} className={input} autoComplete="off" />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Hausnummer
                <input value={form.houseNumber} onChange={(e) => set('houseNumber', e.target.value)} className={input} autoComplete="off" />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                PLZ
                <input value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} className={input} autoComplete="off" inputMode="numeric" />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Ort
                <input value={form.city} onChange={(e) => set('city', e.target.value)} className={input} autoComplete="off" />
              </label>
            </div>

            {isAs && (
              <div className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-600">
                  Rechtsform
                  <select value={form.legalForm} onChange={(e) => set('legalForm', e.target.value)} className={input}>
                    <option value="">Keine Angabe</option>
                    {LEGAL_FORMS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Branche
                  <select required value={form.industry} onChange={(e) => set('industry', e.target.value)} className={input}>
                    <option value="">Bitte wählen</option>
                    {INDUSTRIES.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Beschäftigte
                  <input required type="number" min={1} value={form.employees} onChange={(e) => set('employees', e.target.value)} className={input} />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Standorte
                  <input type="number" min={1} value={form.locations} onChange={(e) => set('locations', e.target.value)} className={input} />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Berufsgenossenschaft
                  <select value={form.bg} onChange={(e) => set('bg', e.target.value)} className={input}>
                    <option value="">Keine Angabe</option>
                    {BERUFSGENOSSENSCHAFTEN.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Telefon
                  <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={input} autoComplete="off" />
                </label>
              </div>
            )}

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input type="checkbox" checked={form.sendInvite} onChange={(e) => set('sendInvite', e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#1d4ed8]" />
              <span>
                Willkommens-Mail senden
                <span className="block text-xs text-slate-500">Der Kunde legt sein Passwort selbst fest. Ohne Haken bekommst du nur den Link.</span>
              </span>
            </label>

            {error && <p className="mt-4 text-sm text-rose-600" role="alert">{error}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Abbrechen
              </button>
              <button type="submit" disabled={saving} className="rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#16294d] px-6 py-2.5 text-sm font-semibold !text-white shadow-sm hover:brightness-110 disabled:opacity-60">
                {saving ? 'Wird angelegt…' : isAs ? 'Betrieb anlegen' : 'Kunde anlegen'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
