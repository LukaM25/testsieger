import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import {
  ANALYTICS_EVENT_NAMES,
  isAnalyticsEventName,
  recordAnalyticsEvent,
} from "@/lib/analytics";
import { readCookieConsentFromHeader } from "@/lib/cookieConsent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ANALYTICS_SESSION_COOKIE = "dpi_analytics_sid";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const AnalyticsPayloadSchema = z.object({
  name: z.enum(ANALYTICS_EVENT_NAMES),
  path: z.string().max(1000).optional().nullable(),
  referrer: z.string().max(1000).optional().nullable(),
  source: z.string().max(120).optional().nullable(),
  medium: z.string().max(120).optional().nullable(),
  campaign: z.string().max(240).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return req.headers.get("x-real-ip");
}

function inferSource(payload: z.infer<typeof AnalyticsPayloadSchema>) {
  if (payload.source) return payload.source;
  if (!payload.referrer) return "direct";

  try {
    const referrerHost = new URL(payload.referrer).hostname.replace(/^www\./, "");
    return referrerHost || "referral";
  } catch {
    return "referral";
  }
}

function toPrismaJson(value: Record<string, unknown> | undefined) {
  if (!value) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function POST(req: NextRequest) {
  const parsed = AnalyticsPayloadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !isAnalyticsEventName(parsed.data.name)) {
    return NextResponse.json({ ok: false, error: "INVALID_EVENT" }, { status: 400 });
  }

  const payload = parsed.data;
  if (payload.path?.startsWith("/admin")) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  if (readCookieConsentFromHeader(req.headers.get("cookie"))?.analytics !== true) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const existingSessionId = req.cookies.get(ANALYTICS_SESSION_COOKIE)?.value;
  const sessionId = existingSessionId || randomUUID();
  const ip = getClientIp(req);

  await recordAnalyticsEvent({
    name: payload.name,
    path: payload.path,
    referrer: payload.referrer,
    source: inferSource(payload),
    medium: payload.medium,
    campaign: payload.campaign,
    sessionId,
    metadata: toPrismaJson(payload.metadata),
    userAgent: req.headers.get("user-agent"),
    ip,
  });

  const res = NextResponse.json({ ok: true });
  if (!existingSessionId) {
    res.cookies.set(ANALYTICS_SESSION_COOKIE, sessionId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  }

  return res;
}
