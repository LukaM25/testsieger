"use client";

import { useCallback, useMemo, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import { usePrecheckStatusData, type ProductStatusPayload } from "@/hooks/usePrecheckStatusData";
import { PrecheckStatusCard } from "@/components/PrecheckStatusCard";

interface DashboardClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    products: Array<{
      id: string;
      name: string;
      brand: string | null;
      status: string;
      adminProgress: ProductStatusPayload["adminProgress"];
      paymentStatus: ProductStatusPayload["paymentStatus"];
      createdAt: string;
      certificate: { id: string; pdfUrl: string | null } | null;
      license: { status: string; plan: string } | null;
    }>;
    orders: Array<{
      id: string;
      productId: string;
      plan: string;
      priceCents: number;
      createdAt: string;
      paidAt: string | null;
      product: { id: string; name: string } | null;
    }>;
  };
}

const CATEGORY_OPTIONS = [
  "Ausbildung",
  "Auto & Motorrad",
  "Baby",
  "Baumarkt",
  "Beleuchtung",
  "Bücher",
  "Bürobedarf & Schreibwaren",
  "Computer & Zubehör",
  "DVD & Blu-ray",
  "Elektro-Großgeräte",
  "Elektronik & Foto",
  "Garten",
  "Gewerbe, Industrie & Wissenschaft",
  "Handgefertigte Produkte",
  "Haustierbedarf",
  "Kamera & Foto",
  "Kosmetik & Pflege",
  "Küche, Haushalt & Wohnen",
  "Lebensmittel & Getränke",
  "Mode",
  "Musikinstrumente & DJ-Equipment",
  "Software",
  "Spiele & Gaming",
  "Spielzeug",
  "Sport & Freizeit",
] as const;

type NewProductFormState = {
  productName: string;
  brand: string;
  category: string;
  code: string;
  specs: string;
  size: string;
  madeIn: string;
  material: string;
};

type NewProductFormErrors = Partial<Record<keyof Pick<NewProductFormState, "productName" | "brand" | "category">, string>>;

export default function DashboardClient({ user }: DashboardClientProps) {
  const firstName = useMemo(() => (user.name || "").trim().split(/\s+/)[0] || user.name, [user.name]);
  const initialStatusProducts = useMemo<ProductStatusPayload[]>(
    () =>
      (user.products || []).map(
        (p): ProductStatusPayload => ({
          id: p.id,
          name: p.name,
          paymentStatus: (p.paymentStatus ?? "UNPAID") as ProductStatusPayload["paymentStatus"],
          adminProgress: (p.adminProgress ?? "PRECHECK") as ProductStatusPayload["adminProgress"],
          status: p.status ?? "PRECHECK",
          createdAt: p.createdAt ?? undefined,
          brand: p.brand ?? null,
          certificate: p.certificate ? { id: p.certificate.id, pdfUrl: p.certificate.pdfUrl ?? null } : null,
          license: p.license ? { status: p.license.status, plan: p.license.plan ?? null } : null,
        })
      ),
    [user.products]
  );

  const statusState = usePrecheckStatusData({ initialProducts: initialStatusProducts });
  const { products, setProducts, setSelectedProductId, refresh } = statusState;

  const [showSubmit, setShowSubmit] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<NewProductFormErrors>({});
  const [licenseSelections, setLicenseSelections] = useState<Record<string, string>>({});
  const [licensePaying, setLicensePaying] = useState<string | null>(null);
  const [baseFeeSelections, setBaseFeeSelections] = useState<Record<string, string>>({});
  const [baseFeePaying, setBaseFeePaying] = useState<string | null>(null);
  const [orderPayingId, setOrderPayingId] = useState<string | null>(null);
  const [receiptLoadingId, setReceiptLoadingId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    productName: "",
    brand: "",
    category: "",
    code: "",
    specs: "",
    size: "",
    madeIn: "",
    material: "",
  });

  const validateNewProduct = useCallback((draft: NewProductFormState): NewProductFormErrors => {
    const errors: NewProductFormErrors = {};
    if (draft.productName.trim().length < 2) errors.productName = "Bitte einen Produktnamen angeben (min. 2 Zeichen).";
    if (!draft.brand.trim()) errors.brand = "Bitte eine Marke angeben.";
    if (draft.category && !CATEGORY_OPTIONS.includes(draft.category as any)) {
      errors.category = "Bitte eine Kategorie aus der Liste auswählen.";
    }
    return errors;
  }, []);

  const handleQuickSubmit = useCallback(async () => {
    setSubmitMessage(null);
    const errors = validateNewProduct(newProduct);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setSubmitMessage("Bitte markierte Felder prüfen.");
      return;
    }

    const tempId = `tmp_${Date.now().toString(36)}`;
    const optimistic: ProductStatusPayload = {
      id: tempId,
      name: newProduct.productName.trim(),
      brand: newProduct.brand.trim(),
      paymentStatus: "UNPAID",
      adminProgress: "PRECHECK",
      status: "PRECHECK",
      createdAt: new Date().toISOString(),
      certificate: null,
      license: null,
    };

    setProducts((prev) => [optimistic, ...prev]);
    setSelectedProductId(tempId);

    setSubmitLoading(true);
    try {
      const res = await fetch("/api/products/quick-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.product) {
        setProducts((prev) => prev.filter((p) => p.id !== tempId));
        setSelectedProductId((prev) => (prev === tempId ? "" : prev));
        setSubmitMessage(data.error || "Produkt konnte nicht angelegt werden.");
        return;
      }
      const created = data.product as {
        id: string;
        name: string;
        brand?: string | null;
        status?: string;
        adminProgress?: ProductStatusPayload["adminProgress"];
        paymentStatus?: ProductStatusPayload["paymentStatus"];
        createdAt?: string;
      };
      setProducts((prev) =>
        prev.map((p) =>
          p.id === tempId
            ? {
                ...p,
                id: created.id,
                name: created.name ?? p.name,
                brand: created.brand ?? p.brand ?? null,
                status: created.status ?? p.status,
                adminProgress: created.adminProgress ?? p.adminProgress,
                paymentStatus: created.paymentStatus ?? p.paymentStatus,
                createdAt: created.createdAt ?? p.createdAt,
              }
            : p
        )
      );
      setSelectedProductId(created.id);
      setSubmitMessage("Produkt angelegt.");
      setNewProduct({
        productName: "",
        brand: "",
        category: "",
        code: "",
        specs: "",
        size: "",
        madeIn: "",
        material: "",
      });
      setFieldErrors({});
      setShowSubmit(false);
      refresh().catch(() => {});
    } finally {
      setSubmitLoading(false);
    }
  }, [newProduct, refresh, setProducts, setSelectedProductId, validateNewProduct]);

  const handlePayOrder = useCallback(async (order: any) => {
    if (!order?.productId || !order?.plan) {
      alert("Produkt oder Plan fehlt.");
      return;
    }
    setOrderPayingId(order.id);
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: order.plan, productId: order.productId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        alert(data.error || "Zahlung konnte nicht gestartet werden.");
        return;
      }
      window.location.href = data.url as string;
    } catch {
      alert("Zahlung konnte nicht gestartet werden.");
    } finally {
      setOrderPayingId(null);
    }
  }, []);

  const handleReceipt = useCallback(async (order: any) => {
    setReceiptLoadingId(order.id);
    try {
      const res = await fetch("/api/orders/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.receiptUrl) {
        alert(data.error || "Beleg nicht verfügbar.");
        return;
      }
      window.open(data.receiptUrl as string, "_blank", "noopener,noreferrer");
    } catch {
      alert("Beleg konnte nicht geladen werden.");
    } finally {
      setReceiptLoadingId(null);
    }
  }, []);

  const handleBaseFeePay = useCallback(async (productId: string, option: string) => {
    setBaseFeePaying(productId);
    try {
      const res = await fetch("/api/precheck/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, option }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        alert(data.error || "Grundgebühr konnte nicht gestartet werden.");
        return;
      }
      if (data?.alreadyPaid) {
        alert("Grundgebühr bereits bezahlt.");
        return;
      }
      window.location.href = data.url as string;
    } catch {
      alert("Grundgebühr konnte nicht gestartet werden.");
    } finally {
      setBaseFeePaying(null);
    }
  }, []);

  const handleLicensePay = useCallback(async (productId: string, plan: string) => {
    if (!plan) {
      alert("Bitte Lizenzplan auswählen.");
      return;
    }
    setLicensePaying(productId);
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, productId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        alert(data.error || "Zahlung konnte nicht gestartet werden.");
        return;
      }
      window.location.href = data.url as string;
    } catch {
      alert("Zahlung konnte nicht gestartet werden.");
    } finally {
      setLicensePaying(null);
    }
  }, []);

  const ordersByProduct = useMemo(() => {
    const groups = new Map<
      string,
      { key: string; productName: string; orders: DashboardClientProps["user"]["orders"][number][] }
    >();
    for (const order of user.orders) {
      const key = order.product?.id || order.productId;
      const productName = order.product?.name || "Produkt";
      const existing = groups.get(key);
      if (existing) {
        existing.orders.push(order);
      } else {
        groups.set(key, { key, productName, orders: [order] });
      }
    }
    const list = Array.from(groups.values());
    for (const group of list) {
      group.orders.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    }
    list.sort((a, b) => {
      const bTime = b.orders[0]?.createdAt ? Date.parse(b.orders[0].createdAt) : 0;
      const aTime = a.orders[0]?.createdAt ? Date.parse(a.orders[0].createdAt) : 0;
      return bTime - aTime;
    });
    return list;
  }, [user.orders]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Dashboard</p>
            <h1 className="text-3xl font-bold text-slate-900">Willkommen, {firstName}</h1>
            <p className="text-sm text-slate-600">Status im Blick, Zertifikat sicher abrufen.</p>
          </div>
          <LogoutButton className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black" label="Logout" />
        </header>

        <PrecheckStatusCard state={statusState} />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Ihre Produkte</h2>
          {products.length === 0 && <p className="text-slate-600">Noch keine Produkte erfasst.</p>}
          <div className="grid gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Neues Produkt einreichen</div>
                  <div className="mt-1 text-xs text-slate-600">
                    Schnell anlegen (Produktname + Marke) und danach Testgebühr/Lizenz starten.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSubmit((s) => !s)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {showSubmit ? "Schließen" : "Öffnen"}
                </button>
              </div>

              {showSubmit ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Kategorie</label>
                    <select
                      className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                        fieldErrors.category ? "border-rose-300 bg-rose-50" : "border-slate-200"
                      }`}
                      value={newProduct.category}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewProduct((p) => ({ ...p, category: value }));
                        setFieldErrors((prev) => ({ ...prev, category: undefined }));
                      }}
                    >
                      <option value="">Nichts ausgewählt</option>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.category && <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.category}</p>}
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Produktname</label>
                    <input
                      className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                        fieldErrors.productName ? "border-rose-300 bg-rose-50" : "border-slate-200"
                      }`}
                      placeholder="Produktname"
                      value={newProduct.productName}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewProduct((p) => ({ ...p, productName: value }));
                        setFieldErrors((prev) => ({ ...prev, productName: undefined }));
                      }}
                      onBlur={() => setFieldErrors((prev) => ({ ...prev, ...validateNewProduct(newProduct) }))}
                    />
                    {fieldErrors.productName && <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.productName}</p>}
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Marke</label>
                    <input
                      className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                        fieldErrors.brand ? "border-rose-300 bg-rose-50" : "border-slate-200"
                      }`}
                      placeholder="Marke"
                      value={newProduct.brand}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewProduct((p) => ({ ...p, brand: value }));
                        setFieldErrors((prev) => ({ ...prev, brand: undefined }));
                      }}
                      onBlur={() => setFieldErrors((prev) => ({ ...prev, ...validateNewProduct(newProduct) }))}
                    />
                    {fieldErrors.brand && <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.brand}</p>}
                  </div>

                  <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Artikelnummer (optional)"
                      value={newProduct.code}
                      onChange={(e) => setNewProduct((p) => ({ ...p, code: e.target.value }))}
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Größe / Maße (optional)"
                      value={newProduct.size}
                      onChange={(e) => setNewProduct((p) => ({ ...p, size: e.target.value }))}
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2"
                      placeholder="Spezifikationen (optional)"
                      value={newProduct.specs}
                      onChange={(e) => setNewProduct((p) => ({ ...p, specs: e.target.value }))}
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Hergestellt in (optional)"
                      value={newProduct.madeIn}
                      onChange={(e) => setNewProduct((p) => ({ ...p, madeIn: e.target.value }))}
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2"
                      placeholder="Material (optional)"
                      value={newProduct.material}
                      onChange={(e) => setNewProduct((p) => ({ ...p, material: e.target.value }))}
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleQuickSubmit}
                      disabled={submitLoading}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
                    >
                      {submitLoading ? "Wird angelegt…" : "Produkt anlegen"}
                    </button>
                    {submitMessage && <span className="text-sm text-slate-600">{submitMessage}</span>}
                  </div>
                </div>
              ) : null}
            </div>

            {products.map((p: any) => {
              const isOptimistic = String(p.id).startsWith("tmp_");
              return (
              <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">{p.name}</div>
                    <div className="text-sm text-slate-500">{p.brand}</div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                    {isOptimistic ? "Wird angelegt…" : `Status: ${p.status}`}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {["PAID", "MANUAL"].includes(p.paymentStatus) ? (
                    <span className="text-xs font-semibold text-emerald-700">Grundgebühr bezahlt</span>
                  ) : (
                    <>
                      <select
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
                        value={baseFeeSelections[p.id] || "standard"}
                        onChange={(e) => setBaseFeeSelections((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        disabled={isOptimistic || baseFeePaying === p.id}
                      >
                        <option value="standard">Grundgebühr (Standard)</option>
                        <option value="priority">Priority</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleBaseFeePay(p.id, baseFeeSelections[p.id] || "standard")}
                        disabled={isOptimistic || baseFeePaying === p.id}
                        className={`rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition ${
                          isOptimistic || baseFeePaying === p.id
                            ? "bg-slate-300 text-slate-600"
                            : "bg-slate-900 text-white hover:bg-black"
                        }`}
                      >
                        {isOptimistic ? "Speichert…" : baseFeePaying === p.id ? "Starte Zahlung…" : "Grundgebühr zahlen"}
                      </button>
                    </>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <select
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
                    value={licenseSelections[p.id] || p.license?.plan || "BASIC"}
                    onChange={(e) => setLicenseSelections((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    disabled={
                      isOptimistic ||
                      licensePaying === p.id ||
                      p.license?.status === "ACTIVE" ||
                      !["PAID", "MANUAL"].includes(p.paymentStatus)
                    }
                  >
                    <option value="BASIC">Basic</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="LIFETIME">Lifetime</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleLicensePay(p.id, licenseSelections[p.id] || p.license?.plan || "BASIC")}
                    disabled={
                      isOptimistic ||
                      licensePaying === p.id ||
                      p.license?.status === "ACTIVE" ||
                      !["PAID", "MANUAL"].includes(p.paymentStatus)
                    }
                    className={`rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition ${
                      p.license?.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-700 cursor-not-allowed"
                      : ["PAID", "MANUAL"].includes(p.paymentStatus)
                        ? "bg-slate-900 text-white hover:bg-black"
                        : "bg-slate-200 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    {p.license?.status === "ACTIVE"
                      ? "Lizenz aktiv"
                      : licensePaying === p.id
                      ? "Starte Zahlung…"
                      : ["PAID", "MANUAL"].includes(p.paymentStatus)
                      ? p.license?.status === "EXPIRED"
                        ? "Lizenz verlängern"
                        : "Lizenzplan zahlen"
                      : "Grundgebühr zuerst zahlen"}
                  </button>
                  {p.license?.status === "ACTIVE" && (
                    <span className="text-xs font-semibold text-emerald-700">
                      Aktivierter Plan: {p.license?.plan || "—"}
                    </span>
                  )}
                  {p.license?.status === "EXPIRED" && (
                    <span className="text-xs font-semibold text-amber-600">Lizenz abgelaufen – bitte neu buchen.</span>
                  )}
                  {!["PAID", "MANUAL"].includes(p.paymentStatus) && (
                    <span className="text-xs text-amber-600">Bitte zuerst Grundgebühr bezahlen.</span>
                  )}
                </div>

                {p.certificate ? (
                  <div className="mt-3 flex flex-wrap gap-3">
                    <a
                      href={`/api/certificates/${p.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition ${
                        isOptimistic
                          ? "cursor-not-allowed bg-slate-200 text-slate-500"
                          : "bg-slate-900 text-white hover:bg-black"
                      }`}
                      onClick={(e) => {
                        if (isOptimistic) e.preventDefault();
                      }}
                    >
                      Zertifikat öffnen (PDF)
                    </a>
                    <a
                      href={p.certificate?.reportUrl || "#"}
                      target={p.certificate?.reportUrl && !isOptimistic ? "_blank" : undefined}
                      rel="noreferrer"
                      title={!p.certificate?.reportUrl ? "Noch nicht verfügbar." : undefined}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition ${
                        !p.certificate?.reportUrl || isOptimistic
                          ? "cursor-not-allowed bg-slate-200 text-slate-500"
                          : "bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
                      }`}
                      onClick={(e) => {
                        if (!p.certificate?.reportUrl || isOptimistic) e.preventDefault();
                      }}
                    >
                      Hochgeladener Prüfbericht
                    </a>
                    <a
                      href={p.certificate?.sealUrl || "#"}
                      target={p.certificate?.sealUrl && !isOptimistic ? "_blank" : undefined}
                      rel="noreferrer"
                      title={!p.certificate?.sealUrl ? "Noch nicht verfügbar." : undefined}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition ${
                        !p.certificate?.sealUrl || isOptimistic
                          ? "cursor-not-allowed bg-slate-200 text-slate-500"
                          : "bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
                      }`}
                      onClick={(e) => {
                        if (!p.certificate?.sealUrl || isOptimistic) e.preventDefault();
                      }}
                    >
                      Siegel
                    </a>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-amber-600">Prüfung wird vorbereitet. Wir melden uns per E-Mail.</p>
                )}
              </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Bestellungen</h2>
          {user.orders.length === 0 && <p className="text-slate-600">Keine Bestellungen vorhanden.</p>}
          <div className="grid gap-4">
            {ordersByProduct.map((group) => (
              <div key={group.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold text-slate-900">{group.productName}</div>
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {group.orders.length} Bestellung{group.orders.length === 1 ? "" : "en"}
                  </span>
                </div>
                <div className="mt-4 grid gap-3">
                  {group.orders.map((o) => (
                    <div key={o.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{o.plan}</div>
                          <div className="mt-1 text-xs text-slate-600">
                            {new Date(o.createdAt).toLocaleDateString("de-DE")}
                          </div>
                        </div>
                        <span className={`text-sm font-semibold ${o.paidAt ? "text-emerald-700" : "text-amber-700"}`}>
                          {o.paidAt ? "Bezahlt" : "Offen"}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-700">
                        <span>Preis: {(o.priceCents || 0) / 100} €</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleReceipt(o)}
                          disabled={!o.paidAt || receiptLoadingId === o.id}
                          className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                            o.paidAt && receiptLoadingId !== o.id
                              ? "bg-slate-900 text-white hover:bg-black"
                              : "bg-slate-200 text-slate-500 cursor-not-allowed"
                          }`}
                        >
                          {receiptLoadingId === o.id ? "Lade…" : "Beleg herunterladen"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePayOrder(o)}
                          disabled={!!o.paidAt || orderPayingId === o.id}
                          className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                            o.paidAt
                              ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                              : orderPayingId === o.id
                              ? "bg-emerald-200 text-emerald-900 cursor-not-allowed"
                              : "bg-emerald-600 text-white hover:bg-emerald-700"
                          }`}
                        >
                          {o.paidAt ? "Bereits bezahlt" : orderPayingId === o.id ? "Starte…" : "Jetzt zahlen"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
