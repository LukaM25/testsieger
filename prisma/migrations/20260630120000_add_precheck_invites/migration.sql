CREATE TABLE "PrecheckInvite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "gender" "Gender",
    "company" TEXT,
    "address" TEXT,
    "productData" JSONB NOT NULL,
    "privacyAccepted" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "productId" TEXT,

    CONSTRAINT "PrecheckInvite_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PrecheckInvite_email_idx" ON "PrecheckInvite"("email");
CREATE INDEX "PrecheckInvite_expiresAt_idx" ON "PrecheckInvite"("expiresAt");
CREATE INDEX "PrecheckInvite_usedAt_idx" ON "PrecheckInvite"("usedAt");

ALTER TABLE "PrecheckInvite" ADD CONSTRAINT "PrecheckInvite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
