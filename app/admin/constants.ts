import { PaymentStatusOption, StatusOption } from './types';

export const STATUS_OPTIONS = [
  { value: 'PRECHECK', label: 'Pre-Check / Pre-check' },
  { value: 'RECEIVED', label: 'Eingegangen / Received' },
  { value: 'ANALYSIS', label: 'Analyse / Analysis' },
  { value: 'PASS', label: 'Bestanden / Pass' },
  { value: 'COMPLETION', label: 'Abschluss / Completion' },
  { value: 'FAIL', label: 'Nicht bestanden / Fail' },
] as const satisfies { value: StatusOption; label: string }[];

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'UNPAID', label: 'Unbezahlt / Unpaid' },
  { value: 'PAID', label: 'Bezahlt / Paid' },
  { value: 'MANUAL', label: 'Manuelle Zahlung / Manual payment' },
] as const satisfies { value: PaymentStatusOption; label: string }[];

export const STATUS_TONE: Record<string, string> = {
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

export const PAYMENT_TONE: Record<string, string> = {
  UNPAID: 'bg-rose-50 text-rose-700 ring-rose-100',
  PAID: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  MANUAL: 'bg-amber-50 text-amber-700 ring-amber-100',
};

export const statusLabel = (status: string) => {
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
