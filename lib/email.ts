// lib/email.ts
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  throw new Error('Missing RESEND_API_KEY in env');
}
const resend = new Resend(RESEND_API_KEY);

export async function sendPrecheckConfirmation(opts: {
  to: string;
  name: string;
  productName: string;
}) {
  const { to, name, productName } = opts;

  const from = process.env.MAIL_FROM ?? 'no-reply@your-domain.tld';
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.6; color:#111">
      <p>Hallo ${escapeHtml(name || '')},</p>
      <p>Ihr Pre-Check für <strong>${escapeHtml(productName)}</strong> ist bei uns eingegangen.</p>
      <p>Wir haben für Sie ein Kundenkonto angelegt. Sie können Abläufe und Dokumente im Dashboard einsehen.</p>
      <p>
        <a href="${appUrl}/packages" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#111;color:#fff;text-decoration:none;">
          Pakete anzeigen
        </a>
      </p>
      <p>Danke!<br/>Prüfsiegel Zentrum UG</p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from,
    to,
    subject: 'Pre-Check eingegangen – wir prüfen Ihre Angaben',
    html,
  });

  if (error) {
    // Don’t crash the flow — just log so we can inspect later.
    console.error('Resend email error:', error);
  }
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
  const from = process.env.MAIL_FROM ?? 'no-reply@your-domain.tld';
  const attachments = pdfBuffer
    ? [
        {
          filename: `${productName}-Prüfbericht.pdf`,
          type: 'application/pdf',
          data: pdfBuffer.toString('base64'),
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

  const { error } = await resend.emails.send({
    from,
    to,
    subject: `Prüfung abgeschlossen – ${productName}`,
    html,
    attachments,
  });

  if (error) {
    console.error('Resend completion email error:', error);
  }
}

export async function sendFailureNotification(opts: {
  to: string;
  name: string;
  productName: string;
  reason: string;
}) {
  const { to, name, productName, reason } = opts;
  const from = process.env.MAIL_FROM ?? 'no-reply@your-domain.tld';
  const html = `
    <div style="font-family:system-ui,Arial">
      <p>Hallo ${escapeHtml(name)},</p>
      <p>bei der Prüfung Ihres Produkts <strong>${escapeHtml(productName)}</strong> fehlen noch einige Informationen.</p>
      <p><strong>Grund:</strong> ${escapeHtml(reason)}</p>
      <p>Bitte senden Sie uns die fehlenden Angaben, damit wir fortfahren können.</p>
    </div>
  `;
  const { error } = await resend.emails.send({
    from,
    to,
    subject: `Statusmeldung zu ${productName}`,
    html,
  });
  if (error) {
    console.error('Resend failure email error:', error);
  }
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
