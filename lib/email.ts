// lib/email.ts
import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.MAIL_FROM ?? 'pruefsiegel@lucidstar.de';
const SHIPPING_ADDRESS_BLOCK = `Prüfsiegel Zentrum UG (haftungsbeschränkt)
Musterstraße 12
6020 Innsbruck
Österreich`;

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
}) {
  const { to, name, productName } = opts;
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'http://pruefsiegelzentrum.vercel.app';
  const checkoutAnchor = `${appUrl.replace(/\/$/, '')}/precheck#checkout-options`;

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.65;color:#0f172a">
      <p>Hallo ${escapeHtml(name || '')},</p>
      <p>vielen Dank, dass Sie unseren Service gewählt haben. Ihr Pre-Check für <strong>${escapeHtml(productName)}</strong> ist eingegangen.</p>
      <p>Bitte begleichen Sie jetzt die Grundgebühr (254 € zzgl. 19 % MwSt. = 302,26 €), damit wir Ihnen umgehend Rechnung und Versandanschrift bereitstellen können.</p>
      <p style="margin:16px 0 8px;">
        <a href="${checkoutAnchor}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0f172a;color:#fff;text-decoration:none;font-weight:700;">Grundgebühr bezahlen</a>
      </p>
      <p style="margin-top:18px;font-size:13px;color:#475569;">Sobald der Zahlungseingang vorliegt, senden wir Ihnen die Rechnung und die Versandadresse.</p>
      <p style="margin-top:18px;">Danke für Ihr Vertrauen.<br/>Prüfsiegel Zentrum UG</p>
    </div>
  `;

  await sendEmail({
    from: `Pruefsiegel Zentrum UG – Pre-Check <${FROM_EMAIL}>`,
    to,
    subject: 'Pre-Check eingegangen – Grundgebühr jetzt bezahlen',
    html,
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
  sealNumber?: string;
  invoiceUrl?: string;
  csvBuffer?: Buffer | null;
  sealBuffer?: Buffer | null;
  invoiceBuffer?: Buffer | null;
}) {
  const {
    to,
    name,
    productName,
    verifyUrl,
    pdfUrl,
    qrUrl,
    pdfBuffer,
    documentId,
    message,
    sealNumber,
    invoiceUrl,
    csvBuffer,
    sealBuffer,
    invoiceBuffer,
  } = opts;
  const attachments: Attachment[] = [];
  if (pdfBuffer) {
    attachments.push({
      filename: `${productName}-Prüfbericht.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    });
  }
  if (csvBuffer) {
    attachments.push({
      filename: `${productName}-Bewertung.csv`,
      content: csvBuffer,
      contentType: 'text/csv',
    });
  }
  if (sealBuffer) {
    attachments.push({
      filename: `${productName}-Siegel.png`,
      content: sealBuffer,
      contentType: 'image/png',
    });
  }
  if (invoiceBuffer) {
    attachments.push({
      filename: `${productName}-Rechnung.pdf`,
      content: invoiceBuffer,
      contentType: 'application/pdf',
    });
  }

  const html = `
    <div style="font-family:system-ui,Arial;line-height:1.65;color:#0f172a">
      <p>Hallo ${escapeHtml(name)},</p>
      <p>die Prüfung Ihres Produkts <strong>${escapeHtml(productName)}</strong> wurde erfolgreich abgeschlossen (Bestanden).</p>
      <p style="margin:12px 0;">Im Folgenden finden Sie Ihr finales Paket mit Prüfbericht, Zertifikat/Verifikation, Zusammenfassung und Rechnungsangaben.</p>
      <p style="margin:12px 0;">
        <strong>Verifikation / Zertifikat:</strong><br />
        <a href="${verifyUrl}" style="color:#1d4ed8;font-weight:600;">${verifyUrl}</a>
      </p>
      <p style="margin:12px 0;">
        <strong>Prüfbericht:</strong> <a href="${pdfUrl}" style="color:#1d4ed8;font-weight:600;">Download</a><br />
        <strong>QR-Code / Badge:</strong> <a href="${qrUrl}" style="color:#1d4ed8;font-weight:600;">Download</a>
      </p>
      ${sealNumber ? `<p style="font-size:13px;color:#475569;">Siegel/Badge-ID: <code>${escapeHtml(sealNumber)}</code></p>` : ''}
      ${documentId ? `<p style="font-size:13px;color:#475569;">Dokument-ID: <code>${escapeHtml(documentId)}</code></p>` : ''}
      <p style="margin:12px 0;font-size:13px;color:#475569;">
        Rechnung: ${invoiceUrl ? `<a href="${invoiceUrl}" style="color:#1d4ed8;font-weight:600;">Abrufen</a>` : 'liegt in Ihrem Kundenkonto bereit.'}
      </p>
      ${renderNote(message)}
      <ul style="margin:16px 0;padding-left:20px;font-size:13px;color:#475569;">
        <li>Siegel/Badge und QR-Code sind ab sofort nutzbar.</li>
        <li>Der Prüfbericht fasst Testergebnis und Bewertung zusammen.</li>
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
    attachments: attachments.length ? attachments : undefined,
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
  const address = shippingAddress?.trim() || SHIPPING_ADDRESS_BLOCK;
  const html = `
    <div style="font-family:system-ui,Arial;line-height:1.65;color:#0f172a">
      <p>Hallo ${escapeHtml(name)},</p>
      <p>der Zahlungseingang für <strong>${escapeHtml(productName)}</strong> (Grundgebühr) ist bestätigt. Vielen Dank!</p>
      <p style="margin:12px 0;font-size:13px;color:#475569;white-space:pre-line;">Versandadresse:<br/>${escapeHtml(address)}</p>
      <p style="margin-top:14px;font-size:13px;color:#475569;">Die Rechnung/Quittung finden Sie im Anhang.</p>
      <ul style="margin:16px 0;padding-left:20px;font-size:13px;color:#475569;">
        <li>Bitte senden Sie Ihr Produkt an die oben genannte Adresse.</li>
        <li>Bei Rückfragen erreichen Sie uns jederzeit per Antwort auf diese E-Mail.</li>
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

export async function sendPassAndLicenseRequest(opts: {
  to: string;
  name: string;
  productName: string;
  licenseUrl?: string;
}) {
  const { to, name, productName, licenseUrl } = opts;
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'http://pruefsiegelzentrum.vercel.app';
  const plansLink = (licenseUrl || `${appUrl.replace(/\/$/, '')}/produkte`).replace(/\/$/, '');
  const html = `
    <div style="font-family:system-ui,Arial;line-height:1.65;color:#0f172a">
      <p>Hallo ${escapeHtml(name)},</p>
      <p>Ihr Produkt <strong>${escapeHtml(productName)}</strong> hat den Test bestanden. Vielen Dank für Ihr Vertrauen!</p>
      <p style="margin:12px 0;">Bitte wählen Sie jetzt Ihren Lizenzplan, damit wir Ihr Siegel final aktivieren können.</p>
      <p>
        <a href="${plansLink}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0f172a;color:#fff;text-decoration:none;font-weight:700;">Zu den Lizenzplänen</a>
      </p>
      <ul style="margin:16px 0;padding-left:20px;font-size:13px;color:#475569;">
        <li>Nach Planwahl erhalten Sie automatisch das finale Paket per E-Mail.</li>
        <li>Siegel bleibt bis dahin vorgemerkt, aber noch nicht endgültig freigeschaltet.</li>
      </ul>
      <p style="margin-top:18px;">Danke für Ihr Vertrauen.<br/>Prüfsiegel Zentrum UG</p>
    </div>
  `;

  await sendEmail({
    from: `Pruefsiegel Zentrum UG – Test bestanden <${FROM_EMAIL}>`,
    to,
    subject: `Test bestanden – Lizenzplan für ${productName} wählen`,
    html,
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

export async function sendPasswordResetEmail(opts: { to: string; name?: string | null; resetUrl: string }) {
  const { to, name, resetUrl } = opts;
  const safeName = escapeHtml(name || '');
  const html = `
    <div style="font-family:system-ui,Arial;line-height:1.65;color:#0f172a">
      <p>Hallo${safeName ? ' ' + safeName : ''},</p>
      <p>du hast einen Link zum Zurücksetzen deines Passworts angefordert. Falls das nicht von dir stammt, kannst du diese E-Mail ignorieren.</p>
      <p style="margin:16px 0;">
        <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0f172a;color:#fff;text-decoration:none;font-weight:700;">Passwort jetzt zurücksetzen</a>
      </p>
      <p style="font-size:13px;color:#475569;">Der Link ist 60 Minuten gültig.</p>
      <p style="margin-top:18px;">Prüfsiegel Zentrum UG</p>
    </div>
  `;

  await sendEmail({
    from: `Pruefsiegel Zentrum UG – Konto <${FROM_EMAIL}>`,
    to,
    subject: 'Passwort zurücksetzen',
    html,
  });
}

function renderNote(message?: string) {
  const trimmed = (message || '').trim();
  if (!trimmed) return '';
  const safe = escapeHtml(trimmed).replace(/\n/g, '<br />');
  return `
    <div style="margin:14px 0;padding:12px;border:1px solid #e5e7eb;border-radius:10px;background:#f8fafc;">
      <p style="margin:0 0 6px;font-weight:700;">Evaluation / Zusammenfassung:</p>
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
