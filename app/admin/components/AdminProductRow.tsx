'use client';

import { memo, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { PAYMENT_STATUS_OPTIONS, STATUS_OPTIONS, STATUS_TONE, statusLabel } from '../constants';
import { AdminPermissions, AdminProduct, PaymentStatusOption, StatusOption } from '../types';

type Props = {
  product: AdminProduct;
  onUpdated: (patch: { id: string } & Partial<Omit<AdminProduct, 'id'>>) => void;
  onPreview: (id: string) => void;
  isPreviewLoading: boolean;
  permissions: AdminPermissions;
};

const FLOW_STEPS: { key: StatusOption; label: string }[] = [
  { key: 'PRECHECK', label: 'Pre-Check' },
  { key: 'RECEIVED', label: 'Eingang' },
  { key: 'ANALYSIS', label: 'Analyse' },
  { key: 'PASS', label: 'Bestanden' },
  { key: 'COMPLETION', label: 'Abschluss' },
  { key: 'FAIL', label: 'Nicht bestanden' },
];

function CheckIcon({ className = 'h-3.5 w-3.5 text-emerald-600' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 01.006 1.414l-7.5 7.57a1 1 0 01-1.42 0L3.29 9.77a1 1 0 011.42-1.41l3.08 3.11 6.79-6.86a1 1 0 011.414-.01z"
        clipRule="evenodd"
      />
    </svg>
  );
}

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
  const [licensePlansEmailSent, setLicensePlansEmailSent] = useState(false);
  
  const [paymentStatusValue, setPaymentStatusValue] = useState<PaymentStatusOption>(
    (product.paymentStatus as PaymentStatusOption) || 'UNPAID'
  );
  const [autoSent, setAutoSent] = useState(false);
  useEffect(() => {
    setPaymentStatusValue((product.paymentStatus as PaymentStatusOption) || 'UNPAID');
  }, [product.paymentStatus]);

  useEffect(() => {
    setLicensePlansEmailSent(false);
  }, [product.id]);

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

  const baseFeePaid = paymentStatusValue === 'PAID' || paymentStatusValue === 'MANUAL';
  const baseFeeIsPriority = product.baseFeePlan === 'PRECHECK_PRIORITY';
  const baseFeeStatus = baseFeePaid ? (baseFeeIsPriority ? 'PRIORITY' : 'NORMAL') : 'OFFEN';
  const baseFeeTone = baseFeePaid
    ? baseFeeIsPriority
      ? 'bg-amber-50 text-amber-700 ring-amber-200'
      : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    : 'bg-rose-50 text-rose-700 ring-rose-100';

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
        onUpdated({ id: product.id, certificate: { id: String(data.certificateId) } });
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
    if (statusBlockReason) {
      setLocalMessage(statusBlockReason);
      return;
    }
    setLocalMessage(null);
    setLoading(true);
    const previous = { id: product.id, adminProgress: product.adminProgress, status: product.status };
    const optimisticStatus =
      ['RECEIVED', 'ANALYSIS', 'COMPLETION', 'PASS'].includes(selectedStatus) &&
      ['PRECHECK', 'PAID'].includes(product.status)
        ? 'IN_REVIEW'
        : product.status;
    onUpdated({ id: product.id, adminProgress: selectedStatus, status: optimisticStatus });
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
        onUpdated(previous);
        return;
      }
      setLocalMessage('Status aktualisiert.');
      onUpdated({
        id: product.id,
        adminProgress: (data.adminProgress as StatusOption) || selectedStatus,
        status: (data.productStatus as string) || optimisticStatus,
      });
      if (selectedStatus === 'PASS' && !autoSent) {
        setAutoSent(true);
        await handleSendCertificate({ auto: true });
      }
    } catch (err) {
      console.error(err);
      setLocalMessage('Aktualisierung fehlgeschlagen.');
      onUpdated(previous);
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
      if (data.license?.id) onUpdated({ id: product.id, license: data.license });
      else onUpdated({ id: product.id });
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
    if (!licensePaid) {
      setLocalMessage('Lizenzzahlung erforderlich.');
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLocalMessage(data.error || 'Zertifikat konnte nicht erstellt werden.');
        return;
      }
      setLocalMessage('Zertifikat generiert.');
      const certId = data.certificateId || product.certificate?.id;
      if (certId) {
        onUpdated({
          id: product.id,
          certificate: {
            id: String(certId),
            pdfUrl: data.pdfUrl ?? product.certificate?.pdfUrl ?? null,
            sealUrl: data.sealUrl ?? product.certificate?.sealUrl ?? null,
            ratingScore: data.ratingScore ?? product.certificate?.ratingScore ?? null,
            ratingLabel: data.ratingLabel ?? product.certificate?.ratingLabel ?? null,
          },
        });
      } else {
        onUpdated({ id: product.id });
      }
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
    const previous = { id: product.id, paymentStatus: product.paymentStatus, status: product.status };
    const optimisticProductStatus =
      (paymentStatusValue === 'PAID' || paymentStatusValue === 'MANUAL') && product.status === 'PRECHECK'
        ? 'PAID'
        : product.status;
    onUpdated({ id: product.id, paymentStatus: paymentStatusValue, status: optimisticProductStatus });
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
        onUpdated(previous);
        return;
      }
      setPaymentStatusMessage('Payment status aktualisiert.');
      onUpdated({
        id: product.id,
        paymentStatus: (data.paymentStatus as PaymentStatusOption) || paymentStatusValue,
        status: (data.productStatus as string) || optimisticProductStatus,
      });
    } catch (err) {
      console.error(err);
      setPaymentStatusMessage('Payment status konnte nicht gesetzt werden.');
      onUpdated(previous);
    } finally {
      setPaymentStatusLoading(false);
    }
  };

  const canAccessRatings = permissions.canUpdateStatus;
  const canAccessAssets = permissions.role !== 'VIEWER';
  const licensePaid =
    Boolean(product.licensePaid) || Boolean(product.license?.paidAt) || product.license?.status === 'ACTIVE';
  const isDone = product.status === 'COMPLETED';
  const ratingReady = Boolean(product.certificate?.ratingScore && product.certificate?.ratingLabel);
  const reportUploaded = Boolean(product.certificate?.reportUrl);
  const canSendLicensePlansEmail =
    permissions.canUpdateStatus &&
    ratingReady &&
    ['PAID', 'MANUAL'].includes(product.paymentStatus) &&
    (product.adminProgress as any) === 'PASS';
  const canTriggerCompletion =
    permissions.canSendCompletion &&
    (product.adminProgress as any) === 'COMPLETION' &&
    product.status !== 'COMPLETED' &&
    licensePaid;
  const hasRatingData = ratingReady;
  const hasCertificatePdf = Boolean(product.certificate?.pdfUrl);
  const hasSeal = Boolean(product.certificate?.sealUrl);
  const statusSaved = selectedStatus === product.adminProgress;
  const completionDone = (product.adminProgress as any) === 'COMPLETION' || isDone;
  const statusBlockReason = (() => {
    if (selectedStatus === 'PASS' && !ratingReady) {
      return 'Prüfergebnis fehlt – bitte Ergebnis speichern.';
    }
    if (selectedStatus === 'COMPLETION') {
      if (!licensePaid) return 'Lizenzzahlung erforderlich.';
      if (!ratingReady) return 'Prüfergebnis fehlt – bitte Ergebnis speichern.';
      if (!reportUploaded) return 'Prüfbericht fehlt.';
    }
    return null;
  })();
  const sealButtonStyle = hasSeal
    ? { backgroundColor: '#b45309', borderColor: '#b45309', color: '#ffffff', WebkitTextFillColor: '#ffffff' }
    : undefined;

  const handleGenerateWithRating = async () => {
    if (!permissions.canGenerateCert) {
      setLocalMessage('Keine Berechtigung zum Generieren.');
      return;
    }
    if (!licensePaid) {
      setLocalMessage('Lizenzzahlung erforderlich.');
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
      const certId = data.certificateId || product.certificate?.id;
      if (certId) {
        onUpdated({
          id: product.id,
          certificate: {
            id: String(certId),
            pdfUrl: data.pdfUrl ?? product.certificate?.pdfUrl ?? null,
            sealUrl: data.sealUrl ?? product.certificate?.sealUrl ?? null,
            ratingScore: data.ratingScore ?? product.certificate?.ratingScore ?? null,
            ratingLabel: data.ratingLabel ?? product.certificate?.ratingLabel ?? null,
          },
        });
      } else {
        onUpdated({ id: product.id });
      }
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
      const certId = data.certificateId || product.certificate?.id;
      if (certId) {
        onUpdated({
          id: product.id,
          certificate: {
            id: String(certId),
            reportUrl: (data.reportUrl as string) || product.certificate?.reportUrl || null,
          },
        });
      } else {
        onUpdated({ id: product.id });
      }
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
            {isDone && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800 ring-1 ring-emerald-200">
                  <svg
                    aria-hidden="true"
                    className="h-3 w-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 5.29a1 1 0 01.006 1.414l-7.5 7.57a1 1 0 01-1.42 0L3.29 9.77a1 1 0 011.42-1.41l3.08 3.11 6.79-6.86a1 1 0 011.414-.01z"
                      clipRule="evenodd"
                    />
                  </svg>
                  ERLEDIGT
                </span>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold text-slate-900">{product.name}</span>
              <span className="text-sm text-slate-500">{product.brand}</span>
              <span className="text-xs text-slate-400">{new Date(product.createdAt).toLocaleTimeString('de-DE')}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ring-1 ${STATUS_TONE[product.status] ?? 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
                Status: {statusLabel(product.status)}
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ring-1 ${baseFeeTone}`}>
                GRUNDGEBÜHR:
                {baseFeeStatus === 'NORMAL' && (
                  <svg aria-hidden="true" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.704 5.29a1 1 0 01.006 1.414l-7.5 7.57a1 1 0 01-1.42 0L3.29 9.77a1 1 0 011.42-1.41l3.08 3.11 6.79-6.86a1 1 0 011.414-.01z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {baseFeeStatus === 'PRIORITY' && (
                  <svg aria-hidden="true" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11.4 1.5 4.5 11h4.7l-1.1 7.5 7-9.8h-4.7l1-7.2z" />
                  </svg>
                )}
                <span>{baseFeeStatus}</span>
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700 ring-1 ring-slate-200">
                Vor.Nr.: {product.processNumber ?? '—'}
              </span>
              {product.license ? (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700 ring-1 ring-blue-100">
                  Lizenz: {product.license.plan}
                  {product.license.expiresAt
                    ? ` · gültig bis ${new Date(product.license.expiresAt).toLocaleDateString('de-DE')}`
                    : ' · Lifetime'}
                </span>
              ) : null}
              {!licensePaid && (
                <span className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-700 ring-1 ring-rose-100">
                  Lizenz: Zahlung offen
                </span>
              )}
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
              <div className="flex flex-col gap-2">
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
                        (!permissions.canFinalizeStatus && (status.value === 'PASS' || status.value === 'FAIL')) ||
                        (status.value === 'PASS' && !ratingReady) ||
                        (status.value === 'COMPLETION' && (!licensePaid || !ratingReady || !reportUploaded))
                      }
                    >
                      {status.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={loading || !permissions.canUpdateStatus || Boolean(statusBlockReason)}
                  onClick={handleUpdate}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-black disabled:opacity-70"
                >
                  <span className="inline-flex items-center gap-2">
                    {loading ? 'Status wird gespeichert…' : 'STATUS SPEICHERN'}
                    {statusSaved && !loading ? <CheckIcon /> : null}
                  </span>
                </button>
              </div>
              {statusBlockReason ? (
                <p className="text-xs text-rose-600">{statusBlockReason}</p>
              ) : !licensePaid ? (
                <p className="text-xs text-rose-600">
                  Lizenzzahlung offen – Abschluss &amp; Zertifikate sind gesperrt.
                </p>
              ) : null}

              <a
                href={`/admin/products/${product.id}/rating`}
                className={`rounded-lg border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                  hasRatingData
                    ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800'
                    : 'border-slate-900 text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  1. Prüfergebnis bearbeiten
                  {hasRatingData ? <CheckIcon className="h-3.5 w-3.5 text-emerald-500" /> : null}
                </span>
              </a>

              <button
                type="button"
                disabled={licensePlansEmailLoading || !canSendLicensePlansEmail}
                onClick={async () => {
	                  setLicensePlansEmailMessage(null);
                    setLicensePlansEmailSent(false);
	                  if (!canSendLicensePlansEmail) {
	                    if (!permissions.canUpdateStatus) {
	                      setLicensePlansEmailMessage('Keine Berechtigung.');
	                    } else if (!ratingReady) {
	                      setLicensePlansEmailMessage('Prüfergebnis fehlt – bitte Ergebnis speichern.');
	                    } else if (!['PAID', 'MANUAL'].includes(product.paymentStatus)) {
	                      setLicensePlansEmailMessage('Grundgebühr muss bezahlt sein.');
	                    } else if ((product.adminProgress as any) !== 'PASS') {
	                      setLicensePlansEmailMessage('Status muss auf Bestanden stehen.');
	                    } else {
	                      setLicensePlansEmailMessage('Voraussetzungen fehlen.');
	                    }
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
                      setLicensePlansEmailSent(true);
	                    setLicensePlansEmailMessage('E-Mail “Testsieger bestanden + Lizenzpläne” gesendet.');
	                  } catch (err) {
	                    console.error(err);
	                    setLicensePlansEmailMessage('Senden fehlgeschlagen.');
		                  } finally {
		                    setLicensePlansEmailLoading(false);
		                    onUpdated({ id: product.id });
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
                      : !ratingReady
                        ? 'Prüfergebnis fehlt.'
	                    : !['PAID', 'MANUAL'].includes(product.paymentStatus)
	                      ? 'Grundgebühr muss bezahlt sein.'
	                      : (product.adminProgress as any) !== 'PASS'
	                        ? 'Status muss auf Bestanden stehen.'
	                        : undefined
	                }
	              >
              <span className="inline-flex items-center gap-2">
                {licensePlansEmailLoading ? '2. Sende…' : '2. Bestanden - Mail senden'}
                {licensePlansEmailSent && !licensePlansEmailLoading ? (
                  <svg
                    aria-hidden="true"
                    className="h-3.5 w-3.5 text-emerald-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 5.29a1 1 0 01.006 1.414l-7.5 7.57a1 1 0 01-1.42 0L3.29 9.77a1 1 0 011.42-1.41l3.08 3.11 6.79-6.86a1 1 0 011.414-.01z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : null}
              </span>
            </button>
              {licensePlansEmailMessage && <p className="text-xs text-slate-500">{licensePlansEmailMessage}</p>}

              <button
                type="button"
                disabled={sendLoading || !permissions.canGenerateCert || !licensePaid}
                onClick={() => handleSendCertificate()}
                title={!licensePaid ? 'Lizenzzahlung erforderlich.' : undefined}
                className={`rounded-lg border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                  hasCertificatePdf
                    ? 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 disabled:border-emerald-600 disabled:bg-emerald-600 disabled:text-white disabled:opacity-100 disabled:cursor-not-allowed'
                    : 'border-emerald-600 text-emerald-700 hover:bg-emerald-50 disabled:opacity-70'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {sendLoading ? '3. Zertifikat wird generiert…' : '3. Zertifikat generieren'}
                  {hasCertificatePdf && !sendLoading ? <CheckIcon className="h-3.5 w-3.5 text-emerald-200" /> : null}
                </span>
              </button>

              <button
                type="button"
                disabled={genLoading || !permissions.canGenerateCert || !licensePaid}
                onClick={handleGenerateWithRating}
                title={!licensePaid ? 'Lizenzzahlung erforderlich.' : undefined}
                style={sealButtonStyle}
                className={`rounded-lg border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                  hasSeal
                    ? 'border-amber-700 disabled:cursor-not-allowed'
                    : 'border-amber-700 text-amber-800 hover:bg-amber-50 disabled:opacity-70'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {genLoading ? '4. Siegel wird generiert…' : '4. Siegel generieren'}
                  {hasSeal && !genLoading ? <CheckIcon className="h-3.5 w-3.5 text-emerald-500" /> : null}
                </span>
              </button>

              {!licensePaid && (
                <p className="text-xs text-rose-600">
                  Lizenzzahlung erforderlich für Zertifikat, Siegel und Completion.
                </p>
              )}

              <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
	                <div className="flex items-center justify-between gap-2">
	                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
	                    5. Prüfbericht hochladen
	                  </span>
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
                    <span className="inline-flex items-center gap-2">
                      {uploadingReport ? 'Lade hoch...' : 'Prüfbericht hochladen'}
                      {reportUploaded && !uploadingReport ? <CheckIcon className="h-3.5 w-3.5 text-emerald-200" /> : null}
                    </span>
                  </button>
	                </div>
	                {reportMessage && <p className="text-xs text-slate-500">{reportMessage}</p>}
	              </div>

              <button
                type="button"
                disabled={sendLoading || !permissions.canSendCompletion}
                onClick={async () => {
                  if (!permissions.canSendCompletion) {
                    setLocalMessage('Keine Berechtigung für Completion-Versand.');
                    return;
                  }
                  const forceSend = !canTriggerCompletion;
                  setSendLoading(true);
                  setLocalMessage(null);
                  try {
                    const res = await fetch('/api/admin/complete-license', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ productId: product.id, force: forceSend }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      setLocalMessage(data.error || 'Senden fehlgeschlagen.');
                      return;
                    }
                    if (data.alreadySent) {
                      setLocalMessage('Completion-Email wurde bereits gesendet und erneut verschickt.');
                    } else {
                      setLocalMessage('Completion-Email mit allen Dateien gesendet.');
                    }
                    onUpdated({ id: product.id, status: 'COMPLETED', adminProgress: 'COMPLETION' });
                  } catch (err) {
                    console.error(err);
                    setLocalMessage('Senden fehlgeschlagen.');
                  } finally {
                    setSendLoading(false);
                  }
                }}
                className="rounded-lg border border-emerald-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800 transition hover:bg-emerald-50 disabled:opacity-70"
                title={!permissions.canSendCompletion ? 'Keine Berechtigung.' : undefined}
              >
                <span className="inline-flex items-center gap-2">
                  {sendLoading ? '6. Sende…' : 'Abschluss – Alle Dateien senden'}
                  {completionDone && !sendLoading ? <CheckIcon className="h-3.5 w-3.5 text-emerald-600" /> : null}
                </span>
              </button>

              <p className="text-xs text-slate-500">
                Hinweis: Der Versand an den Kunden erfolgt erst über die Aktion &ldquo;Abschluss – Alle Dateien senden&rdquo;.
              </p>
            </div>
          </CollapsibleSection>

	          <CollapsibleSection title="Assets & Downloads" subtitle="Links" defaultOpen={false}>
	            <div className="grid gap-3 sm:grid-cols-2">
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
                <span className="inline-flex items-center gap-2">
                  Zertifikat öffnen
                  {hasCertificatePdf ? <CheckIcon className="h-3.5 w-3.5 text-emerald-600" /> : null}
                </span>
              </a>
	              {product.certificate?.reportUrl ? (
                <a
                  href={
                    canAccessAssets
                      ? `/api/admin/products/${product.id}/asset-url?kind=report&redirect=1`
                      : '#'
                  }
                  target={canAccessAssets ? '_blank' : undefined}
                  rel="noreferrer"
                  onClick={(e) => {
                    if (!canAccessAssets) e.preventDefault();
                  }}
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-lg px-3.5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                    canAccessAssets
                      ? 'border border-emerald-700 text-emerald-800 hover:bg-emerald-50'
                      : 'border border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    Hochgeladener Prüfbericht
                    {reportUploaded ? <CheckIcon className="h-3.5 w-3.5 text-emerald-600" /> : null}
                  </span>
                </a>
	              ) : (
	                <div className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
	                  Kein Upload vorhanden
	                </div>
	              )}
              <a
                href={
                  product.certificate?.sealUrl && canAccessAssets
                    ? `/api/admin/products/${product.id}/asset-url?kind=seal&redirect=1`
                    : '#'
                }
                target={product.certificate?.sealUrl && canAccessAssets ? '_blank' : undefined}
                rel="noreferrer"
                onClick={(e) => {
                  if (!product.certificate?.sealUrl || !canAccessAssets) e.preventDefault();
                }}
                className={`inline-flex min-h-[44px] items-center justify-center rounded-lg px-3.5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                  product.certificate?.sealUrl && canAccessAssets
                    ? 'border border-amber-700 text-amber-800 hover:bg-amber-50'
                    : 'border border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  Siegel öffnen
                  {hasSeal ? <CheckIcon className="h-3.5 w-3.5 text-emerald-600" /> : null}
                </span>
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
                <span className="inline-flex items-center gap-2">
                  Rating CSV herunterladen
                  {hasRatingData ? <CheckIcon className="h-3.5 w-3.5 text-emerald-600" /> : null}
                </span>
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
