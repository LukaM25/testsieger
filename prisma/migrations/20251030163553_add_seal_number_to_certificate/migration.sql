/*
  Warnings:

  - A unique constraint covering the columns `[seal_number]` on the table `Certificate` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `seal_number` to the `Certificate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "seal_number" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_seal_number_key" ON "Certificate"("seal_number");
