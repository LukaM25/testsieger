// app/admin/AdminList.tsx

import { prisma } from '@/lib/prisma';
import { complete } from '@/app/admin/actions'; // <-- use this path


type Row = {
  id: string;
  name: string;
  brand: string;
  status: string;
  userName: string;
  userEmail: string;
  certificateUrl: string | null;
};

export default async function AdminList() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: true, certificate: true },
  });

  const rows: Row[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    status: String(p.status),
    userName: p.user.name,
    userEmail: p.user.email,
    certificateUrl: p.certificate?.pdfUrl ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin · Produkte</h1>
        <form action="/api/admin/logout" method="post">
          <button className="btn border">Logout</button>
        </form>
      </div>

      <div className="grid gap-3">
        {rows.map((row) => (
          <div key={row.id} className="card flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="space-y-1">
              <div className="font-semibold">{row.name} · {row.brand}</div>
              <div className="text-sm text-neutral-600">User: {row.userName} ({row.userEmail})</div>
              <div className="text-sm">Status: {row.status}</div>
              {row.certificateUrl && (
                <div className="text-sm">
                  Zertifikat:{' '}
                  <a className="underline" href={row.certificateUrl} target="_blank">PDF öffnen</a>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <a className="btn border" href={`/verify/${row.id}`} target="_blank">Verifizieren</a>
              <form action={complete}>
                <input type="hidden" name="productId" value={row.id} />
                <button className="btn btn-primary" type="submit">Abschluss bestätigen</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
