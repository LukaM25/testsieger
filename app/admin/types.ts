export type StatusOption = 'PRECHECK' | 'RECEIVED' | 'ANALYSIS' | 'COMPLETION' | 'PASS' | 'FAIL';
export type PaymentStatusOption = 'UNPAID' | 'PAID' | 'MANUAL';

export type AdminProduct = {
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
  processNumber?: string | null;
  adminProgress: StatusOption;
  createdAt: string;
  user: {
    name: string;
    company?: string | null;
    email: string;
    address?: string | null;
  };
  paymentStatus: string;
  baseFeePlan?: 'PRECHECK_FEE' | 'PRECHECK_PRIORITY' | null;
  licensePaid?: boolean;
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

export type AdminSummary = {
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

export type AdminAuthInfo = Pick<AdminSummary, 'id' | 'email' | 'name' | 'role'>;

export type AuditEntry = {
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

export type AdminPermissions = {
  role: 'VIEWER' | 'EXAMINER' | 'SUPERADMIN';
  canUpdateStatus: boolean;
  canFinalizeStatus: boolean;
  canManagePayments: boolean;
  canManageLicense: boolean;
  canGenerateCert: boolean;
  canUploadReport: boolean;
  canSendCompletion: boolean;
};
