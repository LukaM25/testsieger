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
  templatePath?: string;
  outputDir?: string;
};

const REF_WIDTH = 1780;
const REF_HEIGHT = 2048;

const FONTS = {
  ratingScore: { size: 160, weight: 700, color: "#000000" },
  ratingLabel: { size: 80, weight: 700, color: "#000000" },
  body: { size: 40, weight: 400, color: "#000000" },
  bodyMuted: { size: 40, weight: 400, color: "#7f7f7f" },
  smallMuted: { size: 28, weight: 400, color: "#7f7f7f" },
};

const DEFAULT_TEMPLATE = path.join(process.cwd(), "public", "template", "template_siegel.png");
const DEFAULT_OUTPUT_DIR = path.join(process.cwd(), "public", "uploads", "seals");

function formatTestDate(date: Date) {
  try {
    return new Intl.DateTimeFormat("de-DE", { month: "2-digit", year: "2-digit" }).format(date);
  } catch {
    return "";
  }
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
}) {
  const anchor = align === "center" ? "middle" : "start";
  const anchorX = align === "center" ? width / 2 : x;
  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .t { font-family: 'Inter', 'Arial', sans-serif; }
      </style>
      <text x="${anchorX}" y="${y}" text-anchor="${anchor}" class="t" font-size="${fontSize}" font-weight="${fontWeight}" fill="${color}">
        ${text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
      </text>
    </svg>`
  );
}

export async function generateSeal({
  product,
  certificateId,
  ratingScore,
  ratingLabel,
  appUrl,
  templatePath = DEFAULT_TEMPLATE,
  outputDir = DEFAULT_OUTPUT_DIR,
}: SealInput) {
  const templateMeta = await sharp(templatePath).metadata();
  const canvasWidth = templateMeta.width ?? REF_WIDTH;
  const canvasHeight = templateMeta.height ?? REF_HEIGHT;

  // Scale coordinates relative to reference template dimensions
  const scaleX = canvasWidth / REF_WIDTH;
  const scaleY = canvasHeight / REF_HEIGHT;
  const COORDS = {
    ratingScoreY: Math.round(920 * scaleY),
    ratingLabelY: Math.round(1060 * scaleY),
    productPos: { x: Math.round(820 * scaleX), y: Math.round(1415 * scaleY) },
    brandPos: { x: Math.round(820 * scaleX), y: Math.round(1475 * scaleY) },
    testDatePos: { x: Math.round(430 * scaleX), y: Math.round(1575 * scaleY) },
    tcCodePos: { x: Math.round(1000 * scaleX), y: Math.round(1575 * scaleY) },
    dpiLinePos: { x: Math.round(430 * scaleX), y: Math.round(1665 * scaleY) },
    reportUrlPos: { x: Math.round(430 * scaleX), y: Math.round(1740 * scaleY) },
    qr: { x: Math.round(1180 * scaleX), y: Math.round(1480 * scaleY), size: Math.round(300 * scaleX) },
  };
  const reportUrl = `${appUrl.replace(/\/$/, "")}/lizenzen?q=${certificateId}`;

  // Use the original template buffer with alpha
  const templateBuffer = await sharp(templatePath).ensureAlpha().toBuffer();

  const composites: sharp.OverlayOptions[] = [];

  // Rating center aligned
  composites.push({
    input: makeSvgText({
      text: ratingScore,
      x: 0,
      y: COORDS.ratingScoreY,
      fontSize: FONTS.ratingScore.size,
      fontWeight: FONTS.ratingScore.weight,
      color: FONTS.ratingScore.color,
      align: "center",
      width: canvasWidth,
      height: canvasHeight,
    }),
  });
  composites.push({
    input: makeSvgText({
      text: ratingLabel.toUpperCase(),
      x: 0,
      y: COORDS.ratingLabelY,
      fontSize: FONTS.ratingLabel.size,
      fontWeight: FONTS.ratingLabel.weight,
      color: FONTS.ratingLabel.color,
      align: "center",
      width: canvasWidth,
      height: canvasHeight,
    }),
  });

  // Product + brand
  composites.push({
    input: makeSvgText({
      text: product.name,
      x: COORDS.productPos.x,
      y: COORDS.productPos.y,
      fontSize: FONTS.body.size,
      fontWeight: FONTS.body.weight,
      color: FONTS.body.color,
      width: canvasWidth,
      height: canvasHeight,
    }),
  });
  composites.push({
    input: makeSvgText({
      text: product.brand ?? "",
      x: COORDS.brandPos.x,
      y: COORDS.brandPos.y,
      fontSize: FONTS.body.size,
      fontWeight: FONTS.body.weight,
      color: FONTS.body.color,
      width: canvasWidth,
      height: canvasHeight,
    }),
  });

  // Dates and metadata
  const testDate = formatTestDate(product.createdAt);
  if (testDate) {
    composites.push({
      input: makeSvgText({
        text: testDate,
        x: COORDS.testDatePos.x,
        y: COORDS.testDatePos.y,
        fontSize: FONTS.body.size,
        fontWeight: FONTS.body.weight,
        color: FONTS.bodyMuted.color,
        width: canvasWidth,
        height: canvasHeight,
      }),
    });
  }

  // TC code placeholder (blank)
  composites.push({
    input: makeSvgText({
      text: "",
      x: COORDS.tcCodePos.x,
      y: COORDS.tcCodePos.y,
      fontSize: FONTS.body.size,
      fontWeight: FONTS.body.weight,
      color: FONTS.bodyMuted.color,
      width: canvasWidth,
      height: canvasHeight,
    }),
  });

  composites.push({
    input: makeSvgText({
      text: "Nach DPI Standart geprüft",
      x: COORDS.dpiLinePos.x,
      y: COORDS.dpiLinePos.y,
      fontSize: FONTS.body.size,
      fontWeight: FONTS.body.weight,
      color: FONTS.bodyMuted.color,
      width: canvasWidth,
      height: canvasHeight,
    }),
  });
  composites.push({
    input: makeSvgText({
      text: reportUrl,
      x: COORDS.reportUrlPos.x,
      y: COORDS.reportUrlPos.y,
      fontSize: FONTS.smallMuted.size,
      fontWeight: FONTS.smallMuted.weight,
      color: FONTS.smallMuted.color,
      width: canvasWidth,
      height: canvasHeight,
    }),
  });

  // QR code
  const qrSize = Math.max(32, Math.min(COORDS.qr.size, canvasWidth, canvasHeight));
  const qrX = Math.min(Math.max(0, COORDS.qr.x), canvasWidth - qrSize);
  const qrY = Math.min(Math.max(0, COORDS.qr.y), canvasHeight - qrSize);
  const qrBuffer = await QRCode.toBuffer(reportUrl, { margin: 0, width: qrSize });
  composites.push({
    input: qrBuffer,
    top: qrY,
    left: qrX,
  });

  const outFile = path.join(outputDir, `seal_${product.id}.png`);
  await fs.mkdir(outputDir, { recursive: true });

  const final = await sharp(templateBuffer).composite(composites).png().toBuffer();

  await fs.writeFile(outFile, final);
  const rel = outFile.split(`${path.sep}public${path.sep}`)[1] || outFile;
  const normalized = rel.replace(/\\/g, "/");
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}
