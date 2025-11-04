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

// minimal XSS-safe escaping for interpolated strings in HTML
function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
