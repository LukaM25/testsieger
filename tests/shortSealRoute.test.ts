import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: { certificate: { findMany } },
}));

import { GET } from "@/app/s/[code]/route";

describe("short seal redirect", () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it("resolves a short suffix to the full seal number", async () => {
    findMany.mockResolvedValue([
      { seal_number: "70dc0fbf-230b-46b7-a505-95118644472d" },
    ]);

    const response = await GET(
      new Request("https://dpi-siegel.de/s/95118644472d"),
      { params: Promise.resolve({ code: "95118644472d" }) },
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://dpi-siegel.de/lizenzen?q=70dc0fbf-230b-46b7-a505-95118644472d#lizenzsuche",
    );
  });

  it("keeps the short code when no unique match exists", async () => {
    findMany.mockResolvedValue([]);

    const response = await GET(
      new Request("https://dpi-siegel.de/s/UNKNOWN"),
      { params: Promise.resolve({ code: "UNKNOWN" }) },
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://dpi-siegel.de/lizenzen?q=UNKNOWN#lizenzsuche",
    );
  });
});
