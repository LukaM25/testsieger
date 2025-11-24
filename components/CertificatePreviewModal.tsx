import React from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  productName?: string | null;
};

export function CertificatePreviewModal({ isOpen, onClose, pdfUrl, productName }: Props) {
  if (!isOpen || !pdfUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] grid place-items-center bg-black/70 backdrop-blur-sm px-6 py-8"
      onClick={onClose}
    >
      <div
        className="relative w-[80vw] h-[80vh] rounded-xl bg-slate-950 shadow-2xl overflow-hidden border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-900/80 text-slate-100 border-b border-white/10">
          <div className="font-semibold truncate" title={productName || 'Certificate'}>
            {productName || 'Certificate'}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={pdfUrl}
              download
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/20"
            >
              Download
            </a>
            <button
              onClick={onClose}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </div>
        <iframe
          title="Certificate preview"
          src={pdfUrl}
          className="w-full h-full bg-slate-950"
        />
      </div>
    </div>
  );
}
