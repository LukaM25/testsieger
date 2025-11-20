import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';

type Props = { params: { seal: string } };

export default async function VerifyPage({ params }: Props) {
  const seal = params.seal;

  const cert = await prisma.certificate.findFirst({
    where: { seal_number: seal },
    include: {
      product: {
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!cert) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Nicht gefunden</h1>
        <p className="mt-2 text-gray-600">Kein Zertifikat mit der Siegelnummer „{seal}“.</p>
      </div>
    );
  }

  const p = cert.product;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-semibold">Verifikation</h1>
      <p className="mb-6 text-gray-600">Siegelnummer: <span className="font-mono">{cert.seal_number}</span></p>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-3">
          <div>
            <div className="text-sm font-medium uppercase tracking-[0.35em] text-slate-500">Produkt</div>
            <div className="text-2xl font-semibold text-slate-900">{p.name}</div>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium text-xs uppercase tracking-[0.3em] text-slate-500">Marke</span>
            <div className="text-base font-semibold text-slate-700">{p.brand}</div>
          </div>
          <div><span className="font-medium">Prüfstatus:</span> Geprüft nach Prüfsiegel Zentrum UG Standard 2025</div>
          <div className="pt-4 flex gap-3">
            <Link
              href={cert.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-black px-4 py-2 text-white"
            >
              Prüfbericht (PDF)
            </Link>
            <Link href={cert.qrUrl} className="rounded-lg border px-4 py-2">QR-Code</Link>
          </div>
        </div>
        <div className="flex items-start justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cert.qrUrl} alt="QR" className="h-40 w-40" />
        </div>
      </div>
    </div>
  );
}
