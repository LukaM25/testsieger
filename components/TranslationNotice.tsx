"use client";

import { useLocale } from "./LocaleProvider";

export default function TranslationNotice({ className }: { className?: string }) {
  const { locale, t } = useLocale();
  if (locale !== "en") return null;
  const base = "mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900";
  const combined = className ? `${base} ${className}` : base;
  return (
    <div className={combined}>
      {t("notice.unverified", "Notice: Translation not checked")}
    </div>
  );
}
