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
  return `${appUrl.replace(/\/$/, '')}/lizenzen?q=${encodeURIComponent(code)}`;
}
