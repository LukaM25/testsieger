import { AdminRole } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, logAdminAudit } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { buildCompliance } from '@/lib/arbeitssicherheit/compliance';
import { toDashboardData } from '@/lib/arbeitssicherheit/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

const detailInclude = {
  documents: { orderBy: { updatedAt: 'desc' as const } },
  trainings: { orderBy: { createdAt: 'desc' as const } },
  deadlines: { orderBy: { dueAt: 'asc' as const } },
  user: { select: { id: true, name: true, email: true, active: true } },
};

export async function GET(_req: Request, ctx: Ctx) {
  const admin = await requireAdmin(AdminRole.VIEWER).catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await ctx.params;

  const org = await prisma.aSOrganization.findUnique({ where: { id }, include: detailInclude });
  if (!org) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  // Ampelstatus wie ihn der Kunde sieht (nur offene Fristen)
  const compliance = buildCompliance(toDashboardData({ ...org, deadlines: org.deadlines.filter((d) => !d.doneAt) }));

  return NextResponse.json({
    organization: {
      id: org.id,
      name: org.name,
      legalForm: org.legalForm,
      industry: org.industry,
      employees: org.employees,
      locations: org.locations,
      bg: org.bg,
      memberNumber: org.memberNumber,
      phone: org.phone,
      contactRole: org.contactRole,
      risks: org.risks,
      existing: org.existing,
      notes: org.notes,
      nextInspectionAt: org.nextInspectionAt?.toISOString() ?? null,
      createdAt: org.createdAt.toISOString(),
      user: org.user,
      documents: org.documents.map((d) => ({
        id: d.id,
        categoryId: d.categoryId,
        title: d.title,
        fileName: d.fileName,
        hasFile: Boolean(d.assetKey),
        validUntil: d.validUntil?.toISOString() ?? null,
        updatedAt: d.updatedAt.toISOString(),
      })),
      trainings: org.trainings.map((t) => ({
        id: t.id,
        title: t.title,
        topic: t.topic,
        dueAt: t.dueAt?.toISOString() ?? null,
        completedAt: t.completedAt?.toISOString() ?? null,
        participantsDone: t.participantsDone,
        participantsTotal: t.participantsTotal,
      })),
      deadlines: org.deadlines.map((d) => ({
        id: d.id,
        kind: d.kind,
        title: d.title,
        detail: d.detail,
        dueAt: d.dueAt.toISOString(),
        doneAt: d.doneAt?.toISOString() ?? null,
      })),
    },
    compliance: {
      level: compliance.level,
      headline: compliance.headline,
      okCount: compliance.okCount,
      total: compliance.total,
      pillars: compliance.pillars.map((p) => ({ id: p.id, title: p.title, state: p.state, stateLabel: p.stateLabel })),
      actions: compliance.actions.map((a) => ({ id: a.id, priority: a.priority, title: a.title, when: a.when ?? null })),
    },
  });
}

const PatchSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  legalForm: z.string().trim().max(60).nullable().optional(),
  industry: z.string().trim().min(2).max(100).optional(),
  employees: z.coerce.number().int().min(1).max(100000).optional(),
  locations: z.coerce.number().int().min(1).max(1000).optional(),
  bg: z.string().trim().max(60).nullable().optional(),
  memberNumber: z.string().trim().max(40).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  contactRole: z.string().trim().max(80).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  nextInspectionAt: z.string().nullable().optional(),
});

export async function PATCH(req: Request, ctx: Ctx) {
  const admin = await requireAdmin(AdminRole.EXAMINER).catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await ctx.params;

  const parsed = PatchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Bitte Eingaben prüfen.' }, { status: 400 });
  const { nextInspectionAt, ...rest } = parsed.data;

  const data: Record<string, unknown> = { ...rest };
  if (nextInspectionAt !== undefined) {
    if (nextInspectionAt === null || nextInspectionAt === '') data.nextInspectionAt = null;
    else {
      const d = new Date(nextInspectionAt);
      if (Number.isNaN(d.getTime())) return NextResponse.json({ error: 'Ungültiges Datum.' }, { status: 400 });
      data.nextInspectionAt = d;
    }
  }

  try {
    await prisma.aSOrganization.update({ where: { id }, data });
  } catch {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
  await logAdminAudit({ adminId: admin.id, action: 'AS_ORG_UPDATED', entityType: 'ASOrganization', entityId: id, payload: Object.keys(data) });
  return NextResponse.json({ ok: true });
}
