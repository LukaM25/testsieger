-- AlterTable
ALTER TABLE "Order"
ALTER COLUMN "easybillCustomerId" TYPE BIGINT USING "easybillCustomerId"::BIGINT,
ALTER COLUMN "easybillDocumentId" TYPE BIGINT USING "easybillDocumentId"::BIGINT;
