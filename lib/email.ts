// lib/email.ts
import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import QRCode from 'qrcode';
import { ensureSignedS3Url } from './s3';
import { fetchRatingCsv } from './ratingSheet';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
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

function renderFooter() {
  const logo = `${APP_BASE_URL.replace(/\/$/, '')}/dpilogo-v2.png`;
  const seal = `${APP_BASE_URL.replace(/\/$/, '')}/siegel.png`;
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
  productName: string;
}) {
  const { to, name, productName } = opts;
  const checkoutAnchor = `${APP_BASE_URL.replace(/\/$/, '')}/precheck#checkout-options`;

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.65;color:#0f172a">
      <p>Guten Tag ${escapeHtml(name || '')},</p>
      <p>Ihr Produkt <strong>${escapeHtml(productName)}</strong> hat den Pre-Check erfolgreich bestanden. Alle relevanten Daten wurden in Echtzeit abgefragt und valide bestätigt. Damit erfüllt Ihr Produkt die Kriterien, um offiziell in den Testsieger Check des Deutschen Prüfsiegel Instituts (DPI) überführt zu werden.</p>
      <p>Falls die Prüfgebühr für den Testsieger Check noch nicht beglichen wurde, können Sie diese hier direkt auslösen:</p>
      <p style="margin:16px 0 8px;">
        <a href="${checkoutAnchor}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0f172a;color:#fff;text-decoration:none;font-weight:700;">Prüfgebühr jetzt buchen</a>
      </p>
      <p>Sollten Sie bereits bezahlt haben, können Sie diesen Hinweis ignorieren.</p>
      <p>Nach Zahlung wird Ihr Produkt automatisch in den Prufplan aufgenommen. Sie erhalten anschlieBend die verbindliche Bestatigung inklusive Zeitfenster.</p>
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
      ${renderFooter()}
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
  productName: string;
  processNumber: string;
  receiptPdf?: Buffer | null;
}) {
  const { to, name, productName, processNumber, receiptPdf } = opts;
  const html = `
    <div style="font-family:system-ui,Arial;line-height:1.65;color:#0f172a">
      <p>Guten Tag ${escapeHtml(name)},</p>
      <p>vielen Dank für die Begleichung der Prüfgebühr. Ihr Auftrag für den Testsieger Check des Deutschen Prüfsiegel Instituts (DPI) ist damit offiziell aktiviert.</p>
      <p>Die Rechnung zu Ihrer Zahlung finden Sie im Anhang dieser E-Mail.</p>
      <p>Damit wir Ihr Produkt unmittelbar in den Prüfprozess übernehmen können, senden Sie es bitte an folgende Versandadresse:</p>
      <p style="margin:12px 0;line-height:1.5;font-size:14px;">
        Deutsches Prüfsiegel Institut (DPI)<br/>
        Abteilung Produktprüfung<br/>
        Tölzer Straße 172<br/>
        83703 Gmund<br/>
        Adresszusatz: Vorgangsnummer ${escapeHtml(processNumber)} (Betreff)
      </p>
      <p>Die Vorgangsnummer ist zwingend erforderlich, damit Ihr Produkt korrekt zugeordnet werden kann.</p>
      <p>Sobald das Produkt bei uns eingeht, erhalten Sie die Eingangsbestätigung sowie das geplante Prüfzeitfenster. Bei Fragen stehen wir jederzeit zur Verfügung.</p>
      <p style="margin-top:18px;">Mit besten Grüßen<br/>Deutsches Prüfsiegel Institut (DPI)</p>
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
            filename: `Rechnung-${productName}.pdf`,
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
  productName: string;
  licenseUrl?: string;
  csvBuffer?: Buffer | null;
}) {
  const { to, name, productName, licenseUrl, csvBuffer } = opts;
  const plansLink = (licenseUrl || `${APP_BASE_URL.replace(/\/$/, '')}/pakete`).replace(/\/$/, '');
  const join = plansLink.includes('?') ? '&' : '?';
  const basicLink = `${plansLink}${join}plan=basic`;
  const premiumLink = `${plansLink}${join}plan=premium`;
  const lifetimeLink = `${plansLink}${join}plan=lifetime`;
  const attachments: Attachment[] = [];
  if (csvBuffer) {
    attachments.push({
      filename: 'Rating.csv',
      content: csvBuffer,
      contentType: 'text/csv',
    });
  }

	  const html = `
	    <div style="font-family:system-ui,Arial;line-height:1.65;color:#0f172a">
	      <p>Guten Tag ${escapeHtml(name)},</p>
	      <p>gute Nachrichten: Ihr Produkt hat den Testsieger Check erfolgreich bestanden!</p>
	      <p>Das vollständige Prüfergebnis finden Sie im Anhang dieser E-Mail.</p>
	      <p style="margin:14px 0;">Um das Siegel, den Prüfbericht und das Zertifikat offiziell zu aktivieren und nutzen zu dürfen, wählen Sie jetzt Ihren passenden Lizenzplan aus:</p>
        <div style="margin:16px 0;max-width:520px;">
          <a href="${basicLink}" style="display:block;padding:12px 18px;border-radius:10px;background:#0f172a;color:#fff;text-decoration:none;font-weight:700;text-align:center;margin-bottom:10px;">
            Basic wählen (0,99 € / Tag)
          </a>
          <a href="${premiumLink}" style="display:block;padding:12px 18px;border-radius:10px;background:#0f172a;color:#fff;text-decoration:none;font-weight:700;text-align:center;margin-bottom:10px;">
            Premium wählen (1,47 € / Tag)
          </a>
          <a href="${lifetimeLink}" style="display:block;padding:12px 18px;border-radius:10px;background:#0f172a;color:#fff;text-decoration:none;font-weight:700;text-align:center;">
            Lifetime wählen (1466 € einmalig)
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

export async function sendLicenseActivatedEmail(opts: {
  to: string;
  name: string;
  productName: string;
  certificateId?: string | null;
  pdfUrl?: string | null;
  qrUrl?: string | null;
  sealUrl?: string | null;
  sealNumber?: string | null;
  ratingCsv?: Buffer | null;
}) {
  const { to, name, productName, certificateId, pdfUrl, qrUrl, sealUrl, sealNumber, ratingCsv } = opts;
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
      <p>Guten Tag ${escapeHtml(name)},</p>
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
  productName: string;
}) {
  const { to, name, productName } = opts;
  const html = `
    <div style="font-family:system-ui,Arial;line-height:1.6;color:#111">
      <p>Guten Tag${name ? ' ' + escapeHtml(name) : ''},</p>
      <p>Ihr Produkt <strong>${escapeHtml(productName)}</strong> ist bei uns eingetroffen und für den Testsieger Check des DPI registriert. Die Prüfung läuft im vereinbarten Zeitfenster an.</p>
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

// minimal XSS-safe escaping for interpolated strings in HTML
function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
