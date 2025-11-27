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
  const checkoutAnchor = `${appUrl.replace(/\/$/, '')}/precheck#checkout-options`;
  const licenseAnchor = `${appUrl.replace(/\/$/, '')}/precheck#license-plans`;

  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.6; color:#111">
      <p>Hallo ${escapeHtml(name || '')},</p>
      <p>Ihr Pre-Check für <strong>${escapeHtml(productName)}</strong> ist eingegangen.</p>
      <p>Bitte bezahlen Sie jetzt die Grundgebühr (254 € zzgl. 19 % MwSt. = 302,26 €), damit wir Versandadresse und Rechnung bereitstellen.</p>
      <p style="margin:16px 0 8px;">
        <a href="${checkoutAnchor}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0f172a;color:#fff;text-decoration:none;font-weight:700;">Grundgebühr bezahlen</a>
      </p>
      <p style="font-size:13px;color:#444;margin-top:12px;">Sobald die Zahlung erfolgt ist, können Sie hier den Lizenzplan wählen:</p>
      <p>
        <a href="${licenseAnchor}" style="display:inline-block;padding:10px 16px;border-radius:10px;background:#111827;color:#fff;text-decoration:none;font-weight:600;">Lizenzplan auswählen</a>
      </p>
      ${shippingAddress ? `<p style="font-size:13px;color:#444;margin-top:12px;">Vorläufige Versandadresse: ${escapeHtml(shippingAddress)}</p>` : ''}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
      <p style="color:#111;margin:0;"><strong>EN:</strong> Your pre-check for <strong>${escapeHtml(productName)}</strong> has been received. Please pay the base fee (254 € + 19% VAT = 302.26 €) so we can provide the shipping address and invoice.</p>
      <p style="margin:12px 0 8px;">
        <a href="${checkoutAnchor}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0f172a;color:#fff;text-decoration:none;font-weight:700;">Pay base fee</a>
      </p>
      <p style="font-size:13px;color:#444;margin-top:12px;">After payment, choose your license plan:</p>
      <p>
        <a href="${licenseAnchor}" style="display:inline-block;padding:10px 16px;border-radius:10px;background:#111827;color:#fff;text-decoration:none;font-weight:600;">Select license plan</a>
      </p>
      <p style="margin-top:18px;">Danke!<br/>Prüfsiegel Zentrum UG</p>
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
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
      <p><strong>EN:</strong> We need more information for <strong>${escapeHtml(productName)}</strong>.<br/>Reason: ${escapeHtml(reason)}<br/>Please send the missing details so we can proceed.</p>
    </div>
  `;
  await sendEmail({
    from: `Pruefsiegel Zentrum UG – Status <${FROM_EMAIL}>`,
    to,
    subject: `Statusmeldung zu ${productName}`,
    html,
  });
}

export async function sendPrecheckPaymentSuccess(opts: {
  to: string;
  name: string;
  productName: string;
  receiptPdf?: Buffer;
  shippingAddress?: string | null;
}) {
  const { to, name, productName, receiptPdf, shippingAddress } = opts;
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'http://pruefsiegelzentrum.vercel.app';
  const licenseAnchor = `${appUrl.replace(/\/$/, '')}/precheck#license-plans`;
  const html = `
    <div style="font-family:system-ui,Arial;line-height:1.6;color:#111">
      <p>Hallo ${escapeHtml(name)},</p>
      <p>Zahlungseingang für <strong>${escapeHtml(productName)}</strong> bestätigt. Vielen Dank!</p>
      ${shippingAddress ? `<p style="font-size:13px;color:#444;">Versandadresse: ${escapeHtml(shippingAddress)}</p>` : ''}
      <p style="margin:14px 0 10px;">Lassen Sie uns jetzt den Lizenzplan wählen und das Siegel erhalten:</p>
      <p>
        <a href="${licenseAnchor}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0f172a;color:#fff;text-decoration:none;font-weight:700;">Lizenzplan auswählen</a>
      </p>
      <p style="margin-top:14px;font-size:13px;color:#444;">Die Quittung befindet sich im Anhang.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
      <p><strong>EN:</strong> Payment received for <strong>${escapeHtml(productName)}</strong>. Thank you!</p>
      ${shippingAddress ? `<p style="font-size:13px;color:#444;">Shipping address: ${escapeHtml(shippingAddress)}</p>` : ''}
      <p style="margin:12px 0 10px;">Choose your license plan next:</p>
      <p>
        <a href="${licenseAnchor}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0f172a;color:#fff;text-decoration:none;font-weight:700;">Select license plan</a>
      </p>
      <p style="margin-top:14px;font-size:13px;color:#444;">Receipt is attached.</p>
      <p style="margin-top:18px;">Prüfsiegel Zentrum UG</p>
    </div>
  `;

  await sendEmail({
    from: `Pruefsiegel Zentrum UG – Zahlung <${FROM_EMAIL}>`,
    to,
    subject: 'Prüfung bestanden – Zahlung eingegangen',
    html,
    attachments: receiptPdf
      ? [
          {
            filename: `Quittung-${productName}.pdf`,
            content: receiptPdf,
            contentType: 'application/pdf',
          },
        ]
      : undefined,
  });
}

export async function sendProductReceivedEmail(opts: {
  to: string;
  name: string;
  productName: string;
}) {
  const { to, name, productName } = opts;
  const html = `
    <div style="font-family:system-ui,Arial;line-height:1.6;color:#111">
      <p>Hallo ${escapeHtml(name)},</p>
      <p>Wir haben Ihr Produkt <strong>${escapeHtml(productName)}</strong> erhalten. Die Analyse startet in Kürze.</p>
      <p style="margin-top:12px;">Danke für Ihr Vertrauen.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0;" />
      <p><strong>EN:</strong> We have received your product <strong>${escapeHtml(productName)}</strong>. Analysis will start shortly.</p>
      <p style="margin-top:12px;">Thank you for your trust.</p>
      <p style="margin-top:16px;">Prüfsiegel Zentrum UG</p>
    </div>
  `;

  await sendEmail({
    from: `Pruefsiegel Zentrum UG – Wareneingang <${FROM_EMAIL}>`,
    to,
    subject: 'Produkt eingegangen – Analyse startet',
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
