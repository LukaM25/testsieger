// scripts/test-storage-pipeline.ts
import { prisma } from "@/lib/prisma";
import { storeCertificateAssets } from "@/lib/certificateAssets";

async function main() {
  // 1. Pick an existing test certificate or create a dummy one first
  const cert = await prisma.certificate.findFirst({
    orderBy: { createdAt: "desc" },
    include: { product: { include: { user: true } } },
  });

  if (!cert || !cert.product || !cert.product.user) {
    throw new Error("No certificate + product + user found; create one in the app first.");
  }

  const dummyPdf = Buffer.from("%PDF-1.4\n% dummy test pdf\n", "utf8");
  const dummyPng = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // just header for test

  const result = await storeCertificateAssets({
    certificateId: cert.id,
    productId: cert.product.id,
    userId: cert.product.user.id,
    sealNumber: cert.seal_number,
    pdfBuffer: dummyPdf,
    qrBuffer: dummyPng,
  });

  console.log("Stored assets:", result);

  const assets = await prisma.asset.findMany({
    where: { certificateId: cert.id },
  });

  console.log("DB assets for certificate:", assets);
}

main()
  .then(() => {
    console.log("✅ storage pipeline test finished");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ storage pipeline test failed", err);
    process.exit(1);
  });
