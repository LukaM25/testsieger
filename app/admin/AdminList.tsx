"use client";

import { useState, useEffect } from "react";

export default function AdminList() {
  const [products, setProducts] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Fetch all products from your DB
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      setProducts(data.products || []);
    })();
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

      // Optional: reload product data after generation
      const reload = await fetch("/api/admin/products");
      const updated = await reload.json();
      setProducts(updated.products || []);
    } catch (err: any) {
      console.error(err);
      alert("Fehler: " + err.message);
    } finally {
      setLoadingId(null);
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
