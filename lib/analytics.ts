import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { readCookieConsentFromHeader } from "@/lib/cookieConsent";

export const ANALYTICS_EVENT_NAMES = [
  "page_view",
  "cta_click",
  "precheck_submit",
  "precheck_invite_submit",
  "precheck_invite_claim",
  "checkout_start",
  "payment_success",
  "contact_submit",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

type RecordAnalyticsEventInput = {
  name: AnalyticsEventName;
  path?: string | null;
  referrer?: string | null;
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  sessionId?: string | null;
  userId?: string | null;
  productId?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  userAgent?: string | null;
  ip?: string | null;
};

function truncate(value: string | null | undefined, max = 500) {
  if (!value) return null;
  return value.slice(0, max);
}

function normalizeMetadata(metadata: Prisma.InputJsonValue | null | undefined) {
  if (!metadata) return undefined;
  const serialized = JSON.stringify(metadata);
  if (serialized.length > 5000) return undefined;
  return metadata;
}

export function hashIp(ip: string | null | undefined) {
  if (!ip) return null;
  const salt = process.env.ANALYTICS_HASH_SALT || process.env.JWT_SECRET || "";
  if (!salt) return null;
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export async function recordAnalyticsEvent(input: RecordAnalyticsEventInput) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        name: input.name,
        path: truncate(input.path, 1000),
        referrer: truncate(input.referrer, 1000),
        source: truncate(input.source, 120),
        medium: truncate(input.medium, 120),
        campaign: truncate(input.campaign, 240),
        sessionId: truncate(input.sessionId, 120),
        userId: truncate(input.userId, 120),
        productId: truncate(input.productId, 120),
        metadata: normalizeMetadata(input.metadata),
        userAgent: truncate(input.userAgent, 500),
        ipHash: hashIp(input.ip),
      },
    });
  } catch (error) {
    console.error("ANALYTICS_EVENT_RECORD_FAILED", {
      name: input.name,
      error,
    });
  }
}

export function isAnalyticsEventName(value: string): value is AnalyticsEventName {
  return (ANALYTICS_EVENT_NAMES as readonly string[]).includes(value);
}

export function hasAnalyticsConsent(request: Request) {
  return readCookieConsentFromHeader(request.headers.get("cookie"))?.analytics === true;
}
