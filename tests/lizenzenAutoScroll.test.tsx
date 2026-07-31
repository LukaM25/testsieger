import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LizenzenClient from "@/app/lizenzen/LizenzenClient";

vi.mock("next/navigation", () => ({
  useSearchParams: () =>
    new URLSearchParams(
      "q=70dc0fbf-230b-46b7-a505-95118644472d",
    ),
}));

describe("license verification auto-scroll", () => {
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    scrollIntoView.mockReset();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
  });

  it("opens the exact product and scrolls to the search results", async () => {
    render(
      <LizenzenClient
        products={[
          {
            id: "product-sx175",
            name: "SX175 Speedbike",
            brand: "SPORTSTECH",
            category: "Fitness",
            madeIn: null,
            processNumber: null,
            certificate: {
              id: "certificate-sx175",
              seal_number: "70dc0fbf-230b-46b7-a505-95118644472d",
              pdfUrl: null,
              reportUrl: null,
              createdAt: new Date("2026-07-21T00:00:00.000Z"),
            },
            license: {
              id: "license-sx175",
              licenseCode: "70dc0fbf-230b-46b7-a505-95118644472d",
              status: "ACTIVE",
            },
            user: { company: "SPORTSTECH" },
          },
        ]}
      />,
    );

    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      });
    });

    expect(screen.getByText("Gültig & Geprüft")).toBeTruthy();
  });
});
