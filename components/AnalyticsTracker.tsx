"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  CookieConsent,
  readCookieConsent,
} from "@/lib/cookieConsent";

type AnalyticsPayload = {
  name: string;
  path?: string;
  referrer?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  metadata?: Record<string, unknown>;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    trackDpiEvent?: (name: string, metadata?: Record<string, unknown>) => void;
  }
}

function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get("utm_source") || undefined,
    medium: params.get("utm_medium") || undefined,
    campaign: params.get("utm_campaign") || undefined,
  };
}

function sendAnalyticsEvent(payload: AnalyticsPayload) {
  if (payload.path?.startsWith("/admin")) return;

  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    keepalive: true,
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<CookieConsent | null>(null);

  useEffect(() => {
    setConsent(readCookieConsent());

    const handleConsentUpdate = (event: Event) => {
      setConsent((event as CustomEvent<CookieConsent>).detail ?? readCookieConsent());
    };

    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, handleConsentUpdate);
    return () => window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, handleConsentUpdate);
  }, []);

  useEffect(() => {
    window.trackDpiEvent = (name, metadata) => {
      const payload = {
        name,
        path: `${window.location.pathname}${window.location.search}`,
        referrer: document.referrer || undefined,
        ...getUtmParams(),
        metadata,
      };

      if (consent?.marketing) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: payload.name,
          path: payload.path,
          ...(payload.metadata ?? {}),
        });
      }

      if (consent?.analytics) sendAnalyticsEvent(payload);
    };

    return () => {
      delete window.trackDpiEvent;
    };
  }, [consent]);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (!consent?.analytics && !consent?.marketing) return;

    const payload = {
      name: "page_view",
      path: `${window.location.pathname}${window.location.search}`,
      referrer: document.referrer || undefined,
      ...getUtmParams(),
    };

    if (consent?.marketing) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: payload.name, path: payload.path });
    }

    if (consent?.analytics) sendAnalyticsEvent(payload);
  }, [consent, pathname]);

  return null;
}
