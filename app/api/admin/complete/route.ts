import { NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/admin';
import { completeProduct, CompletionError } from '@/lib/completion';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const authed = await isAdminAuthed();
    if (!authed) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: 'MISSING_PRODUCT_ID' }, { status: 400 });
    }

    const result = await completeProduct(productId);
    return NextResponse.json({
      ok: true,
      message: `Zertifikat erstellt. Verifikation: ${result.verifyUrl}`,
      verifyUrl: result.verifyUrl,
      certId: result.certId,
      pdfUrl: result.pdfUrl,
      qrUrl: result.qrUrl,
      seal: result.seal,
    });
  } catch (error: any) {
    if (error instanceof CompletionError) {
      const body = { error: error.code, ...(error.payload ?? {}) };
      return NextResponse.json(body, { status: error.status });
    }
    console.error('ADMIN_COMPLETE_ERROR', error);
    return NextResponse.json({ error: error?.message || 'COMPLETE_FAILED' }, { status: 500 });
  }
}
