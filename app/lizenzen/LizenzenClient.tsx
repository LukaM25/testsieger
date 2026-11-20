'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BadgeCheck, ChevronDown, FileText, FileCheck2, Search, ShieldAlert, X } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  brand: string;
  category: string | null;
  processNumber?: string | null;
  certificate: {
    id: string;
    seal_number: string | null;
    pdfUrl: string | null;
    reportUrl: string | null;
    sealUrl?: string | null;
    createdAt: Date | string;
  } | null;
  license: { id: string; licenseCode: string; status: string } | null;
  user: { company: string | null };
};

const fmt = (d?: Date | string | null) => (d ? new Date(d).toLocaleDateString('de-DE') : '—');

export default function LizenzenClient({ products }: { products: any[] }) {
  const list = products as Product[];
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = searchParams.get('q');
    if (!q) return;
    setQuery(q);
    const n = q.toLowerCase();
    const exact = list.find(
      (p) =>
        p.id.toLowerCase() === n ||
        p.certificate?.id?.toLowerCase() === n ||
        p.certificate?.seal_number?.toLowerCase() === n ||
        p.license?.licenseCode?.toLowerCase() === n,
    );
    if (exact) setOpenId(exact.id);
    const raf = window.requestAnimationFrame(() =>
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    );
    return () => window.cancelAnimationFrame(raf);
  }, [searchParams, list]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return [];
    return list.filter((p) =>
      [
        p.name,
        p.brand,
        p.category ?? '',
        p.id,
        p.certificate?.id ?? '',
        p.certificate?.seal_number ?? '',
        p.license?.licenseCode ?? '',
        p.processNumber ?? '',
      ].some((v) => v.toLowerCase().includes(q)),
    );
  }, [q, list]);

  return (
    <div
      id="lizenzsuche"
      ref={sectionRef}
      className="scroll-mt-24 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_24px_70px_-45px_rgba(43,64,102,0.35)] sm:p-8"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d4ed8]/10 text-[#1d4ed8]">
          <BadgeCheck className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-semibold text-[#2B4066]">Siegel & Lizenz prüfen</h2>
          <p className="text-sm text-slate-500">Ist ein Siegel echt und gültig? Hier erfahren Sie es in Sekunden.</p>
        </div>
      </div>

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          inputMode="search"
          autoComplete="off"
          aria-label="Lizenzcode, Siegelnummer oder Produktname"
          placeholder="Lizenzcode, Siegelnummer oder Produktname eingeben"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-4 pl-12 pr-12 text-base text-slate-900 outline-none transition focus:border-[#1d4ed8] focus:bg-white focus:ring-4 focus:ring-[#1d4ed8]/10"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setOpenId(null);
            }}
            aria-label="Eingabe löschen"
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Tipp: Den Lizenzcode finden Sie auf dem Prüfbericht. Per QR-Code auf dem Siegel öffnet sich diese Seite automatisch mit dem passenden Ergebnis.
      </p>

      <div className="mt-5 space-y-3" aria-live="polite">
        {!q && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-8 text-center text-sm text-slate-500">
            Geben Sie oben einen Code oder Produktnamen ein. Das Ergebnis erscheint sofort.
          </div>
        )}

        {q && filtered.length === 0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              Zu „{query}“ gibt es keinen Eintrag. Bitte prüfen Sie die Schreibweise. Finden Sie den Code trotzdem nicht, schreiben Sie uns über die{' '}
              <a href="/kontakt" className="font-semibold underline">
                Kontaktseite
              </a>
              .
            </p>
          </div>
        )}

        {filtered.map((p) => {
          const open = openId === p.id;
          const active = p.license?.status === 'ACTIVE';
          const code = p.license?.licenseCode || p.certificate?.seal_number || null;
          return (
            <div
              key={p.id}
              className={`overflow-hidden rounded-2xl border transition ${open ? 'border-[#1d4ed8]/40 bg-[#f5f8ff]' : 'border-slate-200 bg-white hover:border-slate-300'}`}
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? null : p.id)}
                aria-expanded={open}
                className="flex w-full items-center gap-4 p-4 text-left"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white">
                  {p.certificate?.sealUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.certificate.sealUrl} alt="" className="h-full w-full object-contain p-1.5" />
                  ) : (
                    <BadgeCheck className="h-6 w-6 text-slate-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-[#2B4066]">{p.name}</div>
                  <div className="truncate text-xs text-slate-500">
                    {p.brand}
                    {code ? ` · ${code}` : ''}
                  </div>
                </div>
                <span
                  className={`hidden shrink-0 rounded-full px-3 py-1 text-xs font-semibold sm:inline-block ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                >
                  {active ? 'Lizenz aktiv' : 'Geprüft'}
                </span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>

              {open && (
                <div className="border-t border-slate-200/70 px-4 pb-5 pt-4">
                  <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                    {[
                      ['Status', active ? 'Prüfung bestanden, Lizenz aktiv' : 'Prüfung bestanden'],
                      ['Lizenzcode', p.license?.licenseCode || '—'],
                      ['Siegelnummer', p.certificate?.seal_number || '—'],
                      ['Ausgestellt am', fmt(p.certificate?.createdAt)],
                      ['Marke', p.brand],
                      ['Kategorie', p.category || '—'],
                      ['Unternehmen', p.user?.company || '—'],
                      ['Produkt-ID', p.id],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{k}</dt>
                        <dd className="mt-0.5 break-all text-slate-800">{v}</dd>
                      </div>
                    ))}
                  </dl>

                  {p.certificate && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {p.certificate.pdfUrl && (
                        <a
                          href={`/api/certificates/${p.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1d4ed8] to-[#16294d] px-4 py-2.5 text-sm font-semibold !text-white shadow-sm transition hover:-translate-y-0.5"
                        >
                          <FileCheck2 className="h-4 w-4" /> Zertifikat öffnen
                        </a>
                      )}
                      {p.certificate.reportUrl && (
                        <a
                          href={p.certificate.reportUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#2B4066] transition hover:-translate-y-0.5 hover:border-[#1d4ed8]/40"
                        >
                          <FileText className="h-4 w-4" /> Prüfbericht öffnen
                        </a>
                      )}
                      {!p.certificate.pdfUrl && !p.certificate.reportUrl && (
                        <p className="text-sm text-slate-500">Dokumente werden gerade erstellt.</p>
                      )}
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
