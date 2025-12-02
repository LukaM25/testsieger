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
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.65;color:#0f172a">
      <p>Hallo ${escapeHtml(name || '')},</p>
      <p>Ihr Pre-Check für <strong>${escapeHtml(productName)}</strong> ist erfolgreich eingegangen. Wir prüfen die Angaben und bereiten alles für den Versand vor.</p>
      <p>Bitte begleichen Sie jetzt die Grundgebühr (254 € zzgl. 19 % MwSt. = 302,26 €), damit wir Ihnen sofort Rechnung und Versandanschrift bereitstellen können.</p>
      <p style="margin:16px 0 8px;">
        <a href="${checkoutAnchor}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0f172a;color:#fff;text-decoration:none;font-weight:700;">Grundgebühr bezahlen</a>
      </p>
      <p style="font-size:13px;color:#475569;margin-top:12px;">Nach Zahlung wählen Sie Ihren Lizenzplan und erhalten Ihr Versandlabel direkt im Portal.</p>
      <p>
        <a href="${licenseAnchor}" style="display:inline-block;padding:10px 16px;border-radius:10px;background:#111827;color:#fff;text-decoration:none;font-weight:600;">Lizenzplan auswählen</a>
      </p>
      ${shippingAddress ? `<p style="font-size:13px;color:#475569;margin-top:12px;">Vorläufige Versandadresse: ${escapeHtml(shippingAddress)}</p>` : ''}
      <ul style="margin:16px 0;padding-left:20px;font-size:13px;color:#475569;">
        <li>Beleg im Anhang, falls verfügbar.</li>
        <li>Versand erst nach Zahlungseingang.</li>
        <li>Updates erhalten Sie per E-Mail.</li>
      </ul>
      <p style="margin-top:18px;">Danke für Ihr Vertrauen.<br/>Prüfsiegel Zentrum UG</p>
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
  message?: string;
}) {
  const { to, name, productName, verifyUrl, pdfUrl, qrUrl, pdfBuffer, documentId, message } = opts;
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
    <div style="font-family:system-ui,Arial;line-height:1.65;color:#0f172a">
      <p>Hallo ${escapeHtml(name)},</p>
      <p>die Prüfung Ihres Produkts <strong>${escapeHtml(productName)}</strong> wurde erfolgreich abgeschlossen.</p>
      <p style="margin:12px 0;">
        Die Ergebnisse finden Sie im angehängten Prüfbericht oder über die Verifikationsseite:<br />
        <a href="${verifyUrl}" style="color:#1d4ed8;font-weight:600;">${verifyUrl}</a>
      </p>
      <p style="margin:12px 0;">
        Prüfbericht: <a href="${pdfUrl}" style="color:#1d4ed8;font-weight:600;">Download</a><br />
        QR-Code: <a href="${qrUrl}" style="color:#1d4ed8;font-weight:600;">Download</a>
      </p>
      ${documentId ? `<p style="font-size:13px;color:#475569;">Dokument-ID: <code>${escapeHtml(documentId)}</code></p>` : ''}
      ${renderNote(message)}
      <ul style="margin:16px 0;padding-left:20px;font-size:13px;color:#475569;">
        <li>Siegel und QR-Code sind ab sofort nutzbar.</li>
        <li>Für Änderungen an Einsatzorten oder Ansprechpartnern nutzen Sie bitte das Kundenportal.</li>
      </ul>
      <p style="margin-top:18px;">Vielen Dank für die Zusammenarbeit.<br />Prüfsiegel Zentrum UG</p>
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

export async function sendCertificateAndSealEmail(opts: {
  to: string;
  name: string;
  productName: string;
  verifyUrl: string;
  pdfBuffer?: Buffer;
  sealBuffer?: Buffer;
  message?: string;
}) {
  const { to, name, productName, verifyUrl, pdfBuffer, sealBuffer, message } = opts;
  const attachments: Attachment[] = [];
  if (pdfBuffer) {
    attachments.push({
      filename: `${productName}-Pruefbericht.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    });
  }
  if (sealBuffer) {
    attachments.push({
      filename: `${productName}-Siegel.png`,
      content: sealBuffer,
      contentType: 'image/png',
    });
  }

  const html = `
    <div style="font-family:system-ui,Arial;line-height:1.65;color:#0f172a">
      <p>Hallo ${escapeHtml(name)},</p>
      <p>Prüfbericht und Siegel für <strong>${escapeHtml(productName)}</strong> stehen bereit.</p>
      <p>Verifikation: <a href="${verifyUrl}" style="color:#1d4ed8;font-weight:600;">${verifyUrl}</a></p>
      <p style="margin:12px 0;">Im Anhang finden Sie den Prüfbericht (PDF) und das Siegel (PNG). Bitte nutzen Sie den QR-Code und die Siegelgrafik gemäß Ihren vereinbarten Einsatzorten.</p>
      ${renderNote(message)}
      <ul style="margin:16px 0;padding-left:20px;font-size:13px;color:#475569;">
        <li>Bei Fragen zur Platzierung oder Farben melden Sie sich jederzeit.</li>
        <li>Änderungen an Siegel- oder Einsatzdaten erfolgen über das Kundenportal.</li>
      </ul>
      <p style="margin-top:18px;">Danke für Ihr Vertrauen.<br/>Prüfsiegel Zentrum UG</p>
    </div>
  `;

  await sendEmail({
    from: `Pruefsiegel Zentrum UG – Zertifikat <${FROM_EMAIL}>`,
    to,
    subject: `Prüfbericht & Siegel – ${productName}`,
    html,
    attachments: attachments.length ? attachments : undefined,
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
    <div style="font-family:system-ui,Arial;line-height:1.65;color:#0f172a">
      <p>Hallo ${escapeHtml(name)},</p>
      <p>für Ihr Produkt <strong>${escapeHtml(productName)}</strong> benötigen wir weitere Informationen, bevor wir die Prüfung abschließen können.</p>
      <p><strong>Grund:</strong> ${escapeHtml(reason)}</p>
      <p>Bitte senden Sie uns die fehlenden Angaben oder Dokumente, damit wir fortfahren können. Bei Rückfragen helfen wir gern.</p>
      <p style="margin-top:18px;">Prüfsiegel Zentrum UG</p>
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
    <div style="font-family:system-ui,Arial;line-height:1.65;color:#0f172a">
      <p>Hallo ${escapeHtml(name)},</p>
      <p>der Zahlungseingang für <strong>${escapeHtml(productName)}</strong> ist bestätigt. Vielen Dank!</p>
      ${shippingAddress ? `<p style="font-size:13px;color:#475569;">Versandadresse: ${escapeHtml(shippingAddress)}</p>` : ''}
      <p style="margin:14px 0 10px;">Wählen Sie jetzt Ihren Lizenzplan und erhalten Sie Ihr Versandlabel sowie alle Siegel-Assets:</p>
      <p>
        <a href="${licenseAnchor}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0f172a;color:#fff;text-decoration:none;font-weight:700;">Lizenzplan auswählen</a>
      </p>
      <p style="margin-top:14px;font-size:13px;color:#475569;">Die Quittung finden Sie im Anhang.</p>
      <ul style="margin:16px 0;padding-left:20px;font-size:13px;color:#475569;">
        <li>Nach Planwahl erhalten Sie Zugang zu Siegelgrafiken und Prüfbericht.</li>
        <li>Änderungen an Adresse oder Ansprechpartner bitte per Antwort auf diese E-Mail.</li>
      </ul>
      <p style="margin-top:18px;">Prüfsiegel Zentrum UG</p>
    </div>
  `;

  await sendEmail({
    from: `Pruefsiegel Zentrum UG – Zahlung <${FROM_EMAIL}>`,
    to,
    subject: 'Pre-Check – Zahlung eingegangen',
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

function renderNote(message?: string) {
  const trimmed = (message || '').trim();
  if (!trimmed) return '';
  const safe = escapeHtml(trimmed).replace(/\n/g, '<br />');
  return `
    <div style="margin:14px 0;padding:12px;border:1px solid #e5e7eb;border-radius:10px;background:#f8fafc;">
      <p style="margin:0 0 6px;font-weight:700;">Note from the Prüfsiegel Team:</p>
      <p style="margin:0;color:#0f172a;">${safe}</p>
    </div>
  `;
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
