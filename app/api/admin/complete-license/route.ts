import { NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/admin';
import { enqueueCompletionJob, processCompletionJob, CompletionError } from '@/lib/completion';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const authed = await isAdminAuthed();
  if (!authed) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { productId } = await req.json().catch(() => ({}));
  if (!productId) return NextResponse.json({ error: 'MISSING_PRODUCT_ID' }, { status: 400 });

  try {
    const job = await enqueueCompletionJob(productId);
    const result = await processCompletionJob(job.id);
    return NextResponse.json({ ok: true, result, jobId: job.id });
  } catch (err: any) {
    if (err instanceof CompletionError) {
      return NextResponse.json({ error: err.code, payload: err.payload }, { status: err.status || 400 });
    }
    console.error('ADMIN_COMPLETE_LICENSE_ERROR', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
