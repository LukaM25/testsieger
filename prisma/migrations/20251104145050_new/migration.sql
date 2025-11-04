/*
  Warnings:

  - A unique constraint covering the columns `[pdfmonkeyDocumentId]` on the table `Certificate` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "pdfmonkeyDocumentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_pdfmonkeyDocumentId_key" ON "Certificate"("pdfmonkeyDocumentId");
