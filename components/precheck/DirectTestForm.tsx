"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Lock, Minus, Plus } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { QUICK_CREATE_CATEGORY_OPTIONS } from "@/lib/quickCreateProductForm";

type P = { productName: string; brand: string; category: string; code: string; specs: string };
const emptyProduct = (): P => ({ productName: "", brand: "", category: "", code: "", specs: "" });
const BASE_EUR = 179;
const discountFor = (n: number) => (n <= 1 ? 0 : n === 2 ? 20 : 30);
const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100";

export default function DirectTestForm({ initialCount = 1, nextPath }: { initialCount?: number; nextPath: string }) {
  const { locale } = useLocale();
  const tr = (de: string, en: string) => (locale === "en" ? en : de);
  const [count, setCount] = useState(Math.min(3, Math.max(1, initialCount)));
  const [products, setProducts] = useState<P[]>(() => Array.from({ length: 3 }, emptyProduct));
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [agb, setAgb] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState(false);

  const fmt = (n: number) =>
    new Intl.NumberFormat(locale === "en" ? "en-GB" : "de-DE", { style: "currency", currency: "EUR" }).format(n);
  const pct = discountFor(count);
  const perItem = Math.round(BASE_EUR * (1 - pct / 100) * 100) / 100;
  const total = Math.round(perItem * count * 100) / 100;

  const setField = (i: number, key: keyof P, value: string) =>
    setProducts((prev) => prev.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailExists(false);
    setBusy(true);
    try {
      const res = await fetch("/api/precheck/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${firstName.trim()} ${lastName.trim()}`.trim(), email, company, agbAccepted: agb, products: products.slice(0, count) }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.url) {
        window.location.href = json.url;
        return;
      }
      if (json.error === "EMAIL_EXISTS") {
        setEmailExists(true);
      } else if (json.errors) {
        setError(tr("Bitte füllen Sie alle Pflichtfelder korrekt aus.", "Please fill in all required fields correctly."));
      } else {
        setError(tr("Das hat leider nicht geklappt. Bitte versuchen Sie es erneut.", "Something went wrong. Please try again."));
      }
    } catch {
      setError(tr("Verbindungsfehler. Bitte versuchen Sie es erneut.", "Connection error. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      id="direkt"
      className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_24px_70px_-45px_rgba(43,64,102,0.35)] md:p-9"
    >
      <p className="eyebrow">{tr("Direkt testen lassen", "Test directly")}</p>
      <h3 className="text-2xl font-semibold tracking-tight text-[#2B4066] md:text-3xl">
        {tr("Ohne Anmeldung. Ohne Umweg.", "No sign-up. No detours.")}
      </h3>
      <p className="mt-2 text-sm text-slate-600 md:text-base">
        {tr(
          "Produkt angeben, Testgebühr zahlen, fertig. Ihr Konto legen wir automatisch an. Nach der Zahlung erhalten Sie Ihre Zugangsdaten per E-Mail.",
          "Enter your product, pay the test fee, done. We create your account automatically. After payment you receive your login details by email."
        )}
      </p>

      <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setCount(n)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              count === n ? "bg-gradient-to-r from-[#1d4ed8] to-[#16294d] shadow-[0_14px_28px_-16px_rgba(29,78,216,0.7)] !text-white" : "text-slate-600 hover:text-[#2B4066]"
            }`}
          >
            {n} {n === 1 ? tr("Produkt", "product") : tr("Produkte", "products")}
            {discountFor(n) > 0 && <span className="ml-1.5 text-xs opacity-80">-{discountFor(n)} %</span>}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <input className={inputCls} placeholder={tr("Vorname", "First name")} value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoComplete="given-name" />
        <input className={inputCls} placeholder={tr("Nachname", "Last name")} value={lastName} onChange={(e) => setLastName(e.target.value)} required autoComplete="family-name" />
        <input className={inputCls} type="email" placeholder={tr("E-Mail", "Email")} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <input className={inputCls} placeholder={tr("Firma (optional)", "Company (optional)")} value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" />
      </div>

      <div className="mt-6 space-y-4">
        {products.slice(0, count).map((p, i) => (
          <fieldset key={i} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 md:p-5">
            <legend className="px-2 text-sm font-semibold text-[#2B4066]">
              {tr("Produkt", "Product")} {i + 1}
            </legend>
            <div className="grid gap-3 md:grid-cols-2">
              <input className={inputCls} placeholder={tr("Produktname", "Product name")} value={p.productName} onChange={(e) => setField(i, "productName", e.target.value)} required />
              <input className={inputCls} placeholder={tr("Marke", "Brand")} value={p.brand} onChange={(e) => setField(i, "brand", e.target.value)} required />
              <select className={inputCls} value={p.category} onChange={(e) => setField(i, "category", e.target.value)} required>
                <option value="">{tr("Kategorie wählen", "Select category")}</option>
                {QUICK_CREATE_CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input className={inputCls} placeholder={tr("ASIN / EAN", "ASIN / EAN")} value={p.code} onChange={(e) => setField(i, "code", e.target.value)} required />
              <input className={`${inputCls} md:col-span-2`} placeholder={tr("Kurzbeschreibung (optional)", "Short description (optional)")} value={p.specs} onChange={(e) => setField(i, "specs", e.target.value)} />
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <input id="direkt-agb" type="checkbox" checked={agb} onChange={(e) => setAgb(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 accent-slate-900" required />
        <label htmlFor="direkt-agb" className="cursor-pointer text-sm leading-relaxed text-slate-700">
          {tr("Ich habe die ", "I have read the ")}
          <a href="/agb.pdf" target="_blank" rel="noopener noreferrer" className="font-semibold underline">AGB</a>
          {tr(" und die ", " and the ")}
          <a href="/datenschutz" target="_blank" rel="noopener noreferrer" className="font-semibold underline">{tr("Datenschutzerklärung", "privacy policy")}</a>
          {tr(" gelesen und akzeptiere sie.", " and accept them.")}
        </label>
      </div>

      {emailExists && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {tr("Zu dieser E-Mail gibt es schon ein Konto. ", "An account already exists for this email. ")}
          <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="font-semibold underline">
            {tr("Bitte einloggen und fortfahren.", "Please sign in to continue.")}
          </Link>
        </div>
      )}
      {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">{tr("Testgebühr gesamt (netto)", "Total test fee (net)")}</p>
          <p className="flex flex-wrap items-baseline gap-x-3 text-3xl font-semibold tracking-tight text-[#2B4066] tabular-nums">
            {pct > 0 && <span className="text-lg font-medium text-slate-400 line-through decoration-1">{fmt(BASE_EUR * count)}</span>}
            <span>{fmt(total)}</span>
            {pct > 0 && <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">{tr(`Sie sparen ${fmt(BASE_EUR * count - total)}`, `You save ${fmt(BASE_EUR * count - total)}`)}</span>}
          </p>
          {count > 1 && (
            <p className="text-xs text-slate-500">
              {fmt(perItem)} {tr("pro Produkt", "per product")}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={busy}
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#16294d] px-7 py-3.5 text-base font-semibold !text-white shadow-[0_18px_34px_-18px_rgba(29,78,216,0.75)] transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          {busy ? tr("Weiter zur Zahlung…", "Continuing to payment…") : tr("Jetzt testen lassen & bezahlen", "Test now & pay")}
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </button>
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
        {tr("Sichere Zahlung über Stripe. Das Siegel erhalten Sie erst nach bestandener Prüfung und gewähltem Lizenzplan.", "Secure payment via Stripe. You only receive the seal after passing the test and choosing a license plan.")}
      </p>
    </form>
  );
}
