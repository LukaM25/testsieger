import ProduktTestPage from "@/pruf/ProduktTestPage";
import type { LiveTestedProduct } from "@/pruf/ProduktTestPage";
import { prisma } from "@/lib/prisma";
import { ensureSignedS3Url, signedS3Url } from "@/lib/s3";

export const metadata = {
  description: "Testsieger Check – Prüfung von Produkten mit nachverfolgbarer Methodik.",
};

export const dynamic = "force-dynamic";

async function signCertificateAssetUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  if (/^https?:\/\//i.test(url)) return ensureSignedS3Url(url);

  try {
    if (url.startsWith("s3://")) {
      const parsed = new URL(url);
      return signedS3Url(parsed.pathname.replace(/^\//, ""));
    }

    return signedS3Url(url);
  } catch {
    return url;
  }
}

async function getRecentTestedProducts(): Promise<LiveTestedProduct[]> {
  const productsRaw = await prisma.product.findMany({
    where: {
      status: { in: ["COMPLETED", "IN_REVIEW", "PAID"] },
      certificate: { isNot: null },
    },
    include: {
      certificate: true,
      license: {
        select: {
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const recentProducts = productsRaw
    .filter(
      (product) =>
        product.certificate?.reportUrl &&
        product.certificate?.pdfUrl &&
        product.certificate?.sealUrl,
    )
    .sort(
      (a, b) =>
        new Date(b.certificate?.createdAt ?? b.createdAt).getTime() -
        new Date(a.certificate?.createdAt ?? a.createdAt).getTime(),
    )
    .slice(0, 3);

  return Promise.all(
    recentProducts.map(async (product) => ({
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      certificateCreatedAt: (
        product.certificate?.createdAt ?? product.createdAt
      ).toISOString(),
      licenseStatus: product.license?.status ?? null,
      reportUrl: await signCertificateAssetUrl(product.certificate?.reportUrl),
      certificateUrl: product.certificate?.pdfUrl
        ? `/api/certificates/${product.id}/download`
        : null,
      sealUrl: await signCertificateAssetUrl(product.certificate?.sealUrl),
      sealNumber: product.certificate?.seal_number ?? null,
    })),
  );
}

export default async function ProduktTestRoute() {
  const recentTestedProducts = await getRecentTestedProducts();

  return <ProduktTestPage recentTestedProducts={recentTestedProducts} />;
}
