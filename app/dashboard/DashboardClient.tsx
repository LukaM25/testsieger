"use client"

import { useState } from 'react';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import { useCertificateActions } from '@/hooks/useCertificateActions';
import { CertificatePreviewModal } from '@/components/CertificatePreviewModal';

interface DashboardClientProps {
  user: any;
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const { handlePreview, handleSend, previewUrl, isLoading, isSending } = useCertificateActions();
  const [activeCertId, setActiveCertId] = useState<string | null>(null);
  const [products, setProducts] = useState(user.products || []);
  const [orders] = useState(user.orders || []);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    productName: '',
    brand: '',
    category: '',
    code: '',
    specs: '',
    size: '',
    madeIn: '',
    material: '',
  });

  const onPreviewClick = async (certId: string) => {
    setActiveCertId(certId);
    await handlePreview(certId);
  };

  const onSendClick = async (certId: string) => {
    setActiveCertId(certId);
    await handleSend(certId);
    setActiveCertId(null);
  };

  const handleQuickSubmit = async () => {
    setSubmitMessage(null);
    if (!newProduct.productName || !newProduct.brand) {
      setSubmitMessage('Bitte Produktname und Marke ausfüllen.');
      return;
    }
    setSubmitLoading(true);
    try {
      const res = await fetch('/api/products/quick-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.product) {
        setSubmitMessage(data.error || 'Produkt konnte nicht angelegt werden.');
        return;
      }
      setProducts((prev: any[]) => [{ ...data.product, status: 'PRECHECK', adminProgress: 'PRECHECK', paymentStatus: 'UNPAID' }, ...prev]);
      setSubmitMessage('Produkt angelegt. Lade Liste neu …');
      setNewProduct({
        productName: '',
        brand: '',
        category: '',
        code: '',
        specs: '',
        size: '',
        madeIn: '',
        material: '',
      });
      setTimeout(() => window.location.reload(), 800);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Willkommen, {user.name.split(' ')[0]}</h1>
          <LogoutButton className="rounded-md bg-gray-800 px-4 py-2 text-white text-sm hover:bg-black" label="Logout" />
        </div>

        <div className="grid gap-10">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <button
              type="button"
              onClick={() => setShowSubmit((s) => !s)}
              className="w-full flex items-center justify-between text-left font-semibold text-slate-900"
            >
              <span>Submit Product</span>
              <span className="text-sm text-slate-500">{showSubmit ? '−' : '+'}</span>
            </button>
            {showSubmit && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Produktname"
                  value={newProduct.productName}
                  onChange={(e) => setNewProduct((p) => ({ ...p, productName: e.target.value }))}
                />
                <input
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Marke"
                  value={newProduct.brand}
                  onChange={(e) => setNewProduct((p) => ({ ...p, brand: e.target.value }))}
                />
                <input
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Kategorie (optional)"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}
                />
                <input
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Artikelnummer (optional)"
                  value={newProduct.code}
                  onChange={(e) => setNewProduct((p) => ({ ...p, code: e.target.value }))}
                />
                <input
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm md:col-span-2"
                  placeholder="Spezifikationen (optional)"
                  value={newProduct.specs}
                  onChange={(e) => setNewProduct((p) => ({ ...p, specs: e.target.value }))}
                />
                <input
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Größe / Maße (optional)"
                  value={newProduct.size}
                  onChange={(e) => setNewProduct((p) => ({ ...p, size: e.target.value }))}
                />
                <input
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Hergestellt in (optional)"
                  value={newProduct.madeIn}
                  onChange={(e) => setNewProduct((p) => ({ ...p, madeIn: e.target.value }))}
                />
                <input
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm md:col-span-2"
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
                    {submitLoading ? 'Wird gesendet…' : 'Produkt senden'}
                  </button>
                  {submitMessage && <span className="text-sm text-slate-600">{submitMessage}</span>}
                </div>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Produkte</h2>
            {products.length === 0 && <p className="text-gray-600">Noch keine Produkte.</p>}
            <div className="grid gap-4">
              {products.map((p: any) => (
                <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="font-semibold text-lg">{p.name}</div>
                  <div className="text-sm text-gray-600 mb-2">Status: {p.status}</div>
                  
                  {p.certificate ? (
                    <div className="flex flex-wrap gap-3 items-center mt-2">
                      {/* PREVIEW BUTTON */}
                      <button
                        onClick={() => onPreviewClick(p.certificate.id)}
                        disabled={isLoading && activeCertId === p.certificate.id}
                        className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                      >
                        {isLoading && activeCertId === p.certificate.id ? 'Loading...' : 'Vorschau PDF'}
                      </button>

                      {/* EMAIL BUTTON */}
                      <button
                        onClick={() => onSendClick(p.certificate.id)}
                        disabled={isSending && activeCertId === p.certificate.id}
                        className="px-3 py-1.5 text-xs bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100"
                      >
                        {isSending && activeCertId === p.certificate.id ? 'Senden...' : 'Email an Kunden'}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">Zertifikat ausstehend</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Bestellungen</h2>
            {orders.map((o: any) => (
              <div key={o.id} className="rounded-lg border border-gray-200 bg-white p-4 flex justify-between">
                <div>{o.plan}</div>
                <div className={o.paidAt ? 'text-green-600' : 'text-yellow-600'}>{o.paidAt ? 'Bezahlt' : 'Offen'}</div>
              </div>
            ))}
          </section>
        </div>
      </div>
      
      {/* MODAL */}
      <CertificatePreviewModal 
        isOpen={!!previewUrl}
        onClose={() => window.location.reload()}
        pdfUrl={previewUrl}
        productName="Vorschau"
      />
    </div>
  );
}
