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

  const onPreviewClick = async (certId: string) => {
    setActiveCertId(certId);
    await handlePreview(certId);
  };

  const onSendClick = async (certId: string) => {
    setActiveCertId(certId);
    await handleSend(certId);
    setActiveCertId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Willkommen, {user.name.split(' ')[0]}</h1>
          <LogoutButton className="rounded-md bg-gray-800 px-4 py-2 text-white text-sm hover:bg-black" label="Logout" />
        </div>

        <div className="grid gap-10">
          <section>
            <h2 className="text-xl font-semibold mb-3">Produkte</h2>
            {user.products.length === 0 && <p className="text-gray-600">Noch keine Produkte.</p>}
            <div className="grid gap-4">
              {user.products.map((p: any) => (
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
            {user.orders.map((o: any) => (
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