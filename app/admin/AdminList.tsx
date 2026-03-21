"use client";

import { useState, useEffect } from "react";

export default function AdminList() {
  const [products, setProducts] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const reloadProducts = async () => {
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    setProducts(data.products || []);
  };

  useEffect(() => {
    reloadProducts();
  }, []);

  async function generateCertificate(productId: string) {
    try {
      setLoadingId(productId);
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler beim Generieren");
      alert("Zertifikat erfolgreich generiert ✅");
      await reloadProducts();
    } catch (err: any) {
      console.error(err);
      alert("Fehler: " + err.message);
    } finally {
      setLoadingId(null);
    }
  }

  async function cancelLicense(productId: string) {
    if (!confirm("Lizenz für dieses Produkt wirklich kündigen?")) return;
    setCancellingId(productId);
    try {
      const res = await fetch("/api/admin/licenses/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        await reloadProducts();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Kündigung fehlgeschlagen.");
      }
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6 text-[#2e4053]">Admin Dashboard</h1>

      {products.length === 0 ? (
        <p className="text-gray-500">Keine Produkte vorhanden.</p>
      ) : (
        <table className="w-full text-sm border border-gray-200">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="p-3 border-b">Produkt</th>
              <th className="p-3 border-b">Marke</th>
              <th className="p-3 border-b">Status</th>
              <th className="p-3 border-b">Lizenz</th>
              <th className="p-3 border-b">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.brand}</td>
                <td className="p-3 capitalize">{p.status}</td>
                <td className="p-3">
                  {p.license ? (
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        p.license.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : p.license.status === "CANCELED"
                          ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                          : p.license.status === "EXPIRED"
                          ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                          : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                      }`}
                    >
                      {p.license.plan} · {p.license.status}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => generateCertificate(p.id)}
                      disabled={loadingId === p.id}
                      className={`px-3 py-1.5 rounded text-white text-sm ${
                        loadingId === p.id
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-amber-500 hover:bg-amber-600"
                      }`}
                    >
                      {loadingId === p.id ? "Wird generiert..." : "Zertifikat generieren"}
                    </button>

                    {p.license?.status === "ACTIVE" && (
                      <button
                        onClick={() => cancelLicense(p.id)}
                        disabled={cancellingId === p.id}
                        className={`px-3 py-1.5 rounded text-white text-sm ${
                          cancellingId === p.id
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-red-500 hover:bg-red-600"
                        }`}
                      >
                        {cancellingId === p.id ? "Kündigt…" : "Lizenz kündigen"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
