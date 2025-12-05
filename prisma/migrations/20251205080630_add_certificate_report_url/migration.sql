-- DropIndex
DROP INDEX "PasswordResetToken_tokenHash_key";

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");
