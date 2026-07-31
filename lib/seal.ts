import fs from "fs/promises";
import path from "path";
import QRCode from "qrcode";
import sharp from "sharp";
import { buildShortSealVerificationUrl } from "@/lib/licenseVerification";

type SealInput = {
  product: { id: string; name: string; brand: string | null; createdAt: Date };
  certificateId: string;
  verificationCode?: string | null;
  sealNumber?: string | null;
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
const TC_CODE_FONT_SCALE = 1.18;
const INFO_TEXT_SCALE_X = 0.81;
const INFO_VALUE_GAP = 20;
const INFO_TEXT_QR_GAP = 36;
const INFO_PANEL_RIGHT = 1500;
const INFO_MIN_SINGLE_LINE_SCALE = 0.72;
const INFO_WRAPPED_BODY_SCALE = 0.54;
const INFO_WRAPPED_LINE_HEIGHT = 50;
const QR_QUIET_ZONE_MODULES = 2;
const QR_LIGHT_MODULE_ALPHA = "66";

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

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
  clip,
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
  clip?: { x: number; width: number };
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

  let textContent = escapeXml(text);
  if (tightenCommaBy > 0 && text.includes(",")) {
    const commaIndex = text.indexOf(",");
    const before = escapeXml(text.slice(0, commaIndex));
    const after = escapeXml(text.slice(commaIndex));
    textContent = `${before}<tspan dx="-${tightenCommaBy}">${after}</tspan>`;
  }

  const clipDefinition = clip
    ? `<defs><clipPath id="text-clip"><rect x="${clip.x}" y="0" width="${clip.width}" height="${height}" /></clipPath></defs>`
    : "";
  const clipAttribute = clip ? `clip-path="url(#text-clip)"` : "";

  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${clipDefinition}
      <style>
        ${fontFace}
        .t { font-family: 'DIN Condensed', 'Arial', 'Helvetica', sans-serif; }
      </style>
      <g ${clipAttribute}>
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
      </g>
    </svg>`
  );
}

type TextMeasurementOptions = {
  fontSize: number;
  fontWeight: number;
  fontDataUrl?: string | null;
  scaleX: number;
};

async function measureRenderedTextWidth(
  text: string,
  { fontSize, fontWeight, fontDataUrl, scaleX }: TextMeasurementOptions,
) {
  if (!text) return 0;

  const padding = Math.max(24, Math.ceil(fontSize));
  const width = Math.min(
    32768,
    Math.max(1024, Math.ceil((text.length + 4) * fontSize * 1.35)),
  );
  const height = Math.max(256, Math.ceil(fontSize * 3));
  const input = makeSvgText({
    text,
    x: padding,
    y: Math.ceil(fontSize * 1.7),
    fontSize,
    fontWeight,
    color: "#000000",
    fontDataUrl,
    scaleX,
    width,
    height,
  });
  const { info } = await sharp(input)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer({ resolveWithObject: true });

  return info.width;
}

async function truncateTextToRenderedWidth(
  text: string,
  maxWidth: number,
  options: TextMeasurementOptions,
) {
  if ((await measureRenderedTextWidth(text, options)) <= maxWidth) return text;

  const suffix = "…";
  let low = 0;
  let high = text.length;
  let best = suffix;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const candidate = `${text.slice(0, middle).trimEnd()}${suffix}`;
    const candidateWidth = await measureRenderedTextWidth(candidate, options);

    if (candidateWidth <= maxWidth) {
      best = candidate;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return best;
}

async function splitIntoMeasuredTwoLines(
  text: string,
  maxWidth: number,
  options: TextMeasurementOptions,
) {
  const words = text.split(" ");
  if (words.length < 2) return null;

  let best: { lines: [string, string]; score: number } | null = null;

  for (let index = 1; index < words.length; index += 1) {
    const first = words.slice(0, index).join(" ");
    const second = words.slice(index).join(" ");
    const [firstWidth, secondWidth] = await Promise.all([
      measureRenderedTextWidth(first, options),
      measureRenderedTextWidth(second, options),
    ]);

    if (firstWidth > maxWidth || secondWidth > maxWidth) continue;

    const score = Math.max(firstWidth, secondWidth) * 2 + Math.abs(firstWidth - secondWidth);
    if (!best || score < best.score) {
      best = { lines: [first, second], score };
    }
  }

  if (best) return best.lines;

  let splitIndex = 1;
  for (let index = 1; index < words.length; index += 1) {
    const candidate = words.slice(0, index + 1).join(" ");
    if ((await measureRenderedTextWidth(candidate, options)) > maxWidth) break;
    splitIndex = index + 1;
  }

  const first = await truncateTextToRenderedWidth(
    words.slice(0, splitIndex).join(" "),
    maxWidth,
    options,
  );
  const second = await truncateTextToRenderedWidth(
    words.slice(splitIndex).join(" "),
    maxWidth,
    options,
  );

  return second ? ([first, second] as [string, string]) : null;
}

async function fitTextToWidth({
  text,
  maxWidth,
  preferredFontSize,
  fontWeight,
  fontDataUrl,
  scaleX,
  maxLines,
  minSingleLineScale = INFO_MIN_SINGLE_LINE_SCALE,
  wrappedFontScale = INFO_WRAPPED_BODY_SCALE,
  wrappedLineHeight,
}: {
  text: string;
  maxWidth: number;
  preferredFontSize: number;
  fontWeight: number;
  fontDataUrl?: string | null;
  scaleX: number;
  maxLines: 1 | 2;
  minSingleLineScale?: number;
  wrappedFontScale?: number;
  wrappedLineHeight: number;
}) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return { lines: [] as string[], fontSize: preferredFontSize, lineHeight: 0 };

  const preferredOptions = {
    fontSize: preferredFontSize,
    fontWeight,
    fontDataUrl,
    scaleX,
  };
  const preferredWidth = await measureRenderedTextWidth(normalized, preferredOptions);
  if (preferredWidth <= maxWidth) {
    return { lines: [normalized], fontSize: preferredFontSize, lineHeight: 0 };
  }

  const minSingleLineFontSize = Math.max(
    1,
    Math.round(preferredFontSize * minSingleLineScale),
  );
  const proportionalFontSize = Math.min(
    preferredFontSize - 1,
    Math.floor((preferredFontSize * maxWidth) / preferredWidth) - 1,
  );

  if (proportionalFontSize >= minSingleLineFontSize) {
    const proportionalOptions = { ...preferredOptions, fontSize: proportionalFontSize };
    if (
      (await measureRenderedTextWidth(normalized, proportionalOptions)) <= maxWidth
    ) {
      return { lines: [normalized], fontSize: proportionalFontSize, lineHeight: 0 };
    }
  }

  if (maxLines === 2) {
    const wrappedFontSize = Math.max(
      1,
      Math.round(preferredFontSize * wrappedFontScale),
    );
    const wrappedOptions = { ...preferredOptions, fontSize: wrappedFontSize };
    const lines = await splitIntoMeasuredTwoLines(normalized, maxWidth, wrappedOptions);
    if (lines) {
      return { lines, fontSize: wrappedFontSize, lineHeight: wrappedLineHeight };
    }
  }

  const fallbackOptions = { ...preferredOptions, fontSize: minSingleLineFontSize };
  const fallbackText = await truncateTextToRenderedWidth(
    normalized,
    maxWidth,
    fallbackOptions,
  );
  return { lines: [fallbackText], fontSize: minSingleLineFontSize, lineHeight: 0 };
}

async function makeFittedTextOverlays({
  text,
  x,
  y,
  maxWidth,
  fontSize,
  fontWeight,
  color,
  fontDataUrl,
  scaleX,
  width,
  height,
  maxLines,
  minSingleLineScale,
  wrappedFontScale,
  wrappedLineHeight,
}: {
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  fontSize: number;
  fontWeight: number;
  color: string;
  fontDataUrl?: string | null;
  scaleX: number;
  width: number;
  height: number;
  maxLines: 1 | 2;
  minSingleLineScale?: number;
  wrappedFontScale?: number;
  wrappedLineHeight: number;
}): Promise<sharp.OverlayOptions[]> {
  const fitted = await fitTextToWidth({
    text,
    maxWidth,
    preferredFontSize: fontSize,
    fontWeight,
    fontDataUrl,
    scaleX,
    maxLines,
    minSingleLineScale,
    wrappedFontScale,
    wrappedLineHeight,
  });
  const firstLineY =
    fitted.lines.length === 1 ? y : y - Math.round(fitted.lineHeight / 2);

  return fitted.lines.map((line, index) => ({
    input: makeSvgText({
      text: line,
      x,
      y: firstLineY + index * fitted.lineHeight,
      fontSize: fitted.fontSize,
      fontWeight,
      color,
      fontDataUrl,
      scaleX,
      width,
      height,
      clip: { x: Math.max(0, x - 2), width: maxWidth + 2 },
    }),
  }));
}

export async function generateSealForS3({
  product,
  certificateId,
  verificationCode = null,
  sealNumber = null,
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
      x: Math.round((565 + 157 + 12) * scaleX),
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

  const reportUrl = buildShortSealVerificationUrl(appUrl, sealNumber, {
    licenseCode: verificationCode,
    certificateId,
    productId: product.id,
  });
  const tcCodeValue = tcCode?.trim().replace(/^TC-/i, "") || "—";
  const infoFontSizes = {
    body: Math.round(INFO_FONT_SIZES.body * scaleY),
    metaData: Math.round(INFO_FONT_SIZES.metaData * scaleY),
    smallMuted: Math.round(INFO_FONT_SIZES.smallMuted * scaleY),
  };
  const wrappedLineHeight = Math.round(INFO_WRAPPED_LINE_HEIGHT * scaleY);
  const infoTextMaxWidth = (x: number) =>
    Math.max(80, COORDS.qr.x - x - Math.round(INFO_TEXT_QR_GAP * scaleX));
  const footerTextMaxWidth = Math.max(
    80,
    Math.round(INFO_PANEL_RIGHT * scaleX) - COORDS.reportUrlValue.x,
  );

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
  composites.push(
    ...(await makeFittedTextOverlays({
      text: product.name,
      x: COORDS.productValue.x,
      y: COORDS.productValue.y,
      maxWidth: infoTextMaxWidth(COORDS.productValue.x),
      fontSize: infoFontSizes.body,
      fontWeight: FONTS.body.weight,
      color: FONTS.body.color,
      fontDataUrl,
      scaleX: INFO_TEXT_SCALE_X,
      width: canvasWidth,
      height: canvasHeight,
      maxLines: 2,
      wrappedLineHeight,
    })),
  );

  composites.push(
    ...(await makeFittedTextOverlays({
      text: product.brand || "",
      x: COORDS.brandValue.x,
      y: COORDS.brandValue.y,
      maxWidth: infoTextMaxWidth(COORDS.brandValue.x),
      fontSize: infoFontSizes.body,
      fontWeight: FONTS.body.weight,
      color: FONTS.body.color,
      fontDataUrl,
      scaleX: INFO_TEXT_SCALE_X,
      width: canvasWidth,
      height: canvasHeight,
      maxLines: 2,
      wrappedLineHeight,
    })),
  );

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

  composites.push(
    ...(await makeFittedTextOverlays({
      text: tcCodeValue || "",
      x: COORDS.tcCodeValue.x,
      y: COORDS.tcCodeValue.y,
      maxWidth: infoTextMaxWidth(COORDS.tcCodeValue.x),
      // The template's baked-in "TC Code:" label is visually taller than the
      // other metadata labels, so match the generated value to that label.
      fontSize: Math.round(infoFontSizes.metaData * TC_CODE_FONT_SCALE),
      fontWeight: FONTS.metaData.weight,
      color: FONTS.metaData.color,
      fontDataUrl,
      scaleX: INFO_TEXT_SCALE_X,
      width: canvasWidth,
      height: canvasHeight,
      maxLines: 1,
      minSingleLineScale: 0.84,
      wrappedLineHeight,
    })),
  );

  // --- 4. FOOTER URL ---
  composites.push(
    ...(await makeFittedTextOverlays({
      text: reportUrl,
      x: COORDS.reportUrlValue.x,
      y: COORDS.reportUrlValue.y,
      maxWidth: footerTextMaxWidth,
      fontSize: infoFontSizes.smallMuted,
      fontWeight: FONTS.smallMuted.weight,
      color: FONTS.smallMuted.color,
      fontDataUrl,
      scaleX: INFO_TEXT_SCALE_X,
      width: canvasWidth,
      height: canvasHeight,
      maxLines: 1,
      minSingleLineScale: 0.86,
      wrappedLineHeight,
    })),
  );

  // --- 5. QR CODE ---
  const qrSize = Math.max(
    32,
    Math.min(COORDS.qr.size, canvasWidth, canvasHeight)
  );

  const qrBuffer = await QRCode.toBuffer(reportUrl, {
    margin: QR_QUIET_ZONE_MODULES,
    width: qrSize,
    color: {
      dark: "#000000",
      light: `#FFFFFF${QR_LIGHT_MODULE_ALPHA}`,
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
  verificationCode = null,
  sealNumber = null,
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
    verificationCode,
    sealNumber,
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
