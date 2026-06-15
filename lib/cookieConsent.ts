export const COOKIE_CONSENT_NAME = "dpi_cookie_consent";
export const COOKIE_CONSENT_UPDATED_EVENT = "dpi-cookie-consent-updated";

export type CookieConsent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  version: 1;
  updatedAt: string;
};

export function createCookieConsent(input: { analytics: boolean; marketing: boolean }): CookieConsent {
  return {
    necessary: true,
    analytics: input.analytics,
    marketing: input.marketing,
    version: 1,
    updatedAt: new Date().toISOString(),
  };
}

export function parseCookieConsentValue(value: string | undefined) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<CookieConsent>;
    if (parsed.necessary !== true || parsed.version !== 1) return null;
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      version: 1,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date(0).toISOString(),
    } satisfies CookieConsent;
  } catch {
    return null;
  }
}

export function readCookieConsent() {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${COOKIE_CONSENT_NAME}=`));
  return parseCookieConsentValue(cookie?.split("=").slice(1).join("="));
}

export function readCookieConsentFromHeader(cookieHeader: string | null) {
  const cookie = (cookieHeader ?? "")
    .split("; ")
    .find((entry) => entry.startsWith(`${COOKIE_CONSENT_NAME}=`));
  return parseCookieConsentValue(cookie?.split("=").slice(1).join("="));
}

export function writeCookieConsent(consent: CookieConsent) {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(JSON.stringify(consent));
  document.cookie = `${COOKIE_CONSENT_NAME}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_UPDATED_EVENT, { detail: consent }));
}
