"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSealForS3 = generateSealForS3;
exports.generateSeal = generateSeal;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const qrcode_1 = __importDefault(require("qrcode"));
const sharp_1 = __importDefault(require("sharp"));
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
const DEFAULT_TEMPLATE = path_1.default.join(process.cwd(), "siegeltemplate.png");
const DEFAULT_OUTPUT_DIR = path_1.default.join(process.cwd(), "public", "uploads", "seals");
const FONT_PATH = path_1.default.join(process.cwd(), "public", "D-DinCondensed.otf");
let cachedFontDataUrl;
async function getFontDataUrl() {
    if (cachedFontDataUrl !== undefined)
        return cachedFontDataUrl;
    try {
        const fontBuffer = await promises_1.default.readFile(FONT_PATH);
        cachedFontDataUrl = `data:font/opentype;base64,${fontBuffer.toString("base64")}`;
    }
    catch (err) {
        console.warn("SEAL_FONT_LOAD_FAILED", err);
        cachedFontDataUrl = null;
    }
    return cachedFontDataUrl;
}
function formatTestDate(date) {
    try {
        return new Intl.DateTimeFormat("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(date);
    }
    catch {
        return "";
    }
}
function shorten(input, max = 28) {
    if (!input)
        return "";
    return input.length > max ? `${input.slice(0, max)}...` : input;
}
function makeSvgText({ text, x, y, fontSize, fontWeight, color, fontDataUrl, scaleX = 1, align = "left", width, height, stretch = false, letterSpacing = 0, tightenCommaBy = 0, }) {
    const anchor = align === "center" ? "middle" : "start";
    // Scaling logic for "tall" look
    const scaleY = stretch ? 1.3 : 1;
    const adjustedY = scaleY === 1 ? y : y / scaleY;
    const adjustedX = scaleX === 1 ? x : x / scaleX;
    const transform = scaleX !== 1 || scaleY !== 1 ? `transform="scale(${scaleX}, ${scaleY})"` : "";
    // If centering, use the provided X (which might include an offset) as the center point
    const anchorX = align === "center" ? adjustedX : adjustedX;
    const fontFace = fontDataUrl
        ? `@font-face { font-family: 'DIN Condensed'; src: url('${fontDataUrl}') format('opentype'); }`
        : "";
    const escapeXml = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    let textContent = escapeXml(text);
    if (tightenCommaBy > 0 && text.includes(",")) {
        const commaIndex = text.indexOf(",");
        const before = escapeXml(text.slice(0, commaIndex));
        const after = escapeXml(text.slice(commaIndex));
        textContent = `${before}<tspan dx="-${tightenCommaBy}">${after}</tspan>`;
    }
    return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
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
    </svg>`);
}
async function generateSealForS3({ product, certificateId, tcCode, ratingScore, ratingLabel, appUrl, licenseDate = null, templatePath = DEFAULT_TEMPLATE, }) {
    const fontDataUrl = await getFontDataUrl();
    const templateMeta = await (0, sharp_1.default)(templatePath).metadata();
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
    const templateBuffer = await (0, sharp_1.default)(templatePath).ensureAlpha().toBuffer();
    const composites = [];
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
    const qrSize = Math.max(32, Math.min(COORDS.qr.size, canvasWidth, canvasHeight));
    const qrBuffer = await qrcode_1.default.toBuffer(reportUrl, {
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
    const finalBuffer = await (0, sharp_1.default)(templateBuffer)
        .composite(composites)
        .png()
        .toBuffer();
    const key = `seals/${product.id}-${certificateId}.png`;
    return { buffer: finalBuffer, key };
}
async function generateSeal({ product, certificateId, tcCode, ratingScore, ratingLabel, appUrl, licenseDate = null, templatePath = DEFAULT_TEMPLATE, outputDir = DEFAULT_OUTPUT_DIR, }) {
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
    const fileName = path_1.default.basename(key);
    const outFile = path_1.default.join(outputDir, fileName);
    await promises_1.default.mkdir(outputDir, { recursive: true });
    await promises_1.default.writeFile(outFile, buffer);
    const rel = outFile.split(`${path_1.default.sep}public${path_1.default.sep}`)[1] || outFile;
    const normalized = rel.replace(/\\/g, "/");
    return normalized.startsWith("/") ? normalized : `/${normalized}`;
}
