// lib/email.ts
import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.MAIL_FROM ?? 'pruefsiegel@lucidstar.de';

const transporter = SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

type Attachment = { filename: string; content: Buffer; contentType?: string };

async function sendEmail(opts: { to: string; subject: string; html: string; attachments?: Attachment[]; from?: string }) {
  const { to, subject, html, attachments, from } = opts;

  if (transporter) {
    await transporter.sendMail({
      from: from ?? FROM_EMAIL,
      to,
      subject,
      html,
      attachments,
    });
    return;
  }

  console.warn('No email provider configured. Email skipped.');
}

export async function sendPrecheckConfirmation(opts: {
  to: string;
  name: string;
  productName: string;
  invoicePdf?: Buffer;
  shippingAddress?: string;
}) {
  const { to, name, productName, invoicePdf, shippingAddress } = opts;
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'http://pruefsiegelzentrum.vercel.app';

  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.6; color:#111">
      <p>Hallo ${escapeHtml(name || '')},</p>
      <p>Ihr Pre-Check für <strong>${escapeHtml(productName)}</strong> ist bei uns eingegangen.</p>
      <p>Bitte begleichen Sie die Grundgebühr. Nach Zahlung senden wir Versandadresse und Rechnung.</p>
      <p>
        <a href="${appUrl}/lizenzen" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#111;color:#fff;text-decoration:none;">
          Lizenzpläne ansehen
        </a>
      </p>
      ${shippingAddress ? `<p style="font-size:13px;color:#444;">Vorläufige Versandadresse: ${escapeHtml(shippingAddress)}</p>` : ''}
      <p>Danke!<br/>Prüfsiegel Zentrum UG</p>
    </div>
  `;

  await sendEmail({
    from: `Pruefsiegel Zentrum UG – Pre-Check <${FROM_EMAIL}>`,
    to,
    subject: 'Pre-Check eingegangen – Grundgebühr jetzt bezahlen',
    html,
    attachments: invoicePdf
      ? [
          {
            filename: `Rechnung-${productName}.pdf`,
            content: invoicePdf,
            contentType: 'application/pdf',
          },
        ]
      : undefined,
  });
}

export async function sendCompletionEmail(opts: {
  to: string;
  name: string;
  productName: string;
  verifyUrl: string;
  pdfUrl: string;
  qrUrl: string;
  pdfBuffer?: Buffer;
  documentId?: string;
}) {
  const { to, name, productName, verifyUrl, pdfUrl, qrUrl, pdfBuffer, documentId } = opts;
  const attachments = pdfBuffer
    ? [
        {
          filename: `${productName}-Prüfbericht.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ]
    : undefined;

  const html = `
    <div style="font-family:system-ui,Arial;line-height:1.6;color:#111">
      <p>Hallo ${escapeHtml(name)},</p>
      <p>die Prüfung Ihres Produkts <strong>${escapeHtml(productName)}</strong> ist abgeschlossen.</p>
      <p style="margin:0.75rem 0;">
        Die Ergebnisse finden Sie im angehängten Prüfbericht oder über die Verifikationsseite:
        <br />
        <a href="${verifyUrl}" style="color:#1d4ed8;font-weight:600;">${verifyUrl}</a>
      </p>
      <p>
        Ihr Prüfbericht: <a href="${pdfUrl}" style="color:#1d4ed8;font-weight:600;">Download</a><br />
        QR-Code: <a href="${qrUrl}" style="color:#1d4ed8;font-weight:600;">Download</a>
      </p>
      ${documentId ? `<p>PDFMonkey-Dokument-ID: <code>${escapeHtml(documentId)}</code></p>` : ''}
      <p>Danke!<br />Prüfsiegel Zentrum UG</p>
    </div>
  `;

  await sendEmail({
    from: `Pruefsiegel Zentrum UG – Completion <${FROM_EMAIL}>`,
    to,
    subject: `Prüfung abgeschlossen – ${productName}`,
    html,
    attachments,
  });
}

export async function sendFailureNotification(opts: {
  to: string;
  name: string;
  productName: string;
  reason: string;
}) {
  const { to, name, productName, reason } = opts;
  const html = `
    <div style="font-family:system-ui,Arial">
      <p>Hallo ${escapeHtml(name)},</p>
      <p>bei der Prüfung Ihres Produkts <strong>${escapeHtml(productName)}</strong> fehlen noch einige Informationen.</p>
      <p><strong>Grund:</strong> ${escapeHtml(reason)}</p>
      <p>Bitte senden Sie uns die fehlenden Angaben, damit wir fortfahren können.</p>
    </div>
  `;
  await sendEmail({
    from: `Pruefsiegel Zentrum UG – Status <${FROM_EMAIL}>`,
    to,
    subject: `Statusmeldung zu ${productName}`,
    html,
  });
}

// minimal XSS-safe escaping for interpolated strings in HTML
function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
