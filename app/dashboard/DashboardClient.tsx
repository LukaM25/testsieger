"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { usePrecheckStatusData, type ProductStatusPayload } from "@/hooks/usePrecheckStatusData";
import { PrecheckStatusCard } from "@/components/PrecheckStatusCard";
import { useProductStatusPoll } from "@/hooks/useProductStatusPoll";

interface DashboardClientProps {
  user: any;
}

type LicenseCartItem = {
  id: string;
  productId: string;
  productName: string;
  productBrand?: string | null;
  plan: string;
  basePriceCents: number;
  discountPercent: number;
  finalPriceCents: number;
  savingsCents: number;
  eligible: boolean;
  reason?: string;
};

type LicenseCartState = {
  cartId: string | null;
  items: LicenseCartItem[];
  totals: { baseCents: number; savingsCents: number; totalCents: number; itemCount: number };
};

const PLAN_COMPARISON = [
  {
    name: "Basic",
    theme: "sky",
    usage: ["1 Verkaufskanal", "Sprache: Deutsch"],
    contents: ["Siegel", "Zertifikat", "Prüfbericht"],
    basePriceEur: 0.99,
    billing: "daily",
    footer: ["Abrechnung 365 Tage / Jahr", "Lizenzverlängerung jährlich."],
  },
  {
    name: "Premium",
    theme: "indigo",
    usage: ["Alle Verkaufskanäle", "Alle Sprachen"],
    contents: ["Siegel", "Zertifikat", "Prüfbericht"],
    basePriceEur: 1.09,
    billing: "daily",
    footer: ["Abrechnung 365 Tage / Jahr", "Lizenzverlängerung jährlich."],
  },
  {
    name: "Lifetime",
    theme: "midnight",
    usage: ["Alle Verkaufskanäle", "Alle Sprachen"],
    contents: ["Siegel", "Zertifikat", "Prüfbericht"],
    basePriceEur: 1460,
    billing: "one-time",
    footer: ["Abrechnung einmalig", "Lizenzverlängerung jährlich."],
  },
] as const;

const PLAN_COMPARE_THEMES = {
  sky: {
    card: "bg-gradient-to-b from-sky-300 via-sky-200 to-sky-50",
    border: "border-sky-200/70",
    label: "text-slate-900",
    body: "text-slate-800",
    muted: "text-slate-700/80",
  },
  indigo: {
    card: "bg-gradient-to-b from-indigo-500 via-indigo-700 to-slate-950",
    border: "border-indigo-400/30",
    label: "text-white",
    body: "text-white/90",
    muted: "text-white/70",
  },
  midnight: {
    card: "bg-gradient-to-b from-blue-950 via-slate-950 to-black",
    border: "border-blue-500/20",
    label: "text-white",
    body: "text-white/90",
    muted: "text-white/70",
  },
} as const;

function PlanComparePopover({ className = "" }: { className?: string }) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const isOpen = hovered || pinned;
  const hoverTimeoutRef = useRef<number | null>(null);
  const formatEur = (amount: number) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amount);
  const roundEur = (n: number) => Math.round(n * 100) / 100;

  const clearHoverTimeout = () => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleHoverOpen = () => {
    clearHoverTimeout();
    setHovered(true);
  };

  const handleHoverClose = () => {
    clearHoverTimeout();
    if (!pinned) {
      hoverTimeoutRef.current = window.setTimeout(() => setHovered(false), 120);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setPinned(false);
      setHovered(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  useEffect(() => {
    return () => clearHoverTimeout();
  }, []);

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={handleHoverOpen}
      onMouseLeave={handleHoverClose}
    >
      <button
        type="button"
        onClick={() => {
          setPinned((prev) => {
            const next = !prev;
            if (!next) setHovered(false);
            return next;
          });
        }}
        onFocus={handleHoverOpen}
        onBlur={handleHoverClose}
        aria-expanded={isOpen}
        className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-300"
      >
        PLANVERGLEICH
      </button>
      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center"
              onClick={() => {
                setPinned(false);
                setHovered(false);
              }}
              onMouseEnter={handleHoverOpen}
              onMouseLeave={handleHoverClose}
            >
              <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" />
              <div
                className="relative z-10 aspect-video w-[min(880px,86vw)] max-h-[80vh]"
                onClick={(event) => event.stopPropagation()}
                onMouseEnter={handleHoverOpen}
                onMouseLeave={handleHoverClose}
              >
                <div className="flex h-full flex-col rounded-3xl bg-white p-6 shadow-2xl">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                        PLANVERGLEICH
                      </div>
                      <div className="text-xl font-semibold text-slate-900">Lizenzpläne im Überblick</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPinned(false);
                        setHovered(false);
                      }}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300"
                    >
                      Schließen
                    </button>
                  </div>

                  <div className="mt-5 grid flex-1 items-stretch gap-6 overflow-y-auto md:grid-cols-3">
                    {PLAN_COMPARISON.map((plan) => {
                      const theme = PLAN_COMPARE_THEMES[plan.theme];
                      const priceSuffix = plan.billing === "daily" ? " / Tag" : "";
                      const priceRows =
                        plan.billing === "daily"
                          ? [
                              { label: "1 Prod.", price: `${formatEur(roundEur(plan.basePriceEur))}${priceSuffix}` },
                              { label: "2 Prod. -20%", price: `${formatEur(roundEur(plan.basePriceEur * 0.8))}${priceSuffix}` },
                              { label: "3 Prod. -30%", price: `${formatEur(roundEur(plan.basePriceEur * 0.7))}${priceSuffix}` },
                            ]
                          : [
                              { label: "1 Prod.", price: `${formatEur(roundEur(plan.basePriceEur))}` },
                              { label: "2 Prod. -20%", price: `${formatEur(roundEur(plan.basePriceEur * 2 * 0.8))}` },
                              { label: "3 Prod. -30%", price: `${formatEur(roundEur(plan.basePriceEur * 3 * 0.7))}` },
                            ];
                      return (
                        <div key={plan.name} className="flex h-full flex-col items-center gap-4">
                          <div className="text-lg font-semibold text-slate-900">{plan.name}</div>
                          <div
                            className={`flex h-full w-full flex-col justify-between rounded-[28px] border ${theme.border} ${theme.card} p-6 text-center font-semibold shadow-[0_28px_60px_-40px_rgba(15,23,42,0.65)]`}
                          >
                            <div className="space-y-6">
                              <div className="space-y-2">
                                <div className={`text-[15.4px] font-semibold ${theme.label}`}>Nutzung:</div>
                                <div className={`space-y-1 text-[15.4px] ${theme.body}`}>
                                  {plan.usage.map((line) => (
                                    <div key={line}>{line}</div>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className={`text-[15.4px] font-semibold ${theme.label}`}>Inhalt:</div>
                                <div className={`space-y-1 text-[15.4px] ${theme.body}`}>
                                  {plan.contents.map((line) => (
                                    <div key={line}>- {line}</div>
                                  ))}
                                </div>
                              </div>
                              <div className={`space-y-1 text-[15.4px] ${theme.body} w-full max-w-[240px] mx-auto`}>
                                {priceRows.map((row) => (
                                  <div key={row.label} className="flex items-center justify-between gap-4 tabular-nums">
                                    <span className="text-left">{row.label}</span>
                                    <span className="text-right">{row.price}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className={`mt-6 space-y-1 text-[12.1px] leading-relaxed ${theme.muted}`}>
                              {plan.footer.map((line) => (
                                <div key={line}>{line}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
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
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const { products, selectedProductId, setProducts, setSelectedProductId, refresh: refreshStatus } = statusState;
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) || null,
    [products, selectedProductId]
  );
  const baseFeePlanByProductId = useMemo(() => {
    const orders = Array.isArray(user.orders) ? user.orders : [];
    const byProduct: Record<string, { plan: string; paidAt?: string | null }> = {};
    orders.forEach((order: any) => {
      if (!order?.productId || !order?.paidAt) return;
      if (order.plan !== "PRECHECK_FEE" && order.plan !== "PRECHECK_PRIORITY") return;
      const existing = byProduct[order.productId];
      if (!existing || (existing.paidAt && new Date(order.paidAt) > new Date(existing.paidAt))) {
        byProduct[order.productId] = { plan: order.plan, paidAt: order.paidAt };
      }
    });
    return byProduct;
  }, [user.orders]);

  const [showLicenseSuccess, setShowLicenseSuccess] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);
  useEffect(() => {
    const handleVisibility = () => {
      setIsTabVisible(document.visibilityState === "visible");
    };
    handleVisibility();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    if (!isTabVisible) return;
    refreshStatus();
    const interval = window.setInterval(() => {
      refreshStatus();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [isTabVisible, refreshStatus]);

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

  const [licenseSelections, setLicenseSelections] = useState<Record<string, string>>({});
  const [licenseCart, setLicenseCart] = useState<LicenseCartState>({
    cartId: null,
    items: [],
    totals: { baseCents: 0, savingsCents: 0, totalCents: 0, itemCount: 0 },
  });
  const [cartLoading, setCartLoading] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [cartBusyId, setCartBusyId] = useState<string | null>(null);
  const [cartCheckoutBusy, setCartCheckoutBusy] = useState(false);
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

  const loadLicenseCart = async (): Promise<LicenseCartState | null> => {
    setCartLoading(true);
    setCartMessage(null);
    try {
      const res = await fetch("/api/license-cart", { cache: "no-store" });
      if (!res.ok) {
        setCartMessage(res.status === 401 ? "Bitte einloggen, um den Warenkorb zu sehen." : "Warenkorb konnte nicht geladen werden.");
        return null;
      }
      const data = await res.json();
      const nextCart: LicenseCartState = {
        cartId: data.cartId || null,
        items: Array.isArray(data.items) ? data.items : [],
        totals: data.totals || { baseCents: 0, savingsCents: 0, totalCents: 0, itemCount: 0 },
      };
      setLicenseCart(nextCart);
      return nextCart;
    } catch {
      setCartMessage("Warenkorb konnte nicht geladen werden.");
      return null;
    } finally {
      setCartLoading(false);
    }
  };

  const findNextLicenseProductId = (currentId: string, cartItems: LicenseCartItem[]) => {
    if (products.length === 0) return "";
    const cartProductIds = new Set(cartItems.map((item) => item.productId));
    const isEligible = (product: ProductStatusPayload) => {
      const baseFeePaid = ["PAID", "MANUAL"].includes(product.paymentStatus);
      const hasPassed = product.adminProgress === "PASS" || Boolean(product.certificate?.id);
      const licenseActive = product.license?.status === "ACTIVE";
      return baseFeePaid && hasPassed && !licenseActive && !cartProductIds.has(product.id);
    };
    const currentIndex = products.findIndex((product) => product.id === currentId);
    const startIndex = currentIndex >= 0 ? currentIndex : -1;
    for (let offset = 1; offset <= products.length; offset += 1) {
      const index = (startIndex + offset) % products.length;
      const candidate = products[index];
      if (candidate && isEligible(candidate)) return candidate.id;
    }
    return "";
  };

  const handleCartAdd = async (productId: string, plan: string) => {
    if (!plan) {
      setCartMessage("Bitte Lizenzplan auswählen.");
      return;
    }
    setCartBusyId(productId);
    setCartMessage(null);
    try {
      const res = await fetch("/api/license-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, plan }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCartMessage(
          data.error === "BASE_FEE_REQUIRED"
            ? "Bitte zuerst die Grundgebühr bezahlen."
            : data.error === "NOT_PASSED"
            ? "Produkt muss bestanden sein."
            : data.error === "LICENSE_ACTIVE"
            ? "Lizenz bereits aktiv."
            : "Produkt konnte nicht hinzugefügt werden."
        );
        return;
      }
      const updatedCart = await loadLicenseCart();
      if (updatedCart && productId === selectedProductId) {
        const nextId = findNextLicenseProductId(productId, updatedCart.items);
        if (nextId && nextId !== productId) {
          setSelectedProductId(nextId);
        }
      }
    } catch {
      setCartMessage("Produkt konnte nicht hinzugefügt werden.");
    } finally {
      setCartBusyId(null);
    }
  };

  const handleCartRemove = async (productId: string) => {
    setCartBusyId(productId);
    setCartMessage(null);
    try {
      const res = await fetch("/api/license-cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) {
        setCartMessage("Produkt konnte nicht entfernt werden.");
        return;
      }
      await loadLicenseCart();
    } catch {
      setCartMessage("Produkt konnte nicht entfernt werden.");
    } finally {
      setCartBusyId(null);
    }
  };

  const handleCartCheckout = async () => {
    setCartCheckoutBusy(true);
    setCartMessage(null);
    try {
      const res = await fetch("/api/license-cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        setCartMessage(data.error || "Checkout konnte nicht gestartet werden.");
        return;
      }
      window.location.href = data.url as string;
    } catch {
      setCartMessage("Checkout konnte nicht gestartet werden.");
    } finally {
      setCartCheckoutBusy(false);
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

  useEffect(() => {
    const checkoutStatus = searchParams.get("licenseCheckout");
    if (checkoutStatus !== "success") return;
    setShowLicenseSuccess(true);
    refreshStatus();
    loadLicenseCart();
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.delete("licenseCheckout");
    const nextSearch = url.searchParams.toString();
    router.replace(nextSearch ? `${url.pathname}?${nextSearch}` : url.pathname, { scroll: false });
  }, [searchParams, router, refreshStatus]);

  useEffect(() => {
    if (!showLicenseSuccess) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowLicenseSuccess(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [showLicenseSuccess]);

  useEffect(() => {
    loadLicenseCart();
  }, []);

  const paidOrders = useMemo(() => {
    const orders = Array.isArray(user.orders) ? user.orders : [];
    return orders.filter((order: any) => Boolean(order?.paidAt));
  }, [user.orders]);

  const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    const date = new Date(iso);
    return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatEur = (cents: number) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
  const formatPlanEur = (amount: number) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amount);
  const VAT_RATE = 0.19;
  const formatNetEur = (grossCents: number) =>
    formatEur(Math.round(grossCents / (1 + VAT_RATE)));

  const cartItemsByProductId = useMemo(() => {
    const map = new Map<string, LicenseCartItem>();
    licenseCart.items.forEach((item) => {
      map.set(item.productId, item);
    });
    return map;
  }, [licenseCart.items]);

  const cartPlanByProductId = useMemo(() => {
    const map: Record<string, string> = {};
    licenseCart.items.forEach((item) => {
      map[item.productId] = item.plan;
    });
    return map;
  }, [licenseCart.items]);

  const orderLabel = (order: any) => {
    const plan = order?.plan;
    if (plan === "PRECHECK_PRIORITY") return "Grundgebühr (Priority)";
    if (plan === "PRECHECK_FEE") return "Grundgebühr";
    if (plan === "BASIC") return "Lizenz Basic";
    if (plan === "PREMIUM") return "Lizenz Premium";
    if (plan === "LIFETIME") return "Lizenz Lifetime";
    return "Rechnung";
  };

  const planLabel = (plan?: string | null) => {
    if (!plan) return "—";
    if (plan === "BASIC") return "Basic";
    if (plan === "PREMIUM") return "Premium";
    if (plan === "LIFETIME") return "Lifetime";
    return plan;
  };

  const cartHasItems = licenseCart.items.length > 0;
  const cartHasEligibleItems = licenseCart.totals.itemCount > 0;
  const cartHasIneligibleItems = licenseCart.items.some((item) => !item.eligible);
  const cartEligibleCount = licenseCart.items.filter((item) => item.eligible).length;
  const cartIneligibleCount = Math.max(0, licenseCart.items.length - cartEligibleCount);
  const cartNetTotalCents = Math.round(licenseCart.totals.totalCents / (1 + VAT_RATE));
  const cartVatCents = Math.max(0, licenseCart.totals.totalCents - cartNetTotalCents);
  const cartReasonLabel = (reason?: string) => {
    if (reason === "GRUNDGEBUEHR_OFFEN") return "Grundgebühr offen";
    if (reason === "PRUEFUNG_OFFEN") return "Prüfung noch offen";
    if (reason === "LIZENZ_AKTIV") return "Lizenz bereits aktiv";
    return "Nicht verfügbar";
  };

  const handlePlanSelect = (productId: string, plan: string, notify = false) => {
    setLicenseSelections((prev) => ({ ...prev, [productId]: plan }));
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const baseFeePaid = ["PAID", "MANUAL"].includes(product.paymentStatus);
    const hasPassed = product.adminProgress === "PASS" || Boolean(product.certificate?.id);
    const licenseActive = product.license?.status === "ACTIVE";
    if (licenseActive || !baseFeePaid || !hasPassed) {
      if (notify) {
        setCartMessage(
          licenseActive
            ? "Lizenz bereits aktiv."
            : !baseFeePaid
            ? "Bitte zuerst die Grundgebühr bezahlen."
            : "Produkt muss bestanden sein."
        );
      }
      return;
    }
    const cartItem = cartItemsByProductId.get(productId);
    if (cartItem?.plan === plan) return;
    handleCartAdd(productId, plan);
  };

  const selectedProductBaseFeePaid = selectedProduct ? ["PAID", "MANUAL"].includes(selectedProduct.paymentStatus) : false;
  const selectedProductHasPassed = selectedProduct
    ? selectedProduct.adminProgress === "PASS" || Boolean(selectedProduct.certificate?.id)
    : false;
  const selectedProductLicenseActive = selectedProduct?.license?.status === "ACTIVE";
  const selectedCartPlan = selectedProduct ? cartPlanByProductId[selectedProduct.id] : null;
  const selectedPlanKey = selectedProduct
    ? licenseSelections[selectedProduct.id] || selectedCartPlan || selectedProduct.license?.plan || ""
    : "";
  const planHint = !selectedProduct
    ? "Bitte zuerst ein Produkt auswählen."
    : selectedProductLicenseActive
    ? "Lizenz bereits aktiv."
    : !selectedProductBaseFeePaid
    ? "Grundgebühr noch offen."
    : !selectedProductHasPassed
    ? "Prüfung noch offen."
    : null;
  const hasOpenLicensePayments = products.some((product) => {
    const baseFeePaid = ["PAID", "MANUAL"].includes(product.paymentStatus);
    const hasPassed = product.adminProgress === "PASS" || Boolean(product.certificate?.id);
    const licenseActive = product.license?.status === "ACTIVE";
    return baseFeePaid && hasPassed && !licenseActive;
  });

  const certificationsPanel = (
    <section
      id="certifications-section"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <button
        type="button"
        onClick={() => setShowProducts((open) => !open)}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={showProducts}
      >
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Meine Zertifizierungen</h2>
          <p className="text-sm text-slate-500">Produkte und Lizenzen kompakt im Überblick.</p>
        </div>
        <span className={`text-slate-400 transition ${showProducts ? "rotate-180" : ""}`}>▾</span>
      </button>
      {productsMounted && (
        <div
          className={`mt-4 overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
            showProducts ? "max-h-[2400px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {products.length === 0 ? (
            <p className="text-slate-600">Noch keine Zertifizierungen vorhanden.</p>
          ) : (
            <div className="grid gap-3">
              {products.map((p) => {
                const baseFeePaid = ["PAID", "MANUAL"].includes(p.paymentStatus);
                const licenseStatus = p.license?.status ?? null;
                const licensePlan = p.license?.plan ?? null;
                const licenseLabelText = licensePlan ? planLabel(licensePlan) : "Keine Lizenz";
                const hasCertificate = Boolean(p.certificate?.pdfUrl || p.certificate?.id);
                const hasPassed = p.adminProgress === "PASS" || hasCertificate;
                const progressLabel = getProgressLabel(p.adminProgress, p.status, hasCertificate);
                const showPassed = progressLabel === "Bestanden";
                const baseFeePlan = baseFeePlanByProductId[p.id]?.plan ?? null;
                const baseFeeIsPriority = baseFeePlan === "PRECHECK_PRIORITY";
                const baseFeeStatus = baseFeePaid ? (baseFeeIsPriority ? "PRIORITY" : "NORMAL") : "OFFEN";
                const baseFeeTone = baseFeePaid
                  ? baseFeeIsPriority
                    ? "bg-amber-50 text-amber-700 ring-amber-200"
                    : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-amber-50 text-amber-700 ring-amber-200";
                const baseFeeLabel =
                  baseFeeStatus === "PRIORITY" ? "Priority" : baseFeeStatus === "NORMAL" ? "Normal" : "Offen";
                return (
                  <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-base font-semibold text-slate-900">{p.name}</div>
                        <div className="text-sm text-slate-500">{p.brand || "—"}</div>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                        Status: {progressLabel}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-slate-50 px-3 py-1 font-semibold text-slate-700 ring-1 ring-slate-200">
                        Lizenz: {licenseLabelText}
                      </span>
                      {licenseStatus === "ACTIVE" && (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          Lizenz aktiv
                        </span>
                      )}
                      {licenseStatus === "EXPIRED" && (
                        <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700 ring-1 ring-amber-200">
                          Lizenz abgelaufen
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold ring-1 ${baseFeeTone}`}
                      >
                        Grundgebühr:
                        {baseFeeStatus === "NORMAL" && (
                          <svg aria-hidden="true" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M16.704 5.29a1 1 0 01.006 1.414l-7.5 7.57a1 1 0 01-1.42 0L3.29 9.77a1 1 0 011.42-1.41l3.08 3.11 6.79-6.86a1 1 0 011.414-.01z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                        {baseFeeStatus === "PRIORITY" && (
                          <svg aria-hidden="true" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M11.4 1.5 4.5 11h4.7l-1.1 7.5 7-9.8h-4.7l1-7.2z" />
                          </svg>
                        )}
                        <span>{baseFeeLabel}</span>
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {hasCertificate ? (
                        <a
                          href={`/api/certificates/${p.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-black"
                        >
                          Zertifikat öffnen (PDF)
                        </a>
                      ) : (
                        <span className="text-xs font-semibold text-amber-700">
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
                      )}
                      {!baseFeePaid && (
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800"
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
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                              baseFeePaying === p.id
                                ? "bg-amber-100 text-amber-700"
                                : "bg-amber-600 text-white hover:bg-amber-700"
                            }`}
                          >
                            {baseFeePaying === p.id ? "Zahlung läuft…" : "Grundgebühr zahlen"}
                          </button>
                        </div>
                      )}
                      {baseFeePaid && !hasPassed && (
                        <button
                          type="button"
                          onClick={() => focusProductStatus(p.id)}
                          className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700 transition hover:border-sky-300"
                        >
                          Prüfung offen → Status ansehen
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );

  const cartPanel = (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-900">Warenkorb</div>
          <p className="text-xs text-slate-500">Lizenzpläne gesammelt und bereit für den Checkout.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
          {licenseCart.items.length} Produkte
        </span>
      </div>
      {cartLoading ? (
        <p className="mt-3 text-sm text-slate-500">Warenkorb wird geladen…</p>
      ) : !cartHasItems ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-slate-500">Noch keine Lizenzpläne im Warenkorb.</p>
          {cartMessage && <p className="text-xs text-amber-700">{cartMessage}</p>}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="space-y-2">
            {licenseCart.items.map((item) => {
              const plan = planLabel(item.plan);
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border px-3 py-2 ${item.eligible ? "border-slate-200 bg-white" : "border-amber-200 bg-amber-50/60"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{item.productName}</div>
                      <div className="text-xs text-slate-500">{plan}</div>
                      {!item.eligible && (
                        <div className="mt-1 text-[11px] font-semibold text-amber-700">{cartReasonLabel(item.reason)}</div>
                      )}
                    </div>
                    <div className="text-right text-xs text-slate-600">
                      <div className="text-sm font-semibold text-slate-900">{formatNetEur(item.finalPriceCents)}</div>
                      {item.savingsCents > 0 && (
                        <div className="text-[11px] text-emerald-700">- {formatNetEur(item.savingsCents)}</div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCartRemove(item.productId)}
                        disabled={cartBusyId === item.productId}
                        className="mt-2 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:opacity-60"
                      >
                        Entfernen
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span>Netto</span>
              <span className="font-semibold text-slate-800">{formatEur(cartNetTotalCents)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span>MwSt. (19%)</span>
              <span className="font-semibold text-slate-800">{formatEur(cartVatCents)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm font-semibold text-slate-900">
              <span>Brutto</span>
              <span>{formatEur(licenseCart.totals.totalCents)}</span>
            </div>
            {licenseCart.totals.savingsCents > 0 && (
              <div className="mt-1 flex items-center justify-between text-emerald-700">
                <span>Ersparnis</span>
                <span className="font-semibold">- {formatEur(licenseCart.totals.savingsCents)}</span>
              </div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span>{cartEligibleCount} verfügbar</span>
              {cartIneligibleCount > 0 && <span>· {cartIneligibleCount} nicht verfügbar</span>}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCartCheckout}
            disabled={!cartHasEligibleItems || cartCheckoutBusy || cartLoading || cartHasIneligibleItems}
            className={`w-full rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition ${
              cartHasEligibleItems && !cartHasIneligibleItems
                ? "bg-slate-900 text-white hover:bg-black"
                : "bg-slate-200 text-slate-500 cursor-not-allowed"
            }`}
          >
            {cartCheckoutBusy ? "Starte Checkout…" : "Lizenzpläne bezahlen"}
          </button>
          {cartHasIneligibleItems && (
            <p className="text-xs text-amber-600">
              Entfernen Sie nicht verfügbare Produkte, um fortzufahren.
            </p>
          )}
          {cartMessage && <p className="text-xs text-amber-700">{cartMessage}</p>}
        </div>
      )}
    </section>
  );
  const rightColumnPanel = hasOpenLicensePayments ? cartPanel : null;

  const planSelectionSection = (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">2. Lizenzplan</p>
          <h2 className="text-2xl font-semibold text-slate-900">Wählen Sie jetzt Ihre Lizenz</h2>
          <p className="text-sm text-slate-500">Plan auswählen und direkt in den Warenkorb legen.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedProduct ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              {selectedProduct.name}
            </span>
          ) : (
            <span className="text-xs text-slate-500">Kein Produkt ausgewählt</span>
          )}
        </div>
      </div>
      {planHint && <p className="mt-3 text-sm text-amber-700">{planHint}</p>}
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {PLAN_COMPARISON.map((plan) => {
          const theme = PLAN_COMPARE_THEMES[plan.theme];
          const planKey = plan.name.toUpperCase();
          const priceSuffix = plan.billing === "daily" ? " / Tag" : "";
          const roundEur = (amount: number) => Math.round(amount * 100) / 100;
          const priceRows =
            plan.billing === "daily"
              ? [
                  { label: "1 Prod.", price: `${formatPlanEur(roundEur(plan.basePriceEur))}${priceSuffix}` },
                  { label: "2 Prod. -20%", price: `${formatPlanEur(roundEur(plan.basePriceEur * 0.8))}${priceSuffix}` },
                  { label: "3 Prod. -30%", price: `${formatPlanEur(roundEur(plan.basePriceEur * 0.7))}${priceSuffix}` },
                ]
              : [
                  { label: "1 Prod.", price: `${formatPlanEur(roundEur(plan.basePriceEur))}` },
                  { label: "2 Prod. -20%", price: `${formatPlanEur(roundEur(plan.basePriceEur * 2 * 0.8))}` },
                  { label: "3 Prod. -30%", price: `${formatPlanEur(roundEur(plan.basePriceEur * 3 * 0.7))}` },
                ];
          const planMatchesCart = selectedCartPlan === planKey;
          const hasCartItem = Boolean(selectedCartPlan);
          const isActivePlan = selectedProductLicenseActive && selectedProduct?.license?.plan === planKey;
          const isSelected = selectedPlanKey === planKey;
          const isBusy = cartBusyId === selectedProduct?.id;

          let actionLabel = "Zum Warenkorb hinzufügen";
          if (!selectedProduct) actionLabel = "Produkt auswählen";
          else if (selectedProductLicenseActive) actionLabel = "Lizenz aktiv";
          else if (!selectedProductBaseFeePaid) actionLabel = "Grundgebühr zuerst zahlen";
          else if (!selectedProductHasPassed) actionLabel = "Bestanden erforderlich";
          else if (planMatchesCart) actionLabel = "Im Warenkorb";
          else if (hasCartItem) actionLabel = "Plan aktualisieren";
          if (isBusy) actionLabel = "Wird hinzugefügt…";

          const actionDisabled =
            !selectedProduct ||
            selectedProductLicenseActive ||
            !selectedProductBaseFeePaid ||
            !selectedProductHasPassed ||
            planMatchesCart ||
            isBusy;

          const ctaGoldClass =
            "text-slate-900 shadow-[0_18px_45px_-18px_rgba(245,158,11,0.85)] ring-2 ring-amber-200/90 hover:brightness-110 hover:shadow-[0_22px_55px_-18px_rgba(245,158,11,0.95)]";
          const ctaGoldStyle = {
            backgroundImage: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 55%, #d97706 100%)",
          };

          return (
            <div key={plan.name} className="flex h-full flex-col items-center gap-4">
              <div className="text-lg font-semibold text-slate-900">{plan.name}</div>
              <div
                className={`relative flex h-full w-full flex-col justify-between rounded-[28px] border ${theme.border} ${theme.card} p-6 text-center font-semibold shadow-[0_28px_60px_-40px_rgba(15,23,42,0.65)] transition-transform duration-300 hover:-translate-y-1 ${
                  isSelected || planMatchesCart || isActivePlan ? "ring-2 ring-slate-900/15 border-slate-900/50" : ""
                }`}
              >
                {isActivePlan ? (
                  <span className="absolute right-4 top-4 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700 ring-1 ring-emerald-200">
                    Lizenz aktiv
                  </span>
                ) : planMatchesCart ? (
                  <span className="absolute right-4 top-4 rounded-full bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700 ring-1 ring-white/80">
                    Im Warenkorb
                  </span>
                ) : null}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className={`text-[15.4px] font-semibold ${theme.label}`}>Nutzung:</div>
                    <div className={`space-y-1 text-[15.4px] ${theme.body}`}>
                      {plan.usage.map((line) => (
                        <div key={line}>{line}</div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className={`text-[15.4px] font-semibold ${theme.label}`}>Inhalt:</div>
                    <div className={`space-y-1 text-[15.4px] ${theme.body}`}>
                      {plan.contents.map((line) => (
                        <div key={line}>- {line}</div>
                      ))}
                    </div>
                  </div>
                  <div className={`space-y-1 text-[15.4px] ${theme.body} w-full max-w-[240px] mx-auto`}>
                    {priceRows.map((row) => (
                      <div key={`${row.label}-${row.price}`} className="flex items-center justify-between gap-4 tabular-nums">
                        <span className="text-left">{row.label}</span>
                        <span className="text-right">{row.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`mt-6 space-y-1 text-[12.1px] leading-relaxed ${theme.muted}`}>
                  {plan.footer.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => selectedProduct && handlePlanSelect(selectedProduct.id, planKey, true)}
                disabled={actionDisabled}
                className={`w-full rounded-full px-4 py-2 text-sm font-semibold transition ${
                  actionDisabled
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                    : ctaGoldClass
                }`}
                style={actionDisabled ? undefined : ctaGoldStyle}
              >
                {actionLabel}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );

  const focusProductStatus = (productId: string) => {
    setSelectedProductId(productId);
    if (typeof window === "undefined") return;
    const top = document.getElementById("dashboard-top");
    if (top) {
      top.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div id="dashboard-top" className="min-h-screen bg-slate-50 px-4 py-8">
      {showLicenseSuccess && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" role="dialog" aria-modal="true">
              <div
                className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm"
                onClick={() => setShowLicenseSuccess(false)}
              />
              <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Lizenzzahlung</p>
                    <h2 className="text-xl font-semibold text-slate-900">Zahlung bestätigt</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLicenseSuccess(false)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300"
                  >
                    Schließen
                  </button>
                </div>
                <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                  Vielen Dank, Ihre Zahlung ist bestätigt ✅
                  <br />
                  In Kürze erhalten Sie die Lizenz und Siegel für den aktuellen Nutzungszeitraum per Email.
                </p>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowLicenseSuccess(false)}
                    className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-black"
                  >
                    Weiter
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
      <div className="mx-auto max-w-6xl space-y-8">
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

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Neues Produkt einreichen</h2>
              <p className="text-sm text-slate-500">Weitere Produkte hinzufügen und automatisch Rabatt erhalten.</p>
            </div>
            <Link
              href="/precheck"
              className="rounded-full border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              +hinzufügen
            </Link>
          </div>
        </section>

        <PrecheckStatusCard
          state={statusState}
          rightColumn={rightColumnPanel}
          cartPlanByProductId={cartPlanByProductId}
        />

        {hasOpenLicensePayments ? planSelectionSection : null}

        {certificationsPanel}

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


              </div>
    </div>
  );
}
