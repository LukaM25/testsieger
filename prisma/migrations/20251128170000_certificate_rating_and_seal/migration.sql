-- Add rating and seal fields to Certificate
ALTER TABLE "Certificate"
  ADD COLUMN "ratingScore" TEXT,
  ADD COLUMN "ratingLabel" TEXT,
  ADD COLUMN "sealUrl" TEXT;
