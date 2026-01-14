import fs from "fs/promises";
import path from "path";
import QRCode from "qrcode";
import sharp from "sharp";

type SealInput = {
  product: { id: string; name: string; brand: string | null; createdAt: Date };
  certificateId: string;
  tcCode?: string | null;
  ratingScore: string;
  ratingLabel: string;
  appUrl: string;
  licenseDate?: Date | null;
  templatePath?: string;
  outputDir?: string;
};

const REF_WIDTH = 1621;
const REF_HEIGHT = 2048;

// Fonts configuration
const FONTS = {
  // Gold bar
  ratingScore: { size: 455, weight: 900, color: "#ffffff" },
  ratingLabel: { size: 340, weight: 900, color: "#ffffff" },

  // Main white box values (Produkt/Marke)
  body: { weight: 700, color: "#000000" },

  // Meta data
  metaData: { weight: 600, color: "#7F7F7F" },

  // Footer URL
  smallMuted: { weight: 400, color: "#7F7F7F" },
};
const INFO_FONT_SIZES = {
  body: 90,
  metaData: 42,
  smallMuted: 35,
};
const INFO_TEXT_SCALE_X = 0.81;
const INFO_VALUE_GAP = 20;

const DEFAULT_TEMPLATE = path.join(process.cwd(), "siegeltemplate.png");
const DEFAULT_OUTPUT_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "seals"
);
const FONT_PATH = path.join(process.cwd(), "public", "D-DinCondensed.otf");

let cachedFontDataUrl: string | null | undefined;

export type GeneratedSeal = {
  buffer: Buffer;
  key: string; // logical storage key for S3
};

async function getFontDataUrl() {
  if (cachedFontDataUrl !== undefined) return cachedFontDataUrl;
  try {
    const fontBuffer = await fs.readFile(FONT_PATH);
    cachedFontDataUrl = `data:font/opentype;base64,${fontBuffer.toString("base64")}`;
  } catch (err) {
    console.warn("SEAL_FONT_LOAD_FAILED", err);
    cachedFontDataUrl = null;
  }
  return cachedFontDataUrl;
}

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
  fontDataUrl,
  scaleX = 1,
  align = "left",
  width,
  height,
  stretch = false,
  letterSpacing = 0,
  tightenCommaBy = 0,
}: {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: number;
  color: string;
  fontDataUrl?: string | null;
  scaleX?: number;
  align?: "left" | "center";
  width: number;
  height: number;
  stretch?: boolean;
  letterSpacing?: number;
  tightenCommaBy?: number;
}) {
  const anchor = align === "center" ? "middle" : "start";

  // Scaling logic for "tall" look
  const scaleY = stretch ? 1.3 : 1;
  const adjustedY = scaleY === 1 ? y : y / scaleY;
  const adjustedX = scaleX === 1 ? x : x / scaleX;
  const transform =
    scaleX !== 1 || scaleY !== 1 ? `transform="scale(${scaleX}, ${scaleY})"` : "";

  // If centering, use the provided X (which might include an offset) as the center point
  const anchorX = align === "center" ? adjustedX : adjustedX;

  const fontFace = fontDataUrl
    ? `@font-face { font-family: 'DIN Condensed'; src: url('${fontDataUrl}') format('opentype'); }`
    : "";

  const escapeXml = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let textContent = escapeXml(text);
  if (tightenCommaBy > 0 && text.includes(",")) {
    const commaIndex = text.indexOf(",");
    const before = escapeXml(text.slice(0, commaIndex));
    const after = escapeXml(text.slice(commaIndex));
    textContent = `${before}<tspan dx="-${tightenCommaBy}">${after}</tspan>`;
  }

  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        ${fontFace}
        .t { font-family: 'DIN Condensed', 'Arial', 'Helvetica', sans-serif; }
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
        ${textContent}
      </text>
    </svg>`
  );
}

export async function generateSealForS3({
  product,
  certificateId,
  tcCode,
  ratingScore,
  ratingLabel,
  appUrl,
  licenseDate = null,
  templatePath = DEFAULT_TEMPLATE,
}: SealInput): Promise<GeneratedSeal> {
  const fontDataUrl = await getFontDataUrl();
  const templateMeta = await sharp(templatePath).metadata();
  const canvasWidth = templateMeta.width ?? REF_WIDTH;
  const canvasHeight = templateMeta.height ?? REF_HEIGHT;

  const scaleX = canvasWidth / REF_WIDTH;
  const scaleY = canvasHeight / REF_HEIGHT;

  // --- FINAL COORDINATES V9 ---
  const COORDS = {
    // Gold Band (Unchanged)
    ratingCenterX: Math.round(713 * scaleX),
    ratingScoreY: Math.round(851 * scaleY),
    ratingLabelY: Math.round(1151 * scaleY),

    // White Box Values
    productValue: {
      x: Math.round((174 + 270 + INFO_VALUE_GAP) * scaleX),
      y: Math.round(1371 * scaleY),
    },
    brandValue: {
      x: Math.round((175 + 220 + INFO_VALUE_GAP) * scaleX),
      y: Math.round(1469 * scaleY),
    },

    // Meta Row (Unchanged)
    testDateValue: {
      x: Math.round((161 + 198 + 6) * scaleX),
      y: Math.round(1568 * scaleY),
    },
    // TC Code (Unchanged)
    tcCodeValue: {
      x: Math.round((565 + 157 + 2) * scaleX),
      y: Math.round(1576 * scaleY),
    },

    // Bottom URL (Unchanged)
    reportUrlValue: {
      x: Math.round((166 + 261 + INFO_VALUE_GAP - 8) * scaleX),
      y: Math.round(1734 * scaleY),
    },

    // QR Code (Unchanged)
    qr: {
      x: Math.round((943 + 20) * scaleX),
      y: Math.round(1328 * scaleY),
      size: Math.round(383 * scaleX * 0.9),
    },
  };

  const reportUrl = `${appUrl.replace(/\/$/, "")}/lizenzen?q=${certificateId}`;
  const tcCodeValue = tcCode ?? certificateId;
  const infoFontSizes = {
    body: Math.round(INFO_FONT_SIZES.body * scaleY),
    metaData: Math.round(INFO_FONT_SIZES.metaData * scaleY),
    smallMuted: Math.round(INFO_FONT_SIZES.smallMuted * scaleY),
  };

  const templateBuffer = await sharp(templatePath).ensureAlpha().toBuffer();
  const composites: sharp.OverlayOptions[] = [];

  // --- 1. RATING (Gold Bar) ---
  const ratingCenterX = COORDS.ratingCenterX;
  const displayScore = ratingScore.replace(".", ",");

  composites.push({
    input: makeSvgText({
      text: displayScore,
      x: ratingCenterX,
      y: COORDS.ratingScoreY,
      fontSize: FONTS.ratingScore.size,
      fontWeight: FONTS.ratingScore.weight,
      color: FONTS.ratingScore.color,
      fontDataUrl,
      scaleX: 0.94,
      align: "center",
      width: canvasWidth,
      height: canvasHeight,
      letterSpacing: 4.5,
      tightenCommaBy: Math.round(FONTS.ratingScore.size * 0.015),
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
      fontDataUrl,
      scaleX: 0.7,
      align: "center",
      width: canvasWidth,
      height: canvasHeight,
      letterSpacing: 0,
    }),
  });

  // --- 2. PRODUCT DETAILS ---
  composites.push({
    input: makeSvgText({
      text: shorten(product.name, 28),
      x: COORDS.productValue.x,
      y: COORDS.productValue.y,
      fontSize: infoFontSizes.body,
      fontWeight: FONTS.body.weight,
      color: FONTS.body.color,
      fontDataUrl,
      scaleX: INFO_TEXT_SCALE_X,
      width: canvasWidth,
      height: canvasHeight,
    }),
  });

  composites.push({
    input: makeSvgText({
      text: product.brand ? shorten(product.brand, 28) : "",
      x: COORDS.brandValue.x,
      y: COORDS.brandValue.y,
      fontSize: infoFontSizes.body,
      fontWeight: FONTS.body.weight,
      color: FONTS.body.color,
      fontDataUrl,
      scaleX: INFO_TEXT_SCALE_X,
      width: canvasWidth,
      height: canvasHeight,
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
        fontSize: infoFontSizes.metaData,
        fontWeight: FONTS.metaData.weight,
        color: FONTS.metaData.color,
        fontDataUrl,
        scaleX: INFO_TEXT_SCALE_X,
        width: canvasWidth,
        height: canvasHeight,
      }),
    });
  }

  composites.push({
    input: makeSvgText({
      text: tcCodeValue || "",
      x: COORDS.tcCodeValue.x,
      y: COORDS.tcCodeValue.y,
      fontSize: infoFontSizes.metaData,
      fontWeight: FONTS.metaData.weight,
      color: FONTS.metaData.color,
      fontDataUrl,
      scaleX: INFO_TEXT_SCALE_X,
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
      fontSize: infoFontSizes.smallMuted,
      fontWeight: FONTS.smallMuted.weight,
      color: FONTS.smallMuted.color,
      fontDataUrl,
      scaleX: INFO_TEXT_SCALE_X,
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
  tcCode,
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
    tcCode,
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
