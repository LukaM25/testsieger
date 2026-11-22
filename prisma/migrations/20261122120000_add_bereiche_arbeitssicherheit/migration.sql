-- CreateEnum
CREATE TYPE "UserArea" AS ENUM ('PRODUKTTEST', 'ARBEITSSICHERHEIT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "area" "UserArea" NOT NULL DEFAULT 'PRODUKTTEST';

-- CreateTable
CREATE TABLE "ASOrganization" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalForm" TEXT,
    "industry" TEXT NOT NULL,
    "employees" INTEGER NOT NULL,
    "locations" INTEGER NOT NULL DEFAULT 1,
    "bg" TEXT,
    "memberNumber" TEXT,
    "phone" TEXT,
    "contactRole" TEXT,
    "risks" TEXT[],
    "existing" TEXT[],
    "notes" TEXT,
    "nextInspectionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ASOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ASDocument" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT,
    "assetKey" TEXT,
    "contentType" TEXT,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ASDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ASTraining" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "participantsDone" INTEGER NOT NULL DEFAULT 0,
    "participantsTotal" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ASTraining_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ASDeadline" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ASDeadline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ASOrganization_userId_key" ON "ASOrganization"("userId");

-- CreateIndex
CREATE INDEX "ASDocument_organizationId_categoryId_idx" ON "ASDocument"("organizationId", "categoryId");

-- CreateIndex
CREATE INDEX "ASTraining_organizationId_idx" ON "ASTraining"("organizationId");

-- CreateIndex
CREATE INDEX "ASDeadline_organizationId_dueAt_idx" ON "ASDeadline"("organizationId", "dueAt");

-- AddForeignKey
ALTER TABLE "ASOrganization" ADD CONSTRAINT "ASOrganization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ASDocument" ADD CONSTRAINT "ASDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ASOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ASTraining" ADD CONSTRAINT "ASTraining_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ASOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ASDeadline" ADD CONSTRAINT "ASDeadline_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ASOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
