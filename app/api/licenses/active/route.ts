import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCertificateAssetLinks } from "@/lib/certificateAssets";
import { ensureSignedS3Url } from "@/lib/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const products = await prisma.product.findMany({
    where: {
      userId: session.userId,
      license: { is: { status: "ACTIVE" } },
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      certificate: { select: { id: true, sealUrl: true } },
      license: { select: { plan: true, startsAt: true, paidAt: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const items = await Promise.all(
    products.map(async (product) => {
      let sealUrl: string | null = null;
      if (product.certificate?.id) {
        const assets = await getCertificateAssetLinks(product.certificate.id).catch(() => null);
        sealUrl = assets?.SEAL_IMAGE ?? null;
      }
      if (!sealUrl && product.certificate?.sealUrl) {
        sealUrl = await ensureSignedS3Url(product.certificate.sealUrl).catch(() => null);
      }

      const activeSince =
        product.license?.startsAt ??
        product.license?.paidAt ??
        product.license?.createdAt ??
        product.createdAt;

      return {
        productId: product.id,
        productName: product.name,
        plan: product.license?.plan ?? null,
        activeSince: activeSince?.toISOString?.() ?? null,
        sealUrl,
      };
    })
  );

  return NextResponse.json({ ok: true, items });
}
