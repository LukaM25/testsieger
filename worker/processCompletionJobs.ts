import { CompletionJobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { processCompletionJob } from '@/lib/completion';

const SLEEP_MS = 5000;

export async function processNextJobOnce() {
  const job = await prisma.completionJob.findFirst({
    where: { status: CompletionJobStatus.PENDING },
    orderBy: { createdAt: 'asc' },
  });

  if (!job) return null;

  console.info('PROCESSING_COMPLETION_JOB_START', {
    jobId: job.id,
    productId: job.productId,
    attempts: job.attempts,
  });

  try {
    const result = await processCompletionJob(job.id);
    console.info('PROCESSING_COMPLETION_JOB_SUCCESS', {
      jobId: job.id,
      productId: job.productId,
      certId: result.certId,
    });
    return result;
  } catch (err) {
    console.error('PROCESSING_COMPLETION_JOB_ERROR', {
      jobId: job.id,
      productId: job.productId,
      error: err,
    });
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runWorkerLoop() {
  let shouldStop = false;

  const handleSignal = (signal: string) => {
    console.info(`Received ${signal}. Exiting after current iteration...`);
    shouldStop = true;
  };

  process.on('SIGINT', handleSignal);
  process.on('SIGTERM', handleSignal);

  while (!shouldStop) {
    try {
      const processed = await processNextJobOnce();
      if (!processed) {
        await sleep(SLEEP_MS);
      }
    } catch (err) {
      console.error('WORKER_LOOP_ERROR', err);
      await sleep(SLEEP_MS);
    }
  }

  process.off('SIGINT', handleSignal);
  process.off('SIGTERM', handleSignal);
  console.info('Worker loop stopped.');
}

if (require.main === module) {
  runWorkerLoop().catch((err) => {
    console.error('WORKER_BOOTSTRAP_ERROR', err);
    process.exitCode = 1;
  });
}
