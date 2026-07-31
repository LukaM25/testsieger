import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const { code: rawCode } = await params;
  const code = rawCode.trim().slice(0, 128);
  const destination = new URL("/lizenzen", request.url);

  if (!code) return NextResponse.redirect(destination, 307);

  const matches = await prisma.certificate.findMany({
    where: {
      OR: [{ seal_number: code }, { seal_number: { endsWith: code } }],
    },
    select: { seal_number: true },
    take: 2,
  });

  destination.searchParams.set(
    "q",
    matches.length === 1 ? matches[0].seal_number : code,
  );
  destination.hash = "lizenzsuche";
  return NextResponse.redirect(destination, 307);
}
