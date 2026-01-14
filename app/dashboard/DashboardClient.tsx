"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import { usePrecheckStatusData, type ProductStatusPayload } from "@/hooks/usePrecheckStatusData";
import { PrecheckStatusCard } from "@/components/PrecheckStatusCard";
import { useProductStatusPoll } from "@/hooks/useProductStatusPoll";

interface DashboardClientProps {
  user: any;
}

const parseAddressParts = (raw: string) => {
  const cleaned = (raw || "").trim();
  if (!cleaned) {
    return { street: "", houseNumber: "", postalCode: "", city: "" };
  }
  const commaSplit = cleaned.split(",");
  const parts = commaSplit.length > 1 ? commaSplit : cleaned.split(/\r?\n/);
  const streetPart = (parts[0] || "").trim();
  const cityPart = (parts[1] || "").trim();

  let street = streetPart;
  let houseNumber = "";
  const streetMatch = streetPart.match(/^(.*?)(\s+\d+[a-zA-Z0-9/-]*)$/);
  if (streetMatch) {
    street = streetMatch[1].trim();
    houseNumber = streetMatch[2].trim();
  }

  let postalCode = "";
  let city = cityPart;
  const cityMatch = cityPart.match(/^(\d{4,6})\s+(.*)$/);
  if (cityMatch) {
    postalCode = cityMatch[1];
    city = cityMatch[2].trim();
  }

  if (!cityPart && !streetMatch) {
    return { street: streetPart, houseNumber: "", postalCode: "", city: "" };
  }

  return { street, houseNumber, postalCode, city };
};

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
  const { products, selectedProductId, setProducts, setSelectedProductId, productStatus } = statusState;
  const selectedProduct =
    productStatus || products.find((product) => product.id === selectedProductId) || null;
  const baseFeeOrdersByProductId = useMemo(() => {
    const orders = Array.isArray(user.orders) ? user.orders : [];
    const byProduct: Record<string, { id: string; paidAt?: string | null }> = {};
    orders.forEach((order: any) => {
      if (!order?.productId || !order?.paidAt) return;
      if (order.plan !== "PRECHECK_FEE" && order.plan !== "PRECHECK_PRIORITY") return;
      const existing = byProduct[order.productId];
      if (!existing || (existing.paidAt && new Date(order.paidAt) > new Date(existing.paidAt))) {
        byProduct[order.productId] = { id: order.id, paidAt: order.paidAt };
      }
    });
    return byProduct;
  }, [user.orders]);

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

  const [showSubmit, setShowSubmit] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [licenseSelections, setLicenseSelections] = useState<Record<string, string>>({});
  const [licensePaying, setLicensePaying] = useState<string | null>(null);
  const [baseFeeSelections, setBaseFeeSelections] = useState<Record<string, string>>({});
  const [baseFeePaying, setBaseFeePaying] = useState<string | null>(null);
  const [showBilling, setShowBilling] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [billingMounted, setBillingMounted] = useState(false);
  const [productsMounted, setProductsMounted] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);
  const initialAddress = useMemo(() => parseAddressParts(user.address || ""), [user.address]);
  const [accountEmail, setAccountEmail] = useState(user.email || "");
  const [accountStreet, setAccountStreet] = useState(initialAddress.street);
  const [accountHouseNumber, setAccountHouseNumber] = useState(initialAddress.houseNumber);
  const [accountPostalCode, setAccountPostalCode] = useState(initialAddress.postalCode);
  const [accountCity, setAccountCity] = useState(initialAddress.city);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountDeleting, setAccountDeleting] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
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
    const requiredFields = [
      { key: "productName", label: "Produktname", min: 2 },
      { key: "brand", label: "Marke", min: 1 },
      { key: "category", label: "Kategorie", min: 1 },
      { key: "code", label: "Artikelnummer", min: 2 },
      { key: "specs", label: "Spezifikationen", min: 5 },
      { key: "size", label: "Größe / Maße", min: 2 },
      { key: "madeIn", label: "Hergestellt in", min: 2 },
      { key: "material", label: "Material", min: 2 },
    ] as const;
    for (const field of requiredFields) {
      const value = (newProduct as Record<string, string>)[field.key] || "";
      if (value.trim().length < field.min) {
        setSubmitMessage(`Bitte ${field.label} ausfüllen.`);
        return;
      }
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

  const handleReceipt = async (orderId: string) => {
    try {
      const res = await fetch("/api/orders/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
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

  const getProgressLabel = (adminProgress?: string, status?: string, hasCertificate?: boolean) => {
    if (hasCertificate) return "Bestanden";
    switch (adminProgress) {
      case "PRECHECK":
        return "Pre-Check eingereicht";
      case "RECEIVED":
        return "Eingegangen";
      case "ANALYSIS":
        return "Analyse";
      case "PASS":
        return "Bestanden";
      case "COMPLETION":
        return "Abschluss";
      case "FAIL":
        return "Nicht bestanden";
      default:
        break;
    }
    switch (status) {
      case "PRECHECK":
        return "Pre-Check eingereicht";
      case "PAID":
        return "Gebühr bezahlt";
      case "IN_REVIEW":
        return "In Prüfung";
      case "COMPLETED":
        return "Abgeschlossen";
      default:
        return "Status folgt";
    }
  };

  const handleAccountSave = async () => {
    setAccountMessage(null);
    if (!accountEmail.trim()) {
      setAccountMessage("Bitte eine E-Mail-Adresse angeben.");
      return;
    }
    setAccountSaving(true);
    try {
      const wantsPasswordChange = Boolean(currentPassword || newPassword || confirmPassword);
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: accountEmail.trim().toLowerCase(),
          street: accountStreet.trim(),
          houseNumber: accountHouseNumber.trim(),
          postalCode: accountPostalCode.trim(),
          city: accountCity.trim(),
          currentPassword: wantsPasswordChange ? currentPassword : "",
          newPassword: wantsPasswordChange ? newPassword : "",
          confirmPassword: wantsPasswordChange ? confirmPassword : "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAccountMessage(data.error || "Änderungen konnten nicht gespeichert werden.");
        return;
      }
      if (wantsPasswordChange) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
      setAccountMessage("Account-Einstellungen gespeichert.");
    } catch {
      setAccountMessage("Änderungen konnten nicht gespeichert werden.");
    } finally {
      setAccountSaving(false);
    }
  };

  const handleAccountDelete = async () => {
    const confirmed = window.confirm(
      "Möchtest du dein Konto wirklich löschen? Der Zugriff wird deaktiviert."
    );
    if (!confirmed) return;
    setAccountMessage(null);
    setAccountDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAccountMessage(data.error || "Konto konnte nicht gelöscht werden.");
        return;
      }
      window.location.href = "/";
    } catch {
      setAccountMessage("Konto konnte nicht gelöscht werden.");
    } finally {
      setAccountDeleting(false);
    }
  };

  useEffect(() => {
    if (!showAccount) return;
    const handleOutside = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setShowAccount(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showAccount]);

  useEffect(() => {
    if (showBilling) {
      setBillingMounted(true);
      return;
    }
    if (!billingMounted) return;
    const timer = setTimeout(() => setBillingMounted(false), 250);
    return () => clearTimeout(timer);
  }, [showBilling, billingMounted]);

  useEffect(() => {
    if (showProducts) {
      setProductsMounted(true);
      return;
    }
    if (!productsMounted) return;
    const timer = setTimeout(() => setProductsMounted(false), 250);
    return () => clearTimeout(timer);
  }, [showProducts, productsMounted]);

  const paidOrders = useMemo(() => {
    const orders = Array.isArray(user.orders) ? user.orders : [];
    return orders.filter((order: any) => Boolean(order?.paidAt));
  }, [user.orders]);

  const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    const date = new Date(iso);
    return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const orderLabel = (order: any) => {
    const plan = order?.plan;
    if (plan === "PRECHECK_PRIORITY") return "Grundgebühr (Priority)";
    if (plan === "PRECHECK_FEE") return "Grundgebühr";
    if (plan === "BASIC") return "Lizenz Basic";
    if (plan === "PREMIUM") return "Lizenz Premium";
    if (plan === "LIFETIME") return "Lizenz Lifetime";
    return "Rechnung";
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
          <div className="relative flex items-center gap-3" ref={accountRef}>
            <button
              type="button"
              onClick={() => setShowAccount((open) => !open)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
              aria-expanded={showAccount}
            >
              Konto Einstellungen
            </button>
            <LogoutButton className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black" label="Logout" />
            {showAccount && (
              <div className="absolute right-0 top-full z-20 mt-3 w-[min(440px,90vw)] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Konto Einstellungen</h2>
                  <p className="text-xs text-slate-500">Adresse ändern, E-Mail bearbeiten oder Konto löschen.</p>
                </div>
                <div className="mt-4 grid gap-3">
                  <input
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="E-Mail-Adresse"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    type="email"
                  />
                  <div className="grid gap-3 sm:grid-cols-[1.4fr,0.6fr]">
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Straße"
                      value={accountStreet}
                      onChange={(e) => setAccountStreet(e.target.value)}
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Hausnr."
                      value={accountHouseNumber}
                      onChange={(e) => setAccountHouseNumber(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[0.7fr,1.3fr]">
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="PLZ"
                      value={accountPostalCode}
                      onChange={(e) => setAccountPostalCode(e.target.value)}
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Stadt"
                      value={accountCity}
                      onChange={(e) => setAccountCity(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-3">
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Aktuelles Passwort"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Neues Passwort"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Neues Passwort bestätigen"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                  {!accountStreet && !accountHouseNumber && !accountPostalCode && !accountCity && user.address && (
                    <p className="text-xs text-slate-500">Vorhandene Adresse: {user.address}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleAccountSave}
                      disabled={accountSaving}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
                    >
                      {accountSaving ? "Speichere…" : "Änderungen speichern"}
                    </button>
                    <button
                      type="button"
                      onClick={handleAccountDelete}
                      disabled={accountDeleting}
                      className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:border-rose-300 disabled:opacity-60"
                    >
                      {accountDeleting ? "Löscht…" : "Konto löschen"}
                    </button>
                    {accountMessage && <span className="text-xs text-slate-600">{accountMessage}</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        <PrecheckStatusCard state={statusState} />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Lizenzplan auswählen</h2>
            <p className="text-sm text-slate-500">Wähle einen Plan für das aktuell ausgewählte Produkt.</p>
          </div>
          {selectedProduct ? (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-base font-semibold text-slate-900">{selectedProduct.name}</div>
                  <div className="text-sm text-slate-500">{selectedProduct.brand || "—"}</div>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                  Status: {selectedProduct.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  value={licenseSelections[selectedProduct.id] || selectedProduct.license?.plan || "BASIC"}
                  onChange={(e) =>
                    setLicenseSelections((prev) => ({ ...prev, [selectedProduct.id]: e.target.value }))
                  }
                  disabled={
                    licensePaying === selectedProduct.id ||
                    selectedProduct.license?.status === "ACTIVE" ||
                    !["PAID", "MANUAL"].includes(selectedProduct.paymentStatus) ||
                    selectedProduct.adminProgress !== "PASS"
                  }
                >
                  <option value="BASIC">Basic</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="LIFETIME">Lifetime</option>
                </select>
                <button
                  type="button"
                  onClick={() =>
                    handleLicensePay(
                      selectedProduct.id,
                      licenseSelections[selectedProduct.id] || selectedProduct.license?.plan || "BASIC"
                    )
                  }
                  disabled={
                    licensePaying === selectedProduct.id ||
                    selectedProduct.license?.status === "ACTIVE" ||
                    !["PAID", "MANUAL"].includes(selectedProduct.paymentStatus) ||
                    selectedProduct.adminProgress !== "PASS"
                  }
                  className={`rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition ${
                    selectedProduct.license?.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-700 cursor-not-allowed"
                      : ["PAID", "MANUAL"].includes(selectedProduct.paymentStatus) &&
                        selectedProduct.adminProgress === "PASS"
                      ? "bg-slate-900 text-white hover:bg-black"
                      : "bg-slate-200 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {selectedProduct.license?.status === "ACTIVE"
                    ? "Lizenz aktiv"
                    : licensePaying === selectedProduct.id
                    ? "Starte Zahlung…"
                    : !["PAID", "MANUAL"].includes(selectedProduct.paymentStatus)
                    ? "Grundgebühr zuerst zahlen"
                    : selectedProduct.adminProgress !== "PASS"
                    ? "Bestanden erforderlich"
                    : selectedProduct.license?.status === "EXPIRED"
                    ? "Lizenz verlängern"
                    : "Lizenzplan zahlen"}
                </button>
                {selectedProduct.license?.status === "ACTIVE" && (
                  <span className="text-xs font-semibold text-emerald-700">
                    Aktivierter Plan: {selectedProduct.license?.plan || "—"}
                  </span>
                )}
                {selectedProduct.license?.status === "EXPIRED" && (
                  <span className="text-xs font-semibold text-amber-600">
                    Lizenz abgelaufen – bitte neu buchen.
                  </span>
                )}
                {!["PAID", "MANUAL"].includes(selectedProduct.paymentStatus) && (
                  <span className="text-xs text-amber-600">Bitte zuerst Grundgebühr bezahlen.</span>
                )}
                {["PAID", "MANUAL"].includes(selectedProduct.paymentStatus) &&
                  selectedProduct.adminProgress !== "PASS" && (
                    <span className="text-xs text-amber-600">Prüfergebnis ausstehend.</span>
                  )}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">Bitte ein Produkt auswählen, um einen Lizenzplan zu wählen.</p>
          )}
        </section>

        <section id="billing-licenses" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <button
            type="button"
            onClick={() => setShowBilling((open) => !open)}
            className="flex w-full items-center justify-between gap-3 text-left"
            aria-expanded={showBilling}
          >
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Abrechnung & Lizenzen</h2>
              <p className="text-sm text-slate-500">Rechnungen und Lizenzstatus im Überblick.</p>
            </div>
            <span className={`text-slate-400 transition ${showBilling ? "rotate-180" : ""}`}>▾</span>
          </button>
          {billingMounted && (
            <div
              className={`mt-4 overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
                showBilling ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="text-sm font-semibold text-slate-800">Rechnungen</div>
              <div className="mt-3 space-y-2">
                {paidOrders.length === 0 && <p className="text-sm text-slate-500">Noch keine Rechnungen.</p>}
                {paidOrders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 shadow-sm">
                    <div className="text-xs text-slate-600">
                      <div className="font-semibold text-slate-800">{orderLabel(order)}</div>
                      <div>{order.product?.name || "Produkt"} · {formatDate(order.paidAt)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleReceipt(order.id)}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-black"
                    >
                      Rechnung PDF
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="text-sm font-semibold text-slate-800">Lizenzen</div>
              <div className="mt-3 space-y-2">
                {products.filter((p: any) => p.license?.status).length === 0 && (
                  <p className="text-sm text-slate-500">Noch keine Lizenzen aktiv.</p>
                )}
                {products.map((p: any) => {
                  const status = p.license?.status;
                  if (!status) return null;
                  return (
                    <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold shadow-sm">
                      <span className="text-slate-700">{p.name}</span>
                      {status === "ACTIVE" ? (
                        <a
                          href={`/kontakt?topic=lizenz-kuendigen&productId=${encodeURIComponent(p.id)}`}
                          className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-800"
                        >
                          Lizenz kündigen
                        </a>
                      ) : status === "EXPIRED" ? (
                        <span className="text-amber-600">Lizenz abgelaufen</span>
                      ) : (
                        <span className="text-slate-500">Status: {status}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
            </div>
          )}
        </section>

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
                placeholder="Kategorie"
                value={newProduct.category}
                onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}
              />
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Artikelnummer"
                value={newProduct.code}
                onChange={(e) => setNewProduct((p) => ({ ...p, code: e.target.value }))}
              />
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2"
                placeholder="Spezifikationen"
                value={newProduct.specs}
                onChange={(e) => setNewProduct((p) => ({ ...p, specs: e.target.value }))}
              />
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Größe / Maße"
                value={newProduct.size}
                onChange={(e) => setNewProduct((p) => ({ ...p, size: e.target.value }))}
              />
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Hergestellt in"
                value={newProduct.madeIn}
                onChange={(e) => setNewProduct((p) => ({ ...p, madeIn: e.target.value }))}
              />
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2"
                placeholder="Material"
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

        <section className="space-y-3" id="products-section">
          <button
            type="button"
            onClick={() => setShowProducts((open) => !open)}
            className="flex w-full items-center justify-between gap-3 text-left"
            aria-expanded={showProducts}
          >
            <h2 className="text-lg font-semibold text-slate-900">Ihre Produkte</h2>
            <span className={`text-slate-400 transition ${showProducts ? "rotate-180" : ""}`}>▾</span>
          </button>
          {productsMounted && (
            <div
              className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
                showProducts ? "max-h-[2200px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              {products.length === 0 && <p className="text-slate-600">Noch keine Produkte erfasst.</p>}
              <div className="grid gap-4">
                {products.map((p: any) => {
                  const baseFeePaid = ["PAID", "MANUAL"].includes(p.paymentStatus);
                  const hasPassed = p.adminProgress === "PASS";
                  const licenseActive = p.license?.status === "ACTIVE";
                  const hasCertificate = Boolean(p.certificate?.pdfUrl || p.certificate?.id);
                  const progressLabel = getProgressLabel(p.adminProgress, p.status, hasCertificate);
                  const showPassed = progressLabel === "Bestanden";
                  return (
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
                  {baseFeePaid ? (
                    <>
                      <span className="text-xs font-semibold text-emerald-700">Grundgebühr bezahlt</span>
                      <button
                        type="button"
                        onClick={() => {
                          const order = baseFeeOrdersByProductId[p.id];
                          if (order?.id) handleReceipt(order.id);
                        }}
                        disabled={!baseFeeOrdersByProductId[p.id]?.id}
                        className={`rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition ${
                          baseFeeOrdersByProductId[p.id]?.id
                            ? "bg-slate-900 text-white hover:bg-black"
                            : "bg-slate-200 text-slate-500 cursor-not-allowed"
                        }`}
                      >
                        Rechnung Grundgebühr
                      </button>
                    </>
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
                      licensePaying === p.id || licenseActive || !baseFeePaid || !hasPassed
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
                      licensePaying === p.id || licenseActive || !baseFeePaid || !hasPassed
                    }
                    className={`rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition ${
                      licenseActive
                        ? "bg-emerald-100 text-emerald-700 cursor-not-allowed"
                        : baseFeePaid && hasPassed
                        ? "bg-slate-900 text-white hover:bg-black"
                        : "bg-slate-200 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    {licenseActive
                      ? "Lizenz aktiv"
                      : licensePaying === p.id
                      ? "Starte Zahlung…"
                      : !baseFeePaid
                      ? "Grundgebühr zuerst zahlen"
                      : !hasPassed
                      ? "Bestanden erforderlich"
                      : baseFeePaid
                      ? p.license?.status === "EXPIRED"
                        ? "Lizenz verlängern"
                        : "Lizenzplan zahlen"
                      : "Lizenzplan zahlen"}
                  </button>
                  {p.license?.status === "ACTIVE" && (
                    <span className="text-xs font-semibold text-emerald-700">
                      Aktivierter Plan: {p.license?.plan || "—"}
                    </span>
                  )}
                  {p.license?.status === "EXPIRED" && (
                    <span className="text-xs font-semibold text-amber-600">Lizenz abgelaufen – bitte neu buchen.</span>
                  )}
                  {!baseFeePaid && (
                    <span className="text-xs text-amber-600">Bitte zuerst Grundgebühr bezahlen.</span>
                  )}
                  {baseFeePaid && !hasPassed && (
                    <span className="text-xs text-amber-600">Prüfergebnis ausstehend.</span>
                  )}
                </div>

                <div className="mt-3 space-y-2">
                  {p.certificate ? (
                    <a
                      href={`/api/certificates/${p.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-black"
                    >
                      Zertifikat öffnen (PDF)
                    </a>
                  ) : (
                    <p className="text-sm text-amber-600">
                      Prüfungsverlauf: {progressLabel}
                      {showPassed && (
                        <svg
                          className="ml-2 inline-block h-4 w-4 text-emerald-600"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 5.29a1 1 0 01.006 1.414l-7.5 7.57a1 1 0 01-1.42 0L3.29 9.77a1 1 0 011.42-1.41l3.08 3.11 6.79-6.86a1 1 0 011.414-.01z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </p>
                  )}
                  <div className="flex justify-center">
                    <span className="rounded-lg bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                      Prüfungsverlauf: {progressLabel}
                      {showPassed && (
                        <svg
                          className="ml-1 inline-block h-3.5 w-3.5 text-emerald-600"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 5.29a1 1 0 01.006 1.414l-7.5 7.57a1 1 0 01-1.42 0L3.29 9.77a1 1 0 011.42-1.41l3.08 3.11 6.79-6.86a1 1 0 011.414-.01z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </span>
                  </div>
                </div>
              </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
