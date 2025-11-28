'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string | null;
  madeIn: string | null;
  certificate: {
    seal_number: string | null;
    pdfUrl: string | null;
    createdAt: Date;
  } | null;
  user: {
    company: string | null;
  };
}

export default function LizenzenClient({ products }: { products: any[] }) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  // 1. Auto-detect QR Code (URL param ?q=...)
  useEffect(() => {
    const searchParam = searchParams.get('q');
    if (searchParam) {
      setQuery(searchParam);
      // If ID matches exactly, open the dropdown immediately
      const exactMatch = products.find(p => p.id === searchParam);
      if (exactMatch) {
        setOpenId(exactMatch.id);
      }
    }
  }, [searchParams, products]);

  // 2. Search Filtering Logic
  const filtered = useMemo(() => {
    if (!query) return []; // Optional: Show nothing until user types
    const lowerQ = query.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerQ) ||
      p.brand.toLowerCase().includes(lowerQ) ||
      (p.category ?? '').toLowerCase().includes(lowerQ) ||
      p.id.toLowerCase().includes(lowerQ) ||
      p.certificate?.seal_number?.toLowerCase().includes(lowerQ)
    );
  }, [query, products]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Lizenzcode prüfen</h2>
      <p className="mt-2 text-sm text-slate-600">
        Geben Sie Lizenzcode, Produktnamen, Produkt-ID oder Kategorie ein, um die Gültigkeit zu verifizieren.
      </p>
      
      {/* SEARCH INPUT */}
      <div className="mt-6">
        <input
          type="text"
          placeholder="Lizenzcode, Produktname, Kategorie oder ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
        />
      </div>

      {/* RESULTS LIST */}
      <div className="mt-4 space-y-3">
        {query && filtered.length === 0 && (
          <p className="text-sm text-slate-500 py-2">Keine Einträge gefunden.</p>
        )}

        {filtered.map((product) => {
          const isOpen = openId === product.id;
          
          return (
            <div 
              key={product.id} 
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${isOpen ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              {/* Clickable Header */}
              <button 
                onClick={() => setOpenId(isOpen ? null : product.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div>
                  <div className="font-bold text-slate-900">{product.name}</div>
                  <div className="text-xs text-slate-500">{product.brand} • {product.certificate?.seal_number || 'Kein Siegel'}</div>
                </div>
                <div className={`transform transition-transform text-slate-400 ${isOpen ? 'rotate-180' : ''}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </button>

              {/* Dropdown Content */}
              {isOpen && (
                <div className="px-4 pb-4 pt-0 border-t border-slate-200/50">
                  <div className="grid md:grid-cols-2 gap-4 mt-4 text-sm">
                    <div>
                      <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Produkt</h4>
                      <div className="text-slate-700 space-y-1">
                        <p>ID: <span className="font-mono text-xs text-slate-500">{product.id}</span></p>
                        <p>Kategorie: {product.category || '—'}</p>
                        <p>Hersteller: {product.user.company || '—'}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Zertifikat</h4>
                      <div className="text-slate-700 space-y-1">
                        <p>Status: <span className="text-green-600 font-bold">Gültig & Geprüft</span></p>
                        <p>Ausgestellt: {new Date(product.certificate?.createdAt).toLocaleDateString('de-DE')}</p>
                      </div>
                    </div>
                  </div>

                  {product.certificate?.pdfUrl && (
                    <div className="mt-4 pt-3 border-t border-slate-200/50">
                      <a 
                        href={product.certificate.pdfUrl}
                        target="_blank"
                        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        Offiziellen Prüfbericht öffnen
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
