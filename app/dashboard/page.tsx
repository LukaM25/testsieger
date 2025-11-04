// app/dashboard/page.tsx
export const dynamic = "force-dynamic";

import { prisma} from "@/lib/prisma";                // use default export (works with both styles)
import { Protected } from "@/components/Protected";
import { getSession } from "@/lib/auth";

export default async function Dashboard() {
  const session = await getSession();

  // No session → gate with your Protected component
  if (!session) {
  return (
    <Protected>
      <div className="p-6 text-center text-gray-600">
        Sie müssen angemeldet sein, um das Dashboard zu sehen.
      </div>
    </Protected>
  );
}


  // Load user's products (stable and safe)
  let products: Array<{
    id: string;
    name: string;
    brand: string;
    status: string;
    certificate: { pdfUrl: string } | null;
  }> = [];

  try {
    products = await prisma.product.findMany({
      where: { userId: session.userId },
      include: { certificate: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (e) {
    // Show a friendly error inside the page instead of bombing to a 404
    return (
      <Protected>
        <div className="mt-6 rounded-xl border bg-red-50 text-red-700 px-4 py-3 text-sm">
          Datenbankfehler beim Laden der Produkte.
        </div>
      </Protected>
    );
  }

  return (
    <Protected>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {products.length === 0 ? (
        <p className="text-sm text-neutral-600">Noch keine Produkte vorhanden.</p>
      ) : (
        <div className="space-y-6">
          {products.map((p) => (
            <div key={p.id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {p.name} – {p.brand}
                  </h3>
                  <p className="text-sm text-neutral-600">Status: {p.status}</p>
                </div>

                {p.certificate ? (
                  <a
                    className="btn btn-primary"
                    href={p.certificate.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Zertifikat
                  </a>
                ) : (
                  <span className="text-sm text-neutral-400">Kein Zertifikat</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Protected>
  );
}
