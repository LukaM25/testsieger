"use client";

import { useEffect, useState } from "react";
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  CookieConsent,
  createCookieConsent,
  readCookieConsent,
  writeCookieConsent,
} from "@/lib/cookieConsent";

const GOOGLE_TAG_MANAGER_ID = "GTM-5Z5ZT5B6";
const GOOGLE_ADS_ID = "AW-18054519223";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function updateGoogleConsent(consent: CookieConsent) {
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtagShim(...args: unknown[]) {
      window.dataLayer?.push(args);
    };

  window.gtag("consent", "update", {
    analytics_storage: consent.analytics ? "granted" : "denied",
    ad_storage: consent.marketing ? "granted" : "denied",
    ad_user_data: consent.marketing ? "granted" : "denied",
    ad_personalization: consent.marketing ? "granted" : "denied",
  });
}

function loadScript(id: string, src: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.src = src;
  script.async = true;
  document.head.appendChild(script);
}

function loadGoogleTags(consent: CookieConsent) {
  updateGoogleConsent(consent);
  if (!consent.marketing) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });

  loadScript(
    "dpi-google-tag-manager",
    `https://www.googletagmanager.com/gtm.js?id=${GOOGLE_TAG_MANAGER_ID}`,
  );
  loadScript(
    "dpi-google-ads-gtag",
    `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`,
  );

  window.gtag?.("js", new Date());
  window.gtag?.("config", GOOGLE_ADS_ID);
}

export default function CookieConsentBanner() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = readCookieConsent();
    setConsent(existing);
    setIsVisible(!existing);
    if (existing) {
      setAnalytics(existing.analytics);
      setMarketing(existing.marketing);
      loadGoogleTags(existing);
    }

    const handleConsentUpdate = (event: Event) => {
      const next = (event as CustomEvent<CookieConsent>).detail;
      if (!next) return;
      setConsent(next);
      setAnalytics(next.analytics);
      setMarketing(next.marketing);
      loadGoogleTags(next);
    };

    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, handleConsentUpdate);
    return () => window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, handleConsentUpdate);
  }, []);

  const saveConsent = (next: CookieConsent) => {
    setConsent(next);
    setIsVisible(false);
    setShowDetails(false);
    writeCookieConsent(next);
    loadGoogleTags(next);
  };

  if (!isVisible) {
    if (!consent) return null;
    return (
      <button
        type="button"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 z-50 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg transition hover:bg-slate-50"
      >
        Cookie-Einstellungen
      </button>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-500">
              Datenschutz
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Cookie-Einstellungen</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Wir verwenden notwendige Cookies für Login, Sprache und Sicherheit. Mit Ihrer Zustimmung nutzen wir
              zusätzlich Analytics zur Verbesserung der Website und Marketing-Tags für Kampagnenmessung.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            <button
              type="button"
              onClick={() => saveConsent(createCookieConsent({ analytics: true, marketing: true }))}
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              Alle akzeptieren
            </button>
            <button
              type="button"
              onClick={() => saveConsent(createCookieConsent({ analytics: false, marketing: false }))}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Ablehnen
            </button>
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              aria-expanded={showDetails}
            >
              Anpassen
            </button>
          </div>
        </div>

        {showDetails ? (
          <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-3">
            <label className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <span className="flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-900">Notwendig</span>
                <input type="checkbox" checked disabled className="h-4 w-4" />
              </span>
              <span className="mt-2 block text-sm text-slate-600">Login, Sprache und Sicherheitsfunktionen.</span>
            </label>
            <label className="rounded-xl border border-slate-200 bg-white p-4">
              <span className="flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-900">Analytics</span>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(event) => setAnalytics(event.target.checked)}
                  className="h-4 w-4"
                />
              </span>
              <span className="mt-2 block text-sm text-slate-600">Seitenaufrufe und Conversion-Statistiken.</span>
            </label>
            <label className="rounded-xl border border-slate-200 bg-white p-4">
              <span className="flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-900">Marketing</span>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(event) => setMarketing(event.target.checked)}
                  className="h-4 w-4"
                />
              </span>
              <span className="mt-2 block text-sm text-slate-600">Google Tag Manager und Google Ads Messung.</span>
            </label>
            <div className="md:col-span-3">
              <button
                type="button"
                onClick={() => saveConsent(createCookieConsent({ analytics, marketing }))}
                className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
              >
                Auswahl speichern
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
