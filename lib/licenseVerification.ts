type VerificationCodeInput = {
  licenseCode?: string | null;
  sealNumber?: string | null;
  certificateId?: string | null;
  productId?: string | null;
};

function clean(value: string | null | undefined) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function getVerificationCode(input: VerificationCodeInput) {
  return (
    clean(input.licenseCode) ??
    clean(input.sealNumber) ??
    clean(input.certificateId) ??
    clean(input.productId)
  );
}

export function buildLicenseVerificationUrl(appUrl: string, input: VerificationCodeInput) {
  const code = getVerificationCode(input);
  if (!code) return `${appUrl.replace(/\/$/, '')}/lizenzen`;
  return `${appUrl.replace(/\/$/, '')}/lizenzen?q=${encodeURIComponent(code)}#lizenzsuche`;
}

export function getShortSealCode(sealNumber: string | null | undefined) {
  const normalized = clean(sealNumber);
  if (!normalized) return null;

  const uuidMatch = normalized.match(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-([0-9a-f]{12})$/i,
  );
  if (uuidMatch) return uuidMatch[1];

  return normalized;
}

export function buildShortSealVerificationUrl(
  appUrl: string,
  sealNumber: string | null | undefined,
  fallback: VerificationCodeInput,
) {
  const shortCode = getShortSealCode(sealNumber);
  if (!shortCode) return buildLicenseVerificationUrl(appUrl, fallback);
  return `${appUrl.replace(/\/$/, '')}/s/${encodeURIComponent(shortCode)}`;
}
