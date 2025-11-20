import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/cookies';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      products: {
        include: { certificate: true },
        orderBy: { createdAt: 'desc' },
      },
      orders: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold mb-6">
          Willkommen, {user.name.split(' ')[0]}
        </h1>

        <div className="grid gap-10">
          {/* Products Section */}
          <section>
            <h2 className="text-xl font-semibold mb-3">Produkte</h2>
            <LogoutButton
              className="rounded-md bg-gray-800 px-4 py-2 text-white text-sm hover:bg-black"
              label="Logout"
            />

            {user.products.length === 0 && (
              <p className="text-gray-600">Noch keine Produkte eingereicht.</p>
            )}
            <div className="grid gap-4">
              {user.products.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex justify-between items-center"
                >
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-sm text-gray-600">
                      Status: {statusLabel(p.status)}
                    </div>
                    {p.certificate && (
                      <div className="text-sm mt-1 space-x-3">
                        <Link
                          href={p.certificate.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Prüfbericht
                        </Link>
                        <Link
                          href={p.certificate.qrUrl}
                          className="text-blue-600 hover:underline"
                        >
                          QR-Code
                        </Link>
                        <Link
                          href={`/verify/${p.certificate.seal_number}`}
                          className="text-blue-600 hover:underline"
                        >
                          Verifikation
                        </Link>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(p.createdAt).toLocaleDateString('de-DE')}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Orders Section */}
          <section>
            <h2 className="text-xl font-semibold mb-3">Bestellungen</h2>
            {user.orders.length === 0 && (
              <p className="text-gray-600">Noch keine Bestellungen vorhanden.</p>
            )}
            <div className="grid gap-3">
              {user.orders.map((o) => (
                <div
                  key={o.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 flex justify-between"
                >
                  <div>
                    <div className="font-medium">{o.plan}</div>
                    <div className="text-sm text-gray-600">
                      Produkt-ID: {o.productId.slice(0, 8)}…
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {o.paidAt
                      ? 'Bezahlt'
                      : 'Offen'}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function statusLabel(status: string) {
  switch (status) {
    case 'PRECHECK': return 'Pre-Check eingereicht';
    case 'PAID': return 'Zahlung erhalten';
    case 'IN_REVIEW': return 'Prüfung läuft';
    case 'COMPLETED': return 'Abgeschlossen';
    default: return status;
  }
}
