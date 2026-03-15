-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "easybillCustomerId" INTEGER,
ADD COLUMN     "easybillDocumentId" INTEGER,
ADD COLUMN     "easybillDocumentNumber" TEXT,
ADD COLUMN     "easybillSyncError" TEXT,
ADD COLUMN     "easybillSyncedAt" TIMESTAMP(3),
ADD COLUMN     "stripeCurrency" TEXT,
ADD COLUMN     "stripeDiscountCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stripePriceId" TEXT,
ADD COLUMN     "stripeSubtotalCents" INTEGER,
ADD COLUMN     "stripeTotalCents" INTEGER,
ADD COLUMN     "stripeUnitAmountCents" INTEGER;
