-- CreateEnum
CREATE TYPE "CompletionJobStatus" AS ENUM ('PENDING', 'RUNNING', 'FAILED', 'COMPLETED');

-- CreateTable
CREATE TABLE "CompletionJob" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "certificateId" TEXT,
    "status" "CompletionJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompletionJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompletionJob_status_createdAt_idx" ON "CompletionJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CompletionJob_productId_idx" ON "CompletionJob"("productId");

-- AddForeignKey
ALTER TABLE "CompletionJob" ADD CONSTRAINT "CompletionJob_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
