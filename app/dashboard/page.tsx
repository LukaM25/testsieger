
import { prisma } from "@/lib/prisma";
import { Protected } from "@/components/Protected";
import { getSession } from "@/lib/auth";

export default async function Dashboard() {
  const session = await getSession();
  if (!session) return <Protected> </Protected>;
  const products = await prisma.product.findMany({ where: { userId: session.userId }, include: { certificate: true } });
  return (
    <Protected>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="space-y-6">
        {products.map(p => (
          <div key={p.id} className="card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{p.name} – {p.brand}</h3>
                <p className="text-sm text-neutral-600">Status: {p.status}</p>
              </div>
              {p.certificate && (
                <a className="btn btn-primary" href={p.certificate.pdfUrl} target="_blank">Zertifikat</a>
              )}
            </div>
          </div>
        ))}
      </div>
    </Protected>
  );
}
