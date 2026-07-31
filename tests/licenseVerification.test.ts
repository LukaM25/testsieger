import { describe, expect, it } from "vitest";
import {
  buildShortSealVerificationUrl,
  getShortSealCode,
} from "@/lib/licenseVerification";

describe("short seal verification links", () => {
  it("uses the final UUID segment as the public short code", () => {
    expect(getShortSealCode("70dc0fbf-230b-46b7-a505-95118644472d")).toBe(
      "95118644472d",
    );
    expect(
      buildShortSealVerificationUrl(
        "https://dpi-siegel.de/",
        "70dc0fbf-230b-46b7-a505-95118644472d",
        {},
      ),
    ).toBe("https://dpi-siegel.de/s/95118644472d");
  });

  it("keeps already-readable seal numbers intact", () => {
    expect(getShortSealCode("PS-2026-ABC123")).toBe("PS-2026-ABC123");
    expect(
      buildShortSealVerificationUrl(
        "https://dpi-siegel.de",
        "PS-2026-ABC123",
        {},
      ),
    ).toBe("https://dpi-siegel.de/s/PS-2026-ABC123");
  });

  it("falls back to the existing license URL when no seal number exists", () => {
    expect(
      buildShortSealVerificationUrl("https://dpi-siegel.de", null, {
        certificateId: "certificate-123",
      }),
    ).toBe("https://dpi-siegel.de/lizenzen?q=certificate-123#lizenzsuche");
  });
});
