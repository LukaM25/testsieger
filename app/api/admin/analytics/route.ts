import { NextResponse } from "next/server";
import { AdminRole, Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
const CONVERSION_EVENTS = [
  "precheck_submit",
  "checkout_start",
  "payment_success",
  "contact_submit",
] as const;

const EVENT_LABELS: Record<string, string> = {
  page_view: "Seitenaufrufe",
  cta_click: "CTA-Klicks",
  precheck_submit: "Precheck-Anfragen",
  checkout_start: "Checkout gestartet",
  payment_success: "Zahlungen",
  contact_submit: "Kontaktanfragen",
};

type CountRow = { count: number | bigint | null };
type DailyRow = {
  day: string;
  pageViews: number | bigint | null;
  visitors: number | bigint | null;
  conversions: number | bigint | null;
};
type TopPageRow = { path: string | null; count: number | bigint | null };
type SourceRow = { source: string | null; count: number | bigint | null };
type EventCountRow = { name: string; count: number | bigint | null };

function parseDays(value: string | null) {
  const parsed = value ? Number.parseInt(value, 10) : 30;
  if ([7, 30, 90].includes(parsed)) return parsed;
  return 30;
}

function toNumber(value: number | bigint | null | undefined) {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  return 0;
}

function percentageChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function fillDailyRows(days: number, since: Date, rows: DailyRow[]) {
  const byDay = new Map(
    rows.map((row) => [
      row.day,
      {
        day: row.day,
        pageViews: toNumber(row.pageViews),
        visitors: toNumber(row.visitors),
        conversions: toNumber(row.conversions),
      },
    ]),
  );

  return Array.from({ length: days }, (_, index) => {
    const day = isoDay(new Date(since.getTime() + index * DAY_MS));
    return byDay.get(day) ?? { day, pageViews: 0, visitors: 0, conversions: 0 };
  });
}

export async function GET(request: Request) {
  const admin = await requireAdmin(AdminRole.VIEWER).catch(() => null);
  if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const days = parseDays(searchParams.get("days"));
  const now = new Date();
  const since = new Date(now.getTime() - days * DAY_MS);
  const previousSince = new Date(since.getTime() - days * DAY_MS);

  if (process.env.ADMIN_DB_BYPASS === "true") {
    return NextResponse.json({
      days,
      totals: { events: 0, pageViews: 0, visitors: 0, conversions: 0 },
      changes: { pageViews: 0, visitors: 0, conversions: 0 },
      eventCounts: [],
      topPages: [],
      sources: [],
      daily: fillDailyRows(days, since, []),
      generatedAt: now.toISOString(),
      warning: "Datenbank-Zugriff ist deaktiviert (ADMIN_DB_BYPASS).",
    });
  }

  try {
    const [
      totalEvents,
      pageViews,
      previousPageViews,
      conversions,
      previousConversions,
      visitorRows,
      previousVisitorRows,
      eventRows,
      topPages,
      sources,
      dailyRows,
    ] = await Promise.all([
      prisma.analyticsEvent.count({ where: { createdAt: { gte: since } } }),
      prisma.analyticsEvent.count({ where: { name: "page_view", createdAt: { gte: since } } }),
      prisma.analyticsEvent.count({
        where: { name: "page_view", createdAt: { gte: previousSince, lt: since } },
      }),
      prisma.analyticsEvent.count({
        where: { name: { in: [...CONVERSION_EVENTS] }, createdAt: { gte: since } },
      }),
      prisma.analyticsEvent.count({
        where: { name: { in: [...CONVERSION_EVENTS] }, createdAt: { gte: previousSince, lt: since } },
      }),
      prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(DISTINCT "sessionId")::int AS count
        FROM "AnalyticsEvent"
        WHERE "createdAt" >= ${since} AND "sessionId" IS NOT NULL
      `,
      prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(DISTINCT "sessionId")::int AS count
        FROM "AnalyticsEvent"
        WHERE "createdAt" >= ${previousSince} AND "createdAt" < ${since} AND "sessionId" IS NOT NULL
      `,
      prisma.$queryRaw<EventCountRow[]>`
        SELECT "name", COUNT(*)::int AS count
        FROM "AnalyticsEvent"
        WHERE "createdAt" >= ${since}
        GROUP BY "name"
        ORDER BY count DESC
      `,
      prisma.$queryRaw<TopPageRow[]>`
        SELECT "path", COUNT(*)::int AS count
        FROM "AnalyticsEvent"
        WHERE "createdAt" >= ${since} AND "name" = 'page_view' AND "path" IS NOT NULL
        GROUP BY "path"
        ORDER BY count DESC
        LIMIT 8
      `,
      prisma.$queryRaw<SourceRow[]>`
        SELECT COALESCE(NULLIF("source", ''), 'direct') AS source, COUNT(*)::int AS count
        FROM "AnalyticsEvent"
        WHERE "createdAt" >= ${since}
        GROUP BY source
        ORDER BY count DESC
        LIMIT 8
      `,
      prisma.$queryRaw<DailyRow[]>`
        SELECT
          to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
          COUNT(*) FILTER (WHERE "name" = 'page_view')::int AS "pageViews",
          COUNT(DISTINCT "sessionId")::int AS visitors,
          COUNT(*) FILTER (WHERE "name" IN (${Prisma.join([...CONVERSION_EVENTS])}))::int AS conversions
        FROM "AnalyticsEvent"
        WHERE "createdAt" >= ${since}
        GROUP BY day
        ORDER BY day ASC
      `,
    ]);

    const visitors = toNumber(visitorRows[0]?.count);
    const previousVisitors = toNumber(previousVisitorRows[0]?.count);

    return NextResponse.json({
      days,
      totals: {
        events: totalEvents,
        pageViews,
        visitors,
        conversions,
      },
      changes: {
        pageViews: percentageChange(pageViews, previousPageViews),
        visitors: percentageChange(visitors, previousVisitors),
        conversions: percentageChange(conversions, previousConversions),
      },
      eventCounts: eventRows.map((row) => ({
        name: row.name,
        label: EVENT_LABELS[row.name] ?? row.name,
        count: toNumber(row.count),
      })),
      topPages: topPages.map((row) => ({
        path: row.path ?? "/",
        count: toNumber(row.count),
      })),
      sources: sources.map((row) => ({
        source: row.source || "direct",
        count: toNumber(row.count),
      })),
      daily: fillDailyRows(days, since, dailyRows),
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("ADMIN_ANALYTICS_LOAD_FAILED", error);
    return NextResponse.json(
      { error: "ANALYTICS_UNAVAILABLE" },
      { status: 500 },
    );
  }
}
