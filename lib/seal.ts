import fs from "fs/promises";
import path from "path";
import QRCode from "qrcode";
import sharp from "sharp";

type SealInput = {
  product: { id: string; name: string; brand: string | null; createdAt: Date };
  certificateId: string;
  ratingScore: string;
  ratingLabel: string;
  appUrl: string;
  licenseDate?: Date | null;
  templatePath?: string;
  outputDir?: string;
};

const REF_WIDTH = 1780;
const REF_HEIGHT = 2048;

// Fonts configuration
const FONTS = {
  // Gold bar
  ratingScore: { size: 430, weight: 900, color: "#000000" },
  ratingLabel: { size: 115, weight: 900, color: "#000000" },

  // Main white box values (Produkt/Marke)
  body: { size: 78, weight: 700, color: "#000000" },

  // Meta data
  metaData: { size: 42, weight: 600, color: "#7F7F7F" },

  // Footer URL
  smallMuted: { size: 32, weight: 400, color: "#9B9B9B" },
};

const DEFAULT_TEMPLATE = path.join(
  process.cwd(),
  "public",
  "template",
  "template_siegel.png"
);
const DEFAULT_OUTPUT_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "seals"
);

export type GeneratedSeal = {
  buffer: Buffer;
  key: string; // logical storage key for S3
};

function formatTestDate(date: Date) {
  try {
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

function shorten(input: string | null | undefined, max = 28) {
  if (!input) return "";
  return input.length > max ? `${input.slice(0, max)}...` : input;
}

function makeSvgText({
  text,
  x,
  y,
  fontSize,
  fontWeight,
  color,
  align = "left",
  width,
  height,
  stretch = false,
  letterSpacing = 0,
}: {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: number;
  color: string;
  align?: "left" | "center";
  width: number;
  height: number;
  stretch?: boolean;
  letterSpacing?: number;
}) {
  const anchor = align === "center" ? "middle" : "start";

  // Scaling logic for "tall" look
  const scaleY = stretch ? 1.3 : 1;
  const adjustedY = stretch ? y / scaleY : y;
  const transform = stretch ? `transform="scale(1, ${scaleY})"` : "";

  // If centering, use the provided X (which might include an offset) as the center point
  const anchorX = align === "center" ? x : x; 

  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .t { font-family: 'Arial', 'Helvetica', sans-serif; }
      </style>
      <text 
        x="${anchorX}" 
        y="${adjustedY}" 
        ${transform} 
        text-anchor="${anchor}" 
        class="t" 
        font-size="${fontSize}" 
        font-weight="${fontWeight}" 
        fill="${color}"
        letter-spacing="${letterSpacing}"
      >
        ${text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}
      </text>
    </svg>`
  );
}

export async function generateSealForS3({
  product,
  certificateId,
  ratingScore,
  ratingLabel,
  appUrl,
  licenseDate = null,
  templatePath = DEFAULT_TEMPLATE,
}: SealInput): Promise<GeneratedSeal> {
  const templateMeta = await sharp(templatePath).metadata();
  const canvasWidth = templateMeta.width ?? REF_WIDTH;
  const canvasHeight = templateMeta.height ?? REF_HEIGHT;

  const scaleX = canvasWidth / REF_WIDTH;
  const scaleY = canvasHeight / REF_HEIGHT;

  // --- FINAL COORDINATES V9 ---
  const COORDS = {
    // Gold Band (Unchanged)
    ratingScoreY: Math.round(1090 * scaleY), 
    ratingLabelY: Math.round(1225 * scaleY),

    // White Box Values
    productValue: {
      x: Math.round(550 * scaleX),
      y: Math.round(1465 * scaleY), // Moved DOWN 5px (was 1460)
    },
    brandValue: {
      x: Math.round(499 * scaleX), // Moved RIGHT by ~2% (was 450)
      y: Math.round(1572 * scaleY), // Moved UP by ~2% (was 1580)
    },

    // Meta Row (Unchanged)
    testDateValue: {
      x: Math.round(462 * scaleX),
      y: Math.round(1673 * scaleY),
    },
    // TC Code (Unchanged)
    tcCodeValue: {
      x: Math.round(710 * scaleX),
      y: Math.round(1715 * scaleY),
    },

    // Bottom URL (Unchanged)
    reportUrlValue: {
      x: Math.round(410 * scaleX),
      y: Math.round(1880 * scaleY),
    },

    // QR Code (Unchanged)
    qr: {
      x: Math.round(1180 * scaleX),
      y: Math.round(1420 * scaleY),
      size: Math.round(320 * scaleX),
    },
  };

  const reportUrl = `${appUrl.replace(/\/$/, "")}/lizenzen?q=${certificateId}`;

  const templateBuffer = await sharp(templatePath).ensureAlpha().toBuffer();
  const composites: sharp.OverlayOptions[] = [];

  // --- 1. RATING (Gold Bar) ---
  const ratingCenterX = (canvasWidth / 2) - Math.round(40 * scaleX);
  const displayScore = ratingScore.replace(".", ",");

  composites.push({
    input: makeSvgText({
      text: displayScore,
      x: ratingCenterX,
      y: COORDS.ratingScoreY,
      fontSize: FONTS.ratingScore.size,
      fontWeight: FONTS.ratingScore.weight,
      color: FONTS.ratingScore.color,
      align: "center",
      width: canvasWidth,
      height: canvasHeight,
      stretch: true,
      letterSpacing: -15,
    }),
  });

  composites.push({
    input: makeSvgText({
      text: ratingLabel.toUpperCase(),
      x: ratingCenterX,
      y: COORDS.ratingLabelY,
      fontSize: FONTS.ratingLabel.size,
      fontWeight: FONTS.ratingLabel.weight,
      color: FONTS.ratingLabel.color,
      align: "center",
      width: canvasWidth,
      height: canvasHeight,
      stretch: true,
      letterSpacing: -2,
    }),
  });

  // --- 2. PRODUCT DETAILS ---
  composites.push({
    input: makeSvgText({
      text: shorten(product.name, 28),
      x: COORDS.productValue.x,
      y: COORDS.productValue.y,
      fontSize: FONTS.body.size,
      fontWeight: FONTS.body.weight,
      color: FONTS.body.color,
      width: canvasWidth,
      height: canvasHeight,
      stretch: true,
    }),
  });

  composites.push({
    input: makeSvgText({
      text: product.brand ? shorten(product.brand, 28) : "",
      x: COORDS.brandValue.x,
      y: COORDS.brandValue.y,
      fontSize: FONTS.body.size,
      fontWeight: FONTS.body.weight,
      color: FONTS.body.color,
      width: canvasWidth,
      height: canvasHeight,
      stretch: true,
    }),
  });

  // --- 3. META DATA ---
  const testDate = formatTestDate(licenseDate ?? product.createdAt);
  if (testDate) {
    composites.push({
      input: makeSvgText({
        text: testDate,
        x: COORDS.testDateValue.x,
        y: COORDS.testDateValue.y,
        fontSize: FONTS.metaData.size,
        fontWeight: FONTS.metaData.weight,
        color: FONTS.metaData.color,
        width: canvasWidth,
        height: canvasHeight,
      }),
    });
  }

  composites.push({
    input: makeSvgText({
      text: certificateId || "",
      x: COORDS.tcCodeValue.x,
      y: COORDS.tcCodeValue.y,
      fontSize: FONTS.metaData.size,
      fontWeight: FONTS.metaData.weight,
      color: FONTS.metaData.color,
      width: canvasWidth,
      height: canvasHeight,
    }),
  });

  // --- 4. FOOTER URL ---
  composites.push({
    input: makeSvgText({
      text: shorten(reportUrl, 60),
      x: COORDS.reportUrlValue.x,
      y: COORDS.reportUrlValue.y,
      fontSize: FONTS.smallMuted.size,
      fontWeight: FONTS.smallMuted.weight,
      color: FONTS.smallMuted.color,
      width: canvasWidth,
      height: canvasHeight,
    }),
  });

  // --- 5. QR CODE ---
  const qrSize = Math.max(
    32,
    Math.min(COORDS.qr.size, canvasWidth, canvasHeight)
  );

  const qrBuffer = await QRCode.toBuffer(reportUrl, {
    margin: 1,
    width: qrSize,
    color: {
      dark: "#000000",
      light: "#0000", // transparent background
    },
  });

  const qrX = Math.min(Math.max(0, COORDS.qr.x), canvasWidth - qrSize);
  const qrY = Math.min(Math.max(0, COORDS.qr.y), canvasHeight - qrSize);

  composites.push({
    input: qrBuffer,
    top: qrY,
    left: qrX,
  });

  const finalBuffer = await sharp(templateBuffer)
    .composite(composites)
    .png()
    .toBuffer();

  const key = `seals/${product.id}-${certificateId}.png`;
  return { buffer: finalBuffer, key };
}

export async function generateSeal({
  product,
  certificateId,
  ratingScore,
  ratingLabel,
  appUrl,
  licenseDate = null,
  templatePath = DEFAULT_TEMPLATE,
  outputDir = DEFAULT_OUTPUT_DIR,
}: SealInput) {
  // TODO: remove once all callers migrate to generateSealForS3
  const { buffer, key } = await generateSealForS3({
    product,
    certificateId,
    ratingScore,
    ratingLabel,
    appUrl,
    licenseDate,
    templatePath,
  });

  const fileName = path.basename(key);
  const outFile = path.join(outputDir, fileName);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outFile, buffer);
  const rel = outFile.split(`${path.sep}public${path.sep}`)[1] || outFile;
  const normalized = rel.replace(/\\/g, "/");
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}
