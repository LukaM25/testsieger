import { AdminRole } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, logAdminAudit } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

const date = z
  .string()
  .nullable()
  .optional()
  .transform((v) => (v ? new Date(v) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), 'DATE');

const Training = z.object({
  title: z.string().trim().min(2).max(160),
  topic: z.string().trim().min(2).max(160),
  dueAt: date,
  participantsTotal: z.coerce.number().int().min(0).max(100000).default(0),
  participantsDone: z.coerce.number().int().min(0).max(100000).default(0),
  completed: z.boolean().optional(),
});

const Deadline = z.object({
  kind: z.enum(['dokument', 'unterweisung', 'begehung']),
  title: z.string().trim().min(2).max(160),
  detail: z.string().trim().max(300).nullable().optional(),
  dueAt: z.string().min(8).transform((v) => new Date(v)).refine((d) => !Number.isNaN(d.getTime()), 'DATE'),
});

const Body = z.discriminatedUnion('type', [
  z.object({ type: z.literal('training'), id: z.string().optional(), data: Training.partial().optional() }),
  z.object({ type: z.literal('deadline'), id: z.string().optional(), done: z.boolean().optional(), data: Deadline.partial().optional() }),
]);

async function guard(ctx: Ctx) {
  const admin = await requireAdmin(AdminRole.EXAMINER).catch(() => null);
  if (!admin) return { error: NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 }) } as const;
  const { id } = await ctx.params;
  const exists = await prisma.aSOrganization.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return { error: NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 }) } as const;
  return { admin, orgId: id } as const;
}

const bad = () => NextResponse.json({ error: 'Bitte Eingaben prüfen.' }, { status: 400 });

/** Unterweisung oder Frist anlegen. */
export async function POST(req: Request, ctx: Ctx) {
  const g = await guard(ctx);
  if ('error' in g) return g.error;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad();
  const body = parsed.data;

  if (body.type === 'training') {
    const t = Training.safeParse(body.data ?? {});
    if (!t.success) return bad();
    const created = await prisma.aSTraining.create({
      data: {
        organizationId: g.orgId,
        title: t.data.title,
        topic: t.data.topic,
        dueAt: t.data.dueAt,
        participantsTotal: t.data.participantsTotal,
        participantsDone: Math.min(t.data.participantsDone, t.data.participantsTotal),
      },
    });
    await logAdminAudit({ adminId: g.admin.id, action: 'AS_TRAINING_CREATED', entityType: 'ASTraining', entityId: created.id, payload: { organizationId: g.orgId } });
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  }

  const d = Deadline.safeParse(body.data ?? {});
  if (!d.success) return bad();
  const created = await prisma.aSDeadline.create({
    data: { organizationId: g.orgId, kind: d.data.kind, title: d.data.title, detail: d.data.detail || null, dueAt: d.data.dueAt },
  });
  await logAdminAudit({ adminId: g.admin.id, action: 'AS_DEADLINE_CREATED', entityType: 'ASDeadline', entityId: created.id, payload: { organizationId: g.orgId } });
  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}

/** Ändern: Unterweisung (Fortschritt, abschließen) oder Frist (erledigt). */
export async function PATCH(req: Request, ctx: Ctx) {
  const g = await guard(ctx);
  if ('error' in g) return g.error;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !parsed.data.id) return bad();
  const body = parsed.data;

  if (body.type === 'training') {
    const existing = await prisma.aSTraining.findFirst({ where: { id: body.id, organizationId: g.orgId } });
    if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    const d = body.data ?? {};
    const total = d.participantsTotal ?? existing.participantsTotal;
    const done = Math.min(d.participantsDone ?? existing.participantsDone, total);
    await prisma.aSTraining.update({
      where: { id: existing.id },
      data: {
        ...(d.title ? { title: d.title } : {}),
        ...(d.topic ? { topic: d.topic } : {}),
        ...(d.dueAt !== undefined ? { dueAt: d.dueAt } : {}),
        participantsTotal: total,
        participantsDone: done,
        completedAt: d.completed === undefined ? existing.completedAt : d.completed ? new Date() : null,
      },
    });
    await logAdminAudit({ adminId: g.admin.id, action: 'AS_TRAINING_UPDATED', entityType: 'ASTraining', entityId: existing.id, payload: { organizationId: g.orgId } });
    return NextResponse.json({ ok: true });
  }

  const existing = await prisma.aSDeadline.findFirst({ where: { id: body.id, organizationId: g.orgId } });
  if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  await prisma.aSDeadline.update({
    where: { id: existing.id },
    data: { doneAt: body.done === undefined ? existing.doneAt : body.done ? new Date() : null },
  });
  await logAdminAudit({ adminId: g.admin.id, action: 'AS_DEADLINE_UPDATED', entityType: 'ASDeadline', entityId: existing.id, payload: { organizationId: g.orgId, done: body.done } });
  return NextResponse.json({ ok: true });
}

/** Löschen: ?type=training|deadline&recordId=… */
export async function DELETE(req: Request, ctx: Ctx) {
  const g = await guard(ctx);
  if ('error' in g) return g.error;
  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  const recordId = url.searchParams.get('recordId') || '';

  const res =
    type === 'training'
      ? await prisma.aSTraining.deleteMany({ where: { id: recordId, organizationId: g.orgId } })
      : type === 'deadline'
        ? await prisma.aSDeadline.deleteMany({ where: { id: recordId, organizationId: g.orgId } })
        : null;
  if (!res || res.count === 0) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  await logAdminAudit({ adminId: g.admin.id, action: `AS_${type!.toUpperCase()}_DELETED`, entityType: type === 'training' ? 'ASTraining' : 'ASDeadline', entityId: recordId, payload: { organizationId: g.orgId } });
  return NextResponse.json({ ok: true });
}
