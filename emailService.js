import { Pool } from 'pg';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode'; // <--- NEW IMPORT
import { readFile } from 'fs/promises';
import path from 'path';
import { generateCertificatePdf } from './pdfGenerator'; 

const SHEET_LINK = process.env.RATING_SHEET_LINK || "https://docs.google.com/spreadsheets/d/1uwauj30aZ4KpwSHBL3Yi6yB85H_OQypI5ogKuR82KFk/edit?usp=sharing";
const APP_BASE_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://pruefsiegelzentrum.vercel.app";

function toCsvLink(link) {
  if (link.includes("/export?format=csv")) return link;
  const base = link.split("/edit", 1)[0];
  return `${base}/export?format=csv`;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = process.env.BREVO_API_URL || 'https://api.brevo.com/v3/smtp/email';

const transporter = SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })
  : null;
const MAIL_FROM = process.env.MAIL_FROM || process.env.SMTP_USER;

export async function processAndSendCertificate(certificateId, userEmail, message) {
  console.log(`Processing certificate: ${certificateId}`);
  const client = await pool.connect();
  
  try {
    // 1. Fetch Data
    const { rows } = await client.query(
      `
        SELECT 
          c.id AS certificate_id,
          c."externalReferenceId",
          c."seal_number",
          c.status,
          c."createdAt" as cert_created_at,
          p.id AS product_id,
          p.name,
          p.brand,
          p.category,
          p.code,
          p.specs,
          p.size,
          p."madeIn",
          p.material,
          u.name AS user_name,
          u.company,
          u.email,
          u.address,
          c."sealUrl" as "sealUrl"
        FROM "Certificate" c
        JOIN "Product" p ON c."productId" = p.id
        JOIN "User" u ON p."userId" = u.id
        WHERE c.id = $1
      `,
      [certificateId]
    );

    if (rows.length === 0) {
      throw new Error(`Certificate record not found for ID: ${certificateId}`);
    }

    const record = rows[0];

    // 2. Generate QR Code Image (Base64)
const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/lizenzen?q=${record.product_id}`;
    const qrImageData = await QRCode.toDataURL(verificationLink);
    const qrBuffer = Buffer.from(qrImageData.split(',')[1], 'base64');
    let sealBuffer = qrBuffer; // fallback seal attachment
    const sealUrl = record.sealUrl || `/uploads/seals/seal_${record.product_id}.png`;
    if (sealUrl) {
      try {
        const sealPath = path.join(process.cwd(), 'public', sealUrl.replace(/^\//, ''));
        sealBuffer = await readFile(sealPath);
      } catch (err) {
        console.warn('SEAL_READ_FAIL', err);
      }
    }

    // 3. Prepare Context
    const dataContext = {
      id: record.certificate_id,
      name: record.name,
      brand: record.brand,
      category: record.category,
      code: record.code,
      specs: record.specs,
      size: record.size,
      madeIn: record.madeIn,
      material: record.material,
      createdAt: record.cert_created_at,
      status: record.status,
      seal_number: record.seal_number,
      externalReferenceId: record.externalReferenceId,
      user: {
        name: record.user_name,
        company: record.company,
        email: record.email,
        address: record.address
      },
      qrUrl: qrImageData, // <--- Passing the IMAGE DATA now
      verify_url: verificationLink // Passing the text link separately
    };

    // 4. Generate PDF
    console.log('Generating PDF Buffer...');
    const pdfBuffer = await generateCertificatePdf(dataContext);

    // 4b. Fetch CSV (best-effort)
    let csvBuffer = null;
    try {
      const res = await fetch(toCsvLink(SHEET_LINK));
      if (res.ok) {
        const csv = await res.text();
        csvBuffer = Buffer.from(csv, 'utf-8');
      }
    } catch (err) {
      console.warn('RATING_CSV_FETCH_FAIL', err);
    }

    // 5. Send Email
    console.log(`Sending email to ${userEmail}...`);
    const note = formatNote(message);

    await sendEmail({
      from: `Pruefsiegel Zentrum UG – Certificate <${MAIL_FROM}>`,
      to: userEmail,
      subject: `Your Product Certificate: ${record.name}`,
      html: `
        <p>Dear ${record.user_name},</p>
        <p>Your product <strong>${record.name}</strong> has been successfully verified.</p>
        <p>Please find your official certificate and supporting files attached.</p>
        ${note}
        ${renderFooter()}
      `,
      attachments: [
        {
          filename: `Certificate_${record.brand}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
        {
          filename: `Seal_${record.brand}.png`,
          content: sealBuffer,
          contentType: 'image/png',
        },
        ...(csvBuffer
          ? [
              {
                filename: `Rating_${record.brand}.csv`,
                content: csvBuffer,
                contentType: 'text/csv',
              },
            ]
          : []),
      ],
    });

    // 6. Update Database
    await client.query(
      `UPDATE "Certificate" SET status = 'ISSUED', "lastSentAt" = NOW() WHERE id = $1`,
      [certificateId]
    );

    return { success: true };
  } catch (error) {
    console.error('Email Service Error:', error);
    throw error;
  } finally {
    client.release();
  }
}

function formatNote(message) {
  if (!message || typeof message !== 'string') return '';
  const trimmed = message.trim().slice(0, 1000);
  if (!trimmed) return '';
  const safe = trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br />');
  return `<div style="margin:14px 0;padding:12px;border:1px solid #e5e7eb;border-radius:10px;background:#f8fafc;">
    <p style="margin:0 0 6px;font-weight:700;">Note from the Prüfsiegel Team:</p>
    <p style="margin:0;color:#0f172a;">${safe}</p>
  </div>`;
}

function renderFooter() {
  const base = (APP_BASE_URL || '').replace(/\/$/, '') || 'http://pruefsiegelzentrum.vercel.app';
  const logo = `${base}/dpilogo-v3.png`;
  const seal = `${base}/siegel19.png`;
  return `
    <div style="margin-top:28px;padding-top:18px;border-top:1px solid #e2e8f0;display:flex;align-items:center;gap:16px;color:#475569;font-size:12px;">
      <img src="${logo}" alt="DPI Logo" width="140" height="40" style="display:block;object-fit:contain;" />
      <img src="${seal}" alt="Prüfsiegel" width="70" height="70" style="display:block;object-fit:contain;" />
      <div style="line-height:1.4;">
        Deutsches Prüfsiegel Institut (DPI)<br/>
        Prüfzentrum – Kundenservice<br/>
        <a href="${base}" style="color:#1d4ed8;text-decoration:none;">${base}</a>
      </div>
    </div>
  `;
}

async function sendEmail(opts) {
  const { from, to, subject, html, attachments } = opts;
  const normalizedAttachments = attachments
    ? attachments.map((attachment) => ({
        ...attachment,
        content: normalizeAttachmentContent(attachment.content),
      }))
    : null;

  if (BREVO_API_KEY) {
    const sender = parseFrom(from || MAIL_FROM);
    const payload = {
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    };
    if (normalizedAttachments && normalizedAttachments.length) {
      payload.attachment = normalizedAttachments.map((attachment) => ({
        name: attachment.filename,
        content: attachment.content.toString('base64'),
      }));
    }
    const res = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('Brevo send failed', res.status, text);
      throw new Error(`Brevo send failed: ${res.status}`);
    }
    return;
  }

  if (transporter) {
    await transporter.sendMail({ from, to, subject, html, attachments: normalizedAttachments || undefined });
    return;
  }

  console.warn('No email provider configured. Email skipped.');
}

function normalizeAttachmentContent(content) {
  return Buffer.isBuffer(content) ? content : Buffer.from(content);
}

function parseFrom(input) {
  const trimmed = String(input || '').trim();
  const match = trimmed.match(/^(.*)<([^>]+)>$/);
  if (!match) return { email: trimmed };
  const name = match[1].trim().replace(/^"|"$/g, '');
  const email = match[2].trim();
  return { email, name: name || undefined };
}
