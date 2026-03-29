import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { generateSealForS3 } from "../lib/seal.ts";

const prisma = new PrismaClient();

function formatDate(date) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function main() {
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { certificate: { isNot: null } },
        { license: { isNot: null } },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      certificate: true,
      license: true,
      user: true,
    },
  });

  if (!product) {
    throw new Error("No product with certificate/license found in DB");
  }

  const certificateId = product.certificate?.id ?? `preview-${product.id}`;
  const verificationCode =
    product.license?.licenseCode ??
    `LIC-PREVIEW-${product.createdAt.getFullYear()}-${product.id.slice(-6).toUpperCase()}`;
  const ratingScore = product.certificate?.ratingScore || "1.2";
  const ratingLabel = product.certificate?.ratingLabel || "SEHR GUT";
  const appUrl =
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    "http://localhost:3000";

  const generated = await generateSealForS3({
    product: {
      id: product.id,
      name: product.name,
      brand: product.brand,
      createdAt: product.createdAt,
    },
    certificateId,
    verificationCode,
    tcCode: product.processNumber ?? "TC-MOCK-2026",
    ratingScore,
    ratingLabel,
    appUrl,
    licenseDate:
      product.license?.startsAt ??
      product.license?.paidAt ??
      product.createdAt,
  });

  const tmpDir = path.join(process.cwd(), "tmp");
  await fs.mkdir(tmpDir, { recursive: true });

  const rawPath = path.join(tmpDir, "seal-preview-db-raw.png");
  await fs.writeFile(rawPath, generated.buffer);

  const framedPath = path.join(tmpDir, "seal-preview-db.png");
  const framedWidth = 1800;
  const framedHeight = 1400;
  const sealWidth = 760;

  const cardSvg = Buffer.from(`
    <svg width="${framedWidth}" height="${framedHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f8fafc" />
          <stop offset="55%" stop-color="#eef2f7" />
          <stop offset="100%" stop-color="#e2e8f0" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)" />
      <rect x="120" y="92" width="1560" height="1216" rx="36" fill="#ffffff" />
      <text x="170" y="180" font-size="34" font-family="Helvetica, Arial, sans-serif" fill="#0f172a" font-weight="700">
        Seal Preview From Local DB
      </text>
      <text x="170" y="228" font-size="22" font-family="Helvetica, Arial, sans-serif" fill="#475569">
        Product: ${escapeXml(product.name)} | Brand: ${escapeXml(product.brand)}
      </text>
      <text x="170" y="266" font-size="22" font-family="Helvetica, Arial, sans-serif" fill="#475569">
        License code: ${escapeXml(verificationCode)} | Test date: ${escapeXml(formatDate(product.license?.startsAt ?? product.createdAt))}
      </text>
      <text x="170" y="304" font-size="22" font-family="Helvetica, Arial, sans-serif" fill="#475569">
        Source product: ${escapeXml(product.id)} | Certificate: ${escapeXml(certificateId)}
      </text>
      <text x="170" y="342" font-size="22" font-family="Helvetica, Arial, sans-serif" fill="#475569">
        Rating: ${escapeXml(ratingScore)} ${escapeXml(ratingLabel)}
      </text>
      <text x="170" y="1248" font-size="20" font-family="Helvetica, Arial, sans-serif" fill="#64748b">
        Preview generated on ${escapeXml(formatDate(new Date()))}. DB product data reused, preview file not persisted to storage.
      </text>
    </svg>
  `);

  const shadow = await sharp({
    create: {
      width: sealWidth + 80,
      height: 1040,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0.18 },
    },
  })
    .blur(20)
    .png()
    .toBuffer();

  const resizedSeal = await sharp(generated.buffer)
    .resize({ width: sealWidth })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: framedWidth,
      height: framedHeight,
      channels: 4,
      background: { r: 248, g: 250, b: 252, alpha: 1 },
    },
  })
    .composite([
      { input: cardSvg, top: 0, left: 0 },
      { input: shadow, top: 280, left: 555 },
      { input: resizedSeal, top: 240, left: 520 },
    ])
    .png()
    .toFile(framedPath);

  console.log(
    JSON.stringify(
      {
        productId: product.id,
        productName: product.name,
        brand: product.brand,
        certificateId,
        verificationCode,
        rawPath,
        framedPath,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
