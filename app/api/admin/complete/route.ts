import { NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { createPdfDocument, getDocumentCard } from '@/lib/pdfmonkey';
import path from 'path';
import { promises as fs } from 'fs';
import QRCode from 'qrcode';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  try {
    const authed = await isAdminAuthed();
    if (!authed) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const { productId } = await req.json();
    if (!productId) return NextResponse.json({ error: 'MISSING_PRODUCT_ID' }, { status: 400 });

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { user: true, certificate: true },
    });
    if (!product) return NextResponse.json({ error: 'PRODUCT_NOT_FOUND' }, { status: 404 });
    if (product.certificate) return NextResponse.json({ error: 'CERT_EXISTS' }, { status: 400 });

    // Enforce PAID or IN_REVIEW before completion
    if (!['PAID', 'IN_REVIEW'].includes(product.status)) {
      return NextResponse.json({ error: 'INVALID_STATUS' }, { status: 400 });
    }

    // 1) Create PDF via PDFMonkey
    const payload = {
      product_name: product.name,
      brand: product.brand,
      code: product.code,
      specs: product.specs,
      size: product.size,
      made_in: product.madeIn,
      material: product.material,
      customer_name: product.user.name,
      customer_email: product.user.email,
      // Add whatever your template expects
      standard: 'Prüfsiegel Zentrum UG Standard 2025',
      date: new Date().toISOString().slice(0, 10),
    };

    const created = await createPdfDocument(payload);
    let card = created;

    // 2) Poll until ready (max ~20s)
    const start = Date.now();
    while (card.status !== 'success') {
      if (card.status === 'failure') {
        return NextResponse.json({ error: 'PDF_GENERATION_FAILED' }, { status: 500 });
      }
      if (Date.now() - start > 20000) break;
      await new Promise(r => setTimeout(r, 1500));
      card = await getDocumentCard(created.id);
    }

    if (card.status !== 'success' || !card.downloadUrl) {
      // store doc id so you can fetch later; for now bail with clear error
      await prisma.certificate.create({
        data: {
          productId: product.id,
          pdfUrl: '',
          qrUrl: '',
          seal_number: `PENDING-${created.id}`,
          pdfmonkeyDocumentId: created.id,
        },
      });
      return NextResponse.json({ error: 'PDF_NOT_READY_YET', documentId: created.id }, { status: 202 });
    }

    // 3) Generate seal + QR + store assets (local public dir)
    const seal = await generateSeal();
    const verifyUrl = `${process.env.APP_URL}/verify/${seal}`;

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const qrDir = path.join(process.cwd(), 'public', 'qr');
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(qrDir, { recursive: true });

    // Download PDFMonkey file and save under public/uploads
    const pdfResp = await fetch(card.downloadUrl);
    if (!pdfResp.ok) return NextResponse.json({ error: 'PDF_DOWNLOAD_FAILED' }, { status: 500 });
    const pdfBuf = Buffer.from(await pdfResp.arrayBuffer());
    const pdfRel = `/uploads/REPORT_${seal}.pdf`;
    const pdfAbs = path.join(uploadsDir, `REPORT_${seal}.pdf`);
    await fs.writeFile(pdfAbs, pdfBuf);

    const qrPng = await QRCode.toBuffer(verifyUrl, { margin: 1, width: 512 });
    const qrRel = `/qr/${seal}.png`;
    const qrAbs = path.join(qrDir, `${seal}.png`);
    await fs.writeFile(qrAbs, qrPng);

    // 4) Create certificate + mark completed
    const cert = await prisma.certificate.create({
      data: {
        productId: product.id,
        pdfUrl: pdfRel,
        qrUrl: qrRel,
        seal_number: seal,
        pdfmonkeyDocumentId: created.id,
      },
    });

    await prisma.product.update({
      where: { id: product.id },
      data: { status: 'COMPLETED' },
    });

    // 5) Email customer (fire-and-forget)
    sendCompletionEmail({
      to: product.user.email,
      name: product.user.name,
      productName: product.name,
      verifyUrl,
      pdfUrl: pdfRel,
      qrUrl: qrRel,
    }).catch(e => console.error('Resend email error', e));

    return NextResponse.json({
      ok: true,
      message: `Zertifikat erstellt. Verifikation: ${verifyUrl}`,
      verifyUrl,
      certId: cert.id,
    });
  } catch (e: any) {
    console.error('ADMIN_COMPLETE_ERROR', e);
    return NextResponse.json({ error: e?.message || 'COMPLETE_FAILED' }, { status: 500 });
  }
}

async function generateSeal() {
  for (let i = 0; i < 5; i++) {
    const part = Math.random().toString(36).slice(2, 8).toUpperCase();
    const seal = `PS-${new Date().getFullYear()}-${part}`;
    const exists = await prisma.certificate.findUnique({ where: { seal_number: seal } }).catch(() => null);
    if (!exists) return seal;
  }
  throw new Error('SEAL_GENERATION_FAILED');
}

async function sendCompletionEmail(opts: {
  to: string; name: string; productName: string;
  verifyUrl: string; pdfUrl: string; qrUrl: string;
}) {
  const { to, name, productName, verifyUrl, pdfUrl, qrUrl } = opts;
  const from = process.env.MAIL_FROM ?? 'no-reply@your-domain.tld';
  await resend.emails.send({
    from,
    to,
    subject: `Prüfung abgeschlossen – ${productName}`,
    html: `
      <div style="font-family:system-ui,Arial">
        <p>Hallo ${escapeHtml(name)},</p>
        <p>Die Prüfung Ihres Produkts <strong>${escapeHtml(productName)}</strong> ist abgeschlossen.</p>
        <ul>
          <li>Verifikation: <a href="${verifyUrl}">${verifyUrl}</a></li>
          <li>Prüfbericht (PDF): <a href="${pdfUrl}">${pdfUrl}</a></li>
          <li>QR-Code: <a href="${qrUrl}">${qrUrl}</a></li>
        </ul>
        <p>Vielen Dank!<br/>Prüfsiegel Zentrum UG</p>
      </div>
    `,
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}
