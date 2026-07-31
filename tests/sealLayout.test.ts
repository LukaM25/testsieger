import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import QRCode from "qrcode";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { generateSealForS3 } from "@/lib/seal";

const REF_WIDTH = 1621;
const REF_HEIGHT = 2048;
const QR_X = 963;
const QR_Y = 1328;
const QR_SIZE = Math.round(383 * 0.9);
const TEXT_SAFE_RIGHT = QR_X - 36;
const FOOTER_SAFE_RIGHT = 1500;

let tempDir = "";
let templatePath = "";
let qrTransparencyTemplatePath = "";

function expectSolidWhite(buffer: Buffer) {
  expect(buffer.every((channel) => channel === 255)).toBe(true);
}

describe("seal information layout", () => {
  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "seal-layout-"));
    templatePath = path.join(tempDir, "blank-template.png");
    qrTransparencyTemplatePath = path.join(tempDir, "qr-transparency-template.png");
    await sharp({
      create: {
        width: REF_WIDTH,
        height: REF_HEIGHT,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .png()
      .toFile(templatePath);

    await sharp({
      create: {
        width: REF_WIDTH,
        height: REF_HEIGHT,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([
        {
          input: {
            create: {
              width: QR_SIZE,
              height: QR_SIZE,
              channels: 4,
              background: { r: 160, g: 160, b: 160, alpha: 1 },
            },
          },
          left: QR_X,
          top: QR_Y,
        },
      ])
      .png()
      .toFile(qrTransparencyTemplatePath);
  });

  afterAll(async () => {
    if (tempDir) await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function generateLongValueSeal(customTemplatePath = templatePath) {
    return generateSealForS3({
      product: {
        id: "layout-test-product",
        name: "SX175 Speedbike Professional Indoor Exercise Edition",
        brand: "SPORTSTECH International Premium Products",
        createdAt: new Date("2026-07-21T00:00:00.000Z"),
      },
      certificateId: "70dc0fbf-230b-46b7-a505-951000000000",
      verificationCode: "70dc0fbf-230b-46b7-a505-951000000000",
      sealNumber: "70dc0fbf-230b-46b7-a505-951000000000",
      tcCode: "cmrkggina000123456789-extra-long-process-code",
      ratingScore: "1.2",
      ratingLabel: "SEHR GUT",
      appUrl: "https://a-very-long-certificate-hostname.example.com",
      licenseDate: new Date("2026-07-21T00:00:00.000Z"),
      templatePath: customTemplatePath,
    });
  }

  it("keeps product, brand, and TC text out of the QR safety gap", async () => {
    const generated = await generateLongValueSeal();
    const safetyGap = await sharp(generated.buffer)
      .extract({
        left: TEXT_SAFE_RIGHT + 1,
        top: 1280,
        width: QR_X - TEXT_SAFE_RIGHT - 1,
        height: 340,
      })
      .removeAlpha()
      .raw()
      .toBuffer();

    expectSolidWhite(safetyGap);
  });

  it("clips a long report URL at the information panel boundary", async () => {
    const generated = await generateLongValueSeal();
    const areaPastFooterBoundary = await sharp(generated.buffer)
      .extract({
        left: FOOTER_SAFE_RIGHT + 1,
        top: 1685,
        width: REF_WIDTH - FOOTER_SAFE_RIGHT - 1,
        height: 75,
      })
      .removeAlpha()
      .raw()
      .toBuffer();

    expectSolidWhite(areaPastFooterBoundary);
  });

  it("renders partially transparent light modules over the QR background", async () => {
    const generated = await generateLongValueSeal(qrTransparencyTemplatePath);
    const reportUrl =
      "https://a-very-long-certificate-hostname.example.com/s/951000000000";
    const expectedQr = await QRCode.toBuffer(reportUrl, {
      margin: 2,
      width: QR_SIZE,
      color: { dark: "#000000", light: "#FFFFFF66" },
    });
    const expectedComposite = await sharp({
      create: {
        width: QR_SIZE,
        height: QR_SIZE,
        channels: 4,
        background: { r: 160, g: 160, b: 160, alpha: 1 },
      },
    })
      .composite([{ input: expectedQr }])
      .png()
      .toBuffer();

    const [actualPixels, expectedPixels] = await Promise.all([
      sharp(generated.buffer)
        .extract({ left: QR_X, top: QR_Y, width: QR_SIZE, height: QR_SIZE })
        .ensureAlpha()
        .raw()
        .toBuffer(),
      sharp(expectedComposite).ensureAlpha().raw().toBuffer(),
    ]);

    expect(actualPixels.equals(expectedPixels)).toBe(true);
  });

  it("does not expose a certificate ID when the TC code is missing", async () => {
    const commonInput = {
      product: {
        id: "missing-tc-product",
        name: "Short product",
        brand: "Short brand",
        createdAt: new Date("2026-07-21T00:00:00.000Z"),
      },
      verificationCode: "70dc0fbf-230b-46b7-a505-951000000000",
      sealNumber: "70dc0fbf-230b-46b7-a505-951000000000",
      tcCode: null,
      ratingScore: "1.2",
      ratingLabel: "SEHR GUT",
      appUrl: "https://dpi-siegel.de",
      licenseDate: new Date("2026-07-21T00:00:00.000Z"),
      templatePath,
    };
    const [first, second] = await Promise.all([
      generateSealForS3({ ...commonInput, certificateId: "certificate-id-one" }),
      generateSealForS3({ ...commonInput, certificateId: "certificate-id-two" }),
    ]);

    expect(first.buffer.equals(second.buffer)).toBe(true);
  });

  it("removes the TC prefix from the visible seal value", async () => {
    const commonInput = {
      product: {
        id: "tc-prefix-product",
        name: "Short product",
        brand: "Short brand",
        createdAt: new Date("2026-07-21T00:00:00.000Z"),
      },
      certificateId: "certificate-tc-prefix",
      verificationCode: "70dc0fbf-230b-46b7-a505-951000000000",
      sealNumber: "70dc0fbf-230b-46b7-a505-951000000000",
      ratingScore: "1.2",
      ratingLabel: "SEHR GUT",
      appUrl: "https://dpi-siegel.de",
      licenseDate: new Date("2026-07-21T00:00:00.000Z"),
      templatePath,
    };
    const [prefixed, numeric] = await Promise.all([
      generateSealForS3({ ...commonInput, tcCode: "TC-21843" }),
      generateSealForS3({ ...commonInput, tcCode: "21843" }),
    ]);

    expect(prefixed.buffer.equals(numeric.buffer)).toBe(true);
  });
});
