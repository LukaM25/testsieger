"use client";

import { useEffect, useMemo, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import { usePrecheckStatusData, type ProductStatusPayload } from "@/hooks/usePrecheckStatusData";
import { PrecheckStatusCard } from "@/components/PrecheckStatusCard";
import { useProductStatusPoll } from "@/hooks/useProductStatusPoll";

interface DashboardClientProps {
  user: any;
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const initialStatusProducts = useMemo<ProductStatusPayload[]>(
    () =>
      (user.products || []).map(
        (p: any): ProductStatusPayload => ({
          id: p.id,
          name: p.name,
          paymentStatus: (p.paymentStatus ?? "UNPAID") as ProductStatusPayload["paymentStatus"],
          adminProgress: (p.adminProgress ?? "PRECHECK") as ProductStatusPayload["adminProgress"],
          status: p.status ?? "PRECHECK",
          createdAt: typeof p.createdAt === "string" ? p.createdAt : p.createdAt?.toISOString?.() ?? undefined,
          brand: p.brand ?? null,
          certificate: p.certificate ? { id: p.certificate.id, pdfUrl: p.certificate.pdfUrl ?? null } : null,
          license: p.license ? { status: p.license.status, plan: p.license.plan ?? null } : null,
        })
      ),
    [user.products]
  );

  const statusState = usePrecheckStatusData({ initialProducts: initialStatusProducts });
  const { products, selectedProductId, setProducts, setSelectedProductId } = statusState;

  const [isTabVisible, setIsTabVisible] = useState(true);
  useEffect(() => {
    const handleVisibility = () => {
      setIsTabVisible(document.visibilityState === "visible");
    };
    handleVisibility();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const pollingEnabled = Boolean(selectedProductId) && isTabVisible;
  const { data: polledStatus } = useProductStatusPoll(selectedProductId || null, {
    enabled: pollingEnabled,
    intervalMs: 20000,
  });

  useEffect(() => {
    if (!polledStatus || !selectedProductId) return;
    setProducts((prev) => {
      let changed = false;
      const next = prev.map((product) => {
        if (product.id !== selectedProductId) return product;
        const nextProduct = { ...product };
        if (polledStatus.productStatus && polledStatus.productStatus !== product.status) {
          nextProduct.status = polledStatus.productStatus;
          changed = true;
        }
        if (polledStatus.adminProgress && polledStatus.adminProgress !== product.adminProgress) {
          nextProduct.adminProgress = polledStatus.adminProgress as ProductStatusPayload["adminProgress"];
          changed = true;
        }
        const certId = polledStatus.certificateId ?? product.certificate?.id ?? null;
        const hasCertData = Boolean(
          certId ||
            polledStatus.certificateStatus ||
            polledStatus.pdfUrl ||
            polledStatus.reportUrl ||
            polledStatus.sealUrl
        );
        if (hasCertData) {
          const nextCertificate = {
            id: certId || product.certificate?.id || "",
            status: polledStatus.certificateStatus ?? product.certificate?.status ?? null,
            pdfUrl: polledStatus.pdfUrl ?? product.certificate?.pdfUrl ?? null,
            reportUrl: polledStatus.reportUrl ?? product.certificate?.reportUrl ?? null,
            sealUrl: polledStatus.sealUrl ?? product.certificate?.sealUrl ?? null,
          };
          const prevCertificate = product.certificate ?? null;
          if (
            !prevCertificate ||
            prevCertificate.id !== nextCertificate.id ||
            prevCertificate.status !== nextCertificate.status ||
            prevCertificate.pdfUrl !== nextCertificate.pdfUrl ||
            prevCertificate.reportUrl !== nextCertificate.reportUrl ||
            prevCertificate.sealUrl !== nextCertificate.sealUrl
          ) {
            nextProduct.certificate = nextCertificate;
            changed = true;
          }
        }
        return changed ? nextProduct : product;
      });
      return changed ? next : prev;
    });
  }, [polledStatus, selectedProductId, setProducts]);

  const [orders, setOrders] = useState(user.orders || []);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [licenseSelections, setLicenseSelections] = useState<Record<string, string>>({});
  const [licensePaying, setLicensePaying] = useState<string | null>(null);
  const [baseFeeSelections, setBaseFeeSelections] = useState<Record<string, string>>({});
  const [baseFeePaying, setBaseFeePaying] = useState<string | null>(null);
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

  const handleQuickSubmit = async () => {
    setSubmitMessage(null);
    if (!newProduct.productName || !newProduct.brand) {
      setSubmitMessage("Bitte Produktname und Marke ausfüllen.");
      return;
    }
    setSubmitLoading(true);
    try {
      const res = await fetch("/api/products/quick-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.product) {
        setSubmitMessage(data.error || "Produkt konnte nicht angelegt werden.");
        return;
      }
      const mapped: ProductStatusPayload = {
        id: data.product.id,
        name: data.product.name,
        brand: data.product.brand ?? null,
        paymentStatus: "UNPAID",
        adminProgress: "PRECHECK",
        status: "PRECHECK",
        certificate: null,
      };
      setProducts((prev) => [mapped, ...prev]);
      setSelectedProductId(data.product.id);
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
    } finally {
      setSubmitLoading(false);
    }
  };

  const handlePayOrder = async (order: any) => {
    if (!order?.productId || !order?.plan) {
      alert("Produkt oder Plan fehlt.");
      return;
    }
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
    }
  };

  const handleReceipt = async (order: any) => {
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
    }
  };

  const handleBaseFeePay = async (productId: string, option: string) => {
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
  };

  const handleLicensePay = async (productId: string, plan: string) => {
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
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Dashboard</p>
            <h1 className="text-3xl font-bold text-slate-900">Willkommen, {user.name.split(" ")[0]}</h1>
            <p className="text-sm text-slate-600">Status im Blick, Zertifikat sicher abrufen.</p>
          </div>
          <LogoutButton className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black" label="Logout" />
        </header>

        <PrecheckStatusCard state={statusState} />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Neues Produkt einreichen</h2>
            <button
              type="button"
              onClick={() => setShowSubmit((s) => !s)}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              {showSubmit ? "Eingabe schließen" : "Formular öffnen"}
            </button>
          </div>
          {showSubmit && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Produktname"
                value={newProduct.productName}
                onChange={(e) => setNewProduct((p) => ({ ...p, productName: e.target.value }))}
              />
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Marke"
                value={newProduct.brand}
                onChange={(e) => setNewProduct((p) => ({ ...p, brand: e.target.value }))}
              />
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Kategorie (optional)"
                value={newProduct.category}
                onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}
              />
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Artikelnummer (optional)"
                value={newProduct.code}
                onChange={(e) => setNewProduct((p) => ({ ...p, code: e.target.value }))}
              />
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2"
                placeholder="Spezifikationen (optional)"
                value={newProduct.specs}
                onChange={(e) => setNewProduct((p) => ({ ...p, specs: e.target.value }))}
              />
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Größe / Maße (optional)"
                value={newProduct.size}
                onChange={(e) => setNewProduct((p) => ({ ...p, size: e.target.value }))}
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
              <div className="md:col-span-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleQuickSubmit}
                  disabled={submitLoading}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
                >
                  {submitLoading ? "Wird gesendet…" : "Produkt einreichen"}
                </button>
                {submitMessage && <span className="text-sm text-slate-600">{submitMessage}</span>}
              </div>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Ihre Produkte</h2>
          {products.length === 0 && <p className="text-slate-600">Noch keine Produkte erfasst.</p>}
          <div className="grid gap-4">
            {products.map((p: any) => (
              <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">{p.name}</div>
                    <div className="text-sm text-slate-500">{p.brand}</div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                    Status: {p.status}
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
                        disabled={baseFeePaying === p.id}
                      >
                        <option value="standard">Grundgebühr (Standard)</option>
                        <option value="priority">Priority</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleBaseFeePay(p.id, baseFeeSelections[p.id] || "standard")}
                        disabled={baseFeePaying === p.id}
                        className={`rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition ${
                          baseFeePaying === p.id ? "bg-slate-300 text-slate-600" : "bg-slate-900 text-white hover:bg-black"
                        }`}
                      >
                        {baseFeePaying === p.id ? "Starte Zahlung…" : "Grundgebühr zahlen"}
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
                  <div className="mt-3">
                    <a
                      href={`/api/certificates/${p.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-black"
                    >
                      Zertifikat öffnen (PDF)
                    </a>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-amber-600">Prüfung wird vorbereitet. Wir melden uns per E-Mail.</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Bestellungen</h2>
          {orders.length === 0 && <p className="text-slate-600">Keine Bestellungen vorhanden.</p>}
          <div className="grid gap-4">
            {orders.map((o: any) => (
              <div key={o.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{o.plan}</div>
                    <div className="text-xs text-slate-500">{o.product?.name || "Produkt"}</div>
                  </div>
                  <span className={`text-sm font-semibold ${o.paidAt ? "text-emerald-600" : "text-amber-600"}`}>
                    {o.paidAt ? "Bezahlt" : "Offen"}
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-700 flex flex-wrap gap-3">
                  <span>Preis: {(o.priceCents || 0) / 100} €</span>
                  <span>{new Date(o.createdAt).toLocaleDateString("de-DE")}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleReceipt(o)}
                    disabled={!o.paidAt}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      o.paidAt ? "bg-slate-900 text-white hover:bg-black" : "bg-slate-200 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    Beleg herunterladen
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePayOrder(o)}
                    disabled={!!o.paidAt}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      o.paidAt ? "bg-slate-200 text-slate-500 cursor-not-allowed" : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    {o.paidAt ? "Bereits bezahlt" : "Jetzt zahlen"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
