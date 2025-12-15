function isMeaningfulEnv(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (!v) return false;
  if (v.toLowerCase() === 'undefined') return false;
  if (v.toLowerCase() === 'null') return false;
  return true;
}

export function getPublicBaseUrl(fallback = 'http://localhost:3000') {
  const raw =
    (isMeaningfulEnv(process.env.NEXT_PUBLIC_BASE_URL) && process.env.NEXT_PUBLIC_BASE_URL) ||
    (isMeaningfulEnv(process.env.APP_URL) && process.env.APP_URL) ||
    fallback;

  const trimmed = raw.trim().replace(/\/+$/, '');

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // If someone configured only a host like "example.com", harden it to https://example.com
  return `https://${trimmed.replace(/^\/+/, '')}`;
}

