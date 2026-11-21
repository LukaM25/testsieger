'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import AreaSwitch from '../../components/AreaSwitch';
import { DOC_CATEGORIES } from '@/lib/arbeitssicherheit/types';
import { BERUFSGENOSSENSCHAFTEN, EXISTING, RISKS } from '@/lib/arbeitssicherheit/options';

type Doc = { id: string; categoryId: string; title: string; fileName: string | null; hasFile: boolean; validUntil: string | null; updatedAt: string };
type Training = { id: string; title: string; topic: string; dueAt: string | null; completedAt: string | null; participantsDone: number; participantsTotal: number };
type Deadline = { id: string; kind: string; title: string; detail: string | null; dueAt: string; doneAt: string | null };
type Org = {
  id: string; name: string; legalForm: string | null; industry: string; employees: number; locations: number; bg: string | null;
  memberNumber: string | null; phone: string | null; contactRole: string | null; risks: string[]; existing: string[]; notes: string | null;
  nextInspectionAt: string | null; createdAt: string; user: { id: string; name: string; email: string };
  documents: Doc[]; trainings: Training[]; deadlines: Deadline[];
};
type Compliance = {
  level: 'ok' | 'attention' | 'action'; headline: string; okCount: number; total: number;
  pillars: { id: string; title: string; state: 'ok' | 'soon' | 'action'; stateLabel: string }[];
  actions: { id: string; priority: number; title: string; when: string | null }[];
};

const CARD = 'rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_-45px_rgba(43,64,102,0.35)]';
const INPUT = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1d4ed8]/50 focus:bg-white focus:ring-4 focus:ring-[#1d4ed8]/10';
const BTN = 'rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#16294d] px-5 py-2 text-sm font-semibold !text-white shadow-sm transition hover:brightness-110 disabled:opacity-60';
const BTN2 = 'rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60';
const LEVEL = {
  action: 'bg-rose-50 text-rose-700 ring-rose-200',
  attention: 'bg-amber-50 text-amber-800 ring-amber-200',
  ok: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
} as const;
const DOT = { ok: 'bg-emerald-500', soon: 'bg-amber-500', action: 'bg-rose-500' } as const;

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' }) : '–');
const day = (iso: string | null) => (iso ? iso.slice(0, 10) : '');
const labelOf = (list: readonly { id: string; label: string }[], id: string) => list.find((x) => x.id === id)?.label ?? id;

export default function ASAdminDetail({ id, canEdit }: { id: string; canEdit: boolean }) {
  const [org, setOrg] = useState<Org | null>(null);
  const [comp, setComp] = useState<Compliance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/arbeitssicherheit/organizations/${id}`, { credentials: 'same-origin', cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setOrg(data.organization);
      setComp(data.compliance);
      setError(null);
    } catch {
      setError('Betrieb konnte nicht geladen werden.');
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function call(url: string, init: RequestInit, okMsg: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(url, { credentials: 'same-origin', ...init });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg(data?.error || 'Das hat nicht geklappt.'); return false; }
      setMsg(okMsg);
      await load();
      return true;
    } catch {
      setMsg('Das hat nicht geklappt.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  const base = `/api/admin/arbeitssicherheit/organizations/${id}`;
  const json = (method: string, body: unknown): RequestInit => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  if (error) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-rose-700">{error}</div>;
  if (!org || !comp) return <div className="mx-auto max-w-6xl px-4 py-10"><div className="h-40 animate-pulse rounded-3xl bg-white" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-24 pt-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin/arbeitssicherheit" className="text-sm font-semibold text-[#1d4ed8] hover:underline">← Alle Betriebe</Link>
          <AreaSwitch active="arbeitssicherheit" />
        </div>

        <header className={CARD}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Betrieb</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#2B4066] sm:text-3xl">{org.name}</h1>
              <p className="mt-1 text-sm text-slate-500">
                {org.industry} · {org.employees} Beschäftigte · {org.locations} {org.locations === 1 ? 'Standort' : 'Standorte'}{org.bg ? ` · ${org.bg}` : ''}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {org.user.name} · <a className="text-[#1d4ed8] hover:underline" href={`mailto:${org.user.email}`}>{org.user.email}</a>{org.phone ? ` · ${org.phone}` : ''}
              </p>
            </div>
            <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${LEVEL[comp.level]}`}>
              {comp.headline} · {comp.okCount}/{comp.total}
            </span>
          </div>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {comp.pillars.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-2.5 text-sm">
                <span className={`h-2 w-2 rounded-full ${DOT[p.state]}`} />
                <span className="flex-1 text-slate-800">{p.title}</span>
                <span className="text-xs text-slate-500">{p.stateLabel}</span>
              </li>
            ))}
          </ul>
          {msg && <p className="mt-4 text-sm text-slate-600" role="status">{msg}</p>}
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Angaben aus der Registrierung */}
          <section className={CARD}>
            <h2 className="text-lg font-semibold text-[#2B4066]">Angaben des Betriebs</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gefährdungsschwerpunkte</dt>
                <dd className="mt-1 text-slate-800">{org.risks.length ? org.risks.map((r) => labelOf(RISKS, r)).join(' · ') : 'Keine Angabe'}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Bereits vorhanden (laut Kunde)</dt>
                <dd className="mt-1 text-slate-800">{org.existing.length ? org.existing.map((r) => labelOf(EXISTING, r)).join(' · ') : 'Nichts angegeben'}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rechtsform / Funktion / Mitgliedsnr.</dt>
                <dd className="mt-1 text-slate-800">{[org.legalForm, org.contactRole, org.memberNumber].filter(Boolean).join(' · ') || '–'}</dd></div>
              {org.notes && <div><dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Anmerkung</dt><dd className="mt-1 whitespace-pre-wrap text-slate-800">{org.notes}</dd></div>}
            </dl>
            {canEdit && <ProfileForm org={org} busy={busy} onSave={(patch) => call(base, json('PATCH', patch), 'Gespeichert.')} />}
          </section>

          {/* Was offen ist */}
          <section className={CARD}>
            <h2 className="text-lg font-semibold text-[#2B4066]">Offen für diesen Betrieb</h2>
            {comp.actions.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Nichts offen.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {comp.actions.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${['bg-rose-500', 'bg-amber-500', 'bg-sky-500'][a.priority]}`} />
                    <span className="flex-1 text-slate-800">{a.title}</span>
                    {a.when && <span className="text-xs text-slate-500">{a.when}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <DocumentsSection org={org} canEdit={canEdit} busy={busy} base={base} call={call} />
        <TrainingsSection org={org} canEdit={canEdit} busy={busy} call={call} base={base} json={json} />
        <DeadlinesSection org={org} canEdit={canEdit} busy={busy} call={call} base={base} json={json} />
      </div>
    </div>
  );
}

function ProfileForm({ org, busy, onSave }: { org: Org; busy: boolean; onSave: (p: Record<string, unknown>) => Promise<boolean> }) {
  const [f, setF] = useState({
    employees: String(org.employees), locations: String(org.locations), bg: org.bg ?? '', phone: org.phone ?? '', nextInspectionAt: day(org.nextInspectionAt),
  });
  return (
    <form
      className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave({ employees: Number(f.employees), locations: Number(f.locations), bg: f.bg || null, phone: f.phone || null, nextInspectionAt: f.nextInspectionAt || null });
      }}
    >
      <label className="text-xs font-semibold text-slate-600">Beschäftigte<input className={`${INPUT} mt-1`} type="number" min={1} value={f.employees} onChange={(e) => setF({ ...f, employees: e.target.value })} /></label>
      <label className="text-xs font-semibold text-slate-600">Standorte<input className={`${INPUT} mt-1`} type="number" min={1} value={f.locations} onChange={(e) => setF({ ...f, locations: e.target.value })} /></label>
      <label className="text-xs font-semibold text-slate-600">Berufsgenossenschaft
        <select className={`${INPUT} mt-1`} value={f.bg} onChange={(e) => setF({ ...f, bg: e.target.value })}><option value="">Keine Angabe</option>{BERUFSGENOSSENSCHAFTEN.map((b) => <option key={b}>{b}</option>)}</select></label>
      <label className="text-xs font-semibold text-slate-600">Telefon<input className={`${INPUT} mt-1`} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
      <label className="col-span-2 text-xs font-semibold text-slate-600">Nächste Betriebsbegehung<input className={`${INPUT} mt-1`} type="date" value={f.nextInspectionAt} onChange={(e) => setF({ ...f, nextInspectionAt: e.target.value })} /></label>
      <div className="col-span-2"><button type="submit" disabled={busy} className={BTN}>Speichern</button></div>
    </form>
  );
}

type CallFn = (url: string, init: RequestInit, okMsg: string) => Promise<boolean>;

function DocumentsSection({ org, canEdit, busy, base, call }: { org: Org; canEdit: boolean; busy: boolean; base: string; call: CallFn }) {
  const [categoryId, setCategoryId] = useState<string>(DOC_CATEGORIES[0].id);
  const [title, setTitle] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [file, setFile] = useState<File | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set('categoryId', categoryId);
    fd.set('title', title);
    if (validUntil) fd.set('validUntil', validUntil);
    if (file) fd.set('file', file);
    const ok = await call(`${base}/documents`, { method: 'POST', body: fd }, 'Unterlage hinterlegt.');
    if (ok) { setTitle(''); setValidUntil(''); setFile(null); }
  }

  return (
    <section className={CARD}>
      <h2 className="text-lg font-semibold text-[#2B4066]">Dokumente</h2>
      {org.documents.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Noch nichts hinterlegt.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {org.documents.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-slate-900">{d.title}</span>
                <span className="block text-xs text-slate-500">
                  {DOC_CATEGORIES.find((c) => c.id === d.categoryId)?.title ?? d.categoryId} · Stand {fmt(d.updatedAt)}{d.validUntil ? ` · gültig bis ${fmt(d.validUntil)}` : ''}
                </span>
              </span>
              {d.hasFile ? <a className={BTN2} href={`/api/arbeitssicherheit/documents/${d.id}`} target="_blank" rel="noreferrer">Öffnen</a> : <span className="text-xs text-slate-400">ohne Datei</span>}
              {canEdit && <button type="button" disabled={busy} className={`${BTN2} text-rose-600`} onClick={() => { if (confirm('Unterlage wirklich löschen?')) void call(`${base}/documents?docId=${d.id}`, { method: 'DELETE' }, 'Gelöscht.'); }}>Löschen</button>}
            </li>
          ))}
        </ul>
      )}
      {canEdit && (
        <form onSubmit={add} className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">Thema
            <select className={`${INPUT} mt-1`} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>{DOC_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
          <label className="text-xs font-semibold text-slate-600">Titel<input required className={`${INPUT} mt-1`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Gefährdungsbeurteilung 2026" /></label>
          <label className="text-xs font-semibold text-slate-600">Gültig bis (optional)<input type="date" className={`${INPUT} mt-1`} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></label>
          <label className="text-xs font-semibold text-slate-600">Datei (PDF, Bild, Word, Excel)<input type="file" accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx" className={`${INPUT} mt-1`} onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
          <div className="sm:col-span-2"><button type="submit" disabled={busy} className={BTN}>{busy ? 'Wird gespeichert…' : 'Unterlage hinterlegen'}</button></div>
        </form>
      )}
    </section>
  );
}

type JsonFn = (m: string, b: unknown) => RequestInit;

function TrainingsSection({ org, canEdit, busy, call, base, json }: { org: Org; canEdit: boolean; busy: boolean; call: CallFn; base: string; json: JsonFn }) {
  const [f, setF] = useState({ title: '', topic: '', dueAt: '', participantsTotal: '' });
  const rec = `${base}/records`;
  return (
    <section className={CARD}>
      <h2 className="text-lg font-semibold text-[#2B4066]">Unterweisungen</h2>
      {org.trainings.length === 0 ? <p className="mt-3 text-sm text-slate-500">Noch keine Unterweisungen.</p> : (
        <ul className="mt-3 divide-y divide-slate-100">
          {org.trainings.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-slate-900">{t.title}</span>
                <span className="block text-xs text-slate-500">{t.topic} · {t.completedAt ? `abgeschlossen ${fmt(t.completedAt)}` : t.dueAt ? `fällig ${fmt(t.dueAt)}` : 'ohne Termin'}</span>
              </span>
              <span className="text-xs font-semibold tabular-nums text-slate-600">{t.participantsDone}/{t.participantsTotal}</span>
              {canEdit && !t.completedAt && (
                <>
                  <button type="button" disabled={busy || t.participantsDone >= t.participantsTotal} className={BTN2} onClick={() => void call(rec, json('PATCH', { type: 'training', id: t.id, data: { participantsDone: t.participantsDone + 1 } }), 'Teilnehmer ergänzt.')}>+1 unterwiesen</button>
                  <button type="button" disabled={busy} className={BTN2} onClick={() => void call(rec, json('PATCH', { type: 'training', id: t.id, data: { completed: true, participantsDone: t.participantsTotal } }), 'Abgeschlossen.')}>Abschließen</button>
                </>
              )}
              {canEdit && <button type="button" disabled={busy} className={`${BTN2} text-rose-600`} onClick={() => { if (confirm('Unterweisung löschen?')) void call(`${rec}?type=training&recordId=${t.id}`, { method: 'DELETE' }, 'Gelöscht.'); }}>Löschen</button>}
            </li>
          ))}
        </ul>
      )}
      {canEdit && (
        <form
          className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await call(rec, json('POST', { type: 'training', data: { title: f.title, topic: f.topic, dueAt: f.dueAt || null, participantsTotal: Number(f.participantsTotal) || 0 } }), 'Unterweisung angelegt.');
            if (ok) setF({ title: '', topic: '', dueAt: '', participantsTotal: '' });
          }}
        >
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Titel<input required className={`${INPUT} mt-1`} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="z. B. Absturzsicherung und Leitern" /></label>
          <label className="text-xs font-semibold text-slate-600">Thema<input required className={`${INPUT} mt-1`} value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} placeholder="z. B. Arbeiten in der Höhe" /></label>
          <label className="text-xs font-semibold text-slate-600">Fällig am<input type="date" className={`${INPUT} mt-1`} value={f.dueAt} onChange={(e) => setF({ ...f, dueAt: e.target.value })} /></label>
          <label className="text-xs font-semibold text-slate-600">Teilnehmer gesamt<input type="number" min={0} className={`${INPUT} mt-1`} value={f.participantsTotal} onChange={(e) => setF({ ...f, participantsTotal: e.target.value })} /></label>
          <div className="sm:col-span-3 sm:self-end"><button type="submit" disabled={busy} className={BTN}>Unterweisung anlegen</button></div>
        </form>
      )}
    </section>
  );
}

function DeadlinesSection({ org, canEdit, busy, call, base, json }: { org: Org; canEdit: boolean; busy: boolean; call: CallFn; base: string; json: JsonFn }) {
  const [f, setF] = useState({ kind: 'begehung', title: '', detail: '', dueAt: '' });
  const rec = `${base}/records`;
  const open = org.deadlines.filter((d) => !d.doneAt);
  const done = org.deadlines.filter((d) => d.doneAt);
  return (
    <section className={CARD}>
      <h2 className="text-lg font-semibold text-[#2B4066]">Fristen</h2>
      {open.length === 0 ? <p className="mt-3 text-sm text-slate-500">Keine offenen Fristen.</p> : (
        <ul className="mt-3 divide-y divide-slate-100">
          {open.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-slate-900">{d.title}</span>
                <span className="block text-xs text-slate-500">{d.kind} · {fmt(d.dueAt)}{d.detail ? ` · ${d.detail}` : ''}</span>
              </span>
              {canEdit && <button type="button" disabled={busy} className={BTN2} onClick={() => void call(rec, json('PATCH', { type: 'deadline', id: d.id, done: true }), 'Als erledigt markiert.')}>Erledigt</button>}
              {canEdit && <button type="button" disabled={busy} className={`${BTN2} text-rose-600`} onClick={() => { if (confirm('Frist löschen?')) void call(`${rec}?type=deadline&recordId=${d.id}`, { method: 'DELETE' }, 'Gelöscht.'); }}>Löschen</button>}
            </li>
          ))}
        </ul>
      )}
      {done.length > 0 && <p className="mt-3 text-xs text-slate-400">{done.length} erledigte {done.length === 1 ? 'Frist' : 'Fristen'} ausgeblendet.</p>}
      {canEdit && (
        <form
          className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await call(rec, json('POST', { type: 'deadline', data: { kind: f.kind, title: f.title, detail: f.detail || null, dueAt: f.dueAt } }), 'Frist angelegt.');
            if (ok) setF({ kind: 'begehung', title: '', detail: '', dueAt: '' });
          }}
        >
          <label className="text-xs font-semibold text-slate-600">Art
            <select className={`${INPUT} mt-1`} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}><option value="begehung">Begehung</option><option value="unterweisung">Unterweisung</option><option value="dokument">Dokument</option></select></label>
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Titel<input required className={`${INPUT} mt-1`} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="z. B. Jährliche Betriebsbegehung" /></label>
          <label className="text-xs font-semibold text-slate-600">Fällig am<input required type="date" className={`${INPUT} mt-1`} value={f.dueAt} onChange={(e) => setF({ ...f, dueAt: e.target.value })} /></label>
          <label className="text-xs font-semibold text-slate-600 sm:col-span-3">Hinweis (optional)<input className={`${INPUT} mt-1`} value={f.detail} onChange={(e) => setF({ ...f, detail: e.target.value })} /></label>
          <div className="sm:self-end"><button type="submit" disabled={busy} className={BTN}>Frist anlegen</button></div>
        </form>
      )}
    </section>
  );
}
