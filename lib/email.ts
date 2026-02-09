// lib/email.ts
import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import QRCode from 'qrcode';
import { ensureSignedS3Url } from './s3';
import { extractLastName, normalizePersonName } from './name';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = process.env.BREVO_API_URL ?? 'https://api.brevo.com/v3/smtp/email';
const FROM_EMAIL = process.env.MAIL_FROM ?? 'pruefsiegel@lucidstar.de';
const APP_BASE_URL = process.env.APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'http://pruefsiegelzentrum.vercel.app';

const transporter = SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

type Attachment = { filename: string; content: Buffer | Uint8Array; contentType?: string };
type RecipientGender = 'MALE' | 'FEMALE' | 'OTHER';

async function sendEmail(opts: { to: string; subject: string; html: string; attachments?: Attachment[]; from?: string }) {
  const { to, subject, html, attachments, from } = opts;
  const normalizedAttachments = attachments?.map((attachment) => ({
    ...attachment,
    content: normalizeAttachmentContent(attachment.content),
  }));

  if (BREVO_API_KEY) {
    const sender = parseFrom(from ?? FROM_EMAIL);
    const payload: Record<string, unknown> = {
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    };
    if (normalizedAttachments?.length) {
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
    await transporter.sendMail({
      from: from ?? FROM_EMAIL,
      to,
      subject,
      html,
      attachments: normalizedAttachments,
    });
    return;
  }

  console.warn('No email provider configured. Email skipped.');
}

function normalizeAttachmentContent(content: Buffer | Uint8Array) {
  return Buffer.isBuffer(content) ? content : Buffer.from(content);
}

function safeLastName(name: string) {
  const lastName = extractLastName(name);
  return lastName ? escapeHtml(lastName) : '';
}

function safeFullName(name: string) {
  const normalized = normalizePersonName(name);
  return normalized ? escapeHtml(normalized) : '';
}

function safeDisplayName(name: string, gender?: RecipientGender) {
  if (gender === 'OTHER') return safeFullName(name);
  return safeLastName(name);
}

function renderStandardGreeting(name: string, gender?: RecipientGender) {
  const safeName = safeDisplayName(name, gender);
  return safeName ? `Guten Tag ${safeName},` : 'Guten Tag,';
}

function renderHelloGreeting(name: string, gender?: RecipientGender) {
  const safeName = safeDisplayName(name, gender);
  return safeName ? `Hallo ${safeName},` : 'Hallo,';
}

function renderGreeting(name: string, gender?: RecipientGender) {
  const safeName = safeDisplayName(name, gender);
  if (!safeName) return 'Guten Tag,';
  if (gender === 'MALE') return `Guten Tag Herr ${safeName},`;
  if (gender === 'FEMALE') return `Guten Tag Frau ${safeName},`;
  return renderStandardGreeting(name, gender);
}

function renderFormalGreeting(name: string, gender?: RecipientGender) {
  const safeName = safeDisplayName(name, gender);
  if (!safeName) return 'Sehr geehrte Damen und Herren,';
  if (gender === 'MALE') return `Sehr geehrter Herr ${safeName},`;
  if (gender === 'FEMALE') return `Sehr geehrte Frau ${safeName},`;
  return renderStandardGreeting(name, gender);
}

function renderFooter() {
  const logo = `${APP_BASE_URL.replace(/\/$/, '')}/dpilogo-v3.png`;
  const seal = `${APP_BASE_URL.replace(/\/$/, '')}/siegel19.png`;
  return `
    <div style="margin-top:28px;padding-top:18px;border-top:1px solid #e2e8f0;display:flex;align-items:center;gap:16px;color:#475569;font-size:12px;">
      <img src="${logo}" alt="DPI Logo" width="140" height="40" style="display:block;object-fit:contain;" />
      <img src="${seal}" alt="Prüfsiegel" width="70" height="70" style="display:block;object-fit:contain;" />
      <div style="line-height:1.4;">
        Deutsches Prüfsiegel Institut (DPI)<br/>
        Prüfzentrum – Kundenservice<br/>
        <a href="${APP_BASE_URL.replace(/\/$/, '')}" style="color:#1d4ed8;text-decoration:none;">${APP_BASE_URL.replace(/\/$/, '')}</a>
      </div>
    </div>
  `;
}

async function fetchBufferFromUrl(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  } catch {
    return null;
  }
}

export async function sendPrecheckConfirmation(opts: {
  to: string;
  name: string;
  gender?: RecipientGender;
  productName: string;
}) {
  const { to, name, gender, productName } = opts;
  const checkoutAnchor = `${APP_BASE_URL.replace(/\/$/, '')}/precheck#checkout-options`;

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.65;color:#0f172a">
      <p>${renderGreeting(name, gender)}</p>
      <p>Ihr Produkt <strong>${escapeHtml(productName)}</strong> hat den Pre-Check erfolgreich bestanden. Alle relevanten Daten wurden in Echtzeit abgefragt und valide bestätigt. Damit erfüllt Ihr Produkt die Kriterien, um offiziell in den Testsieger Check des Deutschen Prüfsiegel Instituts (DPI) überführt zu werden.</p>
      <p>Falls die Prüfgebühr für den Testsieger Check noch nicht beglichen wurde, können Sie diese hier direkt auslösen:</p>
      <p style="margin:16px 0 8px;">
        <a href="${checkoutAnchor}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0f172a;color:#fff;text-decoration:none;font-weight:700;">Prüfgebühr jetzt buchen</a>
      </p>
      <p>Sollten Sie bereits bezahlt haben, können Sie diesen Hinweis ignorieren.</p>
      <p>Nach Zahlung wird Ihr Produkt automatisch in den Prüfplan aufgenommen. Sie erhalten anschließend die verbindliche Bestätigung inklusive Zeitfenster.</p>
      <p style="margin-top:18px;">Mit besten Grüßen<br/>Deutsches Prüfsiegel Institut (DPI)</p>
      ${renderFooter()}
    </div>
  `;

  await sendEmail({
    from: `Pruefsiegel Zentrum UG – Pre-Check <${FROM_EMAIL}>`,
    to,
    subject: 'Pre-Check bestanden – Prüfgebühr jetzt buchen',
    html,
  });
}

export async function sendCompletionEmail(opts: {
  to: string;
  name: string;
  gender?: RecipientGender;
  productName: string;
  verifyUrl: string;
  pdfUrl: string;
  qrUrl: string;
  certificateBuffer?: Buffer;
  reportBuffer?: Buffer | null;
  documentId?: string;
  message?: string;
  sealNumber?: string;
  invoiceUrl?: string;
  ratingPdfBuffer?: Buffer | null;
  sealBuffer?: Buffer | null;
  invoiceBuffer?: Buffer | null;
}) {
  const {
    to,
    name,
    gender,
    productName,
    verifyUrl,
    pdfUrl,
    qrUrl,
    certificateBuffer,
    reportBuffer,
    documentId,
    message,
    sealNumber,
    invoiceUrl,
    ratingPdfBuffer,
    sealBuffer,
    invoiceBuffer,
  } = opts;
  const attachments: Attachment[] = [];
  if (certificateBuffer) {
    attachments.push({
      filename: `${productName}-Zertifikat.pdf`,
      content: certificateBuffer,
      contentType: 'application/pdf',
    });
  }
  if (reportBuffer) {
    attachments.push({
      filename: `${productName}-Prüfbericht.pdf`,
      content: reportBuffer,
      contentType: 'application/pdf',
    });
  }
  if (ratingPdfBuffer) {
    attachments.push({
      filename: `${productName}-Prüfergebnis.pdf`,
      content: ratingPdfBuffer,
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
  if (invoiceBuffer) {
    attachments.push({
      filename: `${productName}-Rechnung.pdf`,
      content: invoiceBuffer,
      contentType: 'application/pdf',
    });
  }

  const html = `
    <div style="font-family:system-ui,Arial;line-height:1.65;color:#0f172a">
      <p>${renderStandardGreeting(name, gender)}</p>
      <p>vielen Dank für die Auswahl und Bezahlung Ihres Lizenzplans. <strong>Ihre Lizenz ist jetzt aktiv.</strong></p>
      <p>Im Anhang finden Sie alle freigegebenen Materialien zu Ihrem erfolgreich bestandenen Testsieger Check:</p>
      <ul style="margin:12px 0 16px;padding-left:20px;color:#0f172a;">
        <li>Offizielles Siegel${sealNumber ? ` (ID: ${escapeHtml(sealNumber)})` : ''}</li>
        <li>Prüfergebnis (PDF)</li>
        <li>Prüfbericht</li>
        <li>Zertifikat</li>
      </ul>
      <p style="margin:12px 0;">
        <strong>Verifikation / Zertifikat:</strong><br />
        <a href="${verifyUrl}" style="color:#1d4ed8;font-weight:600;">${verifyUrl}</a>
      </p>
      <p style="margin:12px 0;">
        <strong>Zertifikat (PDF):</strong> <a href="${pdfUrl}" style="color:#1d4ed8;font-weight:600;">Download</a><br />
        <strong>QR-Code:</strong> <a href="${qrUrl}" style="color:#1d4ed8;font-weight:600;">Download</a>
      </p>
      ${documentId ? `<p style="font-size:13px;color:#475569;">Dokument-ID: <code>${escapeHtml(documentId)}</code></p>` : ''}
      <p style="margin:12px 0;font-size:13px;color:#475569;">
        Rechnung: ${invoiceUrl ? `<a href="${invoiceUrl}" style="color:#1d4ed8;font-weight:600;">Abrufen</a>` : 'liegt in Ihrem Kundenkonto bereit.'}
      </p>
      ${renderNote(message)}
      <p>Sie können diese Unterlagen ab sofort im vereinbarten Rahmen nutzen.</p>
      <p style="margin-top:18px;">Mit besten Grüßen<br/>Deutsches Prüfsiegel Institut (DPI)</p>
      ${renderFooter()}
    </div>
  `;

  await sendEmail({
    from: `Pruefsiegel Zentrum UG – Lizenz <${FROM_EMAIL}>`,
    to,
    subject: `Lizenz aktiv – ${productName}`,
    html,
    attachments: attachments.length ? attachments : undefined,
  });
}

export async function sendCertificateAndSealEmail(opts: {
  to: string;
  name: string;
  gender?: RecipientGender;
  productName: string;
  verifyUrl: string;
  pdfBuffer?: Buffer;
  sealBuffer?: Buffer;
  message?: string;
}) {
  const { to, name, gender, productName, verifyUrl, pdfBuffer, sealBuffer, message } = opts;
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
      <p>${renderHelloGreeting(name, gender)}</p>
      <p>Prüfbericht und Siegel für <strong>${escapeHtml(productName)}</strong> stehen bereit.</p>
      <p>Verifikation: <a href="${verifyUrl}" style="color:#1d4ed8;font-weight:600;">${verifyUrl}</a></p>
      <p style="margin:12px 0;">Im Anhang finden Sie den Prüfbericht (PDF) und das Siegel (PNG). Bitte nutzen Sie den QR-Code und die Siegelgrafik gemäß Ihren vereinbarten Einsatzorten.</p>
      ${renderNote(message)}
      <ul style="margin:16px 0;padding-left:20px;font-size:13px;color:#475569;">
        <li>Bei Fragen zur Platzierung oder Farben melden Sie sich jederzeit.</li>
        <li>Änderungen an Siegel- oder Einsatzdaten erfolgen über das Kundenportal.</li>
      </ul>
      <p style="margin-top:18px;">Danke für Ihr Vertrauen.<br/>Prüfsiegel Zentrum UG</p>
      ${renderFooter()}
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
  gender?: RecipientGender;
  productName: string;
  reason: string;
}) {
  const { to, name, gender, productName, reason } = opts;
  const html = `
    <div style="font-family:system-ui,Arial;line-height:1.65;color:#0f172a">
      <p>${renderHelloGreeting(name, gender)}</p>
      <p>für Ihr Produkt <strong>${escapeHtml(productName)}</strong> benötigen wir weitere Informationen, bevor wir die Prüfung abschließen können.</p>
      <p><strong>Grund:</strong> ${escapeHtml(reason)}</p>
      <p>Bitte senden Sie uns die fehlenden Angaben oder Dokumente, damit wir fortfahren können. Bei Rückfragen helfen wir gern.</p>
      <p style="margin-top:18px;">Prüfsiegel Zentrum UG</p>
      ${renderFooter()}
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
  gender?: RecipientGender;
  productNames: string[];
  processNumber: string;
  receiptPdf?: Buffer | null;
}) {
  const { to, name, gender, productNames, processNumber, receiptPdf } = opts;
  const safeProductNames = productNames.map((value) => escapeHtml(value));
  const productList = safeProductNames.join(', ');
  const isPlural = productNames.length !== 1;
  const productLabel = isPlural ? 'Angemeldete Produkte' : 'Angemeldetes Produkt';
  const productObjectPronoun = isPlural ? 'diese' : 'dieses';
  const html = `
    <div style="font-family:system-ui,Arial;line-height:1.65;color:#0f172a">
      <p>${renderFormalGreeting(name, gender)}</p>
      <p>vielen Dank für den Zahlungseingang der Prüfgebühr. Ihr Auftrag für den „Testsieger Check“ des Deutschen Prüfsiegel Instituts (DPI) ist damit offiziell aktiviert.</p>
      <p>${productLabel}:<br/><strong>${productList}</strong></p>
      <p>Die Rechnung zu Ihrer Zahlung finden Sie im Anhang dieser E-Mail.</p>
      <p>Damit wir Ihre ${isPlural ? 'Produkte' : 'Produkt'} unmittelbar in den Prüfprozess übernehmen können, senden Sie ${productObjectPronoun} bitte an folgende Versandadresse:</p>
      <p style="margin:12px 0;line-height:1.5;font-size:15.4px;font-weight:700;">
        Deutsches Prüfsiegel Institut (DPI)<br/>
        Abteilung Produktprüfung<br/>
        Tölzer Straße 172<br/>
        83703 Gmund
      </p>
      <p><strong>Wichtig:</strong> Bitte geben Sie im Adressfeld oder gut sichtbar auf dem Paket unbedingt folgende Referenz an:</p>
      <p style="margin:8px 0 12px;"><strong>Vorgangsnummer: ${escapeHtml(processNumber)}</strong></p>
      <p>Diese Nummer ist zwingend erforderlich, damit wir Ihre ${isPlural ? 'Produkte' : 'Produkt'} nach dem Eingang korrekt zuordnen ${isPlural ? 'können' : 'kann'}.</p>
      <p>Sobald die Ware bei uns eingetroffen ist, erhalten Sie eine Eingangsbestätigung sowie weitere Informationen zum Ablauf.</p>
      <p style="margin-top:18px;">Mit freundlichen Grüßen<br/>Ihr Team vom Deutschen Prüfsiegel Institut</p>
      ${renderFooter()}
    </div>
  `;

  await sendEmail({
    from: `Pruefsiegel Zentrum UG – Zahlung <${FROM_EMAIL}>`,
    to,
    subject: `Prüfgebühr bestätigt – Vorgangsnummer ${processNumber}`,
    html,
    attachments: receiptPdf
      ? [
          {
            filename: `Rechnung-${productNames.length === 1 ? productNames[0] : processNumber}.pdf`,
            content: receiptPdf,
            contentType: 'application/pdf',
          },
        ]
      : undefined,
  });
}

export async function sendCompletionReadyEmail(opts: {
  to: string;
  name: string;
  gender?: RecipientGender;
  productName: string;
  licenseUrl?: string;
  ratingPdfBuffer?: Buffer | null;
}) {
  const { to, name, gender, productName, licenseUrl, ratingPdfBuffer } = opts;
  const dashboardLink = `${APP_BASE_URL.replace(/\/$/, '')}/dashboard`;
  const attachments: Attachment[] = [];
  if (ratingPdfBuffer) {
    attachments.push({
      filename: `${productName}-Prüfergebnis.pdf`,
      content: ratingPdfBuffer,
      contentType: 'application/pdf',
    });
  }

		  const html = `
		    <div style="font-family:system-ui,Arial;line-height:1.65;color:#0f172a">
		      <p>${renderStandardGreeting(name, gender)}</p>
		      <p>gute Nachrichten: Ihr Produkt hat den Testsieger Check erfolgreich bestanden!</p>
		      <p>Das vollständige Prüfergebnis finden Sie im Anhang dieser E-Mail (PDF).</p>
		      <p style="margin:14px 0;">Um das Siegel, den Prüfbericht und das Zertifikat offiziell zu aktivieren und nutzen zu dürfen, wählen Sie jetzt Ihren passenden Lizenzplan aus:</p>
	        <div style="margin:16px 0;max-width:520px;">
	          <a href="${dashboardLink}" style="display:block;padding:12px 18px;border-radius:10px;background:#0f172a;color:#fff;text-decoration:none;font-weight:700;text-align:center;">
            Zum Kundendashboard
          </a>
        </div>
	      <p style="margin:12px 0;">Nach Abschluss wird Ihr Produkt automatisch für die Nutzung des Testsieger-Siegels freigegeben.</p>
	      <p style="margin-top:18px;">Mit besten Grüßen<br/>Deutsches Prüfsiegel Institut (DPI)</p>
	      ${renderFooter()}
	    </div>
	  `;

  await sendEmail({
    from: `Pruefsiegel Zentrum UG – Abschluss <${FROM_EMAIL}>`,
    to,
    subject: `Testsieger Check bestanden – ${productName}`,
    html,
    attachments: attachments.length ? attachments : undefined,
  });
}

export async function sendLicensePlanReminderEmail(opts: {
  to: string;
  name: string;
  gender?: RecipientGender;
  productName: string;
}) {
  const { to, name, gender, productName } = opts;
  const html = `
    <div style="font-family:system-ui,Arial;line-height:1.65;color:#0f172a">
      <p>${renderStandardGreeting(name, gender)}</p>
      <p>Ihr Produkt <strong>${escapeHtml(productName)}</strong> hat den Test erfolgreich bestanden und erfüllt alle Anforderungen für unser Qualitätssiegel. Dies ist eine kurze Erinnerung:</p>
      <p>Um das Siegel offiziell zu aktivieren und den Service zu starten, wählen Sie bitte jetzt Ihren Lizenzplan aus.</p>
      <p>Sobald der Plan aktiviert ist, erhalten Sie die Nutzungsfreigabe für das Siegel sowie alle zugehörigen Leistungen.</p>
      <p>Bei Fragen helfen wir gerne weiter.</p>
      <p style="margin-top:18px;">Beste Grüße<br/>Testsieger Check,<br/>ein Service des DPI Deutschen Prüfsiegel Institut</p>
      ${renderFooter()}
    </div>
  `;

  await sendEmail({
    from: `Pruefsiegel Zentrum UG – Erinnerung <${FROM_EMAIL}>`,
    to,
    subject: `Erinnerung: Lizenzplan auswählen – ${productName}`,
    html,
  });
}

export async function sendLicensePlanFinalReminderEmail(opts: {
  to: string;
  name: string;
  gender?: RecipientGender;
  productName: string;
}) {
  const { to, name, gender, productName } = opts;
  const html = `
    <div style="font-family:system-ui,Arial;line-height:1.65;color:#0f172a">
      <p>${renderStandardGreeting(name, gender)}</p>
      <p>dies ist unsere letzte Erinnerung:</p>
      <p>Ihr Produkt <strong>${escapeHtml(productName)}</strong> hat den Test erfolgreich bestanden – allerdings ist das Qualitätssiegel noch nicht aktiviert. Bitte wählen Sie jetzt Ihren Lizenzplan, damit die Nutzung des Siegels sowie unser Service offiziell starten können.</p>
      <p>Ohne Auswahl des Lizenzplans können wir die Freigabe leider nicht erteilen.</p>
      <p>Bei Fragen unterstützen wir Sie jederzeit gern.</p>
      <p style="margin-top:18px;">Beste Grüße<br/>Testsieger Check,<br/>ein Service des DPI Deutschen Prüfsiegel Institut</p>
      ${renderFooter()}
    </div>
  `;

  await sendEmail({
    from: `Pruefsiegel Zentrum UG – Erinnerung <${FROM_EMAIL}>`,
    to,
    subject: `Letzte Erinnerung: Lizenzplan auswählen – ${productName}`,
    html,
  });
}

export async function sendLicenseActivatedEmail(opts: {
  to: string;
  name: string;
  gender?: RecipientGender;
  productName: string;
  certificateId?: string | null;
  pdfUrl?: string | null;
  qrUrl?: string | null;
  sealUrl?: string | null;
  sealNumber?: string | null;
  ratingCsv?: Buffer | null;
}) {
  const { to, name, gender, productName, certificateId, pdfUrl, qrUrl, sealUrl, sealNumber, ratingCsv } = opts;
  const attachments: Attachment[] = [];

  if (pdfUrl) {
    const signed = await ensureSignedS3Url(pdfUrl).catch(() => pdfUrl);
    const pdfBuffer = signed ? await fetchBufferFromUrl(signed) : null;
    if (pdfBuffer) attachments.push({ filename: `${productName}-Zertifikat.pdf`, content: pdfBuffer, contentType: 'application/pdf' });
  }

  let qrBuffer: Buffer | null = null;
  if (qrUrl) {
    const signed = await ensureSignedS3Url(qrUrl).catch(() => qrUrl);
    qrBuffer = signed ? await fetchBufferFromUrl(signed) : null;
  }
  const verifyUrl = certificateId ? `${APP_BASE_URL.replace(/\/$/, '')}/lizenzen?q=${encodeURIComponent(certificateId)}` : null;
  if (!qrBuffer && verifyUrl) {
    try { qrBuffer = await QRCode.toBuffer(verifyUrl, { margin: 1, width: 512 }); } catch {}
  }
  if (qrBuffer) attachments.push({ filename: `${productName}-QR.png`, content: qrBuffer, contentType: 'image/png' });

  if (sealUrl) {
    try {
      const sealPath = sealUrl.startsWith('/') ? `${process.cwd()}/public${sealUrl}` : `${process.cwd()}/public/${sealUrl}`;
      const sealBuffer = await fs.readFile(sealPath);
      attachments.push({ filename: `${productName}-Siegel.png`, content: sealBuffer, contentType: 'image/png' });
    } catch {}
  }

  if (ratingCsv) {
    attachments.push({ filename: 'Rating.csv', content: ratingCsv, contentType: 'text/csv' });
  }

  const html = `
    <div style="font-family:system-ui,Arial;line-height:1.65;color:#0f172a">
      <p>${renderStandardGreeting(name, gender)}</p>
      <p>vielen Dank für die Auswahl und Bezahlung Ihres Lizenzplans. Ihre Lizenz ist jetzt aktiv.</p>
      <p>Im Anhang finden Sie alle freigegebenen Materialien zu Ihrem erfolgreich bestandenen Testsieger Check:</p>
      <ul style="margin:12px 0 16px;padding-left:20px;color:#0f172a;">
        <li>Offizielles Siegel${sealNumber ? ` (ID: ${escapeHtml(sealNumber)})` : ''}</li>
        <li>Prüfbericht</li>
        <li>Zertifikat</li>
      </ul>
      <p>Sie können diese Unterlagen ab sofort im vereinbarten Rahmen nutzen.</p>
      <p style="margin-top:18px;">Mit besten Grüßen<br/>Deutsches Prüfsiegel Institut (DPI)</p>
      ${renderFooter()}
    </div>
  `;

  await sendEmail({
    from: `Pruefsiegel Zentrum UG – Lizenz <${FROM_EMAIL}>`,
    to,
    subject: `Lizenz aktiv – ${productName}`,
    html,
    attachments: attachments.length ? attachments : undefined,
  });
}

export async function sendPassAndLicenseRequest(opts: {
  to: string;
  name: string;
  gender?: RecipientGender;
  productName: string;
  licenseUrl?: string;
}) {
  const { to, name, gender, productName, licenseUrl } = opts;
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'http://pruefsiegelzentrum.vercel.app';
  const plansLink = (licenseUrl || `${appUrl.replace(/\/$/, '')}/produkte`).replace(/\/$/, '');
  const html = `
    <div style="font-family:system-ui,Arial;line-height:1.65;color:#0f172a">
      <p>${renderHelloGreeting(name, gender)}</p>
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
      ${renderFooter()}
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
  gender?: RecipientGender;
  productNames: string[];
  processNumber?: string;
}) {
  const { to, name, gender, productNames, processNumber } = opts;
  const safeProductNames = productNames.map((value) => escapeHtml(value));
  const productList = safeProductNames.join(', ');
  const isPlural = productNames.length !== 1;
  const productNoun = isPlural ? 'Produkte' : 'Produkt';
  const processLine = processNumber
    ? `<p>Vorgangsnummer: <strong>${escapeHtml(processNumber)}</strong></p>`
    : '';
  const html = `
    <div style="font-family:system-ui,Arial;line-height:1.6;color:#111">
      <p>${renderStandardGreeting(name, gender)}</p>
      <p>Ihr ${productNoun} <strong>${productList}</strong> ${isPlural ? 'sind' : 'ist'} bei uns eingetroffen und für den Testsieger Check des DPI registriert. Die Prüfung läuft im vereinbarten Zeitfenster an.</p>
      ${processLine}
      <p>Sie erhalten automatisch ein Update, sobald die Analyse abgeschlossen ist.</p>
      <p style="margin-top:16px;">Mit besten Grüßen<br/>Deutsches Prüfsiegel Institut (DPI)</p>
      ${renderFooter()}
    </div>
  `;

  await sendEmail({
    from: `Pruefsiegel Zentrum UG – Wareneingang <${FROM_EMAIL}>`,
    to,
    subject: 'Produkt eingetroffen – Prüfung eingeplant',
    html,
  });
}

export async function sendPasswordResetEmail(opts: { to: string; name?: string | null; gender?: RecipientGender | null; resetUrl: string }) {
  const { to, name, gender, resetUrl } = opts;
  const greeting = renderHelloGreeting(name || '', gender ?? undefined);
  const html = `
    <div style="font-family:system-ui,Arial;line-height:1.65;color:#0f172a">
      <p>${greeting}</p>
      <p>du hast einen Link zum Zurücksetzen deines Passworts angefordert. Falls das nicht von dir stammt, kannst du diese E-Mail ignorieren.</p>
      <p style="margin:16px 0;">
        <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0f172a;color:#fff;text-decoration:none;font-weight:700;">Passwort jetzt zurücksetzen</a>
      </p>
      <p style="font-size:13px;color:#475569;">Der Link ist 60 Minuten gültig.</p>
      <p style="margin-top:18px;">Prüfsiegel Zentrum UG</p>
      ${renderFooter()}
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

function parseFrom(input: string): { name?: string; email: string } {
  const trimmed = input.trim();
  const match = trimmed.match(/^(.*)<([^>]+)>$/);
  if (!match) return { email: trimmed };
  const name = match[1].trim().replace(/^"|"$/g, '');
  const email = match[2].trim();
  return { email, name: name || undefined };
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
