
import { prisma } from "@/lib/prisma";

export default async function Verify({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({ where: { id: params.id }, include: { certificate: true, user: true } });
  if (!product) return <p>Unbekanntes Produkt.</p>;
  return (
    <div className="card space-y-3">
      <h1 className="text-2xl font-bold">Prüfbericht – Verifikation</h1>
      <p><strong>Produkt:</strong> {product.name} | <strong>Marke:</strong> {product.brand}</p>
      <p><strong>Prüfstatus:</strong> Geprüft nach Prüfsiegel Zentrum UG Standard 2025</p>
      {product.certificate && (
        <p><a className="underline" href={product.certificate.pdfUrl} target="_blank">Prüfbericht (PDF) herunterladen</a></p>
      )}
    </div>
  );
}
