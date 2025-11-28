import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";

const SHEET_LINK =
  "https://docs.google.com/spreadsheets/d/1uwauj30aZ4KpwSHBL3Yi6yB85H_OQypI5ogKuR82KFk/edit?usp=sharing";

function toCsvLink(link: string) {
  if (link.includes("/export?format=csv")) return link;
  const base = link.split("/edit", 1)[0];
  return `${base}/export?format=csv`;
}

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id: productId } = await params;

  try {
    const res = await fetch(toCsvLink(SHEET_LINK));
    if (!res.ok) {
      return NextResponse.json({ error: `Sheet fetch failed: ${res.status}` }, { status: 502 });
    }
    const csv = await res.text();
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="rating-${productId}.csv"`,
      },
    });
  } catch (err: any) {
    console.error("RATING_SHEET_DOWNLOAD_ERROR", err);
    return NextResponse.json({ error: "FAILED_TO_DOWNLOAD_SHEET" }, { status: 500 });
  }
}
