"use client";

import { createContext, useContext, useMemo, useState, useEffect, ReactNode, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LOCALE, Locale, LOCALE_COOKIE, translate, normalizeLocale } from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: string, fallback?: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ initialLocale, children }: { initialLocale?: Locale; children: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [locale, setLocaleState] = useState<Locale>(normalizeLocale(initialLocale));

  // persist to cookie
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next); // instant client update
    startTransition(() => {
      // light-weight refresh so server components pick up cookie without blocking UI
      router.refresh();
    });
  };

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale,
    t: (key: string, fallback?: string) => translate(locale, key, fallback),
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
