import React, { useState } from "react";

type Props = {
  productId: string;
  status: string;
  paymentStatus: string;
  forceEnabled?: boolean;
};

export default function ProductPayButton({ productId, status, paymentStatus, forceEnabled = false }: Props) {
  const [loading, setLoading] = useState(false);
  const paid = paymentStatus === "PAID" || paymentStatus === "MANUAL";
  const disabled = loading || paid || (!forceEnabled && status !== "PRECHECK");

  const handlePay = async () => {
    if (disabled) return;
    setLoading(true);
    try {
      const res = await fetch("/api/precheck/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) {
        alert(data?.error || "Zahlung konnte nicht gestartet werden.");
        return;
      }
      window.location.href = data.url as string;
    } catch (err) {
      alert("Zahlung konnte nicht gestartet werden.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePay}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold shadow-sm transition ${
        disabled
          ? "cursor-not-allowed bg-slate-200 text-slate-500"
          : "bg-slate-900 text-white hover:bg-black"
      }`}
    >
      {paid ? "Bereits bezahlt" : loading ? "Starte Zahlung…" : "Testgebühr zahlen"}
    </button>
  );
}
