import { NextResponse } from 'next/server';
import { CompletionJobStatus } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { processCompletionJob } from '@/lib/completion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization') || '';
  return header === `Bearer ${secret}`;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(10, Math.max(1, Number(url.searchParams.get('limit') || '3')));

  const jobs = await prisma.completionJob.findMany({
    where: { status: CompletionJobStatus.PENDING },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: { id: true, productId: true },
  });

  const results: Array<{ jobId: string; productId: string; ok: boolean; error?: string }> = [];
  for (const job of jobs) {
    try {
      await processCompletionJob(job.id);
      results.push({ jobId: job.id, productId: job.productId, ok: true });
    } catch (err: any) {
      results.push({ jobId: job.id, productId: job.productId, ok: false, error: err?.code || err?.message || 'FAILED' });
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
