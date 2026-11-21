import crypto from 'crypto';
import { AdminRole } from '@prisma/client';
import { NextResponse } from 'next/server';
import { requireAdmin, logAdminAudit } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { saveBufferToS3, deleteKey, MAX_UPLOAD_BYTES } from '@/lib/storage';
import { DOC_CATEGORIES } from '@/lib/arbeitssicherheit/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

const ALLOWED = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const safeName = (n: string) => n.replace(/[^\w.\-]+/g, '_').slice(0, 120) || 'datei';

/** Unterlage anlegen, mit oder ohne Datei (multipart/form-data). */
export async function POST(req: Request, ctx: Ctx) {
  const admin = await requireAdmin(AdminRole.EXAMINER).catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await ctx.params;

  const org = await prisma.aSOrganization.findUnique({ where: { id }, select: { id: true } });
  if (!org) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });

  const categoryId = String(form.get('categoryId') || '');
  const title = String(form.get('title') || '').trim();
  const validUntilRaw = String(form.get('validUntil') || '').trim();
  const file = form.get('file');

  if (!DOC_CATEGORIES.some((c) => c.id === categoryId)) return NextResponse.json({ error: 'Bitte ein Thema wählen.' }, { status: 400 });
  if (title.length < 2) return NextResponse.json({ error: 'Bitte einen Titel angeben.' }, { status: 400 });

  let validUntil: Date | null = null;
  if (validUntilRaw) {
    validUntil = new Date(validUntilRaw);
    if (Number.isNaN(validUntil.getTime())) return NextResponse.json({ error: 'Ungültiges Datum.' }, { status: 400 });
  }

  let assetKey: string | null = null;
  let fileName: string | null = null;
  let contentType: string | null = null;

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: 'Datei zu groß (max. 20 MB).' }, { status: 400 });
    if (!ALLOWED.has(file.type)) return NextResponse.json({ error: 'Erlaubt sind PDF, Bilder, Word und Excel.' }, { status: 400 });
    fileName = safeName(file.name);
    contentType = file.type;
    assetKey = `arbeitssicherheit/${id}/${crypto.randomUUID()}-${fileName}`;
    try {
      await saveBufferToS3({ key: assetKey, body: Buffer.from(await file.arrayBuffer()), contentType });
    } catch (err) {
      console.error('AS_DOC_UPLOAD_FAILED', err);
      return NextResponse.json({ error: 'Upload fehlgeschlagen. Ist der Speicher (S3) eingerichtet?' }, { status: 502 });
    }
  }

  const doc = await prisma.aSDocument.create({
    data: { organizationId: id, categoryId, title, fileName, assetKey, contentType, validUntil },
  });
  await logAdminAudit({ adminId: admin.id, action: 'AS_DOC_CREATED', entityType: 'ASDocument', entityId: doc.id, payload: { organizationId: id, categoryId, hasFile: Boolean(assetKey) } });
  return NextResponse.json({ ok: true, id: doc.id }, { status: 201 });
}

/** Unterlage löschen: ?docId=… */
export async function DELETE(req: Request, ctx: Ctx) {
  const admin = await requireAdmin(AdminRole.EXAMINER).catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await ctx.params;
  const docId = new URL(req.url).searchParams.get('docId') || '';

  const doc = await prisma.aSDocument.findFirst({ where: { id: docId, organizationId: id }, select: { id: true, assetKey: true } });
  if (!doc) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  await prisma.aSDocument.delete({ where: { id: doc.id } });
  if (doc.assetKey) await deleteKey(doc.assetKey).catch((err) => console.error('AS_DOC_DELETE_KEY_FAILED', err));
  await logAdminAudit({ adminId: admin.id, action: 'AS_DOC_DELETED', entityType: 'ASDocument', entityId: doc.id, payload: { organizationId: id } });
  return NextResponse.json({ ok: true });
}
