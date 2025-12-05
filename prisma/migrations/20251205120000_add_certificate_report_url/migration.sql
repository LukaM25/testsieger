-- Add optional field for manual Prüfreports without touching the official certificate PDF
ALTER TABLE "Certificate" ADD COLUMN "reportUrl" TEXT;
