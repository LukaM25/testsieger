'use client';

import { memo, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { PAYMENT_STATUS_OPTIONS, PAYMENT_TONE, STATUS_OPTIONS, STATUS_TONE, statusLabel } from '../constants';
import { AdminPermissions, AdminProduct, PaymentStatusOption, StatusOption } from '../types';

type Props = {
  product: AdminProduct;
  onUpdated: () => void;
  onPreview: (id: string) => void;
  isPreviewLoading: boolean;
  permissions: AdminPermissions;
};

const FLOW_STEPS: { key: StatusOption; label: string }[] = [
  { key: 'PRECHECK', label: 'Pre-Check' },
  { key: 'RECEIVED', label: 'Eingang' },
  { key: 'ANALYSIS', label: 'Analyse' },
  { key: 'COMPLETION', label: 'Abschluss' },
  { key: 'PASS', label: 'Bestanden' },
  { key: 'FAIL', label: 'Nicht bestanden' },
];

function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = true,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle ? (
            <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{subtitle}</span>
          ) : null}
        </div>
        <span className="text-xs font-semibold text-slate-700">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="border-t border-slate-200 px-4 py-3">{children}</div>}
    </div>
  );
}

function AdminProductRow({
  product,
  onUpdated,
  onPreview,
  isPreviewLoading,
  permissions,
}: Props) {
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
  const [licensePlansEmailLoading, setLicensePlansEmailLoading] = useState(false);
  const [licensePlansEmailMessage, setLicensePlansEmailMessage] = useState<string | null>(null);
  
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

  const handleSmartPreview = async () => {
    if (product.certificate?.id) {
      onPreview(product.certificate.id);
      return;
    }

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
        onUpdated();
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

  const canAccessRatings = permissions.canUpdateStatus;
  const canAccessAssets = permissions.role !== 'VIEWER';
  const canSendLicensePlansEmail =
    permissions.canUpdateStatus &&
    ['PAID', 'MANUAL'].includes(product.paymentStatus) &&
    (product.adminProgress as any) === 'PASS';

  const openSignedAsset = async (kind: 'report' | 'seal') => {
    if (!canAccessAssets) {
      setLocalMessage('Keine Berechtigung für Downloads.');
      return;
    }
    try {
      const res = await fetch(`/api/admin/products/${product.id}/asset-url?kind=${encodeURIComponent(kind)}`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        setLocalMessage(data?.error || 'Download konnte nicht geöffnet werden.');
        return;
      }
      window.open(String(data.url), '_blank', 'noreferrer');
    } catch (err) {
      console.error('OPEN_ASSET_FAILED', err);
      setLocalMessage('Download konnte nicht geöffnet werden.');
    }
  };

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

  const currentKey = (product.adminProgress as StatusOption) || (product.status as StatusOption);
  const currentIdx = Math.max(
    0,
    FLOW_STEPS.findIndex((s) => s.key === currentKey),
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
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700 ring-1 ring-slate-200">
                Vor.Nr.: {product.processNumber ?? '—'}
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
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700 ring-slate-200">
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

	        {expanded ? (
	          <>
	            <div className="grid gap-4 lg:grid-cols-3">
	          <CollapsibleSection title="Flow" subtitle="Phasen" defaultOpen={false}>
	            <div className="grid gap-2">
	              {FLOW_STEPS.map((step, idx) => {
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
          </CollapsibleSection>

          <CollapsibleSection title="Workflow-Schritte" subtitle="Update & Versand" defaultOpen={false}>
            <div className="flex flex-col gap-2">
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

	              <button
	                type="button"
	                disabled={licensePlansEmailLoading || !canSendLicensePlansEmail}
	                onClick={async () => {
	                  setLicensePlansEmailMessage(null);
	                  if (!canSendLicensePlansEmail) {
	                    setLicensePlansEmailMessage('Voraussetzungen fehlen (Status/Payment/Permission).');
	                    return;
	                  }
	                  setLicensePlansEmailLoading(true);
	                  try {
	                    const res = await fetch(`/api/admin/products/${product.id}/send-license-plans-email`, {
	                      method: 'POST',
	                      headers: { 'Content-Type': 'application/json' },
	                    });
	                    const data = await res.json().catch(() => ({}));
	                    if (res.status === 409) {
	                      setLicensePlansEmailMessage(
	                        'Prüfergebnis-PDF nicht aktualisiert – bitte Prüfergebnis speichern und erneut versuchen.',
	                      );
	                      return;
	                    }
	                    if (!res.ok) {
	                      setLicensePlansEmailMessage(data.error || 'Senden fehlgeschlagen.');
	                      return;
	                    }
	                    setLicensePlansEmailMessage('E-Mail “Testsieger bestanden + Lizenzpläne” gesendet.');
	                  } catch (err) {
	                    console.error(err);
	                    setLicensePlansEmailMessage('Senden fehlgeschlagen.');
	                  } finally {
	                    setLicensePlansEmailLoading(false);
	                    onUpdated();
	                  }
	                }}
	                className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
	                  !canSendLicensePlansEmail || licensePlansEmailLoading
	                    ? 'border border-slate-200 text-slate-400 cursor-not-allowed'
	                    : 'border border-indigo-700 text-indigo-800 hover:bg-indigo-50'
	                }`}
	                title={
	                  !permissions.canUpdateStatus
	                    ? 'Keine Berechtigung.'
	                    : !['PAID', 'MANUAL'].includes(product.paymentStatus)
	                      ? 'Grundgebühr muss bezahlt sein.'
	                      : (product.adminProgress as any) !== 'PASS'
	                        ? 'Status muss auf Bestanden stehen.'
	                        : undefined
	                }
	              >
	                {licensePlansEmailLoading ? 'Sende…' : 'Bestanden-Mail senden'}
	              </button>
	              {licensePlansEmailMessage && <p className="text-xs text-slate-500">{licensePlansEmailMessage}</p>}

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
          </CollapsibleSection>

          <CollapsibleSection title="Assets & Downloads" subtitle="Links" defaultOpen={false}>
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">Prüfbericht hochladen</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {product.certificate?.reportUrl ? 'Upload vorhanden' : 'Noch kein Upload'}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                <input
                  ref={reportInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setReportFile(e.target.files?.[0] ?? null)}
                  disabled={!permissions.canUploadReport}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-[11px] file:font-semibold file:uppercase file:tracking-[0.18em] file:text-white disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={handleReportUpload}
                  disabled={!reportFile || uploadingReport || !permissions.canUploadReport}
                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-emerald-800 disabled:opacity-70"
                >
                  {uploadingReport ? 'Lade hoch...' : 'Prüfbericht hochladen'}
                </button>
              </div>
              {reportMessage && <p className="text-xs text-slate-500">{reportMessage}</p>}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <a
                href={product.certificate?.pdfUrl && canAccessAssets ? `/api/certificates/${product.id}/download` : '#'}
                target={product.certificate?.pdfUrl && canAccessAssets ? '_blank' : undefined}
                rel="noreferrer"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-lg px-3.5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                  product.certificate?.pdfUrl && canAccessAssets
                    ? 'border border-slate-900 text-slate-900 hover:bg-slate-50'
                    : 'border border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                onClick={(e) => {
                  if (!product.certificate?.pdfUrl || !canAccessAssets) e.preventDefault();
                }}
              >
                Zertifikat öffnen
              </a>
	              {product.certificate?.reportUrl ? (
	                <button
	                  type="button"
	                  onClick={() => openSignedAsset('report')}
	                  disabled={!canAccessAssets}
	                  className={`inline-flex min-h-[44px] items-center justify-center rounded-lg px-3.5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] transition ${
	                    canAccessAssets
	                      ? 'border border-emerald-700 text-emerald-800 hover:bg-emerald-50'
	                      : 'border border-slate-200 text-slate-400 cursor-not-allowed'
	                  }`}
	                >
	                  Hochgeladener Prüfbericht
	                </button>
	              ) : (
	                <div className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
	                  Kein Upload vorhanden
	                </div>
	              )}
	              <button
	                type="button"
	                disabled={!product.certificate?.sealUrl || !canAccessAssets}
	                onClick={() => openSignedAsset('seal')}
	                className={`inline-flex min-h-[44px] items-center justify-center rounded-lg px-3.5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] transition ${
	                  product.certificate?.sealUrl && canAccessAssets
	                    ? 'border border-amber-700 text-amber-800 hover:bg-amber-50'
	                    : 'border border-slate-200 text-slate-400 cursor-not-allowed'
	                }`}
	              >
	                Siegel öffnen
	              </button>
              <a
                href={`/admin/products/${product.id}/rating`}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-900 px-3.5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-900 transition hover:bg-slate-50"
              >
                Prüfergebnis bearbeiten
              </a>
              <a
                href={canAccessRatings ? `/api/admin/products/${product.id}/rating-sheet` : '#'}
                onClick={(e) => {
                  if (!canAccessRatings) e.preventDefault();
                }}
                className={`inline-flex min-h-[44px] items-center justify-center rounded-lg px-3.5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                  canAccessRatings
                    ? 'border border-slate-300 text-slate-800 hover:bg-slate-50'
                    : 'border border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
	              >
	                Rating CSV herunterladen
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
          </CollapsibleSection>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <CollapsibleSection
            title="Lizenz verwalten"
            subtitle={product.license?.stripeSubId ? `StripeSub: ${product.license.stripeSubId}` : undefined}
            defaultOpen={false}
          >
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
            <div className="flex flex-wrap items-center gap-2 pt-3">
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
          </CollapsibleSection>

          <CollapsibleSection title="Notiz an den Kunden" subtitle="Optional" defaultOpen={false}>
            <label className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-slate-600">
              Customer note
            </label>
            <textarea
              value={teamNote}
              onChange={(e) => setTeamNote(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Kurze Nachricht für den Kunden (wird in die E-Mail eingefügt) / Short note for the customer"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-400 focus:outline-none"
            />
          </CollapsibleSection>
        </div>

        {selectedStatus === 'FAIL' && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <label className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-rose-700">
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
            {[
              ['Vorgangsnummer', product.processNumber],
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
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col border-b border-slate-200 pb-2 last:border-b-0 last:pb-0">
                <span className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">{label}</span>
                <span className="text-sm font-semibold text-slate-900">{value || '—'}</span>
              </div>
            ))}
          </div>
        )}

	        {localMessage && <p className="text-xs text-slate-500">{localMessage}</p>}
	          </>
	        ) : null}
	      </div>
	    </article>
	  );
}

export default memo(AdminProductRow);
