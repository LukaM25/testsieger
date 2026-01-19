-- DropIndex
DROP INDEX "Order_stripeSessionId_key";

-- CreateTable
CREATE TABLE "LicenseCart" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LicenseCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicenseCartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "plan" "Plan" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LicenseCartItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LicenseCart_userId_key" ON "LicenseCart"("userId");

-- CreateIndex
CREATE INDEX "LicenseCartItem_productId_idx" ON "LicenseCartItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "LicenseCartItem_cartId_productId_key" ON "LicenseCartItem"("cartId", "productId");

-- CreateIndex
CREATE INDEX "Order_stripeSessionId_idx" ON "Order"("stripeSessionId");

-- AddForeignKey
ALTER TABLE "LicenseCart" ADD CONSTRAINT "LicenseCart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseCartItem" ADD CONSTRAINT "LicenseCartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "LicenseCart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseCartItem" ADD CONSTRAINT "LicenseCartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
