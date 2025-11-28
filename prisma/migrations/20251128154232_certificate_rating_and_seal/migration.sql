/*
  Warnings:

  - You are about to drop the column `pdfmonkeyDocumentId` on the `Certificate` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[externalReferenceId]` on the table `Certificate` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Certificate_pdfmonkeyDocumentId_key";

-- AlterTable
ALTER TABLE "Certificate" DROP COLUMN "pdfmonkeyDocumentId",
ADD COLUMN     "externalReferenceId" TEXT,
ADD COLUMN     "lastSentAt" TIMESTAMP(3),
ADD COLUMN     "snapshotData" JSONB,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_externalReferenceId_key" ON "Certificate"("externalReferenceId");
