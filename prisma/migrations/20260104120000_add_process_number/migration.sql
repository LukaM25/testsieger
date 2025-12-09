-- Add processNumber to Product for human-friendly, unique tracking IDs (Vor.Nr.)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "processNumber" TEXT;

-- Enforce uniqueness on processNumber
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'Product_processNumber_key'
  ) THEN
    CREATE UNIQUE INDEX "Product_processNumber_key" ON "Product"("processNumber");
  END IF;
END $$;
