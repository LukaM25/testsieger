import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getAdminContext } from '@/lib/admin';
import { signedUrlForKey } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Download einer Unterlage. Erlaubt ist nur der Kunde, dem das Dokument gehört, oder ein Admin.
 * Es wird auf eine kurzlebige signierte URL weitergeleitet, die Datei selbst bleibt privat.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const doc = await prisma.aSDocument.findUnique({
    where: { id },
    select: { assetKey: true, organization: { select: { userId: true } } },
  });
  if (!doc || !doc.assetKey) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  const admin = await getAdminContext().catch(() => null);
  if (!admin) {
    const session = await getSession();
    if (!session || session.userId !== doc.organization.userId) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
  }

  const url = await signedUrlForKey(doc.assetKey, 60 * 5);
  return NextResponse.redirect(url);
}
