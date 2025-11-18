-- CreateEnum
CREATE TYPE "AdminProgress" AS ENUM ('PRECHECK', 'RECEIVED', 'ANALYSIS', 'COMPLETION', 'PASS', 'FAIL');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "adminProgress" "AdminProgress" NOT NULL DEFAULT 'PRECHECK';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "company" TEXT;
