import { AdminRole } from '@prisma/client';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { orgInclude, toDashboardData } from '@/lib/arbeitssicherheit/data';
import { buildCompliance } from '@/lib/arbeitssicherheit/compliance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Liste aller Betriebe mit Ampelstatus, die dringendsten zuerst. */
export async function GET() {
  const admin = await requireAdmin(AdminRole.VIEWER).catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const orgs = await prisma.aSOrganization.findMany({
    include: { ...orgInclude, user: { select: { id: true, name: true, email: true, active: true } } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  const rank = { action: 0, attention: 1, ok: 2 } as const;
  const rows = orgs
    .map((org) => {
      const c = buildCompliance(toDashboardData(org));
      return {
        id: org.id,
        name: org.name,
        industry: org.industry,
        employees: org.employees,
        bg: org.bg,
        createdAt: org.createdAt.toISOString(),
        contact: { name: org.user.name, email: org.user.email },
        level: c.level,
        okCount: c.okCount,
        total: c.total,
        openActions: c.actions.length,
        urgentActions: c.actions.filter((a) => a.priority === 0).length,
        nextInspection: org.nextInspectionAt ? org.nextInspectionAt.toISOString() : null,
      };
    })
    .sort((a, b) => rank[a.level] - rank[b.level] || b.urgentActions - a.urgentActions);

  return NextResponse.json({ organizations: rows });
}
